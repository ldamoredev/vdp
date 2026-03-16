# VDP — Tu vida, entendida

## ¿Qué es VDP?

VDP es un sistema de IA personal que gestiona tu vida diaria en seis áreas: tus tareas, tu plata, tu salud, tu trabajo, tus relaciones y tu aprendizaje. Cada área tiene su propio agente de IA que entiende el contexto, trackea lo que importa y actúa en tu nombre. Pero el poder real está en que se comunican entre sí.

Cuando dormiste 4 horas, tu agente de trabajo te sugiere un día más liviano. Cuando tu gasto se dispara, tu agente financiero chequea si algo anda mal. Cuando hace 3 semanas que no llamás a tu vieja, tu agente de personas te lo recuerda — con onda.

VDP no solo guarda datos. Conecta los puntos de tu vida y te ayuda a tomar mejores decisiones con el panorama completo.

---

## Los seis dominios

### Tasks — tu lista de acción diaria

Antes que nada, necesitás saber: ¿qué tengo que hacer hoy? Tu agente de tareas gestiona una lista de pendientes diaria, simple y enfocada. Nada de gestión de proyectos, nada de Gantt — solo las cosas que querés lograr antes de que termine el día.

Las tareas pueden opcionalmente vincularse a cualquier dominio. "Pagar el alquiler" es una tarea de wallet. "Llamar al dentista" es una tarea de health. "Agregar a Alice a contactos" es una tarea de people. "Comprar un cargador" es simplemente una tarea.

**Qué hace:**

- Gestiona una lista de pendientes diaria con prioridades (baja, media, alta)
- Etiqueta tareas con un dominio cuando es relevante
- Trackea tasa de completitud por día y semana
- Review de fin de día: las tareas incompletas se pueden pasar a mañana o descartar
- Señala tareas trabadas que se pasaron 3+ veces
- Las tareas pueden graduarse a tareas completas de proyecto en Work cuando crecen en alcance

**Conversaciones de ejemplo:**

> "Agregame una tarea: pagar el alquiler"
> → El agente crea la tarea, la etiqueta como dominio "wallet", la programa para hoy.

> "¿Qué me falta hoy?"
> → El agente lista tus tareas pendientes del día con prioridades y etiquetas de dominio.

> "Completé lo del dentista"
> → El agente la marca como hecha, actualiza tu tasa de completitud diaria (ahora 5/7 — 71%).

> "Pasame las que no completé para mañana"
> → El agente pasa 2 tareas restantes a mañana, las marca como arrastradas.

**Comportamiento proactivo de ejemplo:**

> "Venís arrastrando 'organizar documentos de impuestos' hace 4 días seguidos. Capaz es demasiado grande para una tarea diaria — ¿querés dividirla en pasos más chicos, o pasarla a un proyecto de Work?"

> "Completaste todas las tareas de hoy — bien ahí! Tu tasa de completitud esta semana es 89%, arriba del 74% de la semana pasada."

---

### Wallet — tu cerebro financiero

Tu agente financiero conoce tus cuentas, tus patrones de gasto, tus metas de ahorro y tus inversiones. Habla tu idioma financiero — ARS y USD, dólar blue y MEP, plazo fijo y FCI.

**Qué hace:**

- Registra cada ingreso y gasto en múltiples cuentas y monedas
- Calcula saldos en tiempo real automáticamente
- Monitorea gastos por categoría y avisa cuando algo se ve raro
- Trackea metas de ahorro con progreso ("estás al 62% de tu fondo de vacaciones")
- Gestiona seguimiento de cartera de inversiones
- Mantiene historial de tipos de cambio ARS/USD con todos los tipos de mercado

**Conversaciones de ejemplo:**

> "Gasté 15.000 en el súper"
> → El agente crea el gasto, lo asigna a "Supermercado", confirma el saldo.

> "¿Cuánto gasté este mes en comida?"
> → El agente consulta gastos por categoría, lo desglosa, lo compara con el mes pasado.

