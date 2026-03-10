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
    const { cpf, email, full_name, password } = await req.json();

    if (!cpf || !email || !full_name || !password) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength server-side
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ error: "A senha não atende aos requisitos mínimos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if CPF exists in profiles (pre-registered by admin)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf")
      .eq("cpf", cpf)
      .is("id", null) // No auth user linked yet — for pre-registered profiles
      .maybeSingle();

    // If no pre-registered profile, check if CPF already has an account
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("cpf", cpf)
      .not("id", "is", null)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Esta conta já foi ativada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Update profile with CPF and name (trigger already created the profile row)
    await supabaseAdmin
      .from("profiles")
      .update({ cpf, full_name })
      .eq("id", userId);

    // Assign student role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "student" });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
