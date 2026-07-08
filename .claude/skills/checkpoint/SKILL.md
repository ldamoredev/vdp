---
name: checkpoint
description: End-of-session ritual — write the in-flight state to STATUS.md (Done / In progress / Next / Notes for next session) so a fresh session in ANY model (Opus, Sonnet, Codex, opencode) can resume cold without loading the chat transcript, then commit and push. Invoke when the owner says to wrap up, end the session, hand off, or when the chat is getting long. Not for milestone changes (those go in ROADMAP.md) or machine/personal facts (those go in agent memory).
---

# checkpoint

Writes the session's product state down so the next one picks it up. The problem
it solves: chats get long and expensive, and VDP is multi-agent — the next
session may be a different model that can't read this transcript or this agent's
memory. `STATUS.md` is the **model-agnostic** continuity substrate; `checkpoint`
keeps it current. Its read-side counterpart is `orient`.

## When to use / when NOT

- **Use** when: closing a session, the owner says "wrap up" / "hand off" / "this
  chat is loaded" / "/checkpoint", or before starting a genuinely fresh chat.
- **Do NOT use** for: mid-work status; milestone/scope/sequencing changes (those
  belong in `ROADMAP.md`); architecture or domain-model decisions (those go in
  `AGENTS.md` / `docs/architecture/`, reviewed separately); machine-local or
  agent-specific facts (installed CLIs, auth state, push credentials, model
  quirks — those live in the agent's own memory, never in a repo doc).

## Three docs, three homes — keep them distinct

- **`STATUS.md`** — volatile in-flight state: what just shipped, what's mid-slice,
  the ordered next steps, notes a cold session needs. Changes every session.
- **`ROADMAP.md`** — milestone sequencing (phases, F-items). Changes rarely, only
  when a phase actually ships or is rescoped. `checkpoint` touches it only then.
- **Agent memory** — model-specific and machine facts. Never in `STATUS.md`.

## Checklist

1. **Re-read `STATUS.md`** as it stands.
2. **Move finished items to Done** — phrase each as *what shipped*, not what was
   attempted; name files/modules/PRs where it helps a fresh session orient.
3. **Update "In progress"** — exactly where work was left, including *why* if it
   paused mid-way (waiting on an owner decision, a STOP gate, a blocked PR).
4. **Update "Next"** — the ordered remaining steps; keep any detailed plan made
   this session rather than compressing it away.
5. **Update "Notes for next session"** — only what isn't derivable from the code:
   open decisions awaiting the owner, deliberate shortcuts and their payoff
   condition, workflow rules settled this session not yet in `AGENTS.md`. Prune
   notes that are now stale or already folded into permanent docs.
6. **Update `_Last updated:_`** to today's date (owner is in Argentina — local
   date).
7. **Keep it short** — a handoff note, not a transcript. Bias to trimming resolved
   notes over accumulating new ones.
8. **Commit and push directly, no gate.** `STATUS.md` is a docs-only, owner-asked
   trivial change (same class `open-pr` step 0 treats as direct-push). `git add
   STATUS.md` (plus `ROADMAP.md` only if a phase actually shipped/rescoped),
   conventional commit describing the session, push over HTTPS. Report what moved
   *after* pushing — visibility, not a gate.

## Model-agnostic writing

`STATUS.md` is read by Codex, Kimi, GLM and Claude alike. Write it self-contained
and in English (repo-doc language rule): no "see my memory", no Claude-specific
references, no reliance on this chat. If a fact only lives in this agent's memory
but a cold session of another model needs it, that fact belongs in `STATUS.md` or
`AGENTS.md`, not left in memory.
