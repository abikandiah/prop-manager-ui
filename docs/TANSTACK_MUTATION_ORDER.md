# TanStack Query Mutation Order Investigation

> **Question**: Does `resumePausedMutations()` maintain order?
> **Answer**: **NO** - Mutations resume in parallel by default ⚠️
> **Last Updated**: 2026-02-14

## Table of Contents

- [How TanStack Query Handles Mutations](#how-tanstack-query-handles-mutations)
- [The Problem: Dependent Mutations](#the-problem-dependent-mutations)
- [Solutions](#solutions)
  - [Option 1: Mutation Keys (Built-in)](#option-1-mutation-keys-ensure-sequential-execution-built-in)
  - [Option 2: Global Mutation Queue (Custom)](#option-2-global-mutation-queue-custom)
  - [Option 3: Optimistic ID Resolution](#option-3-optimistic-id-resolution-recommended)
  - [Option 4: Backend Handles Optimistic IDs](#option-4-backend-handles-optimistic-ids-best)
  - [Option 5: Smart Retry with Backoff](#option-5-smart-retry-with-backoff-pragmatic)
- [Recommendation](#recommendation)
- [Code Example: Smart Dependent Mutation](#code-example-smart-dependent-mutation)
- [Summary](#summary)

---

### TL;DR: **NO** - Mutations resume in parallel by default ⚠️

## How TanStack Query Handles Mutations

### Normal (Online) Behavior:
```typescript
// Multiple mutations execute in PARALLEL
mutate1({ name: 'A' })  // Starts immediately
mutate2({ name: 'B' })  // Starts immediately (doesn't wait for mutate1)
mutate3({ name: 'C' })  // Starts immediately (doesn't wait for mutate1 or mutate2)
```

### Paused Mutations (Offline):
```typescript
// User goes offline
mutate1({ name: 'A' })  // Pauses, state.isPaused = true
mutate2({ name: 'B' })  // Pauses, state.isPaused = true
mutate3({ name: 'C' })  // Pauses, state.isPaused = true

// User comes back online
queryClient.resumePausedMutations()
// ⚠️ All 3 resume in PARALLEL (no order guarantee)
```

### MutationCache Storage:
```typescript
// TanStack stores mutations in a Map
class MutationCache {
  #mutations = new Map<MutationKey, Mutation[]>()
}

// resumePausedMutations() implementation (simplified):
resumePausedMutations() {
  this.#mutations.forEach((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.state.isPaused) {
        mutation.continue()  // ⚠️ All resume at once!
      }
    })
  })
}
```

## The Problem: Dependent Mutations

### Scenario:
```typescript
// While offline:
1. Create property → propertyId: "opt-123" (optimistic)
2. Create unit → { propertyId: "opt-123" }

// Come back online:
resumePausedMutations()
  ├─ Create property starts
  └─ Create unit starts   ⚠️ PARALLEL!

// Race condition:
- Unit creation might reach backend before property
- Backend: "Property opt-123 doesn't exist" → FAILS
```

## Solutions

### Option 1: Mutation Keys Ensure Sequential Execution (Built-in)

**TanStack DOES guarantee:** Mutations with the **same mutationKey** execute sequentially.

```typescript
// ✅ These execute in order:
mutationKey: ['createProperty']  // Mutation 1
mutationKey: ['createProperty']  // Mutation 2 (waits for 1)
mutationKey: ['createProperty']  // Mutation 3 (waits for 2)

// ❌ These execute in parallel:
mutationKey: ['createProperty']  // Mutation 1
mutationKey: ['createUnit']      // Mutation 2 (doesn't wait!)
```

**Current Code:**
```typescript
// props/hooks.ts
mutationKey: ['createProp']

// units/hooks.ts
mutationKey: ['createUnit']

// ⚠️ These are DIFFERENT keys → execute in parallel!
```

**Fix for ordering:**
```typescript
// Use same key prefix for related mutations
mutationKey: ['mutations', 'createProp']
mutationKey: ['mutations', 'createUnit']  // Still different
```

**This doesn't help!** Different keys still run in parallel.

---

### Option 2: Global Mutation Queue (Custom)

**Implementation:**
```typescript
// src/lib/mutation-queue.ts
class MutationQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false

  async add(fn: () => Promise<void>) {
    this.queue.push(fn)
    if (!this.processing) {
      await this.process()
    }
  }

  private async process() {
    this.processing = true
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!
      await fn()
    }
    this.processing = false
  }
}

export const mutationQueue = new MutationQueue()

// Usage in hooks:
mutationFn: (payload) => {
  return mutationQueue.add(async () => {
    return propsApi.create(payload)
  })
}
```

**Pros:** ✅ Guarantees order
**Cons:** ❌ Complex, all mutations sequential (even unrelated ones)

---

### Option 3: Optimistic ID Resolution (Recommended)

**Don't rely on order, handle IDs properly:**

```typescript
// When property is created:
onSuccess: (realProp, variables, context) => {
  const optimisticId = context.optimisticId
  const realId = realProp.id

  // Update cache: replace optimistic ID with real ID
  queryClient.setQueryData(['props', 'list'], (old) =>
    old.map(p => p.id === optimisticId ? realProp : p)
  )

  // Update any pending mutations that reference this ID
  updatePendingMutations(queryClient, optimisticId, realId)
}

function updatePendingMutations(
  queryClient: QueryClient,
  optimisticId: string,
  realId: string
) {
  const mutations = queryClient.getMutationCache().getAll()

  mutations.forEach(mutation => {
    if (mutation.state.isPaused && mutation.state.variables) {
      const vars = mutation.state.variables as any

      // Update any fields that reference the optimistic ID
      if (vars.propertyId === optimisticId) {
        // ⚠️ Problem: Can't directly mutate mutation.state.variables
        // TanStack doesn't expose an API for this
      }
    }
  })
}
```

**Problem:** TanStack doesn't let us modify paused mutation variables!

---

### Option 4: Backend Handles Optimistic IDs (Best!)

**Make backend accept optimistic IDs temporarily:**

```typescript
// Frontend sends:
POST /api/units
{
  "propertyId": "opt-123",  // Optimistic ID
  "name": "Unit 4A"
}

// Backend response:
201 Created
{
  "id": "unit-456",
  "propertyId": "prop-789",  // ✅ Backend resolved opt-123 → prop-789
  "name": "Unit 4A"
}

// Backend logic:
if (propertyId.startsWith('opt-')) {
  // Look up in pending creates mapping
  realPropertyId = pendingCreates.get(propertyId)
  if (!realPropertyId) {
    return 400 Bad Request: "Property not created yet, retry later"
  }
}
```

**Pros:**
- ✅ Handles order issues
- ✅ No frontend complexity
- ✅ Works even with parallel mutations

**Cons:**
- ❌ Requires backend changes
- ❌ Backend needs to maintain optimistic ID mapping

---

### Option 5: Smart Retry with Backoff (Pragmatic)

**Accept that dependent mutations might fail, retry them:**

```typescript
mutationFn: async (payload) => {
  return propsApi.create(payload)
},
retry: (failureCount, error) => {
  // If property doesn't exist, it might be created soon
  if (error.response?.status === 404 && failureCount < 5) {
    return true  // Retry up to 5 times
  }
  return false
},
retryDelay: (attemptIndex) => {
  return Math.min(1000 * 2 ** attemptIndex, 10000)  // Exponential backoff
}
```

**Pros:**
- ✅ Simple to implement
- ✅ No backend changes
- ✅ Handles race conditions gracefully

**Cons:**
- ⚠️ Delays (waits for retries)
- ⚠️ Still might fail if property creation fails

---

## Recommendation

**Hybrid Approach:**

1. **Design mutations to be independent when possible**
   - Create property and unit separately (OK to have unlinked unit temporarily)
   - Link them in a separate "link unit to property" mutation

2. **Use smart retry for dependent mutations** (Option 5)
   - Handles race conditions
   - Simple to implement
   - No backend changes

3. **Add optimistic ID mapping in cache** (Option 3 - partial)
   - Update query cache when creates succeed
   - UI shows correct relationships immediately

4. **For critical ordering, use same mutationKey**
   - TanStack guarantees order within same key
   - Example: All property edits use `['property', id]`

## Code Example: Smart Dependent Mutation

```typescript
export function useCreateUnit() {
  return useMutation({
    mutationKey: ['createUnit'],
    networkMode: 'online',
    mutationFn: async (payload: CreateUnitPayload) => {
      const requestId = stableRequestId(['createUnit'], payload)
      return unitsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
    },
    retry: (failureCount, error) => {
      // If property doesn't exist yet, retry
      if (
        error.response?.status === 404 &&
        error.response?.data?.message?.includes('property') &&
        failureCount < 5
      ) {
        console.log(`Property not found, retrying unit creation (attempt ${failureCount + 1})`)
        return true
      }
      return failureCount < 2  // Normal retry for other errors
    },
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 10000)
    },
    onMutate: async (payload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: unitKeys.all })
      const previousUnits = queryClient.getQueryData(unitKeys.list())
      const optimistic = applyCreate(queryClient, payload)
      return { previousUnits, optimisticId: optimistic.id }
    },
    onError: (err, _, context) => {
      // Rollback
      if (context?.previousUnits) {
        queryClient.setQueryData(unitKeys.list(), context.previousUnits)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}
```

## Summary

| Approach | Order Guarantee | Complexity | Backend Change | Recommended |
|----------|----------------|------------|----------------|-------------|
| Default TanStack | ❌ No (parallel) | Low | No | ❌ Don't use |
| Same mutationKey | ✅ Yes (same key only) | Low | No | ⚠️ Limited use |
| Global Queue | ✅ Yes | High | No | ❌ Overkill |
| Backend Optimistic IDs | ✅ Yes | Medium | Yes | ✅ If possible |
| Smart Retry | ⚠️ Eventually | Low | No | ✅ **Recommended** |
| Independent Design | ✅ N/A | Low | No | ✅ **Best** |

**Final Answer:**
- TanStack does NOT guarantee mutation order when resuming
- Use **Smart Retry** + **Independent Mutation Design** to handle this
- For critical order, restructure mutations to be independent
