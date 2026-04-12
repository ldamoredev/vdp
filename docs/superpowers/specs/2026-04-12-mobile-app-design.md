# VDP Mobile App — Design Spec

**Date:** 2026-04-12
**Status:** Approved
**Milestone 1:** Login + Home Dashboard + Tasks

## Overview

Native mobile app (iOS + Android) built with Expo and React Native that mirrors the VDP web app's purpose. Lives at `apps/mobile/` in the monorepo alongside `apps/web/`. Communicates directly with the Fastify backend (no Next.js proxy). Brand-consistent UI with native navigation patterns.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platforms | iOS + Android | Cross-platform from the start via Expo |
| Auth strategy | Direct to Fastify + SecureStore | Avoids unnecessary Next.js proxy hop; native apps can't use httpOnly cookies |
| First milestone | Login + Home + Tasks | Complete end-to-end flow to validate architecture |
| AI chat | Deferred to Phase 2 | Focus on CRUD first; SSE streaming on mobile needs careful handling |
| Tab structure | 3 tabs + More menu | Home, Tasks, More — scales as domains are added |
| UI approach | Brand-consistent, native patterns | VDP purple theme + native tab bars, stacks, form sheets, haptics |
| Architecture | Standalone Expo app + direct API calls | Own API client using `@vdp/shared` types; no shared API client package yet |

## Project Structure

```
vdp/
├── apps/
│   ├── web/                    # Existing Next.js app
│   └── mobile/                 # NEW: Expo app
│       ├── app/                # Expo Router file-based routes
│       │   ├── _layout.tsx     # Root layout: auth check + providers
│       │   ├── login.tsx       # Login screen (outside tabs)
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx # NativeTabs (Home, Tasks, More)
│       │   │   ├── (home,tasks,more)/
│       │   │   │   ├── _layout.tsx  # Shared Stack for all tabs
│       │   │   │   ├── index.tsx    # Home dashboard
│       │   │   │   ├── tasks/
│       │   │   │   │   ├── index.tsx    # Task list (today)
│       │   │   │   │   ├── [id].tsx     # Task detail
│       │   │   │   │   └── history.tsx  # Task history
│       │   │   │   ├── tasks/new.tsx    # Create task (modal)
│       │   │   │   ├── more/
│       │   │   │   │   ├── index.tsx    # More menu
│       │   │   │   │   └── settings.tsx # Settings
│       │   │   │   └── wallet/
│       │   │   │       └── index.tsx    # Placeholder (future)
│       │   └── +not-found.tsx
│       ├── components/         # Mobile UI components
│       ├── lib/                # API client, auth, utilities
│       ├── hooks/              # Custom hooks
│       ├── constants/          # Theme, colors, config
│       ├── app.json            # Expo config
│       ├── tsconfig.json       # Extends root, path aliases
│       └── package.json        # Expo + RN dependencies
├── packages/shared/            # Existing: Zod schemas + types
├── server/                     # Existing: Fastify backend
└── turbo.json                  # Add mobile to pipeline
```

## Navigation Architecture

### Tab Bar (Bottom Navigation)

3 tabs with expandable "More" menu:

| Tab | Icon (SF Symbol) | Stack Screens |
|-----|-------------------|---------------|
| Home | `house.fill` | Home dashboard |
| Tasks | `checkmark.circle.fill` | Task list → Task detail, New task (modal), History |
| More | `ellipsis` | Menu → Settings, future domains |

### Auth Flow

1. App launch → check `expo-secure-store` for session token
2. No token → show `login.tsx`
3. User submits email/password → `POST /api/v1/auth/login`
4. Backend returns session token → store in SecureStore
5. Navigate to `(tabs)` group
6. On any 401 response → clear SecureStore → redirect to `login.tsx`

### Route File Structure

Uses Expo Router shared groups `(home,tasks,more)` so all tabs can push common screens. The `login.tsx` route sits outside the tab group — unauthenticated users only see the login screen.

## API Client & Data Layer

### Data Flow

```
React Native Screens
        ↕
React Query (TanStack Query)
  - Caching, refetching, optimistic updates
        ↕
lib/api/ — Mobile API Client
  - fetch() + SecureStore token injection
  - Types from @vdp/shared
        ↕
Fastify Backend (Direct)
  - https://vdp-qr8o.onrender.com/api/v1/*
```

### API Client Structure

```
lib/
├── api/
│   ├── client.ts         # Base HTTP client (fetch wrapper)
│   │                       - Reads token from SecureStore
│   │                       - Injects x-session-token header
│   │                       - Handles 401 → logout
│   │                       - Base URL from config
│   ├── auth.ts           # login(), logout(), getMe()
│   └── tasks.ts          # getTasks(), getTask(), createTask(),
│                           updateTask(), completeTask(),
│                           carryOverTask(), discardTask(),
│                           getTaskStats(), getReview()
├── auth/
│   ├── context.tsx       # AuthContext provider
│   │                       - isAuthenticated, user, login(), logout()
│   └── secure-store.ts   # getToken(), setToken(), clearToken()
└── query/
    └── client.ts         # QueryClient configuration
```

### Key Decisions

- **React Query**: Same as web app — familiar patterns, automatic cache + refetch on focus, optimistic updates.
- **Direct fetch**: No axios. Thin wrapper for auth header injection. React Native has good fetch support.
- **Token strategy**: Session token from `POST /auth/login`, stored in `expo-secure-store` (encrypted), sent as `x-session-token header`.

