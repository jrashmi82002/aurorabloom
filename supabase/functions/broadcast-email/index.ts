import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { subject, message, targetUserIds } = await req.json();

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    // Escape HTML in user-provided content
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // Get user emails - either specific users or all users with profiles
    let emails: string[] = [];
    let userIds: string[] = [];

    if (targetUserIds && targetUserIds.length > 0) {
      // Specific users
      const { data: users } = await supabase
        .auth.admin.listUsers();
      
      if (users?.users) {
        const targetUsers = users.users.filter(u => targetUserIds.includes(u.id));
        emails = targetUsers.map(u => u.email).filter(Boolean) as string[];
        userIds = targetUsers.map(u => u.id);
      }
    } else {
      // All users with profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      
      if (profiles) {
        userIds = profiles.map(p => p.id);
        
        // Get emails from auth
        const { data: users } = await supabase.auth.admin.listUsers();
        if (users?.users) {
          emails = users.users
            .filter(u => userIds.includes(u.id))
            .map(u => u.email)
            .filter(Boolean) as string[];
        }
      }
    }

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, message: "No users to send to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #22c55e; margin: 0;">🌿 Aurora Bloom</h1>
        </div>
        <div style="font-size: 16px; color: #374151; line-height: 1.8;">
          ${safeMessage}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          With warmth,<br>
          The Aurora Bloom Team
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
          You're receiving this because you're part of our healing community.
        </p>
      </div>
    `;

    // Create notifications for all target users (store unescaped message for internal use)
    const notificationPromises = userIds.map(userId =>
      supabase.from("notifications").insert({
        user_id: userId,
        title: subject,
        message: message,
        type: "broadcast",
        is_read: false,
      })
    );

    await Promise.all(notificationPromises);
    console.log(`Admin ${user.id} created ${userIds.length} notifications`);

    // Send emails in batches to avoid rate limits
    let sentCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const promises = batch.map((email) =>
        resend.emails.send({
          from: "Aurora Bloom <onboarding@resend.dev>",
          to: [email],
          subject: safeSubject,
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

    console.log(`Admin ${user.id} broadcast sent to ${sentCount}/${emails.length} users`);

    return new Response(
      JSON.stringify({ success: true, sentCount, totalUsers: emails.length, notificationsCreated: userIds.length }),
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
