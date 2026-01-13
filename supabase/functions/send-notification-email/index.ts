import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { type, email, data } = await req.json();

    // Validate email type
    const allowedTypes = ["pro_approved", "pro_request_received", "admin_new_request"];
    if (!allowedTypes.includes(type)) {
      throw new Error("Unknown email type");
    }

    // For admin notifications, verify the caller is an admin
    if (type === "admin_new_request") {
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        throw new Error("Admin access required for this notification type");
      }
    }

    // For pro_approved emails, verify the caller is an admin
    if (type === "pro_approved") {
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        throw new Error("Admin access required for approval emails");
      }
    }

    // For pro_request_received, the user can only send to themselves
    if (type === "pro_request_received" && email !== user.email) {
      throw new Error("Can only send request confirmation to your own email");
    }

    let subject = "";
    let html = "";

    switch (type) {
      case "pro_approved":
        subject = "🎉 Your Pro Access Has Been Approved!";
        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">Welcome to Pro! 🌟</h1>
            </div>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Great news! Your pro access request has been approved. You now have unlimited access to all therapy sessions and premium features.
            </p>
            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <p style="color: white; font-size: 18px; margin: 0;">
                ✨ Unlimited Messages<br>
                ✨ All Therapy Types<br>
                ✨ Priority Support
              </p>
            </div>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Thank you for being part of our healing community. We're here to support your wellness journey.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              With warmth,<br>
              The Aurora Bloom Team
            </p>
          </div>
        `;
        break;

      case "pro_request_received":
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
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              With warmth,<br>
              The Aurora Bloom Team
            </p>
          </div>
        `;
        break;

      case "admin_new_request":
        // Escape user-provided data
        const safeEmail = escapeHtml(data?.email || email);
        const safeReason = data?.reason ? escapeHtml(data.reason) : null;
        
        subject = "🔔 New Pro Access Request";
        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #22c55e;">New Pro Request</h1>
            <p style="font-size: 16px; color: #374151;">
              A new pro access request has been submitted:
            </p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Email:</strong> ${safeEmail}</p>
              ${safeReason ? `<p style="margin: 10px 0 0;"><strong>Reason:</strong> ${safeReason}</p>` : ''}
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Log in to the admin panel to approve or reject this request.
            </p>
          </div>
        `;
        break;

      default:
        throw new Error("Unknown email type");
    }

    const emailResponse = await resend.emails.send({
      from: "Aurora Bloom <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log(`User ${user.id} sent ${type} email to ${email}`);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