> "Registrá mi sueldo de marzo, 850.000 pesos"
> → El agente crea el ingreso, actualiza el saldo, chequea el progreso de tus metas de ahorro.

**Alerta proactiva de ejemplo:**

> "Tu gasto esta semana es 2.3 veces tu promedio diario. Gastaste $45.000 solo en Entretenimiento — eso es más que todo el mes pasado en esa categoría. ¿Querés que te lo desglose?"

---

### Health — tu compañero de bienestar

Tu agente de salud trackea las métricas que importan — sueño, pasos, agua, ánimo, energía, peso — y las conecta con el resto de tu vida. Gestiona tus hábitos, medicamentos, turnos médicos y mediciones corporales. Nunca da consejos médicos, pero ve los patrones que vos podrías no notar.

**Qué trackea:**

- Métricas diarias: horas de sueño, pasos, ingesta de agua, calorías, ánimo (1-5), energía (1-5)
- Hábitos con racha (meditación, ejercicio, lectura, etc.)
- Horarios de medicamentos y adherencia
- Turnos médicos
- Mediciones corporales: peso, grasa corporal, presión arterial, glucosa

**Conversaciones de ejemplo:**

> "Dormí 5 horas anoche"
> → El agente registra el sueño, nota que hace tres días seguidos que dormís menos de 6 horas, te pregunta cómo estás de ánimo.

> "¿Cómo vengo con mis hábitos esta semana?"
> → El agente muestra tasas de cumplimiento, destaca tu racha de 12 días de meditación, señala que faltaste dos veces al gym.

> "Turno con el cardiólogo el 20 de abril a las 10"
> → El agente crea el turno, te va a recordar 2 días antes.

**Insight proactivo de ejemplo:**

> "Tu ánimo viene bajando hace 4 días (promedio 2.8 vs tu habitual 3.9). Esto empezó el mismo día que tu sueño bajó de 6 horas. No soy médico, pero sueño y ánimo están muy relacionados — capaz vale la pena enfocarse en descansar esta noche."

**Conexión entre dominios:**

Cuando Health detecta mal sueño, emite un evento. El agente de Work lo ve y sugiere reprogramar tareas de concentración profunda. El agente de Wallet lo ve y frena sugerencias de inversión riesgosas — porque la calidad de tus decisiones baja cuando estás cansado.

---

### Work — tu socio de productividad

Tu agente de trabajo te ayuda a planificar tus días, trackear tus proyectos y entender tus patrones de productividad. Conoce tu agenda, tus tareas y tus niveles de energía — y te ayuda a alinearlos.

**Qué gestiona:**

- Proyectos con estado, prioridad y deadlines
- Tareas con tiempo estimado vs real, dependencias y progreso
- Bloques de tiempo: trabajo profundo, reuniones, admin, descansos
- Sesiones de trabajo con score de foco
- Logs diarios: logros, bloqueos, reflexiones
- Integración con calendario (sync con Google Calendar)

**Conversaciones de ejemplo:**

> "¿Qué tengo hoy?"
> → El agente muestra tu agenda: 2 reuniones a la mañana, un bloque de 3 horas de trabajo profundo después del almuerzo, un deadline de tarea a las 5pm.

> "Armame un plan para la semana"
> → El agente mira tus tareas pendientes, deadlines, patrones de energía de los datos de salud y carga de reuniones. Sugiere qué días bloquear para trabajo profundo, qué tareas priorizar.

> "Completé el diseño del API"
> → El agente marca la tarea como terminada, registra las horas reales, actualiza el progreso del proyecto (ahora al 73%), chequea si alguna tarea bloqueada puede avanzar.

**Comportamiento proactivo de ejemplo:**

> "Tenés 0 horas de trabajo profundo esta semana y ya es miércoles. Tu promedio es 12 horas/semana. Mañana tenés un bloque libre de 2 a 5pm — ¿querés que lo proteja?"

> "Tu log diario dice 'bloqueado por review de QA' tres días seguidos. ¿Querés que lo flaggee en tus notas del próximo standup?"

**Conexión entre dominios:**

