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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: adminUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !adminUser) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { action, userId, requestId, email } = await req.json();

    if (action === "approve") {
      // Update profile to pro
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          pro_subscription_status: "yearly",
          pro_subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Delete the request after approval (it's now in pro users)
      if (requestId) {
        const { error: requestError } = await supabaseClient
          .from("pro_access_requests")
          .delete()
          .eq("id", requestId);

        if (requestError) throw requestError;
      }

      // Create notification
      await supabaseClient.from("notifications").insert({
        user_id: userId,
        title: "🎉 Pro Access Granted!",
        message: "Your pro access request has been approved. Enjoy unlimited features!",
        type: "pro_status",
      });

      // Send approval email
      if (email) {
        await resend.emails.send({
          from: "Healing Haven <onboarding@resend.dev>",
          to: [email],
          subject: "🎉 Your Pro Access Has Been Approved!",
          html: `
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
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                With warmth,<br>
                The Healing Haven Team
              </p>
            </div>
          `,
        });
      }

      return new Response(JSON.stringify({ success: true, action: "approved" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "revoke") {
      // Update profile to remove pro
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          pro_subscription_status: "free",
          pro_subscription_ends_at: null,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Create notification
      await supabaseClient.from("notifications").insert({
        user_id: userId,
        title: "Pro Access Update",
        message: "Your pro access has been discontinued. You can request pro access again if needed.",
        type: "pro_status",
      });

      // Send revocation email
      if (email) {
        await resend.emails.send({
          from: "Healing Haven <onboarding@resend.dev>",
          to: [email],
          subject: "Pro Access Update",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #374151; margin-bottom: 20px;">Pro Access Update</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Your pro access has been discontinued. You can continue using the free features of Healing Haven.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                If you'd like to regain pro access, you can submit a new request from your account.
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                With warmth,<br>
                The Healing Haven Team
              </p>
            </div>
          `,
        });
      }

      return new Response(JSON.stringify({ success: true, action: "revoked" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
