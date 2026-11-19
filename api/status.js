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
  return json(res, 200, {
    providers: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY)
    },
    images: Boolean(process.env.OPENAI_API_KEY && process.env.NEXUS_IMAGES_ENABLED === "true"),
    mode: "open"
  });
}
