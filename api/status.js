const json = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(body);
};

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Método no permitido." });
  }
  const paidProvidersEnabled = process.env.NEXUS_ENABLE_PAID_PROVIDERS === "true";
  return json(res, 200, {
    providers: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      anthropic: paidProvidersEnabled && Boolean(process.env.ANTHROPIC_API_KEY),
      openai: paidProvidersEnabled && Boolean(process.env.OPENAI_API_KEY),
      gemini: paidProvidersEnabled && Boolean(process.env.GEMINI_API_KEY)
    },
    imageGeneration: Boolean(paidProvidersEnabled && process.env.OPENAI_API_KEY && process.env.NEXUS_IMAGES_ENABLED === "true"),
    mode: "open",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null
  });
}
