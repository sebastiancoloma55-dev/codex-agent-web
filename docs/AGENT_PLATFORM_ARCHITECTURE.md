# NEXUS AI — Arquitectura de agentes y plan de escalamiento

## Estado implementado en esta rama

- Chat multimodelo con autenticación privada compartida.
- Explorador GitHub público en modo lectura.
- Orquestación multiagente configurable de 4, 6 u 8 especialistas: planificador inicial, especialistas ejecutados en paralelo con pool limitado a 3 solicitudes simultáneas y supervisor final cuando el tamaño del equipo lo incluye.
- Directorio local de 1.000 perfiles lógicos de especialidad (10 roles × 10 dominios × 10 enfoques), con búsqueda y asignación de hasta 12 perfiles por proyecto.
- Las asignaciones se guardan por proyecto en el navegador y se inyectan como contexto especializado al equipo multiagente; no crean 1.000 procesos ni llamadas independientes.
- Estado visible de conectores: GitHub público en lectura mediante el explorador existente; Vercel, repositorios privados y demás plataformas aún no conectados.
- Roles base: planificación, ingeniería, seguridad y QA.
- Roles ampliados: arquitectura, backend, frontend/UX y supervisión final.
- Cada especialista recibe la tarea y los resultados previos como contexto.
- Cola local de hasta 50 tareas multiagente, guardada en `localStorage`, con ejecución manual individual y estados básicos.
- Cancelación de una ejecución desde el navegador.
- Extracción de bloques `unified diff` generados por el especialista de ingeniería.
- Registro local de propuestas y estados pendiente/aprobada/descartada.
- Exportación local de proyectos, conversaciones, recuerdos y propuestas.
- Sin escritura en repositorios, ejecución de comandos, sandbox ni despliegues.

## Cola local de tareas (implementada en esta etapa)

La cola conserva hasta 50 tareas en `localStorage` del navegador. Permite guardar una tarea, ejecutarla manualmente y conservar estados básicos al recargar. Si la pestaña se cierra durante una ejecución, la tarea en curso vuelve a estado pendiente al reabrir la aplicación; debe iniciarse manualmente. No es una cola cloud, no sincroniza entre dispositivos, no ejecuta en segundo plano y depende del almacenamiento disponible del navegador.

## Directorio de agentes por proyecto (implementado en esta etapa)

El catálogo genera 1.000 perfiles lógicos a partir de combinaciones de rol, dominio y enfoque. El usuario puede buscar perfiles, asignar hasta 12 al proyecto activo y quitarlos. Las asignaciones se almacenan en `localStorage` por ID de proyecto y se añaden al contexto del equipo en la siguiente ejecución. Estos perfiles son especializaciones de instrucciones, no agentes autónomos ni workers en ejecución.

El conector GitHub existente continúa limitado a repositorios públicos en modo lectura. No se ha conectado OAuth, GitHub App, Vercel ni otras plataformas. No hay permisos de escritura ni despliegue.

## Planificador y validación de dependencias (implementado en esta etapa)

El plan estructurado asigna IDs `ST-1` a `ST-8`. El validador local comprueba referencias inexistentes, dependencias propias y ciclos y calcula un orden topológico. Tras validar, las subtareas se entregan a especialistas independientes en un pool del navegador con concurrencia máxima de 3 llamadas a `/api/chat`; los resultados se guardan progresivamente en el historial local. El supervisor final consolida resultados cuando forma parte del equipo. Esto es ejecución concurrente acotada durante la sesión del navegador, no una cola persistente ni workers cloud: cerrar la pestaña interrumpe la ejecución. El límite de 3 reduce ráfagas, pero cada llamada puede consumir cuota o generar costo según el proveedor.

## Qué significa escalar a cientos o miles de agentes

No se deben iniciar miles de llamadas de modelos en paralelo desde el navegador. Eso causaría límites de proveedor, costos impredecibles, pérdida de estado y dificultad para cancelar o auditar.

La arquitectura objetivo es jerárquica y basada en trabajos:

