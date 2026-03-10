import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin_master
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin_master")
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Apenas admin master pode realizar esta ação" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { institution_id, admin_email, admin_name } = await req.json();

    if (!institution_id || !admin_email || !admin_name) {
      return new Response(
        JSON.stringify({ error: "institution_id, admin_email e admin_name são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Remove old admin(s) for this institution ──
    // Find all profiles linked to this institution
    const { data: linkedProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("institution_id", institution_id);

    if (linkedProfiles && linkedProfiles.length > 0) {
      for (const profile of linkedProfiles) {
        // Check if this profile has admin_institution role
        const { data: oldRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", profile.id)
          .eq("role", "admin_institution")
          .maybeSingle();

        if (oldRole) {
          // Remove admin_institution role from old admin
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("id", oldRole.id);

          // Unlink old admin from institution
          await supabaseAdmin
            .from("profiles")
            .update({ institution_id: null })
            .eq("id", profile.id);
        }
      }
    }

    // ── Step 2: Set up new admin ──
    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === admin_email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      
      // Update profile with institution_id
      await supabaseAdmin
        .from("profiles")
        .update({ institution_id })
        .eq("id", userId);

      // Check if already has admin_institution role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin_institution")
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "admin_institution" });
      }
    } else {
      // Create new user with temporary password
      const tempPassword = `Temp@${crypto.randomUUID().slice(0, 8)}`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: admin_name },
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;

      // Update profile with institution_id
      await supabaseAdmin
        .from("profiles")
        .update({ institution_id, full_name: admin_name })
        .eq("id", userId);

      // Assign admin_institution role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin_institution" });

      // Send password reset email so user can set their own password
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: admin_email,
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, is_existing: !!existingUser }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
