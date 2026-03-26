---
version: "1.0.0"
rollback: "Remove generated demo page files under apps/web/src/app/(modules)/"
observe: "Check that demo pages render correctly in browser and respect theme system"
feedback: "Verify navigation works, dark/light mode toggles, and no console errors"
---

# Demo Pages Generation for VDP Presentation

## Context

VDP (Vida Digital Personal) is a personal "Life Operating System". It has the following modules/domains:

- **Tasks** (tasks) — ALREADY IMPLEMENTED AND WORKING. DO NOT TOUCH.
- **Wallet** (wallet) — Personal finance management
- **Health** (health) — Health and wellness tracking
- **People** (people) — Contact and relationship management
- **Work** (work) — Career and professional management
- **Study** (study) — Learning and education tracking

## Your Responsibility

Generate modern, visually polished demo (placeholder) pages for every module that does **NOT** have a real implementation yet, so that during a presentation/demo the user can navigate to each section and talk about what each module will do.

## Step-by-Step Instructions

### Step 0 — Codebase Research (MANDATORY, DO NOT SKIP)

Before writing a single line of code:

1. Read `PLAN.md`, `PRODUCT.md`, and `CLAUDE.md` at the project root to understand each module's vision
2. Explore `apps/web/` to understand:
    - The routing system (Next.js App Router with route groups)
    - The main layout and sidebar (icon rail + expandable panel)
    - The theming system (CSS custom properties, `data-theme`, light/dark)
    - Existing UI components and their styling
    - How the Tasks module is implemented (use it as a pattern reference)
3. Explore `packages/` to understand shared components
4. Identify the color palette, typography, spacing, and design patterns in use

**WAIT FOR CONFIRMATION** before proceeding to the next step.

### Step 1 — Landing / Dashboard

Update the main page (Dashboard) to display ALL modules:

- The **Tasks** module must link to its real implementation
- All other modules must have visible, clickable cards/widgets that navigate to their demo pages
- Each module card must include:
    - A representative icon for the domain
    - Module name
    - Brief description (1 line) of what it will do
    - A subtle visual indicator that it's "coming soon" (without looking broken or incomplete)
- Visual hierarchy: Tasks prominent (already working), the rest in a responsive grid
- Respect 100% the existing theme system (CSS custom properties, no hardcoded colors)

**WAIT FOR CONFIRMATION** before proceeding.

### Step 2 — Demo Page Template Per Module

For each unimplemented module (wallet, health, people, work, study), create a page with:

**Structure:**
- Header with icon + module name + descriptive tagline
- Hero section with a 2-3 sentence description of what this module will solve
- Planned features section: 3-4 cards with icons showing the main planned functionalities
- Visual preview section: a stylized mockup/wireframe (can be simple SVGs or empty UI components) that gives a feel for what the final interface will look like
- Subtle footer with "In development" or similar

**Design:**
- Modern, clean, professional
- Use the existing component system and design tokens from the project
- Each module should have its own accent color to differentiate it, while remaining coherent with the overall theme
- Dark/light mode must work correctly
- Responsive (should look good in the demo even on a laptop)
- NO functional behavior (no API calls, no complex state management, no working forms)
- Can use hardcoded mock data to make it feel "alive"

**WAIT FOR CONFIRMATION** before proceeding to the next module.

### Step 3 — Navigation

Ensure that:
- The sidebar shows ALL modules with their icons
- Navigation between modules is smooth
- The active module is properly highlighted in the sidebar
- Each demo module page has a "Back to Dashboard" button

**WAIT FOR CONFIRMATION** when finished.

## Suggested Content Per Module

### Wallet
- Tagline: "Your personal finances, organized and clear"
- Features: Income & expense tracking, Category-based budgets, Balance & trends, Spending alerts
- Preview: Mockup of a balance view with a pie chart and a list of recent transactions

### Health
- Tagline: "Your wellbeing, all in one place"
- Features: Habit tracking, Metric monitoring, Medical history, Reminders
- Preview: Mockup of a panel with health metrics and a habit calendar

### People
- Tagline: "Nurture your relationships, never lose sight of them"
- Features: Contact directory, Important date reminders, Interaction notes, Relationship circles
- Preview: Mockup of contact cards with upcoming birthdays

### Work
- Tagline: "Your professional career, managed with intention"
- Features: Project tracking, Achievement log, Professional networking, Career goals
- Preview: Mockup of a project timeline and professional metrics

### Study
- Tagline: "Learn with purpose, don't lose your way"
- Features: Courses & resources, Study notes, Progress tracking, Spaced repetition
- Preview: Mockup of a learning dashboard with per-course progress

## Technical Rules

- Use strict TypeScript
- Functional React components with Next.js App Router
- CSS custom properties from the project (NEVER hardcoded colors)
- Reuse existing components whenever possible
- Create new components only if nothing reusable exists
- A single generic `DemoModulePage` component is acceptable if the structure repeats, parameterized per module
- Do not install new dependencies unless strictly necessary
- File naming in English; UI text in Argentine Spanish with voseo

## Reference Skills

If you have access to the `frontend-patterns` skill from everything-claude-code, use it as a guide for React/Next.js patterns. If you have `frontend-slides`, check it as a visual presentation reference. But always prioritize consistency with what already exists in the VDP codebase.