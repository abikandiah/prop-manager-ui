# Agent Rules for prop-manager-ui

> Comprehensive guide for AI agents and developers working on this React + TypeScript property management application.

## 🎯 Quick Reference (TL;DR)

**Core Principles:**

- ✅ **DRY**: Abstract repetitive code into reusable components
- ✅ **Feature-driven**: Keep features self-contained in `/src/features/`
- ✅ **Type-safe**: Leverage TypeScript strictly, no `any` types
- ✅ **Design system first**: Use `@abumble/design-system` components, don't reinvent
- ✅ **Utility-first CSS**: Tailwind classes, no custom CSS files
- ✅ **Optimistic updates**: All mutations implement optimistic UI patterns
- ✅ **Offline-first**: Queue mutations when offline, use idempotent requests

**Before writing code:**

1. Check if a similar component/hook/utility already exists
2. Use design system components instead of building custom ones
3. Follow existing patterns (check similar features like `props`, `units`, `leases`)
4. Abstract shared logic into reusable hooks/components
5. Keep components small (<200 lines), split if larger

---

## 📁 Directory Structure

```
src/
├── api/                    # HTTP client & base service
│   ├── client.ts          # Axios instance
│   └── base-service.ts    # Generic CRUD service class
├── components/            # Reusable UI components
│   ├── ui/               # Base design system wrappers
│   └── [Component].tsx   # Shared components (Header, Sidebar, etc.)
├── config/               # Environment configuration
├── contexts/             # React contexts (auth, theme, network)
├── domain/               # TypeScript domain models (entities)
│   ├── property.ts
│   ├── unit.ts
│   └── lease.ts
├── features/             # ✨ Feature modules (self-contained)
│   ├── props/
│   │   ├── api.ts           # API service extending BaseService
│   │   ├── keys.ts          # React Query cache keys
│   │   ├── hooks.ts         # Custom React hooks
│   │   ├── index.ts         # Barrel export
│   │   └── components/
│   │       ├── forms/       # Form components
│   │       └── views/       # Display components
│   ├── units/
│   └── leases/
├── hooks/                # Global custom hooks
├── lib/                  # Utilities & helpers
│   ├── format.ts         # Formatting functions
│   ├── util.ts           # General utilities
│   └── constants.ts      # App constants
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout
│   └── [feature]/       # Feature routes
└── main.tsx             # App entry point
```

### Key Rules:

- **Never** put feature-specific code outside `/src/features/[feature]/`
- **Never** create CSS files - use Tailwind utilities
- **Always** use barrel exports (`index.ts`) for public APIs

---

## 🏷️ Naming Conventions

### Files

| Type         | Convention     | Example                             |
| ------------ | -------------- | ----------------------------------- |
| Components   | PascalCase.tsx | `PropsForm.tsx`, `AppSidebar.tsx`   |
| Utilities    | camelCase.ts   | `format.ts`, `util.ts`              |
| Hooks        | use\*.ts       | `hooks.ts` (exports `usePropsList`) |
| Types/Domain | PascalCase.ts  | `property.ts` (exports `Prop`)      |
| Routes       | kebab-case.tsx | `$id.tsx`, `templates.tsx`          |

### Code

| Type             | Convention       | Example                |
| ---------------- | ---------------- | ---------------------- |
| Components       | PascalCase       | `function PropsForm()` |
| Hooks            | usePascalCase    | `usePropsList()`       |
| Functions        | camelCase        | `formatAddress()`      |
| Constants        | UPPER_SNAKE_CASE | `IDEMPOTENCY_HEADER`   |
| Types/Interfaces | PascalCase       | `interface Prop`       |
| Enum values      | UPPER_SNAKE_CASE | `SINGLE_FAMILY_HOME`   |

---

## 🧩 Component Patterns

### 1. Feature Component Structure

**Every feature follows this structure:**

```typescript
features/[feature]/
├── api.ts                 # Extends BaseService<Entity, CreatePayload, UpdatePayload>
├── keys.ts                # React Query cache key factory
├── hooks.ts               # useQuery & useMutation hooks
├── index.ts               # Barrel export: export * from './components'
└── components/
    ├── index.ts           # Export all components
    ├── forms/             # Form components (create/edit)
    │   └── [Feature]Form.tsx
    └── views/             # Display components (list/detail)
        └── [Feature]TableView.tsx
```

