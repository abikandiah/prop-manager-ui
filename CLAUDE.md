# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

This project uses **pnpm** exclusively. Always use `pnpm` commands, never `npm` or `yarn`.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server (runs on port 3000)
pnpm dev

# Build for production
pnpm build

# Run all tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Format and fix (runs prettier --write and eslint --fix)
pnpm check
```

## Tech Stack

- **Build**: Vite 7 with React 19 and TypeScript (strict mode)
- **Routing**: TanStack Router (file-based routing in `src/routes/`)
- **Data Fetching**: TanStack Query with offline-first persistence (Dexie/IndexedDB)
- **Styling**: Tailwind CSS v4, @abumble/design-system
- **UI Components**: @abumble/design-system + Shadcn UI (new-york style, zinc, CSS variables)
- **Testing**: Vitest with jsdom

## Project Architecture

### Feature-Based Organization

The codebase follows a feature-based architecture. Each domain feature lives in `src/features/{feature-name}/` with a consistent structure:

```
src/features/{feature-name}/
  ├── api.ts           # BaseService-based API client
  ├── hooks.ts         # React Query hooks (queries + mutations)
  ├── keys.ts          # Query key factory
  ├── components/      # Feature-specific components
  │   ├── forms/       # Form components (create/edit dialogs)
  │   └── views/       # View components (tables, lists, details)
  └── index.ts         # Public exports
```

**Examples**: `src/features/props/`, `src/features/units/`, `src/features/leases/`

### Core Directories

- **`src/domain/`**: TypeScript types for domain entities (Prop, Unit, Lease, Address, etc.). These define the shape of data throughout the app.
- **`src/api/`**: Shared API infrastructure (`client.ts` = axios instance with interceptors; `base-service.ts` = generic CRUD service class)
- **`src/config/`**: Runtime configuration from env vars (`config.apiBaseUrl`, `config.queryCacheStaleTimeMs`, etc.). See Constants vs Config rule below.
- **`src/lib/`**: Pure utility functions (formatting, offline helpers, constants)
- **`src/contexts/`**: React context providers (theme, network, auth)
- **`src/components/`**: Shared/global components (ErrorBoundary, NotFound, etc.)
- **`src/routes/`**: TanStack Router file-based routes (each `.tsx` file = route)
- **`src/integrations/tanstack-query/`**: React Query setup with persistence

### API Client Pattern

All feature API clients extend `BaseService`:

```typescript
// src/features/props/api.ts
import { BaseService } from '@/api/base-service'
import type { Prop, CreatePropPayload, UpdatePropPayload } from '@/domain/property'

class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
  constructor() {
    super('props') // endpoint = /api/props
  }
}
export const propsApi = new PropsApi()
```

`BaseService` provides: `list()`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)`.

### React Query Integration

Feature hooks follow this pattern:

1. **Query keys** (in `keys.ts`):
```typescript
export const propKeys = {
  all: ['props'] as const,
  lists: () => [...propKeys.all, 'list'] as const,
  list: () => propKeys.lists(),
  details: () => [...propKeys.all, 'detail'] as const,
  detail: (id: string) => [...propKeys.details(), id] as const,
}
```

2. **Queries** (in `hooks.ts`):
```typescript
export function usePropsList() {
  return useQuery({
    queryKey: propKeys.list(),
    queryFn: () => propsApi.list(),
  })
}
```

3. **Mutations with optimistic updates** (in `hooks.ts`):
```typescript
export function useCreateProp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['createProp'],
    networkMode: 'online',
    mutationFn: (payload: CreatePropPayload) => {
      const requestId = stableRequestId(['createProp'], payload)
      return propsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
    },
    onMutate: async (payload) => {
      // Apply optimistic update to cache
      await queryClient.cancelQueries({ queryKey: propKeys.list() })
      const previousProps = queryClient.getQueryData<Array<Prop>>(propKeys.list())
      const optimistic = applyCreate(queryClient, payload) // helper function
      return { previousProps, optimisticId: optimistic.id }
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousProps) {
        queryClient.setQueryData(propKeys.list(), context.previousProps)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propKeys.all })
    },
  })
}
```

**Key patterns**:
- All mutations use `stableRequestId()` + `IDEMPOTENCY_HEADER` for idempotent requests
- Optimistic updates applied in `onMutate`, rolled back in `onError`
- Query cache invalidated in `onSuccess` or `onSettled`

### Offline-First Architecture

The app uses TanStack Query's persistence with Dexie (IndexedDB):

