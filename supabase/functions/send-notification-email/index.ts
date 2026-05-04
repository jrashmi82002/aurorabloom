import { Resend } from "https://esm.sh/resend@2.0.0";
import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { parseJsonBody, z } from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const BodySchema = z.object({
  type: z.enum(["pro_approved", "pro_request_received", "admin_new_request"]),
  email: z.string().email().max(255),
  data: z
    .object({
      email: z.string().email().max(255).optional(),
      reason: z.string().max(2000).optional(),
    })
    .optional(),
});

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const body = await parseJsonBody(req, BodySchema);
  if (body instanceof Response) return body;

  try {
    // Authorization: pro_approved + admin_new_request require admin.
    // pro_request_received: caller may only email themselves.
    if (body.type === "pro_approved" || body.type === "admin_new_request") {
      if (!(await isAdmin(auth.userId))) {
        return errorResponse("Admin access required for this notification type", 403);
      }
    }
    if (body.type === "pro_request_received" && body.email !== auth.email) {
      return errorResponse("Can only send request confirmation to your own email", 403);
    }

    let subject = "";
    let html = "";

    if (body.type === "pro_approved") {
      subject = "🎉 Your Pro Access Has Been Approved!";
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #22c55e; margin: 0;">Welcome to Pro! 🌟</h1></div>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Great news! Your pro access request has been approved. You now have unlimited access to all therapy sessions and premium features.
          </p>
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="color: white; font-size: 18px; margin: 0;">✨ Unlimited Messages<br>✨ All Therapy Types<br>✨ Priority Support</p>
          </div>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Thank you for being part of our healing community. We're here to support your wellness journey.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">With warmth,<br>The Aurora Bloom Team</p>
        </div>`;
    } else if (body.type === "pro_request_received") {
      subject = "We Received Your Pro Access Request";
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #22c55e;">Request Received! ✉️</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Thank you for your interest in pro access. We've received your request and will review it shortly.
          </p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            You'll receive an email once your request has been processed.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">With warmth,<br>The Aurora Bloom Team</p>
        </div>`;
    } else {
      const safeEmail = escapeHtml(body.data?.email ?? body.email);
      const safeReason = body.data?.reason ? escapeHtml(body.data.reason) : null;
      subject = "🔔 New Pro Access Request";
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #22c55e;">New Pro Request</h1>
          <p style="font-size: 16px; color: #374151;">A new pro access request has been submitted:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${safeEmail}</p>
            ${safeReason ? `<p style="margin: 10px 0 0;"><strong>Reason:</strong> ${safeReason}</p>` : ""}
          </div>
          <p style="font-size: 14px; color: #6b7280;">Log in to the admin panel to approve or reject this request.</p>
        </div>`;
    }

    const emailResponse = await resend.emails.send({
      from: "Aurora Bloom <onboarding@resend.dev>",
      to: [body.email],
      subject,
      html,
    });

    console.log(`User ${auth.userId} sent ${body.type} email to ${body.email}`);
    return jsonResponse({ success: true, data: emailResponse });
  } catch (error) {
    console.error("send-notification-email error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
