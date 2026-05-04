import { Resend } from "https://esm.sh/resend@2.0.0";
import { handlePreflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const REMINDER_HTML = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
    <div style="font-size: 64px; margin-bottom: 20px;">💧</div>
    <h1 style="color: #0ea5e9; margin: 0 0 20px;">Stay Hydrated!</h1>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      This is your daily reminder to drink water. Proper hydration helps with:
    </p>
    <div style="background: linear-gradient(135deg, #0ea5e9, #38bdf8); padding: 20px; border-radius: 12px; margin: 20px 0; color: white;">
      <p style="margin: 0; font-size: 15px;">
        ✨ Better focus and concentration<br>
        ✨ Improved mood and energy<br>
        ✨ Healthier skin and body<br>
        ✨ Reduced stress and anxiety
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Take care of yourself today! 🌟<br><br>
      With warmth,<br>The Healing Haven Team
    </p>
  </div>
`;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = createServiceClient();
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const notifications = users.map((u) => ({
      user_id: u.id,
      title: "💧 Stay Hydrated!",
      message:
        "Remember to drink water! Staying hydrated is essential for your mental and physical well-being.",
      type: "wellness_reminder",
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase.from("notifications").insert(notifications);
      if (notifError) throw notifError;
    }

    await Promise.allSettled(
      users
        .filter((u) => u.email)
        .map((u) =>
          resend.emails.send({
            from: "Healing Haven <onboarding@resend.dev>",
            to: [u.email!],
            subject: "💧 Daily Hydration Reminder",
            html: REMINDER_HTML,
          }),
        ),
    );

    console.log(`Sent water reminders to ${users.length} users`);
    return jsonResponse({ success: true, usersNotified: users.length });
  } catch (error) {
    console.error("daily-water-reminder error:", error);
    return errorResponse((error as Error).message ?? "Server error", 500);
  }
});