### 2. Form Component Pattern

```typescript
// ✅ Good: Reusable form with create/edit modes
interface PropsFormProps {
  initialProp?: Prop | null          // If provided, edit mode
  onSuccess?: (data?: Prop) => void  // Callback after mutation
  onCancel?: () => void              // Dialog close handler
  submitLabel?: string               // "Create" vs "Save"
}

export function PropsForm({
  initialProp = null,
  onSuccess,
  onCancel,
  submitLabel = 'Create Property',
}: PropsFormProps) {
  // Local state for form
  const [form, setForm] = useState<FormState>(() =>
    initialProp ? entityToFormState(initialProp) : initialFormState
  )

  // Mutations
  const createProp = useCreateProp()
  const updateProp = useUpdateProp()

  // Validation (pure function)
  const error = validateForm(form)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (error) return

    const payload = formStateToPayload(form)

    if (initialProp) {
      updateProp.mutate(
        { id: initialProp.id, payload: { ...payload, version: initialProp.version } },
        { onSuccess }
      )
    } else {
      createProp.mutate(payload, { onSuccess })
    }
  }

  const isPending = createProp.isPending || updateProp.isPending

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isPending || !!error}>
        {isPending ? 'Saving...' : submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  )
}
```

**Key Patterns:**

- ✅ Single component handles both create & edit
- ✅ Local state for form values
- ✅ Pure validation functions
- ✅ Callbacks for success/cancel
- ✅ Loading state from mutations
- ✅ Include `version` for optimistic locking on updates

### 3. Table/List Component Pattern

```typescript
export function PropsTableView() {
  const { data: props, isLoading, isError, error } = usePropsList()
  const [editingProp, setEditingProp] = useState<Prop | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <DelayedLoadingFallback
      isLoading={isLoading}
      fallback={<SkeletonRows count={5} />}
    >
      {isError ? (
        <CenteredEmptyState
          title="Failed to load"
          description={error?.message}
        />
      ) : !props?.length ? (
        <CenteredEmptyState
          title="No properties yet"
          description="Get started by adding your first property"
        />
      ) : (
        <Table>
          {props.map((prop) => (
            <TableRow key={prop.id}>
              <TableCell>{prop.legalName}</TableCell>
              <TableCell>
                <ActionsPopover
                  onEdit={() => setEditingProp(prop)}
                  onDelete={() => setDeleteId(prop.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {editingProp && (
        <FormDialog open onOpenChange={() => setEditingProp(null)}>
          <PropsForm
            initialProp={editingProp}
            onSuccess={() => setEditingProp(null)}
            onCancel={() => setEditingProp(null)}
          />
        </FormDialog>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          open
          onOpenChange={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </DelayedLoadingFallback>
  )
}
```

**Key Patterns:**

- ✅ `DelayedLoadingFallback` prevents loading flash (250ms delay)
- ✅ Handle three states: loading, error, empty, data
- ✅ Skeleton loaders during initial load
- ✅ Dialogs for edit/delete actions
- ✅ Local state for dialog open/close

### 4. Reusable Component Abstraction

**Example: CollapsibleSidebarSection**

When you notice repetitive patterns (like multiple collapsible sections), abstract them:

```typescript
// ❌ Bad: Repetitive code for each section
<Collapsible>
  <CollapsibleTrigger>
    <span>Properties</span>
    <ChevronRight />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Items */}
  </CollapsibleContent>
</Collapsible>
<Collapsible>
  <CollapsibleTrigger>
    <span>Leases</span>
    <ChevronRight />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Items */}
  </CollapsibleContent>
</Collapsible>

// ✅ Good: Abstracted component
<CollapsibleSidebarSection
  title="Properties"
  icon={Package}
  items={[
    { to: '/props', label: 'Props', icon: Package },
    { to: '/units', label: 'Units', icon: LayoutGrid },
  ]}
/>
<CollapsibleSidebarSection
  title="Leases"
  icon={FileText}
  items={[
    { to: '/leases/templates', label: 'Templates', icon: FileSignature },
    { to: '/leases/agreements', label: 'Agreements', icon: FileCheck },
  ]}
/>
```

