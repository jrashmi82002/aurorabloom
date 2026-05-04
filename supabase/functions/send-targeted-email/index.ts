import { Resend } from "https://esm.sh/resend@2.0.0";
import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BodySchema = z.object({
  emails: z.array(z.string().email().max(255)).min(1).max(500),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
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

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0;">${safeSubject}</h1>
      </div>
      <div style="font-size: 16px; color: #374151; line-height: 1.8;">${safeMessage}</div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        With warmth,<br>The Aurora Bloom Team
      </p>
    </div>
  `;

  try {
    const results = await Promise.allSettled(
      body.emails.map((email) =>
        resend.emails.send({
          from: "Aurora Bloom <onboarding@resend.dev>",
          to: [email],
          subject: body.subject,
          html,
        }),
      ),
    );
    const successCount = results.filter((r) => r.status === "fulfilled").length;

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const emailToUserId = new Map(users.map((u) => [u.email, u.id]));
    const notifications = body.emails
      .map((email) => {
        const userId = emailToUserId.get(email);
        if (!userId) return null;
        return {
          user_id: userId,
          title: body.subject,
          message: body.message.substring(0, 200) + (body.message.length > 200 ? "..." : ""),
          type: "admin_message",
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    console.log(`Admin ${auth.userId} sent ${successCount}/${body.emails.length} targeted emails`);
    return jsonResponse({ success: true, sentCount: successCount });
  } catch (error) {
    console.error("send-targeted-email error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