Cuando Health reporta buen sueño y energía alta, Work sugiere encarar las tareas más difíciles. Cuando Work detecta sobrecarga de reuniones (más de 4 horas de reuniones en un día), emite un evento — Health podría sugerir tiempo extra de recuperación.

---

### People — tu cuidador de relaciones

Tu agente de personas te ayuda a mantener y fortalecer las relaciones que importan. Recuerda cumpleaños, trackea cuándo fue la última vez que hablaste con alguien, y avisa cuando una relación necesita atención — porque la vida se complica y la gente se pierde en el camino.

**Qué trackea:**

- Contactos con tipos de relación (familia, amigos cercanos, amigos, profesional)
- Historial de interacciones: cuándo te juntaste, llamaste, mensajeaste o tuviste una conversación importante
- Scores de salud de relación basados en frecuencia de interacción vs qué tan cercanos son
- Fechas importantes: cumpleaños, aniversarios, hitos
- Grupos: círculos de amigos, grupos familiares, equipos de trabajo
- Eventos sociales

**Conversaciones de ejemplo:**

> "Hoy almorcé con Santiago"
> → El agente registra la interacción, actualiza la fecha de "último contacto" de Santiago, nota que tu score de salud de relación mejoró.

> "¿A quién no hablé hace mucho?"
> → El agente lista relaciones descuidadas: "No hablaste con tu hermano hace 23 días, con tu amiga Laura hace 31 días, y con tu ex colega Martín hace 45 días."

> "¿Cuándo cumple años mi vieja?"
> → El agente busca la fecha, te dice que es en 12 días, te pregunta si querés un recordatorio para comprar un regalo.

**Recordatorio proactivo de ejemplo:**

> "El cumpleaños de tu amigo Diego es en 3 días. El año pasado cenaron juntos en La Cabrera. Por tus interacciones recientes, generalmente se juntan — ¿querés que te sugiera un plan?"

> "No registraste ninguna interacción social esta semana. Tu promedio habitual es 4 por semana. ¿Está todo bien?"

**Conexión entre dominios:**

Cuando People detecta aislamiento social (cero interacciones en una semana), emite un evento. Health lo incorpora en el análisis de ánimo. Work podría sugerir un almuerzo de equipo o un café con un colega. Cuando Health reporta ánimo en baja, People podría sugerir contactar amigos cercanos.

---

### Study — tu coach de aprendizaje

Tu agente de estudio te ayuda a aprender de forma consistente, retener lo que estudiás y trackear tu progreso en distintas materias. Gestiona tus planes de estudio, te recuerda las reviews de flashcards, y te ayuda a encontrar el mejor momento para estudiar según tu energía y agenda.

**Qué gestiona:**

- Materias con seguimiento de progreso
- Recursos: libros, cursos, tutoriales con estado de completitud
- Sesiones de estudio con temporizador de foco (estilo Pomodoro)
- Flashcards con repetición espaciada (el algoritmo decide cuándo necesitás repasar)
- Notas de conocimiento con vinculación entre conceptos
- Planes de estudio generados a partir de tus metas y tiempo disponible

**Conversaciones de ejemplo:**

> "Hoy estudié 2 horas de Rust"
> → El agente registra la sesión, actualiza el progreso de la materia, chequea tu meta semanal de estudio (ahora en 8/10 horas).

> "Creame flashcards de lo que estudié hoy"
> → El agente genera flashcards a partir de tus notas de la sesión, las programa para repaso basándose en repetición espaciada.

> "¿Qué debería estudiar hoy?"
> → El agente chequea tus materias, flashcards pendientes de repaso (15 tarjetas pendientes) y tu nivel de energía de los datos de salud. Sugiere empezar con repaso de flashcards (no requiere mucha energía), después 1 hora de material nuevo si mejora la energía.

**Comportamiento proactivo de ejemplo:**

> "Tenés 23 flashcards pendientes de repaso hoy. Tu retención viene bajando en el tema 'Rust ownership' (72% → 58% en 2 semanas) — estas tarjetas necesitan atención."

