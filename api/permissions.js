import { requireSession } from "./auth.js";

const POLICY = Object.freeze({
  version: 1,
  mode: "restricted",
  capabilities: [
    { id: "chat", label: "Enviar consultas a modelos de IA", allowed: true, scope: "Solo mensajes y contexto que envías" },
    { id: "multi_agent_analysis", label: "Orquestar equipo de agentes especialistas", allowed: true, scope: "Hasta 8 consultas secuenciales al proveedor configurado; análisis y propuestas, sin herramientas de escritura ni ejecución" },
    { id: "read_uploads", label: "Leer archivos adjuntos", allowed: true, scope: "Lectura local en el navegador; el texto se envía al proveedor elegido" },
    { id: "local_history", label: "Guardar historial y memoria local", allowed: true, scope: "Solo en este navegador" },
    { id: "write_project_files", label: "Crear o modificar archivos del proyecto", allowed: false, scope: "Requiere herramienta de archivos y aprobación explícita" },
    { id: "execute_code", label: "Ejecutar código o comandos", allowed: false, scope: "Requiere sandbox aislado y aprobación" },
    { id: "git_write", label: "Crear commits o modificar GitHub", allowed: false, scope: "Requiere integración GitHub y autorización por operación" },
    { id: "deploy", label: "Desplegar en Vercel", allowed: false, scope: "Desactivado; requiere autorización expresa" },
    { id: "manage_secrets", label: "Leer o modificar credenciales", allowed: false, scope: "Nunca disponible al modelo desde el navegador" }
  ]
});

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!requireSession(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }
  return res.status(200).json(POLICY);
}
