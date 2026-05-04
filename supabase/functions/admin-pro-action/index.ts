import { Resend } from "https://esm.sh/resend@2.0.0";
import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BodySchema = z.object({
  action: z.enum(["approve", "revoke"]),
  userId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  email: z.string().email().max(255).optional(),
});

const APPROVAL_HTML = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #7c3aed; margin: 0;">Welcome to Pro! 🌟</h1>
    </div>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your pro access request has been approved. You now have unlimited access to all therapy sessions and premium features.
    </p>
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="color: white; font-size: 18px; margin: 0;">
        ✨ Unlimited Messages<br>
        ✨ All Therapy Types<br>
        ✨ Extra Activities<br>
        ✨ Priority Support
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">With warmth,<br>The Healing Haven Team</p>
  </div>
`;

const REVOCATION_HTML = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <h1 style="color: #374151; margin-bottom: 20px;">Pro Access Update</h1>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your pro access has been discontinued. You can continue using the free features of Healing Haven.
    </p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      If you'd like to regain pro access, you can submit a new request from your account.
    </p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">With warmth,<br>The Healing Haven Team</p>
  </div>
`;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const body = await parseJsonBody(req, BodySchema);
  if (body instanceof Response) return body;

  const supabase = createServiceClient();

  try {
    if (body.action === "approve") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          pro_subscription_status: "yearly",
          pro_subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", body.userId);
      if (profileError) throw profileError;

      if (body.requestId) {
        await supabase.from("pro_access_requests").delete().eq("id", body.requestId);
      }

      await supabase.from("notifications").insert({
        user_id: body.userId,
        title: "🎉 Pro Access Granted!",
        message: "Your pro access request has been approved. Enjoy unlimited features!",
        type: "pro_status",
      });

      if (body.email) {
        await resend.emails.send({
          from: "Healing Haven <onboarding@resend.dev>",
          to: [body.email],
          subject: "🎉 Your Pro Access Has Been Approved!",
          html: APPROVAL_HTML,
        });
      }

      return jsonResponse({ success: true, action: "approved" });
    }

    // revoke
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ pro_subscription_status: "free", pro_subscription_ends_at: null })
      .eq("id", body.userId);
    if (profileError) throw profileError;

    await supabase.from("notifications").insert({
      user_id: body.userId,
      title: "Pro Access Update",
      message: "Your pro access has been discontinued. You can request pro access again if needed.",
      type: "pro_status",
    });

    if (body.email) {
      await resend.emails.send({
        from: "Healing Haven <onboarding@resend.dev>",
        to: [body.email],
        subject: "Pro Access Update",
        html: REVOCATION_HTML,
      });
    }

    return jsonResponse({ success: true, action: "revoked" });
  } catch (error) {
    console.error("admin-pro-action error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
