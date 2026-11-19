# NEXUS AI

Plataforma independiente de asistente multimodelo. Este repositorio se desarrolla en la rama `nexus-ai/development`; la rama `main` se conserva sin cambios.

## Estado de esta etapa

- Interfaz web rebrandeada como NEXUS AI, adaptable a escritorio y móvil.
- Chat con selector de proveedor/modelo y adaptadores de API para Anthropic, OpenAI, OpenRouter y Gemini (solo aparecen como disponibles los proveedores cuya clave está configurada; en el Preview actual se detecta OpenRouter).
- Lectura local de archivos de texto, PDF con texto seleccionable y hojas de cálculo para adjuntarlos como contexto a una conversación. No incluye OCR de PDF escaneados ni lectura de imágenes en esta rama.
- Claves de proveedor leídas exclusivamente desde variables de entorno del servidor.
- Sin credenciales incluidas en el repositorio.
- Historial de conversaciones guardado localmente en el navegador; todavía no hay sincronización entre dispositivos ni memoria persistente de servidor.
- Proyectos de trabajo, memoria editable por usuario y exportación de respaldo guardados localmente en el navegador.
- Acceso directo sin contraseña ni sesión: la interfaz y el chat quedan públicos para cualquier persona que tenga el enlace. No se deben enviar datos personales, médicos, laborales ni confidenciales mientras no exista autenticación individual y aislamiento de datos.
- Límite inicial de intentos de acceso en memoria del proceso (8 intentos por ventana de 15 minutos); se validan tamaños de contraseña y cabeceras de cookies. Es protección básica, no rate limiting distribuido.
- API de chat limitada inicialmente a 20 solicitudes por minuto por IP y timeout de 45 segundos por llamada al proveedor; valida el formato del cuerpo, limita mensaje/contexto/historial y aplica un máximo de 70.000 caracteres de texto total. El limitador en memoria no sustituye un rate limiter distribuido.
- Endpoint privado `/api/permissions` y panel de capacidades: consultas, lectura de adjuntos e historial local permitidos; escritura de archivos, ejecución, GitHub, despliegues y gestión de secretos bloqueados.
- Explorador de repositorios GitHub públicos en modo solo lectura desde el navegador: árbol de archivos, filtro, vista previa y selección de archivos para contexto; no requiere token ni permite escrituras.
- Endpoint `/api/status` para mostrar disponibilidad de proveedores sin revelar claves; las opciones sin clave configurada quedan deshabilitadas en la interfaz.
- Validación automática de sintaxis para las funciones API y scripts del navegador mediante GitHub Actions.
- Directorio de 1.000 perfiles lógicos de especialidad (10 roles × 10 dominios × 10 enfoques), buscables y asignables por proyecto (máximo 12); las asignaciones locales enriquecen el contexto de las ejecuciones, pero no representan 1.000 workers independientes.
- Conectividad actual: GitHub público en modo lectura mediante el explorador existente. Vercel, repositorios privados y otras plataformas siguen sin conectar; no hay escritura ni despliegues.
- Orquestador multiagente configurable con equipos de 4, 6 u 8 especialistas: planificador estructurado que descompone la solicitud en subtareas, asigna responsables por rol, registra prioridades, dependencias, criterios de aceptación y riesgos; el resto del equipo recibe las asignaciones correspondientes. Si el planificador no devuelve JSON válido, se aplica una subtarea de respaldo y se informa la limitación. planificación, ingeniería, seguridad, QA y, en equipos ampliados, arquitectura, backend, frontend/UX y supervisión final. El planificador se ejecuta primero; después los especialistas trabajan en paralelo con un pool máximo de 3 solicitudes simultáneas y el supervisor consolida al final cuando está incluido. Máximo de 8 llamadas por ejecución; cada llamada puede consumir cuota o generar costos variables.
- Validador local de dependencias del plan: detecta referencias desconocidas, dependencias propias y ciclos; calcula un orden topológico antes de ejecutar especialistas independientes con las subtareas asignadas. La ejecución concurrente ocurre en la sesión del navegador y se interrumpe si se cierra la pestaña; todavía no existe cola persistente ni workers cloud.
- Revisión de propuestas: detecta bloques unified diff, permite previsualizarlos y registrar localmente aprobación o descarte. Aprobar no aplica el parche ni modifica archivos.
- Historial local de las últimas 20 ejecuciones multiagente: registra proveedor/modelo, tamaño del equipo, estado, fecha y resultados parciales; permite descargar informes Markdown y se incluye en el respaldo JSON. Las ejecuciones que quedan abiertas tras recargar la página se marcan como interrumpidas.
- Arquitectura objetivo y fases de escalamiento documentadas en `docs/AGENT_PLATFORM_ARCHITECTURE.md`, incluyendo cola persistente, workers limitados, presupuesto, sandbox, OAuth y auditoría.
- El equipo produce análisis, propuestas y diffs sugeridos; no aplica parches, no ejecuta comandos ni modifica GitHub.
- La ejecución de tareas multiagente valida dependencias, pero la asignación actual sigue agrupando trabajo por especialista; no equivale a un motor de tareas distribuido con dependencias persistentes. La revisión y aprobación son conceptuales en esta etapa; las herramientas de escritura y sandbox siguen bloqueadas.
- Sin ejecución de herramientas de sistema ni integración GitHub de escritura. El panel de permisos describe las capacidades actuales y bloqueadas.
- No se ha creado un despliegue de Vercel ni se han activado servicios de pago.

## Desarrollo local

Sirve el repositorio con Vercel CLI o un entorno compatible con funciones serverless. La página estática abre directamente el chat. `/api/auth` solo informa el modo abierto; `/api/chat` no requiere sesión. Esta configuración es apropiada solo para pruebas con información no sensible.

## Variables de entorno (solo en el entorno privado)

Configura estas variables únicamente en el entorno privado del servidor (nunca en GitHub ni en el navegador):


Selecciona un proveedor con `AI_PROVIDER`:

- `anthropic`: `ANTHROPIC_API_KEY`, opcional `ANTHROPIC_MODEL`.
- `openai`: `OPENAI_API_KEY`, opcional `AI_MODEL`.
- `openrouter`: `OPENROUTER_API_KEY`, opcional `AI_MODEL`.
- `gemini`: `GEMINI_API_KEY`, opcional `GEMINI_MODEL`.

Opcionales: `APP_URL`. Nunca guardes claves en Git, archivos públicos, código del navegador o capturas.

## Seguridad del modo abierto

Cualquier persona que tenga el enlace puede utilizar el chat y consumir las claves de IA configuradas por el propietario. No hay identidad, historial compartido en servidor ni separación de usuarios. No subas planillas con RUT, licencias médicas, remuneraciones, datos de colaboradores ni otros datos confidenciales. Para uso real se debe implementar autenticación individual, cuotas por usuario y almacenamiento aislado.

## Funciones no activadas en esta rama

- Image Studio: presente en una versión anterior de `main`, pero no se ha reincorporado a esta rama. La implementación anterior usa un endpoint de imágenes que requiere una clave de OpenAI y el modelo `gpt-image-1`, que fue retirado el 23 de octubre de 2026. La nueva versión del endpoint requiere migración y una política de presupuesto antes de activarse. No se habilita por defecto para evitar costos no autorizados.
- Lectura de imágenes y OCR: pendiente. Los adjuntos admitidos actualmente son texto, PDF con capa de texto y hojas de cálculo.
- Persistencia entre dispositivos, cuentas individuales, aislamiento de datos y cola cloud: pendientes.

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
