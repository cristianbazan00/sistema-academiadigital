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

    const { institution_id } = await req.json();

    if (!institution_id) {
      return new Response(
        JSON.stringify({ error: "institution_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get all classes of this institution
    const { data: classes } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("institution_id", institution_id);

    const classIds = classes?.map((c) => c.id) || [];

    // 2. Remove class_members for those classes
    if (classIds.length > 0) {
      await supabaseAdmin
        .from("class_members")
        .delete()
        .in("class_id", classIds);

      // 3. Remove extra_activities for those classes
      await supabaseAdmin
        .from("extra_activities")
        .delete()
        .in("class_id", classIds);

      // 4. Delete classes
      await supabaseAdmin
        .from("classes")
        .delete()
        .eq("institution_id", institution_id);
    }

    // 5. Get all users from this institution
    const { data: instProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("institution_id", institution_id);

    const userIds = instProfiles?.map((p) => p.id) || [];

    if (userIds.length > 0) {
      // 6. Remove roles for institution users (admin_institution, facilitator, student)
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .in("user_id", userIds)
        .in("role", ["admin_institution", "facilitator", "student"]);

      // 7. Unlink profiles from institution
      for (const uid of userIds) {
        await supabaseAdmin
          .from("profiles")
          .update({ institution_id: null })
          .eq("id", uid);
      }
    }

    // 8. Delete the institution
    const { error: delError } = await supabaseAdmin
      .from("institutions")
      .delete()
      .eq("id", institution_id);

    if (delError) {
      return new Response(
        JSON.stringify({ error: delError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
