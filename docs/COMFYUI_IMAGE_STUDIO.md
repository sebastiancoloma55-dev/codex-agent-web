# NEXUS Image Studio — motor ComfyUI

NEXUS Image Studio puede usar una instancia propia de ComfyUI como motor de edición. La aplicación web y sus endpoints permanecen en Vercel; la inferencia de imágenes ocurre en el servidor ComfyUI configurado por el administrador.

## Variables privadas de Vercel

Configurar en Preview (no agregar secretos al repositorio):

- `COMFYUI_URL`: URL HTTPS del servidor ComfyUI accesible desde Vercel.
- `COMFYUI_API_TOKEN`: opcional, si el proxy de ComfyUI exige Bearer token.
- `COMFYUI_WORKFLOW_JSON`: JSON de un workflow exportado en formato API.

No se incluye una clave, URL ni servidor GPU. El administrador debe provisionar el motor y sus modelos; GPU/hosting puede generar costos.

## Placeholders del workflow

En el JSON API del workflow, insertar exactamente estos valores de texto donde corresponda:

- `__NEXUS_PROMPT__`: se reemplaza por la instrucción del usuario.
- `__NEXUS_IMAGE__`: se reemplaza por el nombre del archivo subido a ComfyUI.

El workflow debe recibir la imagen mediante el nodo de carga de imagen compatible (por ejemplo LoadImage) y conectar el texto al nodo de prompt correspondiente. Debe producir al menos una imagen en un nodo de salida que ComfyUI exponga en `history/{prompt_id}.outputs.*.images`.

El backend:
1. valida sesión, formato, tamaño y confirmación de autorización;
2. sube la imagen a `/upload/image`;
3. envía el workflow a `/prompt`;
4. consulta `/history/{prompt_id}` y recupera la imagen de `/view`.

## Endpoints

- `POST /api/comfyui`: inicia un trabajo. Body: `{prompt,image,mimeType,fileName,authorized:true}`.
- `GET /api/comfyui?promptId=...`: consulta el trabajo y devuelve `queued/running/completed/failed`.

## Seguridad y alcance

La confirmación de autorización es una declaración del usuario, no una verificación de identidad o consentimiento de terceros. No habilita generación de desnudos íntimos no consentidos, sexualización de menores ni elusión de salvaguardas. Se permiten flujos legítimos de moda, lencería adulta no explícita y edición creativa. La instancia ComfyUI debe tener controles de acceso y no exponerse públicamente sin autenticación.

## Estado

La integración de software es un adaptador; no incluye una instancia GPU ni un workflow específico. Hasta configurar las variables y desplegar ComfyUI, la función responderá que el motor no está configurado.