**When to abstract:**

- You copy-paste the same structure 3+ times
- The pattern has clear configuration points (props)
- The abstraction reduces code by >50%

---

## 🔌 API & Data Management

### 1. API Service Pattern

**Always extend `BaseService`:**

```typescript
// ✅ Good: Type-safe API service
class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
	constructor() {
		super('props') // Endpoint: /api/props
	}

	// Add custom methods if needed
	async listByOwner(ownerId: string): Promise<Prop[]> {
		const res = await api.get<Prop[]>(this.endpoint, {
			params: { ownerId },
		})
		return res.data
	}
}

export const propsApi = new PropsApi()
```

**BaseService provides:**

- `list(): Promise<T[]>`
- `getById(id): Promise<T>`
- `create(payload): Promise<T>`
- `update(id, payload): Promise<T>`
- `delete(id): Promise<void>`

### 2. React Query Keys Pattern

**Always use key factories:**

```typescript
// ✅ Good: Hierarchical key factory
export const propKeys = {
	all: ['props'] as const,
	lists: () => [...propKeys.all, 'list'] as const,
	list: (filters?: { ownerId?: string }) =>
		filters ? [...propKeys.lists(), filters] : propKeys.lists(),
	details: () => [...propKeys.all, 'detail'] as const,
	detail: (id: string) => [...propKeys.details(), id] as const,
}

// Usage:
queryClient.invalidateQueries({ queryKey: propKeys.all }) // Invalidate all props queries
queryClient.invalidateQueries({ queryKey: propKeys.lists() }) // Invalidate all list queries
queryClient.setQueryData(propKeys.detail(id), newData) // Update specific detail
```

### 3. Query Hooks Pattern

```typescript
// ✅ Good: Simple query hook
export function usePropsList(filters?: { ownerId?: string }) {
	return useQuery({
		queryKey: propKeys.list(filters),
		queryFn: () =>
			filters?.ownerId
				? propsApi.listByOwner(filters.ownerId)
				: propsApi.list(),
	})
}

// ✅ Good: Detail query with null safety
export function usePropDetail(id: string | null) {
	return useQuery({
		queryKey: propKeys.detail(id!),
		queryFn: () => propsApi.getById(id!),
		enabled: id != null, // Skip query if id is null
	})
}
```

### 4. Mutation Hooks with Optimistic Updates

**⚠️ CRITICAL: All mutations MUST implement optimistic updates**

```typescript
export function useCreateProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createProp'],
		networkMode: 'offlineFirst', // ✅ Queue when offline
		mutationFn: (payload: CreatePropPayload) => {
			// ✅ Generate idempotent request ID
			const requestId = stableRequestId(['createProp'], payload)
			return propsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			// 1. Cancel inflight queries to prevent race conditions
			await queryClient.cancelQueries({ queryKey: propKeys.lists() })

			// 2. Snapshot previous state for rollback
			const previous = queryClient.getQueryData<Prop[]>(propKeys.list())

			// 3. Apply optimistic update
			const optimistic: Prop = {
				id: generateOptimisticId(),
				...payload,
				createdAt: nowIso(),
				updatedAt: nowIso(),
				version: 0,
			}
			queryClient.setQueryData<Prop[]>(propKeys.list(), (old) =>
				old ? [...old, optimistic] : [optimistic],
			)

			return { previous, optimisticId: optimistic.id }
		},
		onError: (err, variables, context) => {
			// 4. Rollback on error
			if (context?.previous) {
				queryClient.setQueryData(propKeys.list(), context.previous)
			}
			toast.error(err?.message ?? 'Failed to create property')
		},
		onSettled: () => {
			// 5. Refetch to sync with server
			queryClient.invalidateQueries({ queryKey: propKeys.all })
		},
	})
}
```

**Update mutation:**

```typescript
export function useUpdateProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateProp'],
		networkMode: 'offlineFirst',
		mutationFn: ({
			id,
			payload,
		}: {
			id: string
			payload: UpdatePropPayload
		}) => {
			const requestId = stableRequestId(['updateProp', id], payload)
			return propsApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: propKeys.detail(id) })

			const previous = queryClient.getQueryData<Prop>(propKeys.detail(id))

			// Apply partial update
			queryClient.setQueryData<Prop>(propKeys.detail(id), (old) =>
				old ? { ...old, ...payload, updatedAt: nowIso() } : old,
			)

			return { previous }
		},
		onError: (err, { id }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(propKeys.detail(id), context.previous)
			}
			toast.error(err?.message ?? 'Failed to update property')
		},
		onSettled: (data, error, { id }) => {
			queryClient.invalidateQueries({ queryKey: propKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: propKeys.lists() })
		},
	})
}
```

