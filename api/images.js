import { requireSession } from "./auth.js";

const json = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!requireSession(req, res)) return;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método no permitido." });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json(res, 503, { error: "Falta configurar OPENAI_API_KEY en Vercel para habilitar la edición de imágenes. La clave debe guardarse como variable privada; nunca en GitHub." });

  const { prompt, image, mimeType, fileName } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) return json(res, 400, { error: "Describe qué quieres cambiar en la fotografía." });
  if (prompt.length > 4000) return json(res, 413, { error: "La instrucción supera el máximo de 4.000 caracteres." });
  if (typeof image !== "string" || !image.startsWith("data:")) return json(res, 400, { error: "Adjunta una fotografía para editar." });
  if (!MIME_TYPES.has(mimeType)) return json(res, 415, { error: "Formato no compatible. Usa PNG, JPG o WebP." });

  try {
    const base64 = image.slice(image.indexOf(",") + 1);
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return json(res, 413, { error: "La imagen debe pesar como máximo 8 MB." });
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt.trim());
    form.append("size", "auto");
    form.append("image", new Blob([bytes], { type: mimeType }), (fileName || "photo").replace(/[^a-zA-Z0-9._-]/g, "_"));
    const upstream = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: "Bearer " + key },
      body: form,
      signal: AbortSignal.timeout(120000)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json(res, upstream.status === 429 ? 429 : 502, { error: data.error?.message || "El servicio de imágenes no pudo completar la edición." });
    const result = data.data?.[0]?.b64_json;
    if (!result) return json(res, 502, { error: "El proveedor no devolvió una imagen editable." });
    return json(res, 200, { image: "data:image/png;base64," + result, revisedPrompt: data.data?.[0]?.revised_prompt || "" });
  } catch (error) {
    return json(res, 502, { error: error.name === "TimeoutError" ? "La edición tardó demasiado. Inténtalo con una imagen más pequeña." : "No fue posible conectar con el servicio de imágenes." });
  }
}
