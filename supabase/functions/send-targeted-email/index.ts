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
    // Verify the caller is an admin
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
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { emails, subject, message } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error("No recipients provided");
    }

    // Escape HTML in user-provided content
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">${safeSubject}</h1>
        </div>
        <div style="font-size: 16px; color: #374151; line-height: 1.8;">
          ${safeMessage}
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          With warmth,<br>
          The Aurora Bloom Team
        </p>
      </div>
    `;

    // Send emails to each recipient
    const results = await Promise.allSettled(
      emails.map((email: string) =>
        resend.emails.send({
          from: "Aurora Bloom <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        })
      )
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    // Also create notifications for each user
    const { data: { users } } = await supabaseClient.auth.admin.listUsers();
    const emailToUserId = new Map(users.map((u) => [u.email, u.id]));

    const notifications = emails
      .map((email: string) => {
        const userId = emailToUserId.get(email);
        if (userId) {
          return {
            user_id: userId,
            title: subject,
            message: message.substring(0, 200) + (message.length > 200 ? "..." : ""),
            type: "admin_message",
          };
        }
        return null;
      })
      .filter(Boolean);

    if (notifications.length > 0) {
      await supabaseClient.from("notifications").insert(notifications);
    }

    console.log(`Admin ${user.id} sent ${successCount}/${emails.length} targeted emails`);

    return new Response(JSON.stringify({ success: true, sentCount: successCount }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