**Delete mutation:**

```typescript
export function useDeleteProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deleteProp'],
		networkMode: 'offlineFirst',
		mutationFn: ({ id }: { id: string }) => {
			const requestId = stableRequestId(['deleteProp', id], {})
			return propsApi.delete(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id }) => {
			await queryClient.cancelQueries({ queryKey: propKeys.lists() })

			const previous = queryClient.getQueryData<Prop[]>(propKeys.list())

			// Remove from cache optimistically
			queryClient.setQueryData<Prop[]>(
				propKeys.list(),
				(old) => old?.filter((p) => p.id !== id) ?? [],
			)

			return { previous }
		},
		onError: (err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(propKeys.list(), context.previous)
			}
			toast.error(err?.message ?? 'Failed to delete property')
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: propKeys.all })
		},
	})
}
```

**Key Rules:**

- ✅ **ALWAYS** use `networkMode: 'offlineFirst'` for mutations
- ✅ **ALWAYS** generate idempotent request IDs with `stableRequestId()`
- ✅ **ALWAYS** implement `onMutate` (optimistic update)
- ✅ **ALWAYS** implement `onError` (rollback)
- ✅ **ALWAYS** implement `onSettled` (invalidate)
- ✅ **ALWAYS** cancel inflight queries in `onMutate`
- ✅ **ALWAYS** include `version` field in update payloads (optimistic locking)

---

## 🎨 Styling Guidelines

### 1. Tailwind Utility Classes (ONLY)

**❌ Never create CSS files or `<style>` tags**

```typescript
// ✅ Good: Tailwind utilities
<div className="flex items-center gap-2 p-4 rounded-lg bg-card border border-border">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
  <p className="text-sm text-muted-foreground">Description</p>
</div>

// ❌ Bad: Inline styles or CSS files
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '18px' }}>Title</h2>
</div>
```

### 2. Design System Color Tokens

**Always use semantic color classes:**

| Use Case        | Class                                 |
| --------------- | ------------------------------------- |
| Primary text    | `text-foreground`                     |
| Secondary text  | `text-muted-foreground`               |
| Background      | `bg-background`                       |
| Card background | `bg-card`                             |
| Borders         | `border-border`                       |
| Primary action  | `text-primary`, `bg-primary`          |
| Destructive     | `text-destructive`, `bg-destructive`  |
| Sidebar         | `bg-sidebar`, `border-sidebar-border` |

### 3. Responsive Design

```typescript
// ✅ Good: Mobile-first responsive design
<div className="flex flex-col gap-4 p-4 md:flex-row md:p-6 lg:gap-6 lg:p-8">
  {/* Mobile: column, small padding, small gap */}
  {/* Tablet (md): row, medium padding */}
  {/* Desktop (lg): larger gap and padding */}
</div>

// Grid layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

### 4. Component Styling Patterns

```typescript
// Form fields
<div className="space-y-2">
  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    Legal Name
  </label>
  <Input
    className="w-full"
    value={form.legalName}
    onChange={onChange}
  />
</div>

// Cards
<Card className="p-6 space-y-4">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Tables
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="w-[100px]">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>{/* Actions */}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🔐 TypeScript Best Practices

### 1. Strict Type Safety

**❌ Never use `any`, always provide types**

```typescript
// ❌ Bad
const [data, setData] = useState<any>(null)
function process(input: any): any {}

// ✅ Good
const [data, setData] = useState<Prop | null>(null)
function process(input: Prop): ProcessedProp {}
```

### 2. Domain Model Pattern

**Structure: `/src/domain/[entity].ts`**

