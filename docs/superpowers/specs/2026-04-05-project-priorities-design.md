# Project Priorities Design

Date: 2026-04-05
Status: Approved direction, ready for implementation planning

## Goal

Define the most important next phase for VDP using a product-first lens with enough technical confidence to support shipping. The project should prioritize a stronger current product over broadening scope, while still reducing the specific technical risks that would undermine trust.

## Current Context

The repository has two active domains:

- `Tasks`, which is the most mature reference module
- `Wallet`, which is implemented broadly but still newer and less trusted

The larger product thesis is cross-domain intelligence, but the highest-value path is not to activate more domains yet. The best leverage comes from making the current `Tasks + Wallet` product feel reliable, coherent, and clearly useful.

## Chosen Approach

Use a balanced product-confidence strategy:

- optimize first for a stronger shipped product
- invest second in technical confidence where it directly supports product trust
- defer new domain activation until the current pattern is proven

This avoids two failure modes:

1. shipping too much visible surface without enough reliability to trust it
2. over-investing in technical hardening without making the product meaningfully stronger

## Phase Order

### 1. Core Trust

The first step is to remove the most important trust risks in the current platform.

Priority areas:

- auth and session reliability
- multi-user isolation verification
- critical-path production checks
- stable CI coverage for the most important backend and frontend flows

This phase should stay narrow. The goal is not broad platform work. The goal is to make the existing product safe to keep using and safe to keep extending.

Success criteria:

- login, session persistence, logout, and protected routes are reliable
- cross-user data isolation is verified for Tasks, Wallet, and agent conversations
- critical CI suites are stable and deterministic
- the main user flows can be trusted in production-like conditions

### 2. Wallet Confidence

The second step is to raise Wallet to the same confidence level as Tasks.

Priority areas:

- product completeness for the main Wallet workflows
- consistency of backend and frontend contracts
- stronger test coverage on the highest-value Wallet flows
- removal of rough edges that make Wallet feel newer or less dependable

This phase matters because Wallet is already active in the product. Any area that feels partial here weakens the overall VDP story.

Success criteria:

- the main Wallet flows feel complete enough for regular use
- Wallet behavior is covered by stable unit and integration tests where needed
- frontend interactions match backend behavior cleanly
- Wallet can be treated as a trusted second reference module

### 3. Cross-Domain Value

The third step is to make the current product thesis visible.

Priority areas:

- strengthen one or two `Tasks ↔ Wallet` interactions
- make cross-domain signals understandable and useful to the user
- ensure the resulting actions feel like product value, not internal plumbing

This is the moment where VDP stops feeling like two adjacent modules and starts feeling like one system.

Success criteria:

- at least one cross-domain loop feels clearly valuable in daily use
- the user can see why the system acted and what it is recommending
- the behavior is narrow, explicit, and predictable

### 4. Daily-Use Polish

The fourth step is to refine the loops users repeat most often.

Priority areas:

- task capture and task review
- wallet entry and wallet review
- home summary and shared shell clarity
- chat-driven flows that mutate product state

This phase should focus on friction reduction, clarity, and confidence. It should not turn into broad redesign work.

Success criteria:

- the most common daily actions feel fast and dependable
- the shell and chat interactions support the main product loops instead of distracting from them
- the product feels cohesive across Tasks and Wallet

### 5. Domain Restraint

The fifth step is not an implementation stream but an explicit rule:

- do not activate `Health`, `People`, `Work`, or `Study` yet

These domains remain out of scope until the current two-domain product is:

- stable enough to trust
- compelling enough to recommend
- clear enough that another domain would multiply value instead of diluting focus

## Non-Goals

The following should not define this phase:

- broad platform refactors without direct product payoff
- activation of additional life domains
- building a generic orchestration engine
- expanding surface area faster than the current product can support

## Decision Rules

When choosing work during this phase:

1. prefer work that strengthens the lived product over work that only improves internal elegance
2. choose technical hardening when it removes a trust risk on an active flow
3. prefer deeper confidence in `Tasks + Wallet` over breadth into new domains
4. prioritize cross-domain loops only after the current product is reliable enough to showcase them well

## Success Definition For The Phase

This phase is successful when VDP feels like a trustworthy two-domain product rather than an ambitious multi-domain prototype.

At that point:

- the product is stable enough to use regularly
- Wallet no longer feels materially behind Tasks in confidence
- at least one cross-domain interaction feels indispensable or memorable
- the next planning cycle can evaluate whether to deepen the current system further or activate a new domain

## Risks

The main risks in this phase are:

- letting technical hardening expand into a broad infrastructure program
- shipping more visible surface without strengthening trust first
- adding new domains too early because the architecture makes expansion feel easy

The answer to all three is the same: keep the phase centered on the current product and its strongest usage loops.
