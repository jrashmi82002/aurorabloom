import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const { subject, message } = await req.json();

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pro access request emails (unique users who have interacted)
    const { data: requests } = await supabase
      .from("pro_access_requests")
      .select("email")
      .not("email", "is", null);

    // Get unique emails
    const emails = [...new Set(requests?.map((r) => r.email) || [])];

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, message: "No users to send to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">Healing Haven</h1>
        </div>
        <div style="font-size: 16px; color: #374151; line-height: 1.8; white-space: pre-wrap;">
          ${message}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          With warmth,<br>
          The Healing Haven Team
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
          You're receiving this because you're part of our healing community.
        </p>
      </div>
    `;

    // Send emails in batches to avoid rate limits
    let sentCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const promises = batch.map((email) =>
        resend.emails.send({
          from: "Healing Haven <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }).catch((err: Error) => {
          console.error(`Failed to send to ${email}:`, err);
          return null;
        })
      );

      const results = await Promise.all(promises);
      sentCount += results.filter(Boolean).length;

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`Broadcast sent to ${sentCount}/${emails.length} users`);

    return new Response(
      JSON.stringify({ success: true, sentCount, totalUsers: emails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending broadcast:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
