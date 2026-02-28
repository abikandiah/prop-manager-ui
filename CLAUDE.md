🤖 AI Collaboration Protocol

You (Claude) are the Primary Implementer. You are paired with the Gemini CLI, which acts as your High-Context Research Assistant.
When to use Gemini via CLI:

    Massive Context: If you need to analyze patterns across the entire codebase (which exceeds your current context window).

    Needle-in-a-Haystack: When searching for specific logic or variable flows across many directories.

    Architectural Review: When a plan .md needs a "second opinion" based on global project knowledge.

    Usage: Run gemini -p "@src/ [your query]" to get a summary of global patterns.

# prop-manager-ui — React Frontend

Property management frontend. React 19, TypeScript (strict), Vite 7, TanStack Router + Query, Tailwind v4, offline-first architecture.

> Cross-cutting architecture decisions (IDs, optimistic locking, error contract, auth) are in the root [`../CLAUDE.md`](../CLAUDE.md).

---

## Commands

```bash
pnpm dev      # Dev server (port 3000, proxies /api → localhost:4080)
pnpm test     # Run tests (Vitest + jsdom)
pnpm lint     # ESLint check
pnpm check    # Prettier --write + ESLint --fix (run before committing)
pnpm build    # Production build
```

**Package manager: `pnpm` only. Never `npm` or `yarn`.**

## Dev Auth

In dev, store a JWT in localStorage:

```typescript
// Browser console — after running the backend dev server
setDevToken('paste-jwt-here') // from POST /api/dev/login
```

The axios client (`src/api/client.ts`) reads `DEV_AUTH_TOKEN` from localStorage automatically.

---

## Tech Stack

| Concern               | Library                                                       |
| --------------------- | ------------------------------------------------------------- |
| Build                 | Vite 7                                                        |
| UI                    | React 19                                                      |
| Language              | TypeScript (strict)                                           |
| Routing               | TanStack Router (file-based)                                  |
| Data fetching / cache | TanStack Query + IndexedDB persistence                        |
| Styling               | Tailwind CSS v4, @abumble/design-system                       |
| UI components         | @abumble/design-system + Shadcn UI (new-york, zinc, CSS vars) |
| HTTP client           | Axios (with interceptors)                                     |
| Offline DB            | Dexie (IndexedDB)                                             |
| Testing               | Vitest + jsdom + Testing Library                              |

---

## Architecture

### Directory Structure

```
src/
  api/            # Shared API infrastructure
    client.ts       # Axios instance with auth + idempotency interceptors
    base-service.ts # Generic CRUD service (list, getById, create, update, delete)
  config/         # Runtime config from env vars (apiBaseUrl, cache TTLs, feature flags)
  contexts/       # React contexts: theme, network, auth
  components/     # Shared/global components (ErrorBoundary, NotFound, etc.)
  domain/         # TypeScript interfaces for domain entities
  features/       # Feature modules (see Feature Structure below)
  integrations/
    tanstack-query/ # React Query setup, persistence, user-scoped client
  lib/            # Pure utilities (formatting, offline helpers, generateId())
  routes/         # TanStack Router file-based routes
    __root.tsx      # Root layout with sidebar, header, providers
    routeTree.gen.ts # Auto-generated — never edit manually
```

### Feature Structure

Every feature follows this structure:

```
src/features/{name}/
  api.ts          # BaseService subclass for the feature endpoint
  keys.ts         # Query key factory
  hooks.ts        # TanStack Query hooks (queries + mutations)
  components/
    forms/        # Create/edit form dialogs
    views/        # List tables, detail panels
  index.ts        # Re-exports public API
```

Reference implementation: `src/features/props/`

---

## Patterns

### Domain Types (`src/domain/`)

```typescript
// src/domain/property.ts
export interface Prop {
	id: string
	legalName: string
	address: Address
	propertyType: PropertyType
	version: number // Required — sent back on updates
	createdAt: string
	updatedAt: string
}

export interface CreatePropPayload {
	id: string // Client-generated UUID — ALWAYS include
	legalName: string
	address: AddressInput
	propertyType: PropertyType
}

export interface UpdatePropPayload {
	legalName?: string
	address?: AddressInput
	propertyType?: PropertyType
	version: number // Required — from last-read entity
}
```

### API Client (`api.ts`)

```typescript
import { BaseService } from '@/api/base-service'
import type {
	Prop,
	CreatePropPayload,
	UpdatePropPayload,
} from '@/domain/property'

class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
	constructor() {
		super('props') // maps to /api/props
	}
}

export const propsApi = new PropsApi()
```

