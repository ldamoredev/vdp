---
name: orient
description: Session-start counterpart to checkpoint — re-orient a fresh session by reading STATUS.md, cross-checking it against git/PR reality, and reporting where things stand plus the proposed next item. Read-only; never edits STATUS.md (that's checkpoint) and never starts coding (that's tdd-workflow/the ROADMAP item). Invoke at the start of a session, when the owner asks "where were we?" / "what's next?", or when asked to run /orient.
---

# orient

`checkpoint` writes the state at session end; `orient` picks it up at the start of
the next one — including a different model that never saw the last chat. Read-only:
it does not edit `STATUS.md` and does not start work.

## When to use / when NOT

- **Use** at session start, on "where were we?" / "what's next?" / "/orient", or
  after a gap when you need to reconstruct where things stand.
- **Do NOT** edit `STATUS.md` here (that's `checkpoint`), and do not start coding
  (that's the ROADMAP item run under `tdd-workflow`).

## Steps

1. **Read `STATUS.md`** in full.
2. **Cross-check against git reality** — a handoff note can be stale if the last
   session ended without a `checkpoint`:
   - `git status` — uncommitted leftovers a fresh session should know about.
   - `git log --oneline -15` — anything landed since `_Last updated:_` that
     `STATUS.md` doesn't reflect.
   - `gh pr list` — open PRs waiting on review or merge.
3. **Report a short orientation** (a paragraph or two, prose):
   - What shipped most recently, and whether anything is mid-flight.
   - Any drift found in step 2 (work not in `STATUS.md`, an open PR, a dirty tree)
     — surfaced, not silently fixed.
   - The first "Next" item as the proposed slice, plus any open decision from
     "Notes for next session" that blocks or shapes it.
4. **Stop.** If the owner confirms the proposed item, continue via `tdd-workflow`
   (build) → `open-pr` (ship). Don't re-narrate all of `STATUS.md` — this is a
   refresher plus a drift check.
