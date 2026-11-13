import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "nexus_session";
const SESSION_SECONDS = 8 * 60 * 60;
const attempts = new Map();

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

function secretsReady() {
  return Boolean(process.env.NEXUS_ACCESS_PASSWORD && process.env.NEXUS_SESSION_SECRET && process.env.NEXUS_SESSION_SECRET.length >= 32);
}

function sign(value) {
  return createHmac("sha256", process.env.NEXUS_SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function readCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function hasSession(req) {
  if (!secretsReady()) return false;
  const token = readCookies(req)[COOKIE];
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function requireSession(req, res) {
  if (!secretsReady()) {
    json(res, 503, { error: "La protección de NEXUS aún no está configurada. Define NEXUS_ACCESS_PASSWORD y NEXUS_SESSION_SECRET (mínimo 32 caracteres) como variables privadas del servidor." });
    return false;
  }
  if (!hasSession(req)) {
    json(res, 401, { error: "Sesión no válida o expirada. Inicia sesión nuevamente." });
    return false;
  }
  return true;
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!secretsReady()) return json(res, 503, {
    authenticated: false,
    configured: false,
    error: "Falta configurar NEXUS_ACCESS_PASSWORD y NEXUS_SESSION_SECRET (mínimo 32 caracteres) en el entorno privado."
  });

  if (req.method === "GET") {
    return json(res, 200, { authenticated: hasSession(req), configured: true });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return json(res, 200, { authenticated: false });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return json(res, 405, { error: "Método no permitido." });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const state = attempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + 15 * 60 * 1000;
  }
  if (state.count >= 8) {
    return json(res, 429, { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." });
  }

  const supplied = typeof req.body?.password === "string" ? req.body.password : "";
  if (!safeEqual(supplied, process.env.NEXUS_ACCESS_PASSWORD)) {
    state.count += 1;
    attempts.set(ip, state);
    return json(res, 401, { error: "Contraseña incorrecta." });
  }

  attempts.delete(ip);
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS })).toString("base64url");
  const token = payload + "." + sign(payload);
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`);
  return json(res, 200, { authenticated: true, expiresIn: SESSION_SECONDS });
}
