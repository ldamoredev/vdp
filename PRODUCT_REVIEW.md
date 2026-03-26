# VDP Product Review — Founder Lens

**Date:** 2026-03-26
**Context:** Post first production deploy, solo developer, free tier infra

---

## What VDP Actually Is Today

**The pitch:** Personal AI operating system managing 6 life domains where agents talk to each other.

**The reality:** A polished Tasks-only daily todo list with an embedded AI assistant. Nothing else is live on the backend.

| Domain | Backend | Frontend | Agent Tools | Status |
|--------|---------|----------|-------------|--------|
| **Tasks** | ✅ Full API + tests | ✅ Full UI | ✅ 8 tools | **SHIPPED** |
| Wallet | ❌ Empty | ✅ Demo UI | ❌ None | Demo pages make 404 API calls |
| Health | ❌ Empty | ✅ Demo UI | ❌ None | Demo pages make 404 API calls |
| People | ❌ Empty | ✅ Demo UI | ❌ None | Demo pages with mock data |
| Work | ❌ Empty | ✅ Demo UI | ❌ None | Demo pages with mock data |
| Study | ❌ Empty | ✅ Demo UI | ❌ None | Demo pages with mock data |

---

## Product-Market Fit: 3/10

**Why not higher:**
- No differentiation vs Todoist yet (10M+ users, $4/mo, everywhere)
- Cross-domain magic (the thesis) doesn't exist yet
- 5 domains are UI shells with zero backend

**Why not lower:**
- Agent quality is genuinely good (clarification gate, carry-over detection, end-of-day review)
- Architecture is correct and extensible
- Self-hosted privacy angle is real
- Embedding-powered duplicate detection works

---

## The Sharpest Edge (What VDP Does Better Than Anything)

1. **Clarification gate** — Agent asks "what do you mean?" before creating vague tasks. Nobody else does this.
2. **Carry-over detection** — "You've carried this over 3 times, break it down." Todoist doesn't track this.
3. **End-of-day review ritual** — Structured decisions (complete/carry/discard) guided by agent. Not just "review your list."
4. **Context-aware agent** — Sees full task history, completion trends, similar tasks, carry-over patterns. Todoist AI sees only the task name.
5. **Embedding duplicate detection** — Creates "buy charger," agent finds "pick up phone charger" from 2 weeks ago.

**The moat (once built):** Cross-domain insights. Spending spike → task pressure check. Sleep drop → work suggestions. No competitor has this because no competitor owns all your life data.

---

## The One Thing That Would 10x This

**Implement ONE working second domain (Wallet) to prove the cross-domain thesis.**

Why Wallet:
- Finance is universal, recurring, high-stakes
- Schema already exists in `@vdp/shared`
- Creates the first cross-domain signal: spending spike → task pressure check
- Proves the magic: "It knows I overspent AND it's reminding me to review tasks"

---

## Things Being Built That Don't Matter

| Waste | Impact | Action |
|-------|--------|--------|
| 5 demo page sets (~4000 lines) | Users click → 404 → think it's broken | **Hide or delete** |
| 60+ unused shared schemas (wallet, health) | Dead code noise | **Keep as documentation, add `@future` markers** |
| 132 inline styles in demo pages | Polish on nonexistent features | **Ignore until domains ship** |
| 29 `any` types in demo page code | Type safety on throwaway code | **Fix only chat hooks (production)** |

---

## Time-to-Value

**Current:** 5-10 minutes if self-hosted. The "wow" is the agent clarifying a vague task.

**Blockers to adoption:**
1. Demo pages → 404s → "this is broken" impression
2. No account persistence — feels temporary
3. Spanish-only agent — limits audience (feature for Argentina, bug for everyone else)
4. No mobile-optimized chat — heavy usage will be on phones

---

## 30-Day Roadmap

### Week 1-2: Remove Confusion + Fix Quality

| # | Action | Effort | Why |
|---|--------|--------|-----|
| 1 | Hide/delete demo domain pages from navigation | 2h | Prevents "click → 404" momentum killer |
| 2 | Fix silent embedding `.catch(() => {})` | 30m | Production bugs hidden |
| 3 | Fix `any` types in chat hooks | 1h | Production type safety |
| 4 | Add vitest coverage thresholds (80%) | 30m | Enforce quality standard |
| 5 | Add root error boundary | 30m | Prevent blank screens |
| 6 | Add shared package tests | 3h | Zero tests on 60+ exports |

### Week 2-3: Prove Cross-Domain Magic

| # | Action | Effort | Why |
|---|--------|--------|-----|
| 7 | Build Wallet API skeleton (CRUD transactions) | 8h | First real second domain |
| 8 | Wire agent tools: `log_transaction`, `get_balance` | 4h | Agent can talk about money |
| 9 | Add cross-domain signal: `SpendingSpike` event | 2h | Proves the thesis |
| 10 | Tasks agent listens: "Tu gasto subió, ¿pasó algo?" | 2h | The "wow" moment |

### Week 3-4: Polish + Soft Launch

| # | Action | Effort | Why |
|---|--------|--------|-----|
| 11 | Polish `/tasks` dashboard (carry-over count, transitions) | 8h | Core experience |
| 12 | Quick-capture improvements (keyboard shortcut) | 4h | Daily usage friction |
| 13 | Generate public demo with seed data | 2h | Let people try it |
| 14 | Tweet/share: "AI task manager that asks questions before creating tasks" | 1h | Get 10 beta users |

### DON'T Build

- ❌ Health, People, Work, Study backends
- ❌ Mobile app (responsive web is enough)
- ❌ English translation (nail Spanish first)
- ❌ User accounts (shared secret is fine for now)
- ❌ Cross-domain orchestration engine (wait for 2+ domains)

---

## Diagnosis

> VDP is a legitimately good idea poorly positioned. The developer is building confidence with breadth (6 domain UIs) instead of depth (one domain perfected). The instinct is right — modular architecture is correct — but the execution is backwards.

**Ship Tasks-only, make it perfect. Then add Wallet and prove cross-domain. Then scale.**

The moat is the network effect of your own life domains talking to each other. Can't build that with 5 half-finished domains. Build it with 2 deep ones.
