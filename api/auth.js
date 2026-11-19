import { requireNexusUser } from "./_lib/require-user.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }
  const user = await requireNexusUser(req, res);
  if (!user) return;
  return res.status(200).json({ authenticated: true, configured: true, mode: "asistencia-sso", user });
}