1. **Orquestador principal**: recibe el objetivo, valida permisos y crea un plan versionado.
2. **Descomposición**: divide el plan en tareas pequeñas con entradas, salidas y criterios de aceptación.
3. **Cola persistente cloud**: almacena tareas, prioridad, dependencias, intentos, propietario, estado y vencimiento (no implementada; requiere almacenamiento autorizado).
4. **Pool de workers**: ejecuta un número configurable de agentes simultáneos; el límite se aplica en servidor, no en el navegador.
5. **Especialistas**: agentes con rol, herramientas permitidas y contexto mínimo necesario.
6. **Memoria de trabajo**: resultados estructurados por tarea, referencias a archivos y decisiones; no se comparte todo el historial con todos los agentes.
7. **Supervisor**: valida dependencias, consolida resultados, detecta contradicciones y reintenta solo tareas fallidas.
8. **Presupuesto**: límite por tarea, usuario, proveedor y periodo; contador de llamadas/tokens y parada automática al alcanzar el límite.
9. **Aprobaciones**: las operaciones de escritura, ejecución, publicación o acceso a secretos requieren autorización específica y trazable.
10. **Auditoría**: registra quién pidió qué, qué agente lo hizo, qué datos consultó, qué resultado produjo y qué aprobación se recibió.

El número de agentes es una capacidad lógica del planificador; la concurrencia real debe limitarse por la capacidad disponible y el presupuesto. Un equipo puede representar miles de subtareas a lo largo del tiempo sin tener miles de procesos activos a la vez.

## Servicios e infraestructura que todavía faltan

| Componente | Necesidad | Estado |
|---|---|---|
| Cola cloud y coordinación multiusuario | Mantener tareas y reintentos entre dispositivos, usuarios y cierres de sesión | Pendiente; existe solo una cola local en navegador |
| Base de datos y cuentas individuales | Aislar proyectos, usuarios y permisos | Pendiente |
| Workers server-side | Ejecutar agentes sin depender de la pestaña del navegador | Pendiente |
| Rate limit y presupuesto distribuido | Evitar abuso y costos descontrolados | Pendiente |
| Sandbox aislado | Ejecutar código con límites de CPU, memoria, red y tiempo | Pendiente |
| GitHub OAuth/app | Acceso privado y operaciones por repositorio | Pendiente |
| Motor de parches | Validar y aplicar diffs sobre una rama de trabajo | Pendiente |
| Pruebas automatizadas | Unitarias, integración y end-to-end | Pendiente |
| Observabilidad | Logs, métricas, trazas y auditoría | Pendiente |

## Política de cambios

- El explorador GitHub actual solo lee repositorios públicos.
- Las propuestas de diff se muestran para inspección; aprobar una propuesta en la interfaz solo registra la decisión local, no aplica cambios.
- No se ejecuta código recibido de un modelo.
- No se leen ni almacenan claves en el navegador o en Git.
- No se despliega a producción ni a preview sin autorización explícita.
- No se activa una base de datos, cola, worker o proveedor facturable sin autorización expresa y revisión de costos.

## Próximos hitos técnicos recomendados

1. Pruebas automatizadas de la aplicación actual, incluyendo cancelación y concurrencia acotada.
2. Contratos de tareas y resultados en JSON con validación de esquema.
3. Cola persistente con estados `queued`, `running`, `blocked`, `succeeded`, `failed` y `cancelled` (requiere almacenamiento/infraestructura autorizados).
4. Límites globales de concurrencia y presupuesto.
5. Sandbox efímero sin secretos y con red deshabilitada por defecto.
6. GitHub App/OAuth con permisos mínimos, diff preview y aprobación explícita.
7. Persistencia multiusuario con aislamiento y auditoría.

## Nota de costos

Cada consulta a un modelo puede tener costo o límites de uso. La aplicación actual puede hacer hasta ocho consultas secuenciales en una ejecución de equipo. No se ha configurado una tarifa ni se puede garantizar costo cero al conectar proveedores externos.
