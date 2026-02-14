# Offline-First Architecture Documentation

This directory contains documentation for the offline-first capabilities of the Property Manager UI.

## 📚 Documentation Guide

### Start Here

**New to the offline architecture?** Start with these documents in order:

1. **[Architecture Overview](#architecture-overview)** _(below)_ - High-level understanding of how offline mode works
2. **[Offline Detection Flow](./OFFLINE_DETECTION_FLOW.md)** - Detailed explanation of network and server detection
3. **[Implementation Guide](./OFFLINE_IMPLEMENTATION_PLAN.md)** - Step-by-step implementation details

### Reference Documents

- **[Architecture Review](./OFFLINE_REVIEW.md)** - Current state analysis, what's working, what's missing, implementation checklist
- **[Mutation Ordering](./TANSTACK_MUTATION_ORDER.md)** - How TanStack Query handles mutation order and solutions for dependencies

### Deprecated

- **~~SERVER_REACHABILITY_DETECTION.md~~** - Merged into OFFLINE_DETECTION_FLOW.md

---

## Architecture Overview

### What is Offline-First?

The Property Manager UI works seamlessly whether you're online or offline:

- ✅ **View cached data** when offline
- ✅ **Create, edit, delete** items while offline (optimistic updates)
- ✅ **Automatic sync** when back online
- ✅ **Conflict detection** via version fields
- ✅ **User-scoped data** for privacy

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  - Optimistic updates                                        │
│  - Offline banner                                            │
│  - Sync status indicators                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                  TanStack Query Layer                        │
│  - Query cache (read operations)                             │
│  - Mutation queue (write operations)                         │
│  - Network mode: 'online' (pause when offline)               │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                 Network Detection Layer                      │
│  ┌────────────────────┬────────────────────────────────┐    │
│  │ Network Detection  │  Server Reachability           │    │
│  │ - navigator.onLine │  - Health check polling        │    │
│  │ - Instant          │  - 3-failure threshold         │    │
│  │ - WiFi/cellular    │  - Request interceptors        │    │
│  └────────────────────┴────────────────────────────────┘    │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                   Persistence Layer                          │
│  - IndexedDB (Dexie)                                         │
│  - User-scoped databases: prop-manager-{userId}              │
│  - Query cache blob                                          │
│  - Paused mutations (persisted automatically)                │
└──────────────────────────────────────────────────────────────┘
```

### Core Concepts

#### 1. Network Detection (Two Types)

**Network Connectivity** - Instant detection
- Monitors `navigator.onLine`
- Detects WiFi/cellular state changes
- No threshold, immediate feedback

**Server Reachability** - 3-failure threshold
- Monitors API request failures
- Requires 3 consecutive failures before marking offline
- Prevents false positives from transient network issues

**Combined Logic**: App is "online" only when BOTH are true.

See: [OFFLINE_DETECTION_FLOW.md](./OFFLINE_DETECTION_FLOW.md)

#### 2. Client-Generated IDs

All create operations include a client-generated UUID in the payload:

```typescript
const payload: CreatePropPayload = {
  id: generateId(), // crypto.randomUUID()
  legalName: "123 Main St",
  // ... other fields
}
```

**Benefits**:
- ✅ No optimistic ID mapping needed
- ✅ Eliminates race conditions with dependent mutations
- ✅ Enables offline creation of related entities
- ✅ Simplifies optimistic updates

See: [OFFLINE_IMPLEMENTATION_PLAN.md](./OFFLINE_IMPLEMENTATION_PLAN.md#phase-2-client-side-id-generation)

#### 3. Pure TanStack Query Approach

We use TanStack Query's built-in persistence instead of a custom sync engine:

- **Mutations** use `networkMode: 'online'` → pause when offline
- **Paused mutations** automatically saved to IndexedDB
- **On reconnect** → `resumePausedMutations()` continues from where it left off
- **Idempotency** via `X-Request-Id` header prevents duplicates

See: [OFFLINE_IMPLEMENTATION_PLAN.md](./OFFLINE_IMPLEMENTATION_PLAN.md#phase-1-pure-tanstack-setup)

#### 4. User-Scoped Databases

Each user gets their own IndexedDB database:

```typescript
// Database name: prop-manager-{userId}
const db = new AppDatabase(user.id)
```

**Privacy benefits**:
- ✅ Users can't see each other's cached data
- ✅ Clean logout (delete user's database)
- ✅ No cross-user contamination

See: [OFFLINE_REVIEW.md](./OFFLINE_REVIEW.md#8--critical-no-user-scoping)

#### 5. Optimistic Updates

All mutations implement optimistic updates for instant feedback:

```typescript
onMutate: async (payload) => {
  // Cancel in-flight queries
  await queryClient.cancelQueries({ queryKey: propKeys.list() })

  // Save snapshot for rollback
  const previousProps = queryClient.getQueryData(propKeys.list())

  // Apply optimistic update
  const optimistic = applyCreate(queryClient, payload)

  return { previousProps, optimisticId: optimistic.id }
},
onError: (err, _, context) => {
  // Rollback on error
  if (context?.previousProps) {
    queryClient.setQueryData(propKeys.list(), context.previousProps)
  }
}
```

#### 6. Idempotency

Duplicate mutations are prevented via stable request IDs:

```typescript
const requestId = stableRequestId(['createProp'], payload)
// Same payload → same request ID → backend dedupes

return propsApi.create(payload, {
  [IDEMPOTENCY_HEADER]: requestId // X-Request-Id
})
```

---

## Quick Reference

### Files & Directories

```
src/
├── features/offline/
│   ├── db.ts                    # Dexie database schema
│   └── cachePersistor.ts        # IndexedDB persistence
├── integrations/tanstack-query/
│   └── root-provider.tsx        # Query client setup
├── contexts/
│   ├── network.tsx              # Network detection
│   └── auth.tsx                 # User-scoped DB management
└── lib/
    └── util.ts                  # generateId() helper
```

### Key Configuration

```typescript
// src/contexts/network.tsx
const MAX_FAILURES_BEFORE_OFFLINE = 3  // Server unreachable threshold
const HEALTH_CHECK_INTERVAL_MS = 30000 // Poll interval when offline (30s)

// src/config/index.ts
queryCacheStaleTimeMs: 5 * 60 * 1000      // 5 minutes
queryCacheGcTimeMs: 24 * 60 * 60 * 1000   // 24 hours
queryCacheMaxAgeHours: 168                // 7 days
```

### Common Tasks

**Check if app is offline**:
```typescript
const { isOnline } = useNetwork()
```

**Generate a new UUID**:
```typescript
import { generateId } from '@/lib/util'
const id = generateId()
```

**Resume paused mutations**:
```typescript
queryClient.resumePausedMutations()
```

**Clear user's offline data**:
```typescript
await clearUserDb(userId)
```

---

## Testing Offline Functionality

### Manual Test Scenarios

1. **Network offline**
   - Disable WiFi/network adapter
   - Verify offline banner appears
   - Create/edit items
   - Re-enable network
   - Verify items sync

2. **Server down**
   - Stop backend server
   - Make 3 requests (triggers server unreachable)
   - Verify offline banner appears
   - Restart server
   - Wait up to 30s for health check
   - Verify items sync

3. **App reload while offline**
   - Go offline
   - Create items
   - Close browser tab
   - Reopen app (still offline)
   - Verify items still visible
   - Go online
   - Verify items sync

See: [OFFLINE_IMPLEMENTATION_PLAN.md](./OFFLINE_IMPLEMENTATION_PLAN.md#testing-checklist)

---

## Implementation Status

Current state as of 2026-02-14:

| Feature | Status | Notes |
|---------|--------|-------|
| Query cache persistence | ✅ Complete | IndexedDB via Dexie |
| Network detection | ✅ Complete | Browser events + health checks |
| Server reachability | ✅ Complete | 3-failure threshold |
| Optimistic updates | ✅ Complete | All features implement |
| Client-generated IDs | ✅ Complete | All create payloads |
| Idempotency | ✅ Complete | X-Request-Id header |
| User-scoped databases | ✅ Complete | One DB per user |
| Mutation persistence | ✅ Complete | TanStack built-in |
| Mutation resume | ✅ Complete | Auto-resume on reconnect |
| UI feedback | ⚠️ Partial | Banner exists, need sync indicators |
| Conflict resolution | ❌ Missing | Backend version enforcement needed |

See: [OFFLINE_REVIEW.md](./OFFLINE_REVIEW.md) for detailed status and missing pieces.

---

## Common Issues & Solutions

### Mutations not resuming after reconnect

**Cause**: `resumePausedMutations()` not called

**Solution**: Verify it's called in two places:
1. After cache restore (root-provider.tsx `onSuccess`)
2. When network reconnects (network.tsx)

---

### Race conditions with dependent mutations

**Cause**: TanStack Query resumes mutations in parallel

**Solution**: Use smart retry logic for dependent mutations (404 → retry)

See: [TANSTACK_MUTATION_ORDER.md](./TANSTACK_MUTATION_ORDER.md)

---

### User sees another user's cached data

**Cause**: Shared IndexedDB database across users

**Solution**: Ensure user-scoped databases are implemented

See: [OFFLINE_REVIEW.md](./OFFLINE_REVIEW.md#8--critical-no-user-scoping)

---

## Contributing

When updating offline functionality:

1. Update relevant documentation in `/docs`
2. Test all manual scenarios (see Testing section)
3. Update implementation status in this README
4. Consider privacy implications (user scoping)
5. Ensure idempotency for all mutations

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project-wide development guide
- [TanStack Query Docs](https://tanstack.com/query/latest) - Official library documentation
- [Dexie.js Docs](https://dexie.org/) - IndexedDB wrapper

---

**Last Updated**: 2026-02-14
