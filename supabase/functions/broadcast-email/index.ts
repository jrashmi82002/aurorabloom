import { Resend } from "https://esm.sh/resend@2.0.0";
import { handlePreflight, jsonResponse, errorResponse, corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  targetUserIds: z.array(z.string().uuid()).optional(),
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const body = await parseJsonBody(req, BodySchema);
  if (body instanceof Response) return body;

  const supabase = createServiceClient();
  const safeSubject = escapeHtml(body.subject);
  const safeMessage = escapeHtml(body.message).replace(/\n/g, "<br>");

  try {
    let emails: string[] = [];
    let userIds: string[] = [];

    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    if (body.targetUserIds && body.targetUserIds.length > 0) {
      const targetSet = new Set(body.targetUserIds);
      const targetUsers = authUsers.filter((u) => targetSet.has(u.id));
      emails = targetUsers.map((u) => u.email).filter(Boolean) as string[];
      userIds = targetUsers.map((u) => u.id);
    } else {
      const { data: profiles } = await supabase.from("profiles").select("id");
      userIds = (profiles ?? []).map((p) => p.id);
      const idSet = new Set(userIds);
      emails = authUsers
        .filter((u) => idSet.has(u.id))
        .map((u) => u.email)
        .filter(Boolean) as string[];
    }

    if (emails.length === 0) {
      return jsonResponse({ success: true, sentCount: 0, message: "No users to send to" });
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #22c55e; margin: 0;">🌿 Aurora Bloom</h1>
        </div>
        <div style="font-size: 16px; color: #374151; line-height: 1.8;">${safeMessage}</div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280; text-align: center;">With warmth,<br>The Aurora Bloom Team</p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
          You're receiving this because you're part of our healing community.
        </p>
      </div>
    `;

    await Promise.all(
      userIds.map((userId) =>
        supabase.from("notifications").insert({
          user_id: userId,
          title: body.subject,
          message: body.message,
          type: "broadcast",
          is_read: false,
        }),
      ),
    );

    let sentCount = 0;
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((email) =>
          resend.emails
            .send({
              from: "Aurora Bloom <onboarding@resend.dev>",
              to: [email],
              subject: safeSubject,
              html,
            })
            .catch((err: Error) => {
              console.error(`Failed to send to ${email}:`, err);
              return null;
            }),
        ),
      );
      sentCount += results.filter(Boolean).length;
      if (i + batchSize < emails.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`Admin ${auth.userId} broadcast sent to ${sentCount}/${emails.length} users`);

    return jsonResponse({
      success: true,
      sentCount,
      totalUsers: emails.length,
      notificationsCreated: userIds.length,
    });
  } catch (error) {
    console.error("broadcast-email error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
