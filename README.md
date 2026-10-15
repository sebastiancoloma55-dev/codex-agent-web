# Forge — alternativa web independiente a Codex

Prototipo inicial de interfaz para un agente de programación asistida por IA.

## Estado actual
- Interfaz adaptable a escritorio y móvil.
- Conversación de demostración con sugerencias.
- Contexto visual de archivos seleccionados (solo registra nombre, tamaño y tipo en memoria del navegador).
- Registro de actividad de la sesión.
- Sin ejecución de comandos, sin edición de archivos locales y sin conexión a un proveedor de IA.
- No sube archivos ni guarda conversaciones en un servidor.

## Ejecutar
Es una página estática: abre `index.html` en un navegador o sirve este repositorio con un servicio de hosting estático.

## Próximos pasos
1. Añadir API de aplicación y autenticación.
2. Integrar un proveedor de IA con un nivel gratuito disponible, revisando límites y condiciones antes de elegirlo.
3. Implementar lectura de archivos con consentimiento y contexto acotado.
4. Crear diffs revisables antes de aplicar cambios.
5. Añadir ejecución de herramientas en un entorno aislado con aprobaciones explícitas.

## Seguridad
No guardes claves de API, tokens, secretos ni archivos privados en el repositorio. El repositorio debe permanecer privado si se añadirá código o configuración sensible.
