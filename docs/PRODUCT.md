# VDP — Your life, understood

## What is VDP?

VDP is a personal AI system that manages your daily life across six areas: your tasks, your money, your health, your work, your relationships, and your learning. Each area has its own AI agent that understands the context, tracks what matters, and acts on your behalf. But the real power is that they talk to each other.

When you slept 4 hours, your work agent suggests a lighter day. When your spending spikes, your wallet agent checks if something is off. When you haven't called your mom in 3 weeks, your people agent reminds you — gently.

VDP doesn't just store data. It connects the dots across your life and helps you make better decisions with the full picture.

---

## The six domains

### Tasks — your daily action list

Before anything else, you need to know: what do I need to get done today? Your tasks agent manages a simple, focused daily todo list. No project management, no Gantt charts — just the things you want to accomplish before the day ends.

Tasks can optionally link to any domain. "Pay rent" is a wallet task. "Call dentist" is a health task. "Add Alice to contacts" is a people task. "Buy a charger" is just a task.

**What it does:**

- Manages a daily todo list with priorities (low, medium, high)
- Tags tasks with a domain when relevant
- Tracks completion rate over days and weeks
- End-of-day review: incomplete tasks can be carried over to tomorrow or discarded
- Flags stuck tasks that have been carried over 3+ times
- Tasks can graduate to full Work project tasks when they grow in scope

**Example conversations:**

> "Agregame una tarea: pagar el alquiler"
> → Agent creates the task, tags it as "wallet" domain, sets it for today.

> "¿Qué me falta hoy?"
> → Agent lists your pending tasks for the day with priorities and domain tags.

> "Completé lo del dentista"
> → Agent marks it done, updates your daily completion rate (now 5/7 — 71%).

> "Pasame las que no completé para mañana"
> → Agent carries over 2 remaining tasks to tomorrow, marks them as carried over.

**Example proactive behavior:**

> "You've carried over 'organize tax documents' 4 days in a row. It might be too big for a daily task — want to break it into smaller steps, or promote it to a Work project?"

> "All tasks done for today — nice! Your completion rate this week is 89%, up from 74% last week."

---

### Wallet — your financial brain

Your wallet agent knows your accounts, your spending patterns, your savings goals, and your investments. It speaks your financial language — ARS and USD, blue dollar and MEP, plazo fijo and FCI.

**What it does:**

- Tracks every income and expense across multiple accounts and currencies
- Calculates real-time balances automatically
- Monitors spending by category and flags when something looks unusual
- Tracks savings goals with progress ("you're 62% toward your vacation fund")
- Manages investment portfolio tracking
- Keeps exchange rate history for ARS/USD with all market types

**Example conversations:**

> "Gasté 15.000 en el súper"
> → Agent creates the expense, assigns it to "Supermercado", confirms the balance.

> "¿Cuánto gasté este mes en comida?"
> → Agent queries spending by category, breaks it down, compares to last month.

> "Registrá mi sueldo de marzo, 850.000 pesos"
> → Agent creates income transaction, updates balance, checks savings goal progress.

**Example proactive alert:**

> "Your spending this week is 2.3x your daily average. You've spent $45,000 on Entretenimiento alone — that's more than the entire last month in that category. Want me to break it down?"

---

### Health — your wellness companion

Your health agent tracks the metrics that matter — sleep, steps, water, mood, energy, weight — and connects them to the rest of your life. It manages your habits, medications, appointments, and body measurements. It never gives medical advice, but it sees the patterns you might miss.

**What it tracks:**

- Daily metrics: sleep hours, steps, water intake, calories, mood (1-5), energy (1-5)
- Habits with streak tracking (meditation, exercise, reading, etc.)
- Medication schedules and adherence
- Medical appointments
- Body measurements: weight, body fat, blood pressure, glucose

**Example conversations:**

> "Dormí 5 horas anoche"
> → Agent logs sleep, notices it's been below 6 hours three days in a row, asks about your mood.

> "¿Cómo vengo con mis hábitos esta semana?"
> → Agent shows completion rates, highlights your 12-day meditation streak, flags that you missed gym twice.

> "Turno con el cardiólogo el 20 de abril a las 10"
> → Agent creates the appointment, will remind you 2 days before.

**Example proactive insight:**

> "Your mood has been trending down for 4 days (avg 2.8 vs your usual 3.9). This started the same day your sleep dropped below 6 hours. I'm not a doctor, but sleep and mood are closely linked — could be worth focusing on rest tonight."

**Cross-domain connection:**

When Health detects poor sleep, it emits an event. Work agent sees it and suggests rescheduling deep focus tasks. Wallet agent sees it and holds back on risky investment suggestions — because decision-making quality drops when you're tired.

---

### Work — your productivity partner

Your work agent helps you plan your days, track your projects, and understand your productivity patterns. It knows your calendar, your tasks, and your energy levels — and helps you align them.

**What it manages:**

- Projects with status, priority, and deadlines
- Tasks with estimated vs actual time, dependencies, and progress
- Time blocks: deep work, meetings, admin, breaks
- Work sessions with focus scores
- Daily logs: accomplishments, blockers, reflections
- Calendar integration (Google Calendar sync)

