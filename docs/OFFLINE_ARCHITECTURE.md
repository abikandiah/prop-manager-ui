# Offline Architecture

We use **TanStack Query’s built-in sync** instead of a custom mutation queue and SyncEngine.

## Flow

- **Online**: Queries and mutations hit the API. Query cache is persisted to IndexedDB.
- **Offline**: Queries read from persisted cache. Mutations don’t run (default `networkMode: 'online'` → they **pause**). We apply **optimistic updates** in `onMutate` so the UI updates immediately.
- **Persist**: The **mutation cache** (including paused mutations and their variables) is dehydrated and saved to IndexedDB with the query cache (`dehydrateOptions.shouldDehydrateMutation: true`).
- **Back online** (or after reload): We call `queryClient.resumePausedMutations()`. TanStack re-runs each paused mutation’s `mutationFn` with the stored variables, then we invalidate as usual.

## Pieces

1. **PersistQueryClientProvider** – Persists query + mutation cache to IndexedDB. `onSuccess` after restore calls `queryClient.resumePausedMutations()`.
2. **SyncOnReconnect** – When `isOnline` goes from false → true (with a short debounce), runs **smartSync**: reads pending mutations from Dexie, only calls `resumePausedMutations()` if there are mutations in a resumable state (`state.status` idle or pending).
3. **Mutations** – `mutationFn` is always the API call (e.g. `propsApi.create`). In `onMutate`, when `!isOnline`, we apply optimistic updates via helpers in `api/prop-mutations.ts` (e.g. `applyOptimisticCreate`). No custom queue.
4. **Optimistic id** – `OPTIMISTIC_PROP_ID` (-1) for unsynced creates so the UI can show “(pending sync)” and disable delete.
5. **Network** – `NetworkProvider` keeps TanStack’s `onlineManager` in sync and, when the browser says online, checks real connectivity via a request to the API (e.g. `/actuator/health`).

## IndexedDB (Dexie) — System Outbox

- **Mutations table = Outbox**: No `clear()` on mutations. We use **differential upserts** only: each mutation is stored with a **stable id** (`stableMutationId(m)`) so we `put()` to add or update. If the app crashes between a hypothetical clear and bulkPut, the queue is not lost.
- **Schema (v2)**: `mutations` has `id, status, timestamp` (indexed). Rows are `{ id, value: DehydratedMutation, status: 'pending' | 'failed' | 'synced', timestamp }`. Status is set from the mutation’s `state.status` (success → synced, error → failed, idle/pending → pending) so TTL and “pending vs failed” queries work.
- **Queries**: Still `clear()` + `bulkPut()` (cache is safe to overwrite).
- **Idempotency**: API client sends `X-Request-Id` via a **stable request ID** derived from mutation key + variables (`stableRequestId` in `lib/offline-types.ts`), so the same logical mutation (e.g. on resume) sends the same ID and the backend can dedupe. See `IDEMPOTENCY_HEADER` in `api/props.ts` and backend docs.

## Conflict resolution

- Backend has no ETag/version; **updatedAt** only.
- **Last-write-wins**: After mutations succeed we invalidate; refetched server state wins.
- **Rollback**: Mutations provide an `onError` rollback to the previous cache state in case of network or server failure.
