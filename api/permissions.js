import { requireNexusUser } from "./_lib/require-user.js";

const POLICY = Object.freeze({
  version: 1,
  mode: "asistencia-sso",
  capabilities: [
    { id: "chat", label: "Enviar consultas a modelos de IA", allowed: true, scope: "Solo mensajes y contexto que envías" },
    { id: "multi_agent_analysis", label: "Orquestar equipo de agentes especialistas", allowed: true, scope: "Planificador, especialistas con hasta 3 consultas simultáneas y supervisor final (según tamaño del equipo); máximo 8 llamadas por ejecución. Se ejecuta mientras la pestaña permanece abierta; no es una cola persistente ni workers cloud. Cada llamada puede consumir cuota o generar costo según proveedor." },
    { id: "agent_queue_local", label: "Guardar y ejecutar tareas en cola local", allowed: true, scope: "Hasta 50 tareas en localStorage; ejecución manual en navegador, sin sincronización ni workers cloud" },
    { id: "agent_registry", label: "Asignar perfiles especialistas por proyecto", allowed: true, scope: "Catálogo local de 1.000 perfiles lógicos; hasta 12 asignaciones por proyecto, guardadas en este navegador" },
    { id: "github_public_read", label: "Explorar repositorios GitHub públicos", allowed: true, scope: "Solo lectura pública desde el explorador; sin OAuth, repositorios privados ni escrituras" },
    { id: "read_uploads", label: "Leer archivos adjuntos", allowed: true, scope: "TXT, DOCX, PDF con texto y hojas Excel/CSV; máximo 10 archivos y 30 MB combinados. El contexto enviado se limita a 30.000 caracteres; PDF escaneados requieren OCR no incluido." },
    { id: "image_analysis", label: "Analizar imágenes adjuntas", allowed: true, scope: "JPG/PNG/WebP optimizadas en el navegador; máximo 3 imágenes y 2 MB totales por consulta mediante OpenRouter Free. No genera ni edita imágenes." },
    { id: "local_history", label: "Guardar historial y memoria local", allowed: true, scope: "Solo en este navegador" },
    { id: "write_project_files", label: "Crear o modificar archivos del proyecto", allowed: false, scope: "Requiere herramienta de archivos y aprobación explícita" },
    { id: "execute_code", label: "Ejecutar código o comandos", allowed: false, scope: "Requiere sandbox aislado y aprobación" },
    { id: "git_write", label: "Crear commits o modificar GitHub", allowed: false, scope: "Requiere integración GitHub y autorización por operación" },
    { id: "deploy", label: "Desplegar en Vercel", allowed: false, scope: "Desactivado; requiere autorización expresa" },
    { id: "manage_secrets", label: "Leer o modificar credenciales", allowed: false, scope: "Nunca disponible al modelo desde el navegador" }
  ]
});

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }
  const user = await requireNexusUser(req, res);
  if (!user) return;
  return res.status(200).json({ ...POLICY, user });
}