**Example conversations:**

> "¿Qué tengo hoy?"
> → Agent shows your schedule: 2 meetings in the morning, a 3-hour deep work block after lunch, a task deadline at 5pm.

> "Armame un plan para la semana"
> → Agent looks at your pending tasks, deadlines, energy patterns from health data, and meeting load. Suggests which days to block for deep work, which tasks to prioritize.

> "Completé el diseño del API"
> → Agent marks the task done, logs actual hours, updates project progress (now at 73%), checks if any blocked tasks can now proceed.

**Example proactive behavior:**

> "You have 0 deep work hours so far this week and it's Wednesday. Your average is 12 hours/week. You have a free block tomorrow from 2-5pm — want me to protect it?"

> "Your daily log shows 'blocked by QA review' three days in a row. Want me to flag this in your next standup notes?"

**Cross-domain connection:**

When Health reports good sleep and high energy, Work agent suggests tackling the hardest tasks. When Work detects meeting overload (>4 hours of meetings in a day), it emits an event — Health agent might suggest extra recovery time.

---

### People — your relationship keeper

Your people agent helps you maintain and strengthen the relationships that matter. It remembers birthdays, tracks when you last talked to someone, and flags when a relationship needs attention — because life gets busy and people fall through the cracks.

**What it tracks:**

- Contacts with relationship types (family, close friends, friends, professional)
- Interaction history: when you met, called, texted, or had a meaningful conversation
- Relationship health scores based on interaction frequency vs how close you are
- Important dates: birthdays, anniversaries, milestones
- Groups: friend circles, family groups, work teams
- Social events

**Example conversations:**

> "Hoy almorcé con Santiago"
> → Agent logs the interaction, updates Santiago's "last contact" date, notes that your relationship health score just improved.

> "¿A quién no hablé hace mucho?"
> → Agent lists neglected relationships: "You haven't talked to your brother in 23 days, your friend Laura in 31 days, and your old colleague Martín in 45 days."

> "¿Cuándo cumple años mi vieja?"
> → Agent pulls up the date, tells you it's in 12 days, asks if you want a reminder to buy a gift.

**Example proactive reminder:**

> "Your friend Diego's birthday is in 3 days. Last year you had dinner together at La Cabrera. Based on your recent interactions, you usually meet up — want me to suggest a plan?"

> "You haven't had any social interaction logged this week. Your usual average is 4 per week. Everything okay?"

**Cross-domain connection:**

When People detects social isolation (zero interactions for a week), it emits an event. Health agent factors this into mood analysis. Work agent might suggest a team lunch or coffee with a colleague. When Health reports mood declining, People agent might suggest reaching out to close friends.

---

### Study — your learning coach

Your study agent helps you learn consistently, retain what you study, and track your progress across subjects. It manages your study plans, reminds you about flashcard reviews, and helps you find the best time to study based on your energy and schedule.

**What it manages:**

- Subjects with progress tracking
- Resources: books, courses, tutorials with completion status
- Study sessions with focus timer (Pomodoro-style)
- Flashcards with spaced repetition (the algorithm decides when you need to review)
- Knowledge notes with linking between concepts
- Study plans generated from your goals and available time

**Example conversations:**

> "Hoy estudié 2 horas de Rust"
> → Agent logs the session, updates subject progress, checks your weekly study goal (now at 8/10 hours).

> "Creame flashcards de lo que estudié hoy"
> → Agent generates flashcards from your session notes, schedules them for review based on spaced repetition.

> "¿Qué debería estudiar hoy?"
> → Agent checks your subjects, due flashcard reviews (15 cards due), and your energy level from health data. Suggests starting with flashcard review (low energy OK), then 1 hour of new material if energy improves.

**Example proactive behavior:**

> "You have 23 flashcards due for review today. Your retention has been dropping on the 'Rust ownership' topic (72% → 58% over 2 weeks) — these cards need attention."

> "You haven't studied in 4 days. Your streak was at 15 days before it broke. Want to do a quick 20-minute review session to rebuild momentum?"

**Cross-domain connection:**

Work agent shares your schedule — Study agent finds open windows. Health agent shares your energy levels — Study agent suggests the right difficulty. If Work has a deadline approaching, Study agent reduces its daily recommendations to avoid overload.

---

## What makes VDP different

### 1. Domains are interconnected, not siloed

Most apps track one thing: a budget app, a habit tracker, a task manager. They don't talk to each other. VDP connects them through events:

| Event | Triggered by | Affects |
|-------|-------------|---------|
| All daily tasks completed | Tasks | Orchestrator notes a productive day |
| Task stuck (carried over 3+ days) | Tasks | Work suggests promoting to project task |
| Task overload (>50% carry-over rate) | Tasks | Health checks stress levels, Work reviews workload |
| Poor sleep (< 6h) | Health | Work suggests lighter day, Wallet pauses risky suggestions |
| Spending spike | Wallet | Health asks about mood/stress, People checks social patterns |
| Meeting overload (> 4h/day) | Work | Health suggests recovery, Study reduces daily goals |
| Social isolation (0 interactions/week) | People | Health flags for mood monitoring, Work suggests team activities |
| Study streak broken | Study | Health checks if something is off, Work checks if overloaded |
| Mood declining (3+ days) | Health | People suggests reaching out, Work adjusts workload |

