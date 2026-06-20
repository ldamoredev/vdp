# VDP — Análisis de Producto y Próximos Pasos (2026-06-11)

## Resumen ejecutivo

Tasks es un daily driver real: loop validado E2E, captura rápida, ritual de cierre y un agente
con workflows genuinos (no decorativo). Wallet registra bien pero su promesa de "entender
patrones" depende de carga manual sin transacciones recurrentes. El diferenciador del producto
— señales cross-domain → acción — existe y el patrón técnico es correcto, pero está construido
sobre stores **in-memory**: cada deploy/restart borra insights, señales y la cola del ritual.
Esa es la falla de mayor valor a cerrar antes de expandir. Hay además dos bugs concretos:
la fecha del system prompt de los agentes queda congelada al boot del server, y la detección
de picos de gasto mezcla ARS y USD numéricamente. El orden del ROADMAP (Auth → Expansión)
es correcto en espíritu, pero conviene insertar una sesión corta de "persistencia de
inteligencia" antes, y hacer Auth hardening timeboxed. Health sigue siendo el próximo dominio
correcto, pero como slice fino (hábitos), no las 6 páginas del demo actual.

---

## 1. Análisis de Valor de Producto

### Tasks: entrega lo que promete (con una excepción)

**Lo que entrega hoy.** El loop diario completo está implementado y validado: captura rápida
con prioridad/dominio (`apps/web/src/features/tasks/components/quick-capture-form.tsx`),
cola de ejecución con complete/carry-over/discard/detalle en una acción
(`features/tasks/components/task-row.tsx`), notas y desglose en pasos
(`features/tasks/components/detail/`), historial con tendencias, y el ritual de cierre diario
(`features/review/`). El hardening de junio (E2E, aislamiento cross-user, date-safety,
validación de fechas en tools del agente) lo dejó en estado de producción real.

**El gap.** La mitad "inteligente" del módulo — insights, señales, rachas, la cola del ritual —
se apoya en `TaskInsightsStore`, que es **in-memory** y lo declara explícitamente
(`server/src/modules/tasks/services/TaskInsightsStore.ts:12`, con TODO "v3: Persist to DB").
Las rachas se reconstruyen al boot (`RebuildStreaks`, commit 3ba958f), pero los insights no:
un deploy en Railway borra toda señal pendiente. El usuario no puede confiar en que "lo que el
sistema detectó" siga ahí mañana. Para una herramienta cuya tesis es *acumular* contexto sobre
tu vida, la capa de inteligencia es amnésica.

**Gap menor de fricción.** El dashboard de Tasks tiene 9 bloques en una pantalla
(`apps/web/src/app/(domain)/tasks/page.tsx`): header operacional, captura, señal de planificación,
recomendación de foco, cola, next-best-action, detalle, recovery board y ritmo semanal. La acción
más frecuente del día (ver la cola y tildar) está en la tercera fila, debajo de dos filas de
"señales". Densidad alta está bien (regla de AGENTS.md), pero la jerarquía está invertida.

### Wallet: registra bien, entiende a medias

**Lo que entrega hoy.** El loop de registro es bueno: `QuickAddExpenseSheet`
(`features/wallet/quick-add/`) con foco automático en el monto, chips de categoría y FAB mobile;
edición inline desde el dashboard (`edit-transaction-sheet.tsx`); stats, ahorros, inversiones y
cotizaciones con sus 7 páginas navegables. El sanity strip (`sanity-strip/sanity-strip.tsx`) es
un buen detalle operacional.

**El gap.** La promesa es "entender tus patrones de consumo" (system prompt del agente,
`server/src/modules/wallet/infrastructure/agent/system-prompt.ts`). Eso depende de que el dato
exista y sea correcto, y ahí hay dos problemas:

1. **No hay transacciones recurrentes.** Alquiler, suscripciones, servicios — todo es carga
   manual mensual. O el usuario es disciplinado o las stats y la detección de picos operan
   sobre datos incompletos. No hay ningún servicio de recurrencia en
   `server/src/modules/wallet/services/`.
