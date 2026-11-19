const ADMIN_EMAIL = "scoloma@farmaciasdoctorsimi.cl";
const GLOBAL_ADMIN_ROLES = new Set(["ADMIN", "ADMINISTRADOR", "SUPERADMIN", "SUPER_ADMIN", "ADMIN_PRINCIPAL", "ADMINISTRADOR_PRINCIPAL"]);

export async function verifyNexusSession(req) {
  const authorization = String(req.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: "Inicia sesión desde Asistencia Doctor Simi para acceder a NEXUS AI." };

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return { ok: false, status: 503, error: "La autenticación de NEXUS no está configurada en este entorno." };
  }

  const headers = { apikey: publishableKey, Authorization: "Bearer " + match[1] };
  try {
    const authResponse = await fetch(supabaseUrl + "/auth/v1/user", {
      method: "GET", headers, signal: AbortSignal.timeout(8000), cache: "no-store"
    });
    if (!authResponse.ok) return { ok: false, status: 401, error: "La sesión de Asistencia venció. Vuelve a ingresar a Asistencia." };
    const user = await authResponse.json();
    const email = String(user.email || "").trim().toLowerCase();
    if (!user.id || !email) return { ok: false, status: 403, error: "La cuenta no tiene una identidad válida." };

    if (email === ADMIN_EMAIL) return { ok: true, user: { id: user.id, email, role: "ADMINISTRADOR" } };

    const query = new URLSearchParams({
      select: "email,permisos,activo,acceso_global,rol",
      email: "eq." + email,
      limit: "1"
    });
    const profileResponse = await fetch(supabaseUrl + "/rest/v1/usuarios_roles?" + query.toString(), {
      method: "GET", headers, signal: AbortSignal.timeout(8000), cache: "no-store"
    });
    if (!profileResponse.ok) return { ok: false, status: 403, error: "No fue posible verificar tus permisos de NEXUS AI." };
    const profiles = await profileResponse.json();
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (!profile || profile.activo === false) {
      return { ok: false, status: 403, error: "Tu usuario no tiene un perfil activo en Asistencia." };
    }

    const role = String(profile.rol || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
    const isGlobalAdmin = profile.acceso_global === true || GLOBAL_ADMIN_ROLES.has(role);
    const permissions = Array.isArray(profile.permisos) ? profile.permisos : [];
    if (!isGlobalAdmin && !permissions.includes("nexus-ai")) {
      return { ok: false, status: 403, error: "Tu usuario no tiene habilitado el módulo NEXUS AI. Solicita acceso en Usuarios y roles." };
    }

    return { ok: true, user: { id: user.id, email, role: profile.rol || "COLABORADOR" } };
  } catch (error) {
    return { ok: false, status: 503, error: "No se pudo validar la sesión con Asistencia. Inténtalo nuevamente." };
  }
}

export async function requireNexusUser(req, res) {
  const result = await verifyNexusSession(req);
  if (!result.ok) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(result.status).json({ error: result.error });
    return null;
  }
  return result.user;
}