```typescript
// Enum-like constants with literal types
export const PROPERTY_TYPES = [
	'SINGLE_FAMILY_HOME',
	'APARTMENT_BUILDING',
	'CONDO',
	'TOWNHOUSE',
] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

// Entity interface
export interface Prop {
	id: string
	legalName: string
	propertyType: PropertyType
	address: Address | null
	description: string | null
	createdAt: string
	updatedAt: string
	version: number // ✅ Required for optimistic locking
}

// Create payload (no id, timestamps, version)
export interface CreatePropPayload {
	legalName: string
	propertyType: PropertyType
	address: CreateAddressPayload
	description?: string | null
}

// Update payload (all fields optional except version)
export interface UpdatePropPayload {
	legalName?: string
	propertyType?: PropertyType
	address?: CreateAddressPayload
	description?: string | null
	version: number // ✅ Required for optimistic locking
}
```

### 3. Generic Type Constraints

```typescript
// ✅ Good: Generic with constraints
class BaseService<
	T extends { id: string },
	TCreatePayload = Partial<T>,
	TUpdatePayload = Partial<T> & { version: number },
> {
	async list(): Promise<T[]> {}
	async getById(id: string): Promise<T> {}
	async create(payload: TCreatePayload): Promise<T> {}
	async update(id: string, payload: TUpdatePayload): Promise<T> {}
	async delete(id: string): Promise<void> {}
}
```

### 4. Component Props Typing

```typescript
// ✅ Good: Explicit props interface
interface PropsFormProps {
	initialProp?: Prop | null
	onSuccess?: (data?: Prop) => void
	onCancel?: () => void
	submitLabel?: string
}

export function PropsForm({
	initialProp = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Property',
}: PropsFormProps) {
	// ...
}

// ❌ Bad: Inline types
export function PropsForm({
	initialProp,
	onSuccess,
}: {
	initialProp?: Prop | null
	onSuccess?: (data?: Prop) => void
}) {
	// ...
}
```

---

## 📦 Import/Export Patterns

### 1. Absolute Imports (Required)

```typescript
// ✅ Good: Absolute imports with @ alias
import { PropsForm, usePropsList } from '@/features/props'
import { formatAddress } from '@/lib/format'
import { Button } from '@abumble/design-system/components/Button'

// ❌ Bad: Relative imports
import { PropsForm } from '../../../features/props'
import { formatAddress } from '../../lib/format'
```

### 2. Barrel Exports (index.ts)

**Feature-level:**

```typescript
// features/props/index.ts
export * from './components'
export * from './hooks'
export { propsApi } from './api'
export { propKeys } from './keys'
```

**Component-level:**

```typescript
// features/props/components/index.ts
export * from './forms/PropsForm'
export * from './views/PropsTableView'
```

### 3. Design System Imports

```typescript
// ✅ Good: Specific component imports
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@abumble/design-system/components/Collapsible'

// ❌ Bad: Default imports or wildcard
import Button from '@abumble/design-system/components/Button' // Wrong
import * as DS from '@abumble/design-system' // Wrong
```

### 4. Router Imports

```typescript
import {
	createFileRoute,
	useNavigate,
	Link,
	Outlet,
	useParams,
	useRouterState,
} from '@tanstack/react-router'
```

### 5. React Query Imports

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
```

---

## ✅ Code Quality & Abstraction Principles

### 1. DRY (Don't Repeat Yourself)

**Before writing code, check if it exists:**

```bash
# Search for similar components
grep -r "function.*Form" src/features/

# Search for similar hooks
grep -r "export function use" src/

# Search for utilities
ls src/lib/
```

### 2. When to Abstract

**Abstract when:**

- ✅ You copy-paste code 3+ times
- ✅ The pattern has clear configuration points
- ✅ The abstraction reduces code by >50%
- ✅ The pattern is stable (not changing frequently)

**Don't abstract when:**

- ❌ Only 2 uses (wait for 3rd)
- ❌ The components have different behaviors
- ❌ The abstraction adds complexity without clear benefit

### 3. Component Size Guidelines

- **Forms**: < 200 lines
- **Tables**: < 250 lines
- **Pages**: < 300 lines

**If larger, split into:**

- Sub-components (e.g., `AddressFormFields`)
- Custom hooks (e.g., `useFormValidation`)
- Utility functions (e.g., `formStateToPayload`)

### 4. Keep Components Pure

```typescript
// ✅ Good: Pure validation function
function validatePropForm(
	legalName: string,
	address: AddressFormValue,
): string | null {
	if (!legalName.trim()) return 'Legal name is required'
	if (!address.addressLine1.trim()) return 'Address line 1 is required'
	if (!address.city.trim()) return 'City is required'
	return null
}