## Screen Designs

### 1. Login Screen

- VDP branding (purple theme, logo)
- Email + password fields
- Spanish UI matching web (`Iniciar Sesion`, `Registrate`)
- Error display below form (`Credenciales invalidas`)
- Loading state on submit button
- `KeyboardAvoidingView` for keyboard handling
- No native header (standalone screen)

### 2. Home Dashboard

- Native large title header "Home"
- Personalized greeting: "Hola, {name}"
- **Today's tasks card**: progress bar, top 3 tasks preview, "Ver todas" link to Tasks tab
- **Stats row**: 3 cards — Completadas (green), Pendientes (amber), Carry-over (red) — using `fontVariant: 'tabular-nums'`
- **Domain cards**: Coming-soon placeholders for Wallet, Health (dimmed, not tappable)
- `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` and pull-to-refresh
- Data sources: `GET /auth/me`, `GET /tasks?scheduledDate=today`, `GET /tasks/stats/today`

### 3. Tasks List

- Native large title header "Tareas"
- `+` button in header → opens new task modal
- **Date filter tabs**: Hoy / Manana / Historial (horizontal segmented control area)
- **Task rows**: Checkbox, title, priority badge (color-coded), domain label, chevron
- Carry-over badge on rescheduled tasks
- **Interactions**:
  - Tap checkbox → complete task (with haptic on iOS)
  - Tap row → push task detail screen
  - Swipe right → complete
  - Swipe left → carry-over or discard
  - Long press → context menu (complete, carry-over, discard)
- `FlatList` with pull-to-refresh
- `headerSearchBarOptions` for search
- Optimistic UI on all mutations
- Data source: `GET /tasks?scheduledDate={date}&status={filter}`

### 4. New Task (Modal Sheet)

- Presented as `formSheet` with `sheetGrabberVisible: true` and `sheetAllowedDetents: [0.5, 1.0]`
- Header: Cancel / "Nueva Tarea" / Guardar
- **Fields**:
  - Title (required) — TextInput
  - Description (optional) — multiline TextInput
  - Priority — native Picker (baja, media, alta)
  - Domain — native Picker (trabajo, salud, personal, etc.)
  - Date — `@react-native-community/datetimepicker`
- Validation via `@vdp/shared` Zod schemas
- Keyboard handling
- Data: `POST /tasks`

### 5. Task Detail

- Stack push from task list
- Native header: back button ("Tareas") + "Editar" button
- Title (large, bold)
- Badges: priority (color-coded), domain, status
- Description (selectable text via `<Text selectable />`)
- Date metadata (scheduled date, creation date)
- **Action buttons**:
  - Completar (green, primary)
  - Carry-over (amber, outlined)
  - Descartar (red, outlined — with confirmation alert)
- Haptic feedback on actions (iOS)
- Navigates back to list after action
- Data: `GET /tasks/:id`, `POST /tasks/:id/complete`, `POST /tasks/:id/carry-over`, `POST /tasks/:id/discard`

### 6. More Menu

- Native list screen with menu items
- Rows: Wallet (disabled, "Proximamente"), Health (disabled), Review (disabled), Settings
- Settings screen: user profile info, logout button
- Data: `GET /auth/me`, `POST /auth/logout`

## Backend Changes Required

### 1. Auth Middleware — Already Supports Header Auth (No Change Needed)

The Fastify `SessionTokenAuthenticationMiddleware` already accepts both:
- `x-session-token` header (checked first)
- `vdp_session` cookie (fallback)

The mobile app will use the `x-session-token` header. No backend change required.

### 2. Login Response — Already Returns Token (No Change Needed)

`POST /api/v1/auth/login` already returns `{ sessionToken, user }` in the response body. The mobile app can read `sessionToken` directly.

### 3. CORS (Development Only)

Add Expo dev client origin to CORS allowed origins for local development. In production, native apps make direct HTTP requests — CORS is a browser-only concern.

## Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~52 | Core Expo SDK |
| `expo-router` | File-based routing |
| `expo-secure-store` | Encrypted token storage |
| `expo-haptics` | Haptic feedback (iOS) |
| `expo-image` | Images + SF Symbols for icons |
| `@tanstack/react-query` | Data fetching + cache |
| `@react-native-community/datetimepicker` | Date picker |
| `react-native-gesture-handler` | Swipe actions |
| `react-native-reanimated` | Animations |
| `react-native-safe-area-context` | Safe area insets |
| `@vdp/shared` | Workspace — Zod schemas + types |
| `zod` | Validation (via shared) |
| `date-fns` | Date formatting (same as web) |

All packages work with Expo Go — no custom native builds needed for this milestone.

## Turborepo Integration

Add `mobile` to `turbo.json` pipeline:
- `dev`: `npx expo start`
- `build`: `npx expo export` (or EAS Build when ready)
- `lint`: Standard linting
- `typecheck`: `tsc --noEmit`

Add `apps/mobile` to `pnpm-workspace.yaml` (already covered by `apps/*` glob if present).

## Future Phases (Out of Scope)

- **Phase 2**: AI agent chat (SSE streaming per domain)
- **Phase 3**: Wallet domain screens
- **Phase 4**: Health domain screens
- **Phase 5**: Review (end-of-day) screen
- **Phase 6**: Offline support, push notifications
