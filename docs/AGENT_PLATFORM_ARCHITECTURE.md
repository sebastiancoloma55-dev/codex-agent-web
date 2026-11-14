# NEXUS AI — Arquitectura de agentes y plan de escalamiento

## Estado implementado en esta rama

- Chat multimodelo con autenticación privada compartida.
- Explorador GitHub público en modo lectura.
- Orquestación secuencial configurable de 4, 6 u 8 especialistas.
- Roles base: planificación, ingeniería, seguridad y QA.
- Roles ampliados: arquitectura, backend, frontend/UX y supervisión final.
- Cada especialista recibe la tarea y los resultados previos como contexto.
- Cancelación de una ejecución desde el navegador.
- Extracción de bloques `unified diff` generados por el especialista de ingeniería.
- Registro local de propuestas y estados pendiente/aprobada/descartada.
- Exportación local de proyectos, conversaciones, recuerdos y propuestas.
- Sin escritura en repositorios, ejecución de comandos, sandbox ni despliegues.

## Planificador y validación de dependencias (implementado en esta etapa)

El plan estructurado asigna IDs `ST-1` a `ST-8`. El validador local comprueba referencias inexistentes, dependencias propias y ciclos; calcula las subtareas disponibles al inicio y un orden topológico posible. No añade llamadas al modelo. La interfaz presenta el resultado como simulación: todavía no ejecuta cada subtarea como trabajo independiente ni programa concurrencia real.

## Qué significa escalar a cientos o miles de agentes

No se deben iniciar miles de llamadas de modelos en paralelo desde el navegador. Eso causaría límites de proveedor, costos impredecibles, pérdida de estado y dificultad para cancelar o auditar.

La arquitectura objetivo es jerárquica y basada en trabajos:

1. **Orquestador principal**: recibe el objetivo, valida permisos y crea un plan versionado.
2. **Descomposición**: divide el plan en tareas pequeñas con entradas, salidas y criterios de aceptación.
3. **Cola persistente**: almacena tareas, prioridad, dependencias, intentos, propietario, estado y vencimiento.
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
| Cola persistente y coordinación | Mantener tareas y reintentos entre ejecuciones | Pendiente |
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

1. Pruebas automatizadas de la aplicación actual y validación de dependencias.
2. Contratos de tareas y resultados en JSON con validación de esquema.
3. Cola persistente con estados `queued`, `running`, `blocked`, `succeeded`, `failed` y `cancelled`.
4. Límites globales de concurrencia y presupuesto.
5. Sandbox efímero sin secretos y con red deshabilitada por defecto.
6. GitHub App/OAuth con permisos mínimos, diff preview y aprobación explícita.
7. Persistencia multiusuario con aislamiento y auditoría.

## Nota de costos

Cada consulta a un modelo puede tener costo o límites de uso. La aplicación actual puede hacer hasta ocho consultas secuenciales en una ejecución de equipo. No se ha configurado una tarifa ni se puede garantizar costo cero al conectar proveedores externos.
