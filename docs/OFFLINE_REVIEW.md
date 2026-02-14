# Offline Architecture Review

> **Purpose**: Critical analysis of the current implementation
> **Status**: Partially implemented (see checklist)
> **Last Updated**: 2026-02-14

## Table of Contents

- [Current State Analysis](#current-state-analysis)
  - [What's Working](#-whats-working)
  - [Critical Missing Pieces](#-critical-missing-pieces)
- [Implementation Checklist](#-implementation-checklist)
- [Recommended Architecture Decision](#recommended-architecture-decision)
- [Code Smell: Inconsistent networkMode](#code-smell-inconsistent-networkmode)
- [Summary](#summary)

---

## Current State Analysis

### ✅ What's Working

1. **Query Cache Persistence**
   - Queries are persisted to IndexedDB via Dexie
   - Throttled cache persister (1000ms) prevents excessive writes
   - Cache restored on app load with validation

2. **Network Detection**
   - Browser online/offline events monitored
   - "Lie-Fi" detection via health check to API
   - TanStack Query's `onlineManager` kept in sync

3. **Optimistic Updates**
   - All feature hooks implement optimistic updates in `onMutate`
   - Rollback on error via `onError` context restoration
   - Generate optimistic IDs for creates

4. **Idempotency**
   - Stable request IDs generated from mutation key + variables
   - `X-Request-Id` header sent with all mutations
   - Backend can dedupe retries

5. **Database Schema**
   - `mutations` table for outbox pattern
   - `queries` table for cache blob
   - Proper indexes on `status` and `timestamp`

---

## ❌ Critical Missing Pieces

### 1. **Mutation Cache NOT Being Persisted**

**Problem:**
```typescript
// src/integrations/tanstack-query/root-provider.tsx
dehydrateOptions: {
  shouldDehydrateQuery: (query: Query) => {
    return query.state.status !== 'error'
  },
  // ❌ MISSING: shouldDehydrateMutation
},
```

**Impact:** When the app reloads, all pending mutations are lost. Users lose their offline work.

**Fix:**
```typescript
dehydrateOptions: {
  shouldDehydrateQuery: (query: Query) => {
    return query.state.status !== 'error'
  },
  shouldDehydrateMutation: (mutation) => {
    // Persist paused/pending mutations so they can resume
    return mutation.state.isPaused ||
           mutation.state.status === 'pending' ||
           mutation.state.status === 'idle'
  },
},
```

---

### 2. **Paused Mutations Never Resume**

**Problem:**
```typescript
// syncEngine.ts line 6-8
export async function startSync(queryClient: QueryClient) {
  // TODO: Implement sync engine
  return  // ❌ Returns immediately, sync never happens
}
```

**Impact:** Mutations pause when offline but never actually execute when back online.

**Fix Required:**
- Remove the early return in `syncEngine.ts`
- Call `queryClient.resumePausedMutations()` after cache restore
- Call it again when network reconnects

**Where to add:**
```typescript
// In root-provider.tsx onSuccess callback
onSuccess: () => {
  console.log('Cache restored, resuming paused mutations...')
  queryClient.resumePausedMutations()
},

// Already correctly placed in network.tsx line 59
if (actualOnline) {
  startSync(queryClient)  // This should work once syncEngine is fixed
}
```

---

### 3. **Network Mode Inconsistency**

**Problem:**
- Props & Units: `networkMode: 'online'` → mutations **pause** when offline
- Leases & Templates: `networkMode: 'offlineFirst'` → mutations **fail immediately** when offline

**Impact:** Inconsistent UX across features. Users expect offline support everywhere or nowhere.

**Recommendation:**

**Option A: Full Offline Support (Recommended)**
- Change ALL mutations to `networkMode: 'online'` (they'll pause and resume)
- Complete the sync engine implementation
- Add UI feedback for pending sync

**Option B: Online-Only (Simpler)**
- Keep `networkMode: 'online'` everywhere
- Show clear "You're offline" messaging
- Disable mutation buttons when offline
- Remove mutation persistence complexity

---

### 4. **No UI Feedback for Sync Status**

**Missing:**
- No indicator showing pending mutations
- No "Syncing..." toast when reconnecting
- No retry UI for failed mutations
- No visual distinction for optimistically created items

**Suggested Components:**
```typescript
// src/components/SyncStatusBanner.tsx
// Shows at top: "X changes waiting to sync" or "Syncing..."

// src/hooks/usePendingMutations.ts
export function usePendingMutations() {
  const queryClient = useQueryClient()
  const mutations = queryClient.getMutationCache().getAll()
  return mutations.filter(m => m.state.isPaused || m.state.status === 'pending')
}

// Usage in optimistic items:
<span className="text-xs text-muted-foreground">
  {isPending ? '(pending sync)' : ''}
</span>
```

---

### 5. **Mutation Outbox Never Consumed**

**Problem:**
```typescript
// db.ts - addMutation() is called
// syncEngine.ts - getNextPending() exists but sync is disabled
```

**Impact:** The `mutations` table grows forever but serves no purpose.

**Fix:** Either:
1. Complete the sync engine to actually consume the outbox
2. OR remove the custom outbox and rely only on TanStack's mutation cache persistence

---

### 6. **No Manual Retry for Failed Mutations**

**Problem:** If a mutation fails 3 times, it's marked as `failed` and forgotten.

**Missing:**
- UI to show failed mutations
- Button to retry failed mutations
- Option to discard failed mutations

**Suggested:**
```typescript
// src/components/FailedMutationsDialog.tsx
export function FailedMutationsDialog() {
  const [failedMutations, setFailedMutations] = useState([])

  useEffect(() => {
    db.mutations.where('status').equals('failed').toArray()
      .then(setFailedMutations)
  }, [])

  return (
    <Dialog>
      {failedMutations.map(m => (
        <div key={m.id}>
          <p>{m.value.mutationKey.join('/')}</p>
          <Button onClick={() => retryMutation(m)}>Retry</Button>
          <Button onClick={() => discardMutation(m)}>Discard</Button>
        </div>
      ))}
    </Dialog>
  )
}
```

---

### 7. **Version-Based Conflict Detection Not Enforced**

**Problem:**
- Entities have a `version` field
- Mutations send it in payload
- But backend likely doesn't enforce optimistic locking

**Current Risk:**
- User A edits property offline
- User B edits same property online
- User A comes back online
- User A's changes overwrite User B's (last-write-wins)
- User B's work is silently lost

**Fix (Backend Required):**
```typescript
// Backend should reject updates with stale version:
PATCH /api/props/123
{ "name": "New Name", "version": 5 }

Response 409 Conflict:
{
  "error": "Version mismatch. Expected 7, got 5.",
  "currentVersion": 7
}
```

**Frontend handling:**
```typescript
onError: (err) => {
  if (err.response?.status === 409) {
    // Show conflict resolution UI
    showConflictDialog(err.response.data)
  }
}
```

---

### 8. **🚨 CRITICAL: No User Scoping**

**Problem:**
IndexedDB database is shared across ALL users on the same browser/device.

**Current Code:**
```typescript
// db.ts
export class AppDatabase extends Dexie {
  constructor() {
    super('prop-manager-db')  // ❌ Same DB for all users!
  }
}
```

**Severe Risks:**

1. **Privacy Violation:**
   - User A logs in, caches properties
   - User A logs out
   - User B logs in on same device
   - User B sees User A's cached data in dropdown/autocomplete

2. **Data Corruption:**
   - User A creates property offline (optimistic ID)
   - User A logs out before syncing
   - User B logs in
   - User B's sync tries to sync User A's pending mutation
   - Backend rejects (wrong user) or worse, allows it

3. **Security Issue:**
   - Sensitive user data persists across sessions
   - No cache invalidation on logout

**Recommended Solutions:**

**Option A: User-Scoped Database (Recommended)**
```typescript
// db.ts
export class AppDatabase extends Dexie {
  constructor(userId: string) {
    super(`prop-manager-db-${userId}`)  // ✅ One DB per user
    this.version(1).stores({
      queries: 'id, updatedAt',
      mutations: 'id, status, timestamp, [status+timestamp]',
    })
  }
}

// Create singleton per user
let currentDb: AppDatabase | null = null
let currentUserId: string | null = null

export function getDb(userId: string): AppDatabase {
  if (currentDb && currentUserId === userId) {
    return currentDb
  }

  // Close old DB if switching users
  if (currentDb) {
    currentDb.close()
  }

  currentDb = new AppDatabase(userId)
  currentUserId = userId
  return currentDb
}

// Call on logout to clear
export async function clearUserDb(userId: string) {
  const db = new AppDatabase(userId)
  await db.delete()
  await db.close()
}
```

**Option B: User ID in Every Record**
```typescript
// Add userId to schema
this.version(2).stores({
  queries: 'id, userId, updatedAt',  // Add userId
  mutations: 'id, userId, status, timestamp',  // Add userId
})

// Filter all queries by userId
async loadCacheBlob(userId: string) {
  const record = await this.queries
    .where('[id+userId]')
    .equals([CACHE_KEY, userId])
    .first()
  return record?.value
}

// Clear on logout
async clearUserData(userId: string) {
  await this.queries.where('userId').equals(userId).delete()
  await this.mutations.where('userId').equals(userId).delete()
}
```

**Option C: Clear on Logout (Simple but loses offline data)**
```typescript
// AuthProvider
const logout = async () => {
  // Clear all offline data
  await db.delete()
  await db.open()

  // Clear auth
  setUser(null)
}
```

**Recommendation: Option A** (User-Scoped Database)
- ✅ Best privacy (complete isolation)
- ✅ Easy to implement
- ✅ Clean logout (just delete the DB)
- ✅ No risk of cross-user contamination
- ❌ Takes more disk space (one DB per user)

**Integration Points:**

```typescript
// 1. Get userId from AuthContext
const { user } = useAuth()
const userId = user?.id

// 2. Pass to cache persister
export const createThrottledCachePersister = (userId: string, throttleMs = 1000) => {
  const userDb = getDb(userId)
  // ... use userDb instead of global db
}

// 3. Initialize in root provider
export function getContext(userId: string) {
  const queryClient = new QueryClient({...})
  const persister = createThrottledCachePersister(userId)
  return { queryClient, persistOptions: { persister, ... }}
}

// 4. Clear on logout
const logout = async () => {
  if (user?.id) {
    await clearUserDb(user.id)
  }
  setUser(null)
}
```

**Must Test:**
- [ ] User A creates item offline
- [ ] User A logs out
- [ ] User B logs in (different account)
- [ ] User B should NOT see User A's items
- [ ] User A logs back in
- [ ] User A should see their pending items and sync them

---

## 📋 Implementation Checklist

### Phase 0: User Scoping (🚨 CRITICAL - Do This First!)

- [ ] Implement user-scoped database (Option A recommended)
- [ ] Update `db.ts` to accept userId parameter
- [ ] Update cache persister to use user-scoped DB
- [ ] Clear user's DB on logout
- [ ] Test multi-user scenario (User A offline → logout → User B login)

### Phase 1: Basic Offline Support (Essential)

- [ ] Add `shouldDehydrateMutation` to persist options
- [ ] Call `resumePausedMutations()` in onSuccess callback
- [ ] Remove early return in `syncEngine.ts`
- [ ] Standardize `networkMode` across all features (use 'online' everywhere)
- [ ] Test: Create item offline → close app → reopen → should sync

### Phase 2: User Feedback (Important)

- [ ] Create `usePendingMutations()` hook
- [ ] Add "pending sync" badge to optimistic items
- [ ] Show sync status banner when mutations are pending
- [ ] Toast notification: "X changes synced" on success
- [ ] Show "(offline)" indicator in header when offline

### Phase 3: Error Handling (Important)

- [ ] Create UI for failed mutations
- [ ] Add manual retry mechanism
- [ ] Add "discard changes" option
- [ ] Prune synced mutations older than 7 days (already in code, just call it)

### Phase 4: Advanced (Optional)

- [ ] Backend: Implement optimistic locking with version field
- [ ] Frontend: Conflict resolution UI
- [ ] Differential sync (only sync changed fields)
- [ ] Background sync when app is in background (Service Worker)

---

## Recommended Architecture Decision

### Current Documentation Says:
> "We use TanStack Query's built-in sync instead of a custom mutation queue"

### But the Code Has:
- Custom mutation outbox in Dexie
- Custom `syncEngine.ts` (disabled)
- MutationCache hook that adds to outbox

### Recommendation: Pick One Approach

**Option A: Pure TanStack (Simpler)**
```typescript
// Remove:
- db.mutations table
- syncEngine.ts
- MutationCache onMutate hook

// Keep:
- shouldDehydrateMutation
- resumePausedMutations()
- TanStack handles everything
```

**Option B: Custom Outbox (More Control)**
```typescript
// Keep everything, but:
- Complete syncEngine implementation
- Process mutations from Dexie outbox
- More control over retry logic, ordering, batching
```

**My Recommendation: Option A** (Pure TanStack)
- Less code to maintain
- TanStack Query is battle-tested
- Matches what the documentation says
- Easier to reason about

---

## Code Smell: Inconsistent networkMode

```typescript
// Props, Units: 'online' → mutations pause when offline
networkMode: 'online',

// Leases, Templates: 'offlineFirst' → mutations fail immediately when offline
networkMode: 'offlineFirst',
```

**This is backwards!**

For true offline support, ALL mutations should use `networkMode: 'online'` so they pause and resume.

`networkMode: 'offlineFirst'` means "try to run even when offline" which will always fail for API mutations.

---

## Summary

**Current State:** 70% complete offline architecture

**Working:** Cache persistence, network detection, optimistic updates, idempotency

**Broken:** Mutation persistence, resuming paused mutations, sync engine

**Missing:** UI feedback, error handling, conflict resolution

**Estimate to Complete:**
- Phase 1 (Essential): 4-8 hours
- Phase 2 (Feedback): 4-6 hours
- Phase 3 (Errors): 2-4 hours
- Phase 4 (Advanced): 16-24 hours

**Next Step:** Decide between Pure TanStack vs Custom Outbox, then implement Phase 1.
