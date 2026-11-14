import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "nexus_session";
const SESSION_SECONDS = 8 * 60 * 60;
const attempts = new Map();
const MAX_PASSWORD_LENGTH = 256;
const MAX_COOKIE_HEADER_LENGTH = 16384;

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

function secretsReady() {
  const password = process.env.NEXUS_ACCESS_PASSWORD;
  const secret = process.env.NEXUS_SESSION_SECRET;
  return typeof password === "string" && password.length > 0 &&
    password.length <= MAX_PASSWORD_LENGTH &&
    typeof secret === "string" && secret.length >= 32;
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
  const header = String(req.headers.cookie || "");
  if (header.length > MAX_COOKIE_HEADER_LENGTH) return {};
  try {
    return Object.fromEntries(header.split(";").map(part => {
      const index = part.indexOf("=");
      return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(([key]) => key));
  } catch {
    return {};
  }
}

function hasSession(req) {
  if (!secretsReady()) return false;
  const token = readCookies(req)[COOKIE];
  if (typeof token !== "string" || token.length > 2048) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
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

function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 128);
}

function checkLoginLimit(ip, now) {
  const state = attempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now >= state.resetAt) {
    state.count = 0;
    state.resetAt = now + 15 * 60 * 1000;
  }
  if (state.count >= 8) return false;
  state.count += 1;
  attempts.set(ip, state);
  if (attempts.size > 1000) {
    for (const [key, value] of attempts) {
      if (now >= value.resetAt) attempts.delete(key);
    }
  }
  return true;
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!secretsReady()) return json(res, 503, {
    authenticated: false,
    configured: false,
    error: "Falta configurar NEXUS_ACCESS_PASSWORD y NEXUS_SESSION_SECRET (mínimo 32 caracteres) en el entorno privado. La contraseña admite hasta 256 caracteres."
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

  const ip = getClientIp(req);
  const now = Date.now();
  if (!checkLoginLimit(ip, now)) {
    return json(res, 429, { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." });
  }

  const supplied = typeof req.body?.password === "string" && req.body.password.length <= MAX_PASSWORD_LENGTH
    ? req.body.password : "";
  if (!supplied || !safeEqual(supplied, process.env.NEXUS_ACCESS_PASSWORD)) {
    return json(res, 401, { error: "Contraseña incorrecta o formato no válido." });
  }

  attempts.delete(ip);
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS })).toString("base64url");
  const token = payload + "." + sign(payload);
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`);
  return json(res, 200, { authenticated: true, expiresIn: SESSION_SECONDS });
}