This is the core insight: **your life is one system, not six separate apps.**

### 2. Agents are proactive, not just reactive

Traditional apps wait for you to open them. VDP agents initiate:

- **Morning:** Health agent checks your sleep, Work agent previews your day, Wallet agent shows overnight transactions
- **During the day:** Medication reminders, meeting prep, spending alerts
- **Evening:** Health prompts for mood/energy log, Work generates daily summary, Study reminds about flashcard reviews
- **Weekly:** Cross-domain life report from the Orchestrator — how your week went across all six areas

### 3. AI agents that know your context

Each agent has access to:

- **Your data** — every transaction, every metric, every task, every interaction
- **Your patterns** — the agent learns what's normal for you and flags anomalies
- **Cross-domain context** — the wallet agent knows you slept poorly, the work agent knows you're stressed about money
- **Memory** — the agent remembers previous conversations and builds a picture over time

You talk to them in natural language (Spanish by default). They use tools to query your data, create entries, and take actions. They confirm what they did and ask when they're unsure.

### 4. One system, not six apps

You open VDP and see your life dashboard — a cross-domain overview of what matters today. One click switches to any domain. The chat panel adapts to where you are. Your data lives in one place, your agents collaborate in the background, and you see the full picture.

---

## A day in the life with VDP

**7:30 AM — You wake up**

Your phone shows a morning briefing from VDP:
- Tasks: "5 tasks for today (2 carried over from yesterday). Top priority: submit tax documents."
- Health: "You slept 7.2 hours. Mood yesterday: 4/5. 3 medications due this morning."
- Wallet: "Yesterday's spending: $12,400 (food + transport). Monthly budget: 68% used."
- Work: "Today: standup at 9, design review at 11, 3-hour deep work block at 2pm. 2 tasks due."
- People: "Mom's birthday in 2 days. Diego hasn't been contacted in 18 days."

**9:15 AM — After standup**

You open the Wallet chat: "Registrá que pagué 3.500 de café con Santi." Agent logs it under "Comida," notes the interaction for People (you met with Santiago).

**2:00 PM — Deep work block**

Work agent has already marked this block as protected. Study agent doesn't send flashcard reminders during deep work hours.

**6:30 PM — End of day**

Tasks agent prompts: "You have 2 tasks left: 'submit tax documents' and 'buy charger'. Carry over or discard?" You carry over the tax docs, discard the charger — you'll get it this weekend.

Work agent prompts: "How was today? Accomplishments? Blockers?" You dictate a quick summary. It generates your daily log.

Health agent prompts: "Mood? Energy level?" You say "3 and 3, me siento cansado." Agent logs it, notices mood dropped from yesterday's 4, stores it for pattern analysis.

**Sunday evening — Weekly report**

The Orchestrator generates your weekly life summary:

> "This week: Daily tasks completion rate 82% (28/34). Income $850,000 / Expenses $340,000 (savings rate 60% — up from last week). Sleep averaged 6.8h (goal: 7.5). Completed 14/18 work tasks (78%). Studied 8h of Rust (goal: 10). Talked to 6 people (below your 8/week average). Mood trend: slightly declining (3.6 → 3.2). Possible correlation: your sleep and social interaction both dipped midweek."

---

## Who is VDP for?

VDP is for one person: **you**. It's not a team tool, not a family app, not a business platform. It's your personal operating system — the AI that understands the full context of your life and helps you navigate it.

You care about self-improvement but you're realistic. You don't want 10 different apps. You want one system that connects the dots. You're comfortable talking to AI in natural language. You live in Argentina, you think in pesos and dollars, and you want something that speaks your language.

---

## Core principles

**Your data stays yours.** VDP runs on your own infrastructure. Your financial data, health metrics, and personal conversations never leave your machine. There is no cloud service, no account, no subscription. You own the database.

**AI assists, you decide.** Agents suggest, remind, and analyze — they never take irreversible actions without confirmation. The wallet agent won't move money. The work agent won't cancel meetings. The health agent won't diagnose. They inform your decisions with better data.

**Simplicity over features.** Each domain does a few things well rather than everything poorly. The wallet isn't trying to be a bank. The health module isn't trying to be a hospital. The work tool isn't trying to be Jira. They're focused personal tools that gain power from being connected.

**Conversation first, UI second.** The primary interface is the chat. You tell the agent what you need in your own words. The UI exists for visual data (charts, lists, dashboards) — but the chat is where actions happen. You can manage your entire life without touching a button.

**Cross-domain by default.** Every feature is designed with the question: "How does this affect the other four areas?" Sleep isn't just a health metric — it's a work capacity signal, a spending risk factor, and a study effectiveness predictor. Nothing exists in isolation.