> "Hace 4 días que no estudiás. Tu racha estaba en 15 días antes de cortarse. ¿Querés hacer una sesión rápida de 20 minutos para retomar el ritmo?"

**Conexión entre dominios:**

Work comparte tu agenda — Study encuentra ventanas libres. Health comparte tus niveles de energía — Study sugiere la dificultad adecuada. Si Work tiene un deadline acercándose, Study reduce sus recomendaciones diarias para no sobrecargarte.

---

## Qué hace diferente a VDP

### 1. Los dominios están interconectados, no aislados

La mayoría de las apps trackean una sola cosa: una app de presupuesto, un tracker de hábitos, un gestor de tareas. No se hablan entre sí. VDP los conecta a través de eventos:

| Evento | Lo dispara | Afecta a |
|--------|-----------|----------|
| Todas las tareas del día completadas | Tasks | El Orquestador registra un día productivo |
| Tarea trabada (arrastrada 3+ días) | Tasks | Work sugiere promoverla a tarea de proyecto |
| Sobrecarga de tareas (>50% arrastradas en la semana) | Tasks | Health chequea niveles de estrés, Work revisa carga |
| Mal sueño (< 6h) | Health | Work sugiere día más liviano, Wallet pausa sugerencias riesgosas |
| Pico de gasto | Wallet | Health pregunta por ánimo/estrés, People chequea patrones sociales |
| Sobrecarga de reuniones (> 4h/día) | Work | Health sugiere recuperación, Study reduce metas diarias |
| Aislamiento social (0 interacciones/semana) | People | Health lo flaggea para monitoreo de ánimo, Work sugiere actividades de equipo |
| Racha de estudio cortada | Study | Health chequea si algo anda mal, Work chequea si estás sobrecargado |
| Ánimo en baja (3+ días) | Health | People sugiere contactar gente, Work ajusta carga de trabajo |

Este es el insight central: **tu vida es un solo sistema, no seis apps separadas.**

### 2. Los agentes son proactivos, no solo reactivos

Las apps tradicionales esperan a que las abras. Los agentes de VDP inician:

- **A la mañana:** Health chequea tu sueño, Work te muestra el día, Wallet te muestra transacciones de la noche
- **Durante el día:** Recordatorios de medicamentos, preparación de reuniones, alertas de gasto
- **A la noche:** Health te pide log de ánimo/energía, Work genera resumen diario, Study recuerda repasos de flashcards
- **Semanal:** Reporte de vida cross-domain del Orquestador — cómo te fue en las seis áreas

### 3. Agentes de IA que conocen tu contexto

Cada agente tiene acceso a:

- **Tus datos** — cada transacción, cada métrica, cada tarea, cada interacción
- **Tus patrones** — el agente aprende qué es normal para vos y señala anomalías
- **Contexto cross-domain** — el agente financiero sabe que dormiste mal, el agente de trabajo sabe que estás estresado por la plata
- **Memoria** — el agente recuerda conversaciones anteriores y va construyendo un panorama con el tiempo

Les hablás en lenguaje natural, en español. Usan herramientas para consultar tus datos, crear entradas y tomar acciones. Confirman lo que hicieron y preguntan cuando no están seguros.

### 4. Un sistema, no seis apps

Abrís VDP y ves tu dashboard de vida — una vista cross-domain de lo que importa hoy. Un click te lleva a cualquier dominio. El panel de chat se adapta a donde estés. Tus datos viven en un solo lugar, tus agentes colaboran en el fondo, y vos ves el panorama completo.

---

## Un día con VDP

**7:30 AM — Te despertás**

Tu celular muestra un briefing matutino de VDP:
- Tasks: "5 tareas para hoy (2 arrastradas de ayer). Prioridad alta: presentar documentos de impuestos."
- Health: "Dormiste 7.2 horas. Ánimo de ayer: 4/5. 3 medicamentos pendientes esta mañana."
- Wallet: "Gasto de ayer: $12.400 (comida + transporte). Presupuesto mensual: 68% usado."
- Work: "Hoy: standup a las 9, review de diseño a las 11, bloque de trabajo profundo de 3h a las 2pm. 2 tareas con deadline."
- People: "El cumpleaños de mamá es en 2 días. Hace 18 días que no hablás con Diego."