- **Cache persistence**: Query results saved to IndexedDB (`src/features/offline/cachePersistor.ts`)
- **Mutation outbox**: Pending mutations saved to IndexedDB for offline support (`src/features/offline/db.ts`)
- **Network mode**: `offlineFirst` for queries and mutations
- **Dev mode**: Persistence disabled by default in dev (enable with `VITE_PERSIST_OFFLINE=true`)

See `src/integrations/tanstack-query/root-provider.tsx` for the React Query setup.

### Routing

TanStack Router with file-based routing:

- Routes live in `src/routes/` (e.g., `src/routes/props/index.tsx` → `/props`)
- Route tree auto-generated in `src/routeTree.gen.ts` (never edit manually)
- Root layout in `src/routes/__root.tsx`
- Route loaders can prefetch data before render (but most data fetching uses TanStack Query in components)

## Design System & Styling

This project uses **@abumble/design-system** for shared components, styles, and theme.

### Using @abumble/design-system

- **Components**: Import from `@abumble/design-system/components/{Component}` (e.g., `Card`, `Button`, `Sidebar*`, `Banner`, `NotFound`)
- **Utils**: Use `cn()` from `@abumble/design-system/utils` for className merging
- **Styles**: Base theme in `@abumble/design-system/styles.css` (imported first in `src/styles.css`)
- **Tailwind integration**: Use `@source "../node_modules/@abumble/design-system"` in CSS so Tailwind scans the package

### Styling Guidelines

- **DO NOT** add shadow modifications (e.g., `shadow-*`) to design-system components
- **Theme**: oklch color space, CSS variables in `:root` and `.dark`
- **Dark mode**: Class-based (toggle `.dark` on `document.documentElement`)
- **Semantic text colors**: Use `text-foreground` for headings, `text-muted-foreground` for secondary text (avoid hardcoded grays)
- **Form dialogs**: Standard width `max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto` for all create/edit forms

### Copy & Tone

- **User-facing text**: Use conversational, layperson language (see `.cursor/rules/copy-and-descriptions.mdc`)
- **Examples**: "This is where you keep a list of every property you own or manage—your house, a rental building, a commercial space, or a piece of land."
- **Avoid**: Jargon like "parcel," "legal name," "tracking and monitoring" unless audience is technical

## Configuration vs Constants

Follow the rule in `.cursor/rules/constants-vs-config.mdc`:

- **Use `src/config/index.ts`** for values that may change per environment or deployment (API URLs, timeouts, feature flags, cache TTLs)
- **Use code constants** for fixed domain/protocol values (sentinel IDs like `OPTIMISTIC_PROP_ID`, storage keys, magic numbers)

Ask: "Would we ever want to change this without changing code?"
- **Yes** → config (consider env override)
- **No** → constant in code

## Path Aliases

Import from `@/` to reference `src/`:

```typescript
import { config } from '@/config'
import { propsApi } from '@/features/props/api'
import type { Prop } from '@/domain/property'
```

## Development Notes

### API Proxy

The dev server proxies `/api` to `http://localhost:4080` (see `vite.config.ts`). The backend is expected to run on port 4080 during development.

### Dev Auth Token

In development, a bearer token can be stored in localStorage (`DEV_AUTH_TOKEN`) and automatically added to all requests. See `src/api/client.ts` (`getDevToken()`, `setDevToken()`).

### Devtools

TanStack Router and Query devtools are available in dev mode (bottom-right of screen).

## Adding a New Feature

To add a new domain feature (e.g., "tenants"):

1. **Define domain types** in `src/domain/tenant.ts` (entity, create/update payloads)
2. **Create feature directory** `src/features/tenants/` with:
   - `api.ts`: Extend `BaseService<Tenant, CreateTenantPayload, UpdateTenantPayload>`
   - `keys.ts`: Query key factory following existing pattern
   - `hooks.ts`: Query and mutation hooks with optimistic updates
   - `components/forms/`: Create/edit forms
   - `components/views/`: List/detail views
   - `index.ts`: Re-export public API
3. **Add route** in `src/routes/tenants/index.tsx`
4. **Update navigation** in `src/routes/__root.tsx` or sidebar

Follow the pattern established in `src/features/props/` as a reference.

## Testing

- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Run with: `pnpm test`
- Framework: Vitest with jsdom environment

## Navigation Structure

- **Sidebar**: Main app navigation only (Home, Props, Units, Leases, Messages)
- **User dropdown** (header): Profile and Settings
- **DO NOT** put Settings in the sidebar
- **Theme toggle**: Header (left of notifications), sun/moon icon