2. **La detección de picos mezcla monedas.** `DetectSpendingSpike` usa
   `transactions.sumByDateRange`, que suma `amount` sin filtrar por moneda
   (`server/src/modules/wallet/infrastructure/db/DrizzleTransactionRepository.ts:129-148`),
   y el evento hardcodea `currency: 'ARS'`
   (`server/src/modules/wallet/services/DetectSpendingSpike.ts:57`). Un gasto de USD 100 y uno
   de ARS 100 pesan igual en el promedio. Para el usuario (que maneja ambas monedas, según el
   propio prompt) esto produce falsos positivos/negativos en la señal estrella del producto.

### Capa de agente: leverage real, no decorativa

Veredicto honesto: **es de lo mejor del producto**. Evidencia:

- **Profundidad de tools**: 18 en Tasks y 21 en Wallet (`{domain}/infrastructure/agent/tools/`),
  cubriendo CRUD, transiciones, stats, intelligence y contexto cruzado en ambas direcciones
  (`get_wallet_context` en Tasks, `get_tasks_context` en Wallet).
- **Workflows reales en el prompt**, no genéricos: gate de clarificación de tareas vagas con
  máximo 2 preguntas, review de fin de día tarea-por-tarea con decisión explícita ("el review
  es para DECIDIR, no para narrar"), desglose acotado a 2-4 pasos, detección de duplicados vía
  embeddings (`tasks/infrastructure/agent/system-prompt.ts`).
- **Integración UI quirúrgica**: `features/tasks/chat-sync.ts` actualiza el cache de React Query
  tool-por-tool (upsert en listas, invalidación de derivados), tipado contra el registry
  compartido de `@vdp/shared` — una acción del agente se refleja en el dashboard al instante,
  sin refetch completo.

Tres críticas concretas:

1. **El chat no existe fuera de los dominios.** `ChatPanel` retorna `null` si el pathname no
   matchea un dominio (`components/shell/chat-panel.tsx:61`). En `/home` y `/review` — justo las
   dos superficies de síntesis donde preguntarías "¿cómo vengo hoy?" — Ctrl+K no hace nada
   (el store togglea pero no se renderiza nada, lo que encima se percibe como bug).
2. **La fecha del agente queda congelada al boot.** `TASKS_SYSTEM_PROMPT` y
   `WALLET_SYSTEM_PROMPT` son `const` a nivel de módulo que interpolan `${todayISO()}` y la hora
   en el momento del *import* (`tasks/infrastructure/agent/system-prompt.ts:128-129`), y
   `TaskAgent` los asigna como `readonly systemPrompt` (`TaskAgent.ts:17`). Con el server corriendo
   más de un día — lo normal en producción — el agente cree que hoy es el día del deploy:
   programa tareas para la fecha equivocada y responde mal "qué tengo hoy". Es un bug P1 para
   un producto cuyo agente gira alrededor de "hoy".
3. **`get_wallet_context` promete anomalías y devuelve siempre `[]`.**
   `GetWalletSnapshot.execute` hardcodea `anomalies: []`
   (`server/src/modules/wallet/services/GetWalletSnapshot.ts:42`) aunque `GetSpendingAnomalies`
   existe y está expuesto al agente de Wallet. El contexto cruzado que ve el agente de Tasks
   es más pobre de lo que el tipo declara.

### Cross-domain: el diferenciador correcto, subexplotado

El patrón está bien construido: `wallet.transaction.created` → `DetectSpendingSpike` →
`wallet.spending.spike` → `CrossDomainEventHandlers` crea insight + tarea P3 con deep-link a
los movimientos (`tasks/services/CrossDomainEventHandlers.ts`). Event bus, servicios, resiliencia
a errores — exactamente el template que AGENTS.md prescribe.

Pero está subexplotado en tres ejes:

- **Durabilidad**: la mitad del output (el insight) vive en memoria y muere con el proceso.
  La tarea creada sí persiste — la mitad del valor sobrevive, la otra no.
- **Direccionalidad**: solo existe wallet→tasks. La dirección inversa es gratis con la
  infraestructura actual: los eventos `TaskStuck`, `TasksOverloaded`, `DailyAllCompleted` ya
  existen (`tasks/domain/events/`) y hoy solo alimentan insights locales del propio módulo.
- **Cantidad**: una sola señal viva. No hace falta inventar más dominios para tener más señales:
  "tarea 'pagar X' completada → ofrecer registrar la transacción" es cross-domain con los dos
  módulos que ya existen.

**Es el diferenciador real.** Una lista de tareas y un registro de gastos por separado compiten
con apps mejores. La composición ("sabe que gasté de más Y me crea la tarea de revisarlo") es lo
que ninguna app comercial hace. La conclusión incómoda: el diferenciador hoy depende de un store
que se vacía en cada deploy.

### La única cosa de mayor valor que falta

**Persistir la capa de inteligencia (insights de Tasks y Wallet) a Postgres.** No es la feature
más visible, pero es la condición para que todo lo demás valga: el ritual diario lee
`recentInsights` de ese store, la card de señales cruzadas del home también
(`features/home/components/cross-domain-signals-card.tsx`), el agente lo lee vía `get_insights`,
y el SSE lo transmite. Mientras sea volátil, el usuario aprende a no confiar en esa superficie —
y un sistema de señales en el que no confiás es ruido. El propio código ya lo sabe
(`TaskInsightsStore.ts:12`: "v3: Persist to DB"). Con el constraint de datos del ROADMAP ya
activado (Tasks en uso real → los datos dejaron de ser descartables), esto pasó de "deuda
aceptable" a "contradicción con la fase actual".

---

## 2. Review UX/UI y Propuestas

### Lo que está bien (y no hay que tocar)

- **Shell**: icon rail + sidebar + tab bar mobile (`components/shell/`) es denso, calmo y
  consistente. Los dominios deshabilitados se muestran apagados con tooltip "Proximamente" —
  honesto sin ser ruidoso.
- **Estados**: empty/loading/error existen de verdad — `EmptyTaskList` por filtro,
  `wallet-empty-state.tsx`, skeletons en Wallet, error states en el stream del chat. No es la
  típica app personal con pantallas blancas.
- **Loop de captura**: crear tarea son 2 interacciones desde `/tasks` (escribir + Enter/botón);
  registrar gasto son ~4 taps desde `/wallet` con el sheet (abrir, monto, chip de categoría,
  guardar), con FAB en mobile. Está dentro de lo razonable para uso diario.
- **Mobile**: task-row con acciones colapsadas, sheets bottom-anchored, safe-area en el tab bar.
  Se nota intención real de uso desde el teléfono.

### Problemas y propuestas (priorizadas)

**P1 — Chat global en `/home` y `/review`** · Esfuerzo: M ·
Toca: `components/shell/chat-panel.tsx`, `lib/navigation.ts`
Hoy el panel exige dominio activo (`chat-panel.tsx:61`). Propuesta mínima sin construir un
"agente router": cuando no hay dominio, renderizar el panel con el agente de Tasks como default
(es el que tiene `get_wallet_context`, o sea el más "global" de los dos) y un selector simple de
dominio en el `ChatHeader`. Elimina el no-op de Ctrl+K y pone al agente donde el usuario sintetiza
su día. Es la mejora de mayor impacto percibido por esfuerzo.

**P2 — Invertir jerarquía del dashboard de Tasks** · Esfuerzo: S ·
Toca: `apps/web/src/app/(domain)/tasks/page.tsx`
Subir `ExecutionQueue` + `QuickCaptureForm` a la primera fila; bajar `PlanningSignal` y
`FocusRecommendation` al lateral o debajo. La página es layout-only (regla de AGENTS.md), así
que es literalmente reordenar secciones. El criterio: lo que se usa 20 veces por día arriba,
lo que se lee 1 vez por día abajo.

**P3 — Captura de tareas desde Home** · Esfuerzo: S ·
Toca: `features/home/components/today-tasks-card.tsx`
`TodayTasksCard` lista las 5 tareas de hoy pero no permite agregar; cualquier captura exige
navegar a `/tasks`. Un input de una línea (título + Enter, prioridad default 2) reutilizando la
mutación existente de `features/tasks/use-task-mutations.ts` convierte el home en superficie de
captura, no solo de lectura. Home es la pantalla de aterrizaje; la captura es el hábito que
sostiene todo el sistema.

**P4 — Reemplazar `ProductFocusCard` por datos del usuario** · Esfuerzo: S ·
Toca: `features/home/components/product-focus-card.tsx`
La card explica "qué módulos están activos" con copy estático derivado de `navigation.ts`. Es
contenido sobre el producto, no sobre el usuario — exactamente la "energía de landing" que
AGENTS.md prohíbe, y ocupa un slot del sidebar del home. Reemplazarla por racha actual +
carry-over rate (datos que ya expone la API de stats) o eliminarla.

**P5 — Estado del ritual diario al servidor** · Esfuerzo: M ·
Toca: `features/review/daily-review-storage.ts` + un endpoint chico en el módulo tasks
El estado del ritual (señales reconocidas, nota, completado) vive en `localStorage`. Con tab bar
mobile y PWA manifest, el escenario "reviso desde el teléfono a la noche y desde la desktop a la
mañana" es el caso de uso real — y hoy son dos rituales independientes que no se ven entre sí.
Single-user no implica single-device. (Si se persisten los insights — sección 1 — este es el
paso natural siguiente sobre la misma tabla o una hermana.)

**P6 — Matar el polling de onboarding** · Esfuerzo: S ·
Toca: `apps/web/src/app/(domain)/home/page.tsx:165`
`setInterval(syncOnboardingState, 250)` corre 4 veces por segundo en cada visita al home, para
siempre, para un modal de onboarding que un usuario único vio una vez. Ya hay listeners de
`focus`/`storage`/`visibilitychange` que cubren los casos reales; el interval sobra. Es higiene,
pero es gratis.

**P7 — Ancho del panel de chat** · Esfuerzo: S ·
Toca: `components/shell/chat-panel.tsx:68`
`w-96` fijo en desktop. Para respuestas largas del agente (reviews de fin de día tarea-por-tarea,
resúmenes semanales — workflows que el prompt fomenta) queda apretado. Un toggle de expansión
(96 ↔ ~2/3 de pantalla) alcanza; no hace falta resize libre.

---

## 3. Recomendación de Próximos Pasos

### Sobre el orden del ROADMAP

El estado real está más avanzado que lo que el ROADMAP describe: la Fase 0 (recovery) y la
Fase 1 (Tasks production-readiness, P0+P1+P2 del hardening de junio) están completas. Quedan
Fase 2 (Auth hardening) y Fase 3 (Expansión).

**Acuerdo parcial.** Auth-antes-de-Expansión es correcto. Dos ajustes:

1. **Insertar "persistencia de inteligencia" antes de (o junto a) Auth hardening.** El propio
   ROADMAP dice que al empezar el uso real de Tasks los datos dejan de ser descartables
   ("Data Constraint"). Ese checkpoint ya pasó — pero los insights, señales cross-domain y el
   estado del ritual siguen siendo descartables *por diseño* (stores in-memory, localStorage).
   Expandir a Health multiplicaría señales sobre una base que las pierde. Es una sesión de
   trabajo, no una fase.
2. **Timeboxear Auth hardening.** Auth V1 está completo y validado (sesiones server-managed,
   revocación verificada en vivo, audit logs). Para single-user, la Fase 2 se reduce a: rate
   limiting de login fallido, smoke de sesión en producción (Railway), y cerrar la decisión
   pendiente sobre `RequestAuditLogger` (está construido pero nunca se instancia —
   `server/src/modules/common/http/RequestAuditLogger.ts` — cablearlo o borrarlo, junto con
   `SkillRegistry` que está en la misma situación). No merece una fase abierta; merece una sesión.

### Próximas 2-3 sesiones, en orden

**Sesión 1 — Durabilidad y corrección de la capa de inteligencia (backend).**
(a) Persistir `TaskInsightsStore` y `WalletInsightsStore` a Postgres (tabla en el schema `tasks`
o en `core` junto a las conversaciones de agente, siguiendo el patrón repositorio existente);
(b) fix de la fecha congelada del system prompt (convertir las consts en funciones evaluadas
por chat — `tasks/infrastructure/agent/system-prompt.ts` y el equivalente de wallet);
(c) fix de moneda en `DetectSpendingSpike` (filtrar/segmentar por currency en
`sumByDateRange` o en el servicio). Justificación: los tres son defectos del diferenciador,
no features nuevas; los tres son chicos y acotados; y (a) desbloquea P5 del review UX.

**Sesión 2 — Auth hardening timeboxed (Fase 2 completa).**
Rate limiting de login, smoke E2E de sesión en producción, decisión RequestAuditLogger/
SkillRegistry. Cierra formalmente el gate que ROADMAP exige antes de Expansión, sin inflarlo.

**Sesión 3 — Batch UX del loop diario (frontend).**
P1 (chat global) + P2 (reorden de Tasks) + P3 (captura en home) + P4/P6 (limpieza). Son cuatro
cambios chicos que comparten contexto (shell + home + tasks), rinden más juntos que repartidos,
y dejan la app lista para que la expansión se monte sobre un loop diario sin fricción.

### Expansión: ¿Health?

**Validado, con una condición fuerte de scope.** El razonamiento por composición de eventos con
Tasks + Wallet:

- **Health**: la mayor superficie de señales cruzadas de los cuatro candidatos. Hábito fallado
  repetidamente → tarea (mismo patrón que el spike); gasto en categoría delivery/farmacia ↔
  objetivo nutricional o tratamiento (wallet→health); medicación → tareas recurrentes. Además
  los datos de salud son los que más se benefician de la acumulación longitudinal — el punto
  fuerte de un sistema propio. Y ya existe scaffold (`server/src/modules/health/schema.ts`).
- **Work**: el rival serio, pero choca con el propio producto: las tareas ya tienen `domain:
  "work"` (`quick-capture-form.tsx`, system prompt del agente) y el prompt de Tasks dice "si
  crece en complejidad, movelo a Work". Hacerlo real exige primero definir la frontera
  tarea-diaria/proyecto, o se canibalizan. Es el segundo candidato, no el primero.
- **People**: señales débiles y de baja frecuencia (cumpleaños → tarea; regalo → gasto). Es un
  CRM con poco que componer diariamente.
- **Study**: caso particular de Work con menos eventos. Último.

**La condición**: el demo actual de Health tiene 6 sub-páginas (dashboard, hábitos, métricas,
medicamentos, turnos, cuerpo — `apps/web/src/app/(domain)/health/`). Eso como v1 viola la
disciplina que hizo funcionar a Tasks y Wallet. El slice correcto: **hábitos solamente** (quizás
+ peso como única métrica), pasando completo por el New Domain Gate de AGENTS.md, con una señal
cross-domain desde el día uno (hábito con racha rota → tarea de revisión, reusando el patrón de
`CrossDomainEventHandlers`). Medicamentos/turnos/cuerpo esperan a que el slice de hábitos
demuestre uso diario real — el mismo gate que se le exigió a todo lo demás.

---

## Tabla de acciones priorizadas

| # | Ítem | Impacto | Esfuerzo | Fase |
|---|------|---------|----------|------|
| 1 | Persistir insights (Tasks + Wallet) a Postgres | Alto — el diferenciador deja de evaporarse por deploy | M | Pre-Auth (Sesión 1) |
| 2 | Fix fecha congelada en system prompts de agentes | Alto — el agente opera sobre "hoy" equivocado en prod | S | Pre-Auth (Sesión 1) |
| 3 | Fix mezcla de monedas en `DetectSpendingSpike` | Medio-alto — corrige la señal estrella | S | Pre-Auth (Sesión 1) |
| 4 | Auth hardening timeboxed (rate limit, smoke prod, decisión RequestAuditLogger/SkillRegistry) | Medio — cierra el gate de Fase 2 | M | Fase 2 (Sesión 2) |
| 5 | Chat global en /home y /review (agente default + selector) | Alto — el agente aparece donde se sintetiza el día | M | UX (Sesión 3) |
| 6 | Reordenar dashboard de Tasks (cola arriba) | Medio — menos fricción en la acción más frecuente | S | UX (Sesión 3) |
| 7 | Captura rápida de tareas desde Home | Medio — home pasa de lectura a captura | S | UX (Sesión 3) |
| 8 | Reemplazar ProductFocusCard por datos del usuario; matar polling de onboarding | Bajo-medio — densidad real + higiene | S | UX (Sesión 3) |
| 9 | Estado del ritual diario al servidor (multi-device) | Medio — depende del ítem 1 | M | Post-Sesión 1 |
| 10 | Poblar `anomalies` en `get_wallet_context` (reusar `GetSpendingAnomalies`) | Medio — contexto cruzado más rico para el agente | S | Oportunista |
| 11 | Señal cross-domain inversa (tasks→wallet) y/o transacciones recurrentes | Medio — más composición sin nuevos dominios | M | Pre/durante Expansión |
| 12 | Health como slice fino: solo hábitos + 1 señal cross-domain, por el New Domain Gate | Alto — expansión sin romper la disciplina | L | Fase 3 |