**9:15 AM — Después del standup**

Abrís el chat de Wallet: "Registrá que pagué 3.500 de café con Santi." El agente lo registra en "Comida," anota la interacción para People (te juntaste con Santiago).

**2:00 PM — Bloque de trabajo profundo**

Work ya marcó este bloque como protegido. Study no manda recordatorios de flashcards durante las horas de trabajo profundo.

**6:30 PM — Fin del día**

El agente de Tasks te pregunta: "Te quedan 2 tareas: 'presentar documentos de impuestos' y 'comprar cargador'. ¿Las pasás a mañana o las descartás?" Pasás lo de impuestos, descartás lo del cargador — lo comprás el finde.

Work te pregunta: "¿Cómo estuvo hoy? ¿Logros? ¿Bloqueos?" Dictás un resumen rápido. Genera tu log diario.

Health te pregunta: "¿Ánimo? ¿Nivel de energía?" Decís "3 y 3, me siento cansado." El agente lo registra, nota que el ánimo bajó respecto al 4 de ayer, lo guarda para análisis de patrones.

**Domingo a la noche — Reporte semanal**

El Orquestador genera tu resumen semanal de vida:

> "Esta semana: Tasa de completitud de tareas diarias 82% (28/34). Ingresos $850.000 / Gastos $340.000 (tasa de ahorro 60% — arriba de la semana pasada). Sueño promedio 6.8h (meta: 7.5). Completaste 14/18 tareas de trabajo (78%). Estudiaste 8h de Rust (meta: 10). Hablaste con 6 personas (debajo de tu promedio de 8/semana). Tendencia de ánimo: levemente en baja (3.6 → 3.2). Posible correlación: tu sueño e interacción social bajaron ambos a mitad de semana."

---

## ¿Para quién es VDP?

VDP es para una sola persona: **vos**. No es una herramienta de equipo, no es una app familiar, no es una plataforma empresarial. Es tu sistema operativo personal — la IA que entiende el contexto completo de tu vida y te ayuda a navegarla.

Te importa mejorar pero sos realista. No querés 10 apps distintas. Querés un sistema que conecte los puntos. Te sentís cómodo hablándole a una IA en lenguaje natural. Vivís en Argentina, pensás en pesos y dólares, y querés algo que hable tu idioma.

---

## Principios fundamentales

**Tus datos son tuyos.** VDP corre en tu propia infraestructura. Tus datos financieros, métricas de salud y conversaciones personales nunca salen de tu máquina. No hay servicio en la nube, no hay cuenta, no hay suscripción. Vos sos dueño de la base de datos.

**La IA asiste, vos decidís.** Los agentes sugieren, recuerdan y analizan — nunca toman acciones irreversibles sin confirmación. El agente financiero no va a mover plata. El agente de trabajo no va a cancelar reuniones. El agente de salud no va a diagnosticar. Informan tus decisiones con mejores datos.

**Simplicidad antes que features.** Cada dominio hace pocas cosas bien en vez de todo mal. El wallet no intenta ser un banco. El módulo de salud no intenta ser un hospital. La herramienta de trabajo no intenta ser Jira. Son herramientas personales enfocadas que ganan poder al estar conectadas.

**Conversación primero, UI después.** La interfaz principal es el chat. Le decís al agente lo que necesitás con tus propias palabras. La UI existe para datos visuales (gráficos, listas, dashboards) — pero el chat es donde pasan las cosas. Podés gestionar toda tu vida sin tocar un botón.

**Cross-domain por defecto.** Cada feature se diseña con la pregunta: "¿Cómo afecta esto a las otras cuatro áreas?" El sueño no es solo una métrica de salud — es una señal de capacidad de trabajo, un factor de riesgo de gasto, y un predictor de efectividad de estudio. Nada existe aislado.