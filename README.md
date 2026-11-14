# NEXUS AI

Plataforma independiente de asistente multimodelo. Este repositorio se desarrolla en la rama `nexus-ai/development`; la rama `main` se conserva sin cambios.

## Estado de esta etapa

- Interfaz web rebrandeada como NEXUS AI, adaptable a escritorio y móvil.
- Chat con selector de proveedor/modelo y adaptadores de API para Anthropic, OpenAI, OpenRouter y Gemini (requiere claves privadas).
- Lectura local de archivos de texto, PDF y hojas de cálculo para adjuntarlos como contexto a una conversación.
- Claves de proveedor leídas exclusivamente desde variables de entorno del servidor.
- Sin credenciales incluidas en el repositorio.
- Historial de conversaciones guardado localmente en el navegador; todavía no hay sincronización entre dispositivos ni memoria persistente de servidor.
- Proyectos de trabajo, memoria editable por usuario y exportación de respaldo guardados localmente en el navegador.
- Acceso privado de contraseña única con sesión firmada, cookie segura y protección del endpoint de chat; todavía no hay cuentas individuales ni roles.
- Límite inicial de intentos de acceso en memoria del proceso (8 intentos por ventana de 15 minutos); se validan tamaños de contraseña y cabeceras de cookies. Es protección básica, no rate limiting distribuido.
- API de chat limitada inicialmente a 20 solicitudes por minuto por IP y timeout de 45 segundos por llamada al proveedor; valida el formato del cuerpo, limita mensaje/contexto/historial y aplica un máximo de 70.000 caracteres de texto total. El limitador en memoria no sustituye un rate limiter distribuido.
- Endpoint privado `/api/permissions` y panel de capacidades: consultas, lectura de adjuntos e historial local permitidos; escritura de archivos, ejecución, GitHub, despliegues y gestión de secretos bloqueados.
- Explorador de repositorios GitHub públicos en modo solo lectura desde el navegador: árbol de archivos, filtro, vista previa y selección de archivos para contexto; no requiere token ni permite escrituras.
- Orquestador multiagente configurable con equipos de 4, 6 u 8 especialistas secuenciales: planificador estructurado que descompone la solicitud en subtareas, asigna responsables por rol, registra prioridades, dependencias, criterios de aceptación y riesgos; el resto del equipo recibe las asignaciones correspondientes. Si el planificador no devuelve JSON válido, se aplica una subtarea de respaldo y se informa la limitación. planificación, ingeniería, seguridad, QA y, en equipos ampliados, arquitectura, backend, frontend/UX y supervisión final. Cada especialista realiza una llamada al proveedor elegido; una ejecución de 8 agentes puede generar hasta ocho llamadas y costos variables.
- Revisión de propuestas: detecta bloques unified diff, permite previsualizarlos y registrar localmente aprobación o descarte. Aprobar no aplica el parche ni modifica archivos.
- Historial local de las últimas 20 ejecuciones multiagente: registra proveedor/modelo, tamaño del equipo, estado, fecha y resultados parciales; permite descargar informes Markdown y se incluye en el respaldo JSON. Las ejecuciones que quedan abiertas tras recargar la página se marcan como interrumpidas.
- Arquitectura objetivo y fases de escalamiento documentadas en `docs/AGENT_PLATFORM_ARCHITECTURE.md`, incluyendo cola persistente, workers limitados, presupuesto, sandbox, OAuth y auditoría.
- El equipo produce análisis, propuestas y diffs sugeridos; no aplica parches, no ejecuta comandos ni modifica GitHub. La revisión y aprobación son conceptuales en esta etapa; las herramientas de escritura y sandbox siguen bloqueadas.
- Sin ejecución de herramientas de sistema ni integración GitHub de escritura. El panel de permisos describe las capacidades actuales y bloqueadas.
- No se ha creado un despliegue de Vercel ni se han activado servicios de pago.

## Desarrollo local

Sirve el repositorio con Vercel CLI o un entorno compatible con funciones serverless. La página estática consulta `/api/auth` al iniciar y usa `/api/chat` solo con una sesión válida. La cookie requiere HTTPS (por ejemplo, Vercel Preview). En desarrollo local HTTP, configura un proxy HTTPS o adapta el entorno de pruebas; no desactives la seguridad en un despliegue público.

## Variables de entorno (solo en el entorno privado)

Configura estas variables únicamente en el entorno privado del servidor (nunca en GitHub ni en el navegador):

- `NEXUS_ACCESS_PASSWORD`: contraseña de acceso privado (máximo 256 caracteres).
- `NEXUS_SESSION_SECRET`: secreto aleatorio de al menos 32 caracteres para firmar sesiones. Usa un valor distinto de la contraseña.

Selecciona un proveedor con `AI_PROVIDER`:

- `anthropic`: `ANTHROPIC_API_KEY`, opcional `ANTHROPIC_MODEL`.
- `openai`: `OPENAI_API_KEY`, opcional `AI_MODEL`.
- `openrouter`: `OPENROUTER_API_KEY`, opcional `AI_MODEL`.
- `gemini`: `GEMINI_API_KEY`, opcional `GEMINI_MODEL`.

Opcionales: `APP_URL`. Nunca guardes claves en Git, archivos públicos, código del navegador o capturas.

## Próximas fases

1. Cuentas individuales, perfiles y roles (la capa actual es una contraseña compartida).
2. Persistencia de conversaciones y memoria con controles de usuario.
3. Ampliar catálogo de modelos y gestión transparente de disponibilidad/costos.
4. Proyectos, archivos y artefactos persistentes.
5. Herramientas con permisos granulares, sandbox y confirmación de acciones sensibles.
6. Integraciones OAuth con GitHub y otros servicios.
7. Pruebas automatizadas, revisión de seguridad y despliegue de preview autorizado.

## Costos y despliegue

Las llamadas a Anthropic, OpenAI, Gemini u OpenRouter pueden tener límites o costos según el proveedor y el modelo. No configures claves ni actives recursos facturables sin revisar antes sus condiciones. El despliegue queda expresamente pendiente de autorización.
