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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userError } = await userClient.auth.getUser();
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = caller.id;

    // Admin client
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin_institution
    const { data: hasRole } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin_institution" });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { institution_id, students } = await req.json();
    if (!institution_id || !Array.isArray(students)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
    }

    // Verify caller belongs to this institution
    const { data: callerInstId } = await admin.rpc("get_user_institution_id", { _user_id: callerId });
    if (callerInstId !== institution_id) {
      return new Response(JSON.stringify({ error: "Forbidden: wrong institution" }), { status: 403, headers: corsHeaders });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Cache classes by name
    const classCache = new Map<string, string>();
    const { data: existingClasses } = await admin.from("classes").select("id, name").eq("institution_id", institution_id);
    for (const c of existingClasses ?? []) {
      classCache.set(c.name.toLowerCase(), c.id);
    }

    for (const s of students) {
      const { cpf, full_name, class_name } = s;
      if (!cpf || !full_name || !class_name) {
        errors.push(`Dados incompletos: ${cpf || "sem CPF"}`);
        continue;
      }

      try {
        // Check if CPF already exists
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("cpf", cpf)
          .limit(1)
          .maybeSingle();

        let userId: string;

        if (existingProfile) {
          userId = existingProfile.id;
          skipped++;
        } else {
          // Create user
          const email = `${cpf}@aluno.plataforma.local`;
          const { data: newUser, error: createError } = await admin.auth.admin.createUser({
            email,
            password: cpf, // temporary password
            email_confirm: true,
            user_metadata: { full_name },
          });

          if (createError || !newUser?.user) {
            errors.push(`Erro ao criar ${cpf}: ${createError?.message ?? "desconhecido"}`);
            continue;
          }

          userId = newUser.user.id;

          // Update profile
          await admin.from("profiles").update({
            full_name,
            cpf,
            institution_id,
          }).eq("id", userId);

          // Assign student role
          await admin.from("user_roles").insert({ user_id: userId, role: "student" });

          created++;
        }

        // Get or create class
        let classId = classCache.get(class_name.toLowerCase());
        if (!classId) {
          const { data: newClass } = await admin.from("classes").insert({ name: class_name, institution_id }).select("id").single();
          if (newClass) {
            classId = newClass.id;
            classCache.set(class_name.toLowerCase(), classId);
          }
        }

        // Add to class if not already a member
        if (classId) {
          const { data: existing } = await admin
            .from("class_members")
            .select("id")
            .eq("class_id", classId)
            .eq("user_id", userId)
            .maybeSingle();

          if (!existing) {
            await admin.from("class_members").insert({ class_id: classId, user_id: userId, role: "student" });
          }
        }
      } catch (e) {
        errors.push(`Erro com ${cpf}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify({ created, skipped, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
