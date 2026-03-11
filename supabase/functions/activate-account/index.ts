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
    const body = await req.json();
    const { action } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── CREATE FACILITATOR ──
    if (action === "create_facilitator") {
      const { email, full_name, cpf, institution_id } = body;

      if (!email || !full_name || !cpf || !institution_id) {
        return new Response(
          JSON.stringify({ error: "Todos os campos são obrigatórios." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("cpf", cpf)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Já existe um usuário com este CPF." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const origin = req.headers.get("origin") || "https://id-preview--899820e8-9f41-4d02-805d-45d0357a2e6f.lovable.app";
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name },
        redirectTo: `${origin}/reset-password`,
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = authData.user.id;

      await supabaseAdmin
        .from("profiles")
        .update({ cpf, full_name, institution_id })
        .eq("id", userId);

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "facilitator" });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTIVATE CSV STUDENT ──
    if (action === "activate_csv_student") {
      const { cpf, password } = body;

      if (!cpf || !password) {
        return new Response(
          JSON.stringify({ error: "CPF e senha são obrigatórios." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate password strength
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        return new Response(
          JSON.stringify({ error: "A senha não atende aos requisitos mínimos." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find profile by CPF
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("cpf", cpf)
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: "CPF não encontrado." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get auth user to confirm CSV-imported (fictitious email)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

      if (authError || !authUser?.user) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const email = authUser.user.email || "";
      if (!email.endsWith("@aluno.plataforma.local")) {
        return new Response(
          JSON.stringify({ error: "Esta conta já foi ativada." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password,
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não reconhecida." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
