# VDP — Product Strategy (2026-07-06)

Current strategic document. Replaces the 2026-06-11 analysis (whose items are nearly
all closed: persisted insights, per-chat prompt builders, currency-aware spike
detection, global chat, server-backed ritual). It is the synthesis of two external
analyses (GPT 5.5 and GLM 5.2) validated against the repository, plus independent
judgment. Executable phases live in [`ROADMAP.md`](./ROADMAP.md); architecture rules
in [`AGENTS.md`](./AGENTS.md). This doc defines the **why** and the **what not**.

## Product identity

> **VDP is a personal execution system: it turns objectives into daily action and
> real data (money, habits, hours) into evidence of progress.**

- **Objectives** is the *why* (strategic layer). **Tasks** is the *what do I do now*
  (daily surface). Together they are the spine.
- **Wallet, Health and Projects** are evidence domains: they feed Objectives metrics
  and emit signals that end up as actions.
- **Inbox** is the capture funnel. **Home/Review** are the ritual that opens and
  closes the day — the ritual is the product, not two more screens.
- The signature pattern (the real differentiator): *signal in domain A → suggested
  action in domain B → owner confirmation via pre-filled deep-link*.

What VDP is **not**: a finance app, a quantified-self dashboard, a pure
conversational assistant, a personal Notion, a self-hosted multi-tenant platform.

## Directions evaluated (summary)

| Direction | Verdict |
|---|---|
| Finance OS (Wallet as the identity) | Rejected as identity; Wallet remains an evidence domain |
| Full Life OS (People/Study/Work at the same level) | Rejected for now — breadth without compounding is the anti-pattern |
| Agent-first assistant | Deferred to Phase 4; the architecture supports it but data density comes first |
| **Objective/habit execution** | **Chosen** — maximum reuse of existing code, minimal new surface |
| Personal analytics / correlations | Deferred to Phase 3, always with a one-tap action per tile |
| Personal CRM (People) | Deferred indefinitely — yearly-frequency signal, privacy-sensitive |
| Self-hosted platform | Rejected for now — platformization without a validated product |

## Criteria for deciding features (in order of weight)

1. **Owner's daily use** — n=1 product: the owner's retention is the only PMF.
2. **Cross-domain compounding** — does it emit or consume a signal? No new module
   without its signal-in and signal-out designed up front.
3. **Closes an existing loop** rather than opening a new one.
4. **Full-vertical cost** — the New Domain Gate makes breadth the most expensive
   resource; every new domain is weeks of work.
5. **Real agent value vs. agent theater** — it only counts if it reduces friction on
   something already done (capturing, classifying, synthesizing).
6. **Privacy and trust** — medical stays off the LLM (schema level); agent writes
   require confirmation; backups are a first-class feature.
7. **Data model stability** — no generic entities (universal Event/Note); every
   entity declares its role: Strategic / Action / Measurement / Capture.
8. **Fits without extending the architecture** — best case is "presenter work" or
   one more CQBus handler; worst case demands a scheduler or a second data store.
9. **Genericity risk** — if the feature could appear in Notion's changelog, it does
   not differentiate.
10. **Reversibility** — prefer bets that can be abandoned.

## Module strategy

- **Core:** Tasks, Objectives (to be promoted), Inbox, Home/Review (the ritual).
- **Deepen only on real friction:** Wallet (evidence + signals), Health (weekly
  summary; medical untouchable), Projects (boundary documented in AGENTS.md; Phase 2
  adds agent-assisted project→board task breakdown — the first real depth, driven by
  the F1.2 signal that Tasks+Projects is the daily surface).
- **Deferred:** People (until a weekly loop is validated manually), Study.
- **Avoid:** a Work module unless the activation signal in `AGENTS.md`
  §Tasks / Projects / Work Boundary is met; generic automations; plugin system;
  an orchestrator with free write access; medical AI.

## Product principles

1. No new module without its cross-domain signal designed up front.
2. Agents narrate autonomously; they write with confirmation; they never delete and
   never touch medical.
3. Capture and ritual retain; dashboards get admired. Every read surface carries a
   one-tap action.
4. Objectives connects strategy to daily action or gets demoted honestly — the
   in-between state is the worst option.
5. Medical stays off the LLM at the schema level, not by convention.
6. Never sum across currencies; never sum heterogeneous units in Objectives.
7. The owner's own usage is the only PMF: instrument it and decide with it.
8. Depth before breadth: closing existing loops beats opening new ones.
9. An insight without an attached decision is noise and does not get built.
10. Architecture follows product: no abstraction before the third instance that
    demands it.
11. Trust is the moat: backups, auditing, HITL and correct data are worth more than
    any feature.
12. Avoid genericity: VDP differentiates because its domains read each other.

## Decisions made

- **Identity:** objective-execution system with real evidence (this doc).
- **LLM provider (2026-07-06):** OpenCode Zen, OpenAI-compatible
  (`OPENAI_COMPAT_BASE_URL=https://opencode.ai/zen`). Interim model:
  `mimo-v2.5-free` — passed the tool-calling eval (5/5) and the prod smoke. The
  plan's paid models are blocked on billing; re-evaluate with
  `scripts/agent-model-eval.mjs` once unblocked. `deepseek-v4-flash-free` is
  discarded (rejects turns carrying tool results).
- **Chat in prod:** enabled for the owner only via `chatEnabledForUsers=false`
  (non-superadmins get no chat). Live on vdpapp.com.ar.
- **R4 (merge /home + /review): stays parked.** Two screens with shared state work;
  do not re-litigate without concrete daily friction.
- **Single-user first.** Multi-user infrastructure exists but gets no investment;
  revisit only on a concrete need.

## Open decisions

- **Definitive paid model** once OpenCode billing is resolved (candidates:
  kimi-k2.7-code, minimax-m3, deepseek-v4-flash, qwen3.6-plus).
- **Priority of the Objectives promotion** — validate with F1.2 (instrumentation)
  data that Objectives is used enough to deserve an agent in Phase 4.
- **Mobile/PWA** — decide with F1.2 data whether mobile capture is real friction.

## Technical anti-decisions (do not do too early)

1. No microservices. 2. No scheduler/cron while write-time + lazy-on-load suffice
(if it comes, prefer an external trigger → HTTP). 3. No second data store
(Postgres + pgvector covers the next 10x). 4. No agent-orchestration framework
before the three agents see daily use in prod. 5. No generalized permission system
over the tool registry until the agent policy is frozen. 6. Do not move read-time
composition out of the web presenter into the backend before the third composed
surface. 7. No Work module unless the `AGENTS.md` boundary's activation signal is
met. 8. Do not unify the two domain-modeling styles. 9. No real multi-tenancy
beyond `userId` scoping. 10. No agent auto-actions on user data.