`BaseService` provides: `list()`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)`.

### Query Keys (`keys.ts`)

```typescript
export const propKeys = {
	all: ['props'] as const,
	lists: () => [...propKeys.all, 'list'] as const,
	list: () => propKeys.lists(),
	details: () => [...propKeys.all, 'detail'] as const,
	detail: (id: string) => [...propKeys.details(), id] as const,
}
```

### Query Hooks (`hooks.ts`)

```typescript
export function usePropsList() {
	return useQuery({
		queryKey: propKeys.list(),
		queryFn: () => propsApi.list(),
	})
}

export function usePropById(id: string) {
	return useQuery({
		queryKey: propKeys.detail(id),
		queryFn: () => propsApi.getById(id),
		enabled: !!id,
	})
}
```

### Mutation Hooks with Optimistic Updates (`hooks.ts`)

```typescript
/** Payload for create without id — hook adds it before calling the API. */
export type CreatePropPayloadWithoutId = Omit<CreatePropPayload, 'id'>

export function useCreateProp() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	const mutation = useMutation({
		mutationKey: ['createProp'],
		networkMode: 'online',
		mutationFn: (payload: CreatePropPayload) => {
			const requestId = stableRequestId(['createProp'], payload)
			return propsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload: CreatePropPayload) => {
			await queryClient.cancelQueries({ queryKey: propKeys.list(activeOrgId!) })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(activeOrgId!),
			)
			const optimistic = applyCreate(queryClient, payload, activeOrgId!)
			return { previousProps, optimisticId: optimistic.id }
		},
		// ... onError, onSuccess
	})

	return {
		...mutation,
		mutate: (
			payload: CreatePropPayloadWithoutId,
			options?: Parameters<typeof mutation.mutate>[1],
		) => mutation.mutate({ ...payload, id: generateId() }, options),
		mutateAsync: (
			payload: CreatePropPayloadWithoutId,
			options?: Parameters<typeof mutation.mutateAsync>[1],
		) => mutation.mutateAsync({ ...payload, id: generateId() }, options),
	}
}
```

**Key rules:**

- `networkMode: 'online'` on **all** mutations.
- `stableRequestId()` + `IDEMPOTENCY_HEADER` on every mutation call.
- **Hook-level ID generation**: Wrap the mutation to call `generateId()` automatically. The form should pass the payload _without_ an ID.
- Use `payload.id` in `onMutate` (the hook already injected it).
- Rollback in `onError`, invalidate in `onSettled`.

### ID Generation

```typescript
// In form submit handler — no need to call generateId() manually
function handleSubmit(values: FormValues) {
	const payload: CreatePropPayloadWithoutId = {
		legalName: values.legalName,
		// ...
	}
	createProp(payload) // Hook adds the ID
}
```

---

## Error Handling in UI

API errors come as RFC 7807 `ProblemDetail`. The axios client throws on non-2xx responses.

```typescript
// In a mutation's onError or component error boundary
function handleApiError(error: unknown) {
	if (axios.isAxiosError(error)) {
		const problem = error.response?.data
		// problem.status, problem.title, problem.detail
		// problem.errors: [{ field, message }] for validation failures
	}
}

// Show validation errors from a 400 response
const errors: Array<{ field: string; message: string }> = problem?.errors ?? []
```

For form mutations, pass `onError` to the mutation to surface validation errors back to form fields.

---

## Design System & Styling

### Component Priority

1. **@abumble/design-system** components first (`Card`, `Button`, `Sidebar*`, `Banner`, `NotFound`, etc.)
2. **Shadcn UI** for primitives not in the design-system — add with `pnpx shadcn@latest add <component>` (new-york style, zinc, CSS variables)
3. Custom components as a last resort

```typescript
import { Card } from '@abumble/design-system/components/Card'
import { cn } from '@abumble/design-system/utils'
```

### Styling Rules

- **Text colors**: `text-foreground` for headings, `text-muted-foreground` for secondary text — no hardcoded grays
- **Dark mode**: Class-based (`.dark` on `document.documentElement`)
- **Form dialogs**: Always `className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto"` on `DialogContent`
- **No shadow overrides** on design-system components
- **`cn()`** for all conditional className merges

### Copy & Tone

User-facing text must be **conversational and layperson**:

- Say "Add a property" not "Create a property entity"
- Say "your house, a rental building, a commercial space" not "a real estate parcel"
- Use "you" and "your"
- 1–3 sentences for page descriptions — don't over-explain
- See `.cursor/rules/copy-and-descriptions.mdc` for full guidance

