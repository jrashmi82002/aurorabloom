import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "pro_approved":
        subject = "🎉 Your Pro Access Has Been Approved!";
        html = `
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
                ✨ Priority Support
              </p>
            </div>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Thank you for being part of our healing community. We're here to support your wellness journey.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              With warmth,<br>
              The Healing Haven Team
            </p>
          </div>
        `;
        break;

      case "pro_request_received":
        subject = "We Received Your Pro Access Request";
        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #7c3aed;">Request Received! ✉️</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Thank you for your interest in pro access. We've received your request and will review it shortly.
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              You'll receive an email once your request has been processed.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              With warmth,<br>
              The Healing Haven Team
            </p>
          </div>
        `;
        break;

      case "admin_new_request":
        subject = "🔔 New Pro Access Request";
        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #7c3aed;">New Pro Request</h1>
            <p style="font-size: 16px; color: #374151;">
              A new pro access request has been submitted:
            </p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Email:</strong> ${data?.email || email}</p>
              ${data?.reason ? `<p style="margin: 10px 0 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
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
      from: "Healing Haven <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
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
