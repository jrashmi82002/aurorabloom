import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    const notifications = users.map((user) => ({
      user_id: user.id,
      title: "💧 Stay Hydrated!",
      message: "Remember to drink water! Staying hydrated is essential for your mental and physical well-being.",
      type: "wellness_reminder",
    }));

    // Insert notifications for all users
    if (notifications.length > 0) {
      const { error: notifError } = await supabaseClient
        .from("notifications")
        .insert(notifications);
      if (notifError) throw notifError;
    }

    // Also send emails
    const emailPromises = users
      .filter((u) => u.email)
      .map((user) =>
        resend.emails.send({
          from: "Healing Haven <onboarding@resend.dev>",
          to: [user.email!],
          subject: "💧 Daily Hydration Reminder",
          html: `
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
                Take care of yourself today! 🌟<br>
                <br>
                With warmth,<br>
                The Healing Haven Team
              </p>
            </div>
          `,
        })
      );

    await Promise.allSettled(emailPromises);

    console.log(`Sent water reminders to ${users.length} users`);

    return new Response(
      JSON.stringify({ success: true, usersNotified: users.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