---

## Configuration vs Constants

```typescript
// src/config/index.ts — for values that vary by environment/deployment
export const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
	queryCacheStaleTimeMs: 5 * 60 * 1000,
}

// In-module constants — for fixed domain/protocol values
const IDEMPOTENCY_HEADER = 'X-Request-Id'
const OFFLINE_DB_VERSION = 1
```

**Rule of thumb**: "Would we ever change this without changing code?" → Yes = config, No = constant.

---

## Routing

- File-based routes in `src/routes/` (e.g., `src/routes/props/index.tsx` → `/props`)
- `src/routeTree.gen.ts` is **auto-generated** — never edit it manually
- Root layout: `src/routes/__root.tsx`
- Pass user-scoped `queryClient` via router context:
  ```typescript
  <RouterProvider router={router} context={{ queryClient }} />
  ```

---

## Navigation Structure

- **Sidebar**: Main app nav only — Home, Props, Units, Leases, Messages
- **DO NOT** add Settings to the sidebar
- **User dropdown** (header): Profile (`/profile`), Settings (`/settings`)
- **Theme toggle**: Header, left of notifications (sun/moon icon)

---

## Offline-First Architecture

- Query cache persisted to **IndexedDB** (Dexie) per user (`prop-manager-{userId}`)
- Pending mutations persisted to IndexedDB via `shouldDehydrateMutation`
- User-scoped query client created on login, cleared on logout
- Disable persistence in dev by default; enable with `VITE_PERSIST_OFFLINE=true`
- See `src/integrations/tanstack-query/root-provider.tsx` for setup

---

## Path Aliases

```typescript
import { config } from '@/config'
import { propsApi } from '@/features/props/api'
import type { Prop } from '@/domain/property'
import { generateId } from '@/lib'
import { cn } from '@abumble/design-system/utils'
```

---

## Code Style

- No emojis in code (comments, console logs, variable names) — only in user-facing UI and markdown docs
- Console log prefix format: `console.log('[FeatureName] Message', data)`
- JSDoc for exported functions and hooks
- No semicolons, single quotes, trailing commas, tabs — enforced by Prettier (`pnpm check`)
- See `.cursor/rules/code-comments-and-style.mdc` for full guidance

---

## Testing

Test files: `src/**/*.{test,spec}.{ts,tsx}` — Vitest + jsdom + Testing Library.

### Unit Test (utility function)

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/format'

describe('formatCurrency', () => {
	it('formats positive amounts', () => {
		expect(formatCurrency(1234.56)).toBe('$1,234.56')
	})

	it('handles zero', () => {
		expect(formatCurrency(0)).toBe('$0.00')
	})
})
```

### Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropCard } from '../PropCard'

describe('PropCard', () => {
    it('renders property name', () => {
        render(<PropCard prop={mockProp} />)
        expect(screen.getByText('Acme House')).toBeInTheDocument()
    })

    it('calls onDelete when delete is confirmed', async () => {
        const onDelete = vi.fn()
        render(<PropCard prop={mockProp} onDelete={onDelete} />)
        await userEvent.click(screen.getByRole('button', { name: /delete/i }))
        expect(onDelete).toHaveBeenCalledWith(mockProp.id)
    })
})
```

### Hook Test (with QueryClient)

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePropsList } from '../hooks'

function wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('usePropsList', () => {
    it('returns props from API', async () => {
        vi.spyOn(propsApi, 'list').mockResolvedValue([mockProp])
        const { result } = renderHook(() => usePropsList(), { wrapper })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toContainEqual(mockProp)
    })
})
```

---

## Adding a New Feature — Checklist

1. **Domain types** in `src/domain/{name}.ts`:
   - Entity interface (include `version: number`)
   - `Create{Name}Payload` — **must include `id: string`**
   - `Update{Name}Payload` — all optional except `version: number`

2. **Feature directory** `src/features/{name}/`:
   - `api.ts` — extend `BaseService<Entity, CreatePayload, UpdatePayload>`
   - `keys.ts` — query key factory following existing pattern
   - `hooks.ts` — queries + mutations (optimistic updates, `networkMode: 'online'`)
   - `components/forms/` — create/edit dialog forms (call `generateId()` on submit)
   - `components/views/` — list table, detail view
   - `index.ts` — re-export public surface

3. **Route** in `src/routes/{name}/index.tsx`

4. **Navigation** — add to sidebar in `src/routes/__root.tsx` (only if it's a main nav item)

Follow `src/features/props/` as the reference implementation.