// Component uses pure function
const error = validatePropForm(form.legalName, form.address)

// ❌ Bad: Validation inside component
const [error, setError] = useState<string | null>(null)
useEffect(() => {
	if (!form.legalName.trim()) {
		setError('Legal name is required')
	}
}, [form])
```

### 5. Prefer Composition Over Duplication

```typescript
// ✅ Good: Composed components
<FormDialog
  open={addOpen}
  onOpenChange={setAddOpen}
  title="Add property"
  description="Enter property details"
>
  <PropsForm
    onSuccess={() => setAddOpen(false)}
    onCancel={() => setAddOpen(false)}
  />
</FormDialog>

// Reuse same dialog for edit
<FormDialog
  open={!!editingProp}
  onOpenChange={() => setEditingProp(null)}
  title="Edit property"
>
  <PropsForm
    initialProp={editingProp}
    onSuccess={() => setEditingProp(null)}
    onCancel={() => setEditingProp(null)}
    submitLabel="Save"
  />
</FormDialog>

// ❌ Bad: Duplicate dialog logic
function AddDialog() {
  return (
    <Dialog open={addOpen}>
      <DialogContent>
        <DialogHeader>Add property</DialogHeader>
        <PropsForm onSuccess={...} />
      </DialogContent>
    </Dialog>
  )
}

