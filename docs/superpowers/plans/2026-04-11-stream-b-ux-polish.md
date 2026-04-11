# Stream B — UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the web app feel installable, welcoming, and trustworthy on phones by shipping PWA metadata, a first-visit onboarding modal, and targeted mobile layout fixes.

**Architecture:** Installability lives in the Next app metadata layer (`manifest.ts`, root metadata, generated icon routes) so it stays declarative and low-risk. Onboarding is a small client-side flow on `/home`, with persistence isolated in a tiny storage helper and presentation isolated in a modal component. Mobile polish stays surgical: adjust existing layout and card markup only where review, home, and wallet surfaces are cramped or overflow-prone.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest 3

---

## File Structure

### New files
- `apps/web/src/app/manifest.ts` — PWA manifest definition
- `apps/web/src/app/icon-192.png/route.tsx` — generated 192x192 install icon
- `apps/web/src/app/icon-512.png/route.tsx` — generated 512x512 install icon
- `apps/web/src/app/apple-icon.png/route.tsx` — generated 180x180 Apple touch icon
- `apps/web/src/app/__tests__/manifest.test.ts` — installability metadata tests
- `apps/web/src/components/home/onboarding-modal.tsx` — presentation component for 3-step onboarding
- `apps/web/src/components/home/__tests__/onboarding-modal.test.ts` — modal markup tests
- `apps/web/src/features/home/presentation/onboarding-storage.ts` — localStorage helpers and step metadata
- `apps/web/src/features/home/presentation/__tests__/onboarding-storage.test.ts` — onboarding persistence tests

### Modified files
- `apps/web/src/app/layout.tsx` — viewport, theme color, Apple web app metadata
- `apps/web/src/app/(domain)/home/page.tsx` — mount onboarding and mobile-safe header/grid tweaks
- `apps/web/src/components/home/daily-ritual-card.tsx` — better stacking on narrow widths
- `apps/web/src/features/review/presentation/components/daily-review-screen.tsx` — tighter mobile layout flow
- `apps/web/src/features/review/presentation/components/daily-review-header.tsx` — mobile-friendly badges/header wrapping
- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx` — safer mobile action layout and floating quick-add spacing
- `apps/web/src/features/wallet/presentation/components/wallet-operational-header.tsx` — mobile-friendly action/stat layout
- `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts` — mobile polish assertions
- `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts` — mobile polish assertions
- `apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx` — card layout assertions

---

### Task 1: Ship installability metadata

**Files:**
- Create: `apps/web/src/app/manifest.ts`
- Create: `apps/web/src/app/icon-192.png/route.tsx`
- Create: `apps/web/src/app/icon-512.png/route.tsx`
- Create: `apps/web/src/app/apple-icon.png/route.tsx`
- Create: `apps/web/src/app/__tests__/manifest.test.ts`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Write failing metadata tests**
- [ ] **Step 2: Run `pnpm --filter @vdp/web test -- --run src/app/__tests__/manifest.test.ts` and verify RED**
- [ ] **Step 3: Add manifest, icon routes, and root metadata with `/home` start URL plus mobile meta tags**
- [ ] **Step 4: Re-run the manifest test and verify GREEN**

---

### Task 2: Add first-visit onboarding

**Files:**
- Create: `apps/web/src/components/home/onboarding-modal.tsx`
- Create: `apps/web/src/components/home/__tests__/onboarding-modal.test.ts`
- Create: `apps/web/src/features/home/presentation/onboarding-storage.ts`
- Create: `apps/web/src/features/home/presentation/__tests__/onboarding-storage.test.ts`
- Modify: `apps/web/src/app/(domain)/home/page.tsx`

- [ ] **Step 1: Write failing tests for onboarding copy, steps, and localStorage helpers**
- [ ] **Step 2: Run `pnpm --filter @vdp/web test -- --run onboarding` and verify RED**
- [ ] **Step 3: Implement the storage helper and modal component**
- [ ] **Step 4: Wire the modal into `/home` so first visit opens it and completion persists**
- [ ] **Step 5: Re-run onboarding tests and verify GREEN**

---

### Task 3: Apply mobile polish to home, review, and wallet

**Files:**
- Modify: `apps/web/src/app/(domain)/home/page.tsx`
- Modify: `apps/web/src/components/home/daily-ritual-card.tsx`
- Modify: `apps/web/src/features/review/presentation/components/daily-review-screen.tsx`
- Modify: `apps/web/src/features/review/presentation/components/daily-review-header.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/wallet-operational-header.tsx`
- Modify: `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts`
- Modify: `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`
- Modify: `apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx`

- [ ] **Step 1: Write failing markup tests for responsive stacking/wrapping where current classes are too rigid**
- [ ] **Step 2: Run the focused review, wallet, and home card tests and verify RED**
- [ ] **Step 3: Adjust layout classes so headers, stats, CTAs, and floating actions fit better on narrow widths**
- [ ] **Step 4: Re-run focused tests and verify GREEN**

---

### Task 4: Final verification

**Files:**
- No new files

- [ ] **Step 1: Run `pnpm --filter @vdp/web test -- --run src/app/__tests__/manifest.test.ts src/components/home/__tests__/onboarding-modal.test.ts src/features/home/presentation/__tests__/onboarding-storage.test.ts src/components/home/__tests__/daily-ritual-card.test.tsx src/features/review/presentation/__tests__/daily-review-markup.test.ts src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`**
- [ ] **Step 2: Run `pnpm --filter @vdp/web build`**
- [ ] **Step 3: If both succeed, summarize the shipped Stream B slice and any residual manual mobile checks still worth doing in-browser**
