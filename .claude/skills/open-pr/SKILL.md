---
name: open-pr
description: Closes a finished, verified implementation slice into a reviewable PR — runs the code-review skill on the diff, gates on findings, commits logical conventional commits, pushes the feature branch, and opens the PR. ALWAYS stops at the open PR; never merges (merge is the owner's, after Architect review). Invoke when the dev agent's slice is verified and it's time to wrap it into a PR, or when asked to run /open-pr. Not for mid-slice work or unverified diffs.
---

# open-pr

The closing half of a dev-agent **implementation session** (`docs/WORKFLOW.md`).
It runs *after* the build loop (`tdd-workflow`) is green and verified — it is not
a substitute for that verification. The point is review ergonomics: the owner
reads the change as a PR diff, not an editor deep-dive or a terminal code dump.

## When to use / when NOT

- **Use** when: one ROADMAP item's slice is implemented, refactored, and the
  verification ladder (AGENTS.md §Verification) is green — and it's time to turn
  it into a reviewable PR. Also when the owner says "ship it" / "wrap this into a
  PR" / "/open-pr".
- **Do NOT use** when: mid-slice; on a diff whose design is still uncertain; as a
  way to skip verification. And never read "ship it" as "merge it" — see below.

## The hard VDP rule: stop at the PR, never merge

This is where VDP differs from a solo repo. An implementation session **always
stops at the open PR** and hands to the Architect review (owner + Opus). It
**never** merges, never `--merge`, never pushes `main`, never deploys. Merge is
owner-only, after review, rebase-merge (AGENTS.md §Working Agreement,
`docs/WORKFLOW.md` §Review & merge). "Ship it" and "merge it" are different
instructions; if a message is ambiguous, ask — do not merge on a guess.

## Step 0 — trivial vs reviewable

Check what paths changed (`git diff --name-only` against `main`):

- **Trivial** — every changed path matches `**.md` or `.claude/**` (the same globs
  CI uses to skip). Docs/skills-only: the working agreement already treats these
  as owner-asked direct commits — commit and push on the current branch (usually
  `main`) without a PR, per the owner's explicit request for that change. Skip the
  rest of this skill.
- **Reviewable** — anything under `apps/*/src`, `server/src`, `packages/*/src`,
  migrations, or build/CI config (`*.config.*`, `package.json`, `.github/**`), or
  a mix of code and docs → run the full flow. A mixed code+docs change is
  reviewable; don't split a PR to sneak docs through as trivial.

## Steps (reviewable changes)

1. **Check state** — `git status` / `git diff --stat`, confirm the branch. If on
   `main`, create the feature branch first: `feat/<item-id>-<slug>` (or `fix/`,
   `refactor/`, `docs/` per the item's kind). Cut from fresh `main`.
2. **Run the `code-review` skill on the diff.** Findings block — report them and,
   per that skill, stop for the owner unless they're already resolved. `open-pr`
   does not merge over an unresolved finding.
3. **Commit** in logical conventional commits (backend / frontend / docs),
   imperative messages explaining the *why*. Standard git safety: no `--no-verify`,
   no force-push, new commit not amend. End messages with the `Co-Authored-By`
   trailer from the repo's git guidance.
4. **Push the feature branch** over HTTPS (`git push -u https://github.com/ldamoredev/vdp.git <branch>` — the SSH agent is empty in sessions; see the git-push-credentials memory). No confirmation needed: opening a PR is reversible; merging is the gated step.
5. **Create the PR** — `gh pr create` (the repo PR template drives the body; fill
   every section, including the verification evidence you actually ran). If the
   code-review surfaced something worth the reviewer's attention that wasn't
   fixed, say so in the body.
6. **STOP.** Report the PR URL and a short summary. Wait for the Architect review
   and a separate, explicit owner merge instruction. There is no merge step here.

## Notes

- CI runs the full ladder on every PR; local verification (step before this skill)
  is what *you* attest to in the PR body, CI is the backstop.
- One PR in flight at a time (`docs/WORKFLOW.md`) — parallel PRs only for disjoint
  modules where neither adds a table.
