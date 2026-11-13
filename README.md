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
- Sin autenticación, ejecución de herramientas ni integración GitHub activa todavía.
- No se ha creado un despliegue de Vercel ni se han activado servicios de pago.

## Desarrollo local

Sirve el repositorio con Vercel CLI o un entorno compatible con funciones serverless. La página estática usa `/api/chat` para conversar. Sin variables privadas configuradas, la API devuelve un mensaje claro de configuración pendiente.

## Variables de entorno (solo en el entorno privado)

Selecciona un proveedor con `AI_PROVIDER`:

- `anthropic`: `ANTHROPIC_API_KEY`, opcional `ANTHROPIC_MODEL`.
- `openai`: `OPENAI_API_KEY`, opcional `AI_MODEL`.
- `openrouter`: `OPENROUTER_API_KEY`, opcional `AI_MODEL`.
- `gemini`: `GEMINI_API_KEY`, opcional `GEMINI_MODEL`.

Opcionales: `APP_URL`. Nunca guardes claves en Git, archivos públicos, código del navegador o capturas.

## Próximas fases

1. Autenticación y perfiles.
2. Persistencia de conversaciones y memoria con controles de usuario.
3. Ampliar catálogo de modelos y gestión transparente de disponibilidad/costos.
4. Proyectos, archivos y artefactos persistentes.
5. Herramientas con permisos granulares, sandbox y confirmación de acciones sensibles.
6. Integraciones OAuth con GitHub y otros servicios.
7. Pruebas automatizadas, revisión de seguridad y despliegue de preview autorizado.

## Costos y despliegue

Las llamadas a Anthropic, OpenAI, Gemini u OpenRouter pueden tener límites o costos según el proveedor y el modelo. No configures claves ni actives recursos facturables sin revisar antes sus condiciones. El despliegue queda expresamente pendiente de autorización.