function EditDialog() {
  return (
    <Dialog open={editOpen}>
      <DialogContent>
        <DialogHeader>Edit property</DialogHeader>
        <PropsForm initialProp={...} onSuccess={...} />
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🚀 TanStack Router Patterns

### 1. File-Based Routing Structure

```
routes/
├── __root.tsx           # Root layout (providers, auth checks)
├── index.tsx            # Home page (/)
├── [feature]/
│   ├── index.tsx        # List page (/props)
│   ├── $id.tsx          # Detail page (/props/123)
│   └── $id/
│       ├── route.tsx    # Layout wrapper (outlet)
│       └── index.tsx    # Nested route (/props/123/)
```

### 2. Route Definition

```typescript
// routes/props/index.tsx
export const Route = createFileRoute('/props/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <PageHeader title="Properties" />
      <PropsTableView />
    </>
  )
}
```

### 3. Dynamic Routes

```typescript
// routes/props/$id.tsx
export const Route = createFileRoute('/props/$id')({
  component: PropDetailPage,
})

function PropDetailPage() {
  const { id } = Route.useParams()  // ✅ Type-safe params
  const { data: prop, isLoading } = usePropDetail(id)

  return <PropDetail prop={prop} />
}
```

### 4. Navigation

```typescript
// Declarative
<Link to="/props">View Properties</Link>
<Link to="/props/$id" params={{ id: prop.id }}>View Details</Link>

// Programmatic
const navigate = useNavigate()

navigate({ to: '/props' })
navigate({ to: '/props/$id', params: { id: prop.id } })
```

---

## 🛠️ Utility Functions

### 1. Format Utilities (Always Use These)

```typescript
import { formatAddress, formatCurrency, formatDate } from '@/lib/format'

// ✅ Good: Use existing formatters
<p>{formatAddress(prop.address)}</p>  // Returns '—' if null
<p>{formatCurrency(unit.rentAmount)}</p>  // Returns '$1,200'
<p>{formatDate(lease.startDate)}</p>  // Returns 'Jan 15, 2025'

// ❌ Bad: Inline formatting
<p>{prop.address ? `${prop.address.addressLine1}, ${prop.address.city}` : 'N/A'}</p>
<p>${unit.rentAmount?.toLocaleString()}</p>
<p>{new Date(lease.startDate).toLocaleDateString()}</p>
```

### 2. ID Generation

```typescript
import { generateOptimisticId, nowIso } from '@/lib/util'

// ✅ Use for optimistic updates
const optimistic: Prop = {
	id: generateOptimisticId(), // UUIDv7 (time-sortable)
	...payload,
	createdAt: nowIso(),
	updatedAt: nowIso(),
	version: 0,
}
```

### 3. Idempotency

```typescript
import { stableRequestId } from '@/lib/offline-types'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// ✅ Use in all mutations
mutationFn: (payload: CreatePropPayload) => {
	const requestId = stableRequestId(['createProp'], payload)
	return propsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
}
```

---

## 🚫 What NOT to Do

### ❌ Don't Create CSS Files

```css
/* ❌ Bad: custom.css */
.my-button {
	background: blue;
	padding: 10px;
}
```

**Use Tailwind instead:**

```typescript
// ✅ Good
<button className="bg-blue-500 px-4 py-2 rounded-lg">Click</button>
```

### ❌ Don't Use `any` Types

```typescript
// ❌ Bad
const [data, setData] = useState<any>(null)
function process(input: any): any {}

// ✅ Good
const [data, setData] = useState<Prop | null>(null)
function process(input: Prop): ProcessedProp {}
```

### ❌ Don't Use Relative Imports

```typescript
// ❌ Bad
import { PropsForm } from '../../../features/props'

// ✅ Good
import { PropsForm } from '@/features/props'
```

### ❌ Don't Duplicate Code

```typescript
// ❌ Bad: Duplicate validation logic
function validateCreateForm(name: string) {
	if (!name.trim()) return 'Name required'
	if (name.length < 3) return 'Name too short'
	return null
}

function validateEditForm(name: string) {
	if (!name.trim()) return 'Name required'
	if (name.length < 3) return 'Name too short'
	return null
}

// ✅ Good: Shared validation
function validateName(name: string): string | null {
	if (!name.trim()) return 'Name required'
	if (name.length < 3) return 'Name too short'
	return null
}
```

### ❌ Don't Reinvent Design System Components

```typescript
// ❌ Bad: Custom button
function MyButton({ children, onClick }: Props) {
  return (
    <button
      className="px-4 py-2 rounded bg-blue-500 text-white"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// ✅ Good: Use design system
import { Button } from '@abumble/design-system/components/Button'

<Button onClick={onClick}>{children}</Button>
```

### ❌ Don't Forget Optimistic Updates

```typescript
// ❌ Bad: No optimistic update
export function useCreateProp() {
  return useMutation({
    mutationFn: (payload) => propsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propKeys.all })
    },
  })
}

// ✅ Good: With optimistic update (see full pattern above)
export function useCreateProp() {
  return useMutation({
    mutationFn: ...,
    onMutate: async (payload) => {
      // Cancel, snapshot, optimistic update
    },
    onError: (err, vars, context) => {
      // Rollback
    },
    onSettled: () => {
      // Invalidate
    },
  })
}
```

### ❌ Don't Skip Error Handling

```typescript
// ❌ Bad: No error handling
const { data: prop } = usePropDetail(id)

return <PropDetail prop={prop} />

// ✅ Good: Handle loading, error, empty states
const { data: prop, isLoading, isError, error } = usePropDetail(id)

if (isLoading) return <Skeleton />
if (isError) return <ErrorState message={error?.message} />
if (!prop) return <EmptyState title="Property not found" />

return <PropDetail prop={prop} />
```

### ❌ Don't Forget `version` in Updates

```typescript
// ❌ Bad: No optimistic locking
updateProp.mutate({
	id: prop.id,
	payload: { legalName: 'New Name' },
})

// ✅ Good: Include version
updateProp.mutate({
	id: prop.id,
	payload: {
		legalName: 'New Name',
		version: prop.version, // ✅ Required
	},
})
```

---

## 📚 Common Patterns Quick Reference

### Create a New Feature

```bash
mkdir -p src/features/[feature]/components/{forms,views}
touch src/features/[feature]/{api.ts,keys.ts,hooks.ts,index.ts}
touch src/features/[feature]/components/index.ts
touch src/domain/[feature].ts
```

**1. Domain Model** (`domain/[feature].ts`):

```typescript
export interface Feature {
	id: string
	name: string
	createdAt: string
	updatedAt: string
	version: number
}

export interface CreateFeaturePayload {
	name: string
}

export interface UpdateFeaturePayload {
	name?: string
	version: number
}
```

**2. API** (`features/[feature]/api.ts`):

```typescript
import { BaseService } from '@/api/base-service'
import type {
	Feature,
	CreateFeaturePayload,
	UpdateFeaturePayload,
} from '@/domain/[feature]'

class FeatureApi extends BaseService<
	Feature,
	CreateFeaturePayload,
	UpdateFeaturePayload
> {
	constructor() {
		super('[feature]')
	}
}

export const featureApi = new FeatureApi()
```

**3. Keys** (`features/[feature]/keys.ts`):

```typescript
export const featureKeys = {
	all: ['[feature]'] as const,
	lists: () => [...featureKeys.all, 'list'] as const,
	list: () => featureKeys.lists(),
	details: () => [...featureKeys.all, 'detail'] as const,
	detail: (id: string) => [...featureKeys.details(), id] as const,
}
```

**4. Hooks** (`features/[feature]/hooks.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featureApi } from './api'
import { featureKeys } from './keys'
import { stableRequestId } from '@/lib/offline-types'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { generateOptimisticId, nowIso } from '@/lib/util'
import type {
	Feature,
	CreateFeaturePayload,
	UpdateFeaturePayload,
} from '@/domain/[feature]'

export function useFeatureList() {
	return useQuery({
		queryKey: featureKeys.list(),
		queryFn: () => featureApi.list(),
	})
}

export function useFeatureDetail(id: string | null) {
	return useQuery({
		queryKey: featureKeys.detail(id!),
		queryFn: () => featureApi.getById(id!),
		enabled: id != null,
	})
}

export function useCreateFeature() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createFeature'],
		networkMode: 'offlineFirst',
		mutationFn: (payload: CreateFeaturePayload) => {
			const requestId = stableRequestId(['createFeature'], payload)
			return featureApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: featureKeys.lists() })
			const previous = queryClient.getQueryData<Feature[]>(featureKeys.list())

			const optimistic: Feature = {
				id: generateOptimisticId(),
				...payload,
				createdAt: nowIso(),
				updatedAt: nowIso(),
				version: 0,
			}

			queryClient.setQueryData<Feature[]>(featureKeys.list(), (old) =>
				old ? [...old, optimistic] : [optimistic],
			)

			return { previous }
		},
		onError: (err, vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(featureKeys.list(), context.previous)
			}
			toast.error(err?.message ?? 'Failed to create')
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: featureKeys.all })
		},
	})
}

// ✅ Add useUpdateFeature and useDeleteFeature following same pattern
```

**5. Components** - Follow patterns from Props/Units/Leases

**6. Routes**:

```typescript
// routes/[feature]/index.tsx
export const Route = createFileRoute('/[feature]/')({
	component: FeatureListPage,
})

// routes/[feature]/$id.tsx
export const Route = createFileRoute('/[feature]/$id')({
	component: FeatureDetailPage,
})
```

**7. Barrel Exports** (`features/[feature]/index.ts`):

```typescript
export * from './components'
export * from './hooks'
export { featureApi } from './api'
export { featureKeys } from './keys'
```

---

## 🎯 Final Checklist

Before committing code, verify:

- [ ] ✅ Used absolute imports (`@/...`)
- [ ] ✅ Extended `BaseService` for API layer
- [ ] ✅ Created key factory in `keys.ts`
- [ ] ✅ Implemented optimistic updates in mutations
- [ ] ✅ Used `stableRequestId()` for idempotency
- [ ] ✅ Included `version` field in update payloads
- [ ] ✅ Handled loading/error/empty states
- [ ] ✅ Used design system components (no custom implementations)
- [ ] ✅ Used Tailwind utilities (no CSS files)
- [ ] ✅ Abstracted repetitive code (if 3+ uses)
- [ ] ✅ Followed naming conventions (PascalCase, camelCase, etc.)
- [ ] ✅ Used barrel exports (`index.ts`)
- [ ] ✅ Components < 200-300 lines
- [ ] ✅ No `any` types
- [ ] ✅ Pure validation functions
- [ ] ✅ Used formatters (`formatAddress`, `formatCurrency`, `formatDate`)

---

## 📖 Additional Resources

- **TanStack Router Docs**: https://tanstack.com/router/latest
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

**Last Updated:** 2026-02-09
**Project Version:** React 19, TypeScript 5.7, TanStack Router v1, React Query v5
