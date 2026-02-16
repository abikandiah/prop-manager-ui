# Offline Detection Flow

> **Purpose**: Detailed explanation of network and server reachability detection
> **Status**: Implemented ✅
> **Last Updated**: 2026-02-14

## Table of Contents

- [Two Independent Detection Systems](#two-independent-detection-systems)
  - [Network Connectivity (Instant)](#1-network-connectivity-instant-)
  - [Server Reachability (3-Failure Threshold)](#2-server-reachability-3-failure-threshold-)
- [Combined Logic](#combined-logic)
- [Why Different Thresholds?](#why-different-thresholds)
- [Real-World Scenarios](#real-world-scenarios)
- [Edge Cases](#edge-cases)
- [Which Errors Trigger Server Unreachable?](#which-errors-trigger-server-unreachable)
- [Technical Implementation](#technical-implementation)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Summary](#summary)

---

## Two Independent Detection Systems

### 1. Network Connectivity (INSTANT) ⚡

**Triggers:**

```
User disables WiFi          → INSTANT offline
User enables airplane mode  → INSTANT offline
User connects to WiFi       → INSTANT online (+ check server)
```

**No threshold, no delay, immediate response**

```typescript
navigator.onLine = false
  ↓
isNetworkOnline = false  // Instant!
  ↓
isOnline = false
  ↓
Banner: "You're offline"
Mutations: Paused
```

---

### 2. Server Reachability (3-FAILURE THRESHOLD) 🎯

**Triggers:**

```
Server error (5xx)   → Count failure
Network timeout      → Count failure
DNS failure          → Count failure
```

**Requires 3 consecutive failures before marking offline**

```typescript
Request 1: ❌ 503 Service Unavailable
  ↓
consecutiveFailures = 1
isServerReachable = true  // Still considered reachable
isOnline = true           // Still online
  ↓
Request 2: ❌ 503 Service Unavailable
  ↓
consecutiveFailures = 2
isServerReachable = true  // Still considered reachable
isOnline = true           // Still online
  ↓
Request 3: ❌ 503 Service Unavailable
  ↓
consecutiveFailures = 3   // Threshold reached!
isServerReachable = false // NOW marked unreachable
  ↓
isOnline = false
  ↓
Banner: "Server unavailable"
Mutations: Paused
Health checks: Start polling
```

---

## Combined Logic

```typescript
// The app is "online" only when BOTH are true:
const isOnline = isNetworkOnline && isServerReachable

// Truth table:
isNetworkOnline | isServerReachable | isOnline | Banner Message
----------------|---------------------|----------|------------------
true            | true                | true     | (none)
true            | false               | false    | Server unavailable
false           | true                | false    | You're offline
false           | false               | false    | You're offline
```

---

## Why Different Thresholds?

### Network: Instant (No Threshold)

**Reasons:**

- ✅ Browser events are 100% reliable
- ✅ User knows when they disabled WiFi
- ✅ No false positives possible
- ✅ Users expect instant feedback

**Example:**

```
User clicks WiFi toggle OFF
  ↓
Browser fires 'offline' event
  ↓
App immediately shows "You're offline"  ✅ Expected!
```

### Server: 3 Failures (Threshold Required)

**Reasons:**

- ⚠️ Network requests can fail transiently
- ⚠️ One timeout doesn't mean server is down
- ⚠️ Slow network can cause timeouts
- ⚠️ Want to avoid false positives

**Example without threshold (BAD):**

```
User on slow 3G connection
  ↓
Request times out (slow network, not server down)
  ↓
App switches to offline mode  ❌ False positive!
```

**Example with threshold (GOOD):**

```
User on slow 3G connection
  ↓
Request 1 times out → consecutiveFailures = 1 (still online)
Request 2 succeeds → consecutiveFailures = 0 (reset)
  ↓
No false positive!  ✅
```

---

## Real-World Scenarios

### Scenario 1: WiFi Disconnects

```
1. User turns off WiFi
2. navigator.onLine = false (instant!)
3. isNetworkOnline = false
4. isOnline = false
5. Banner: "You're offline"
6. Mutations pause

Timeline: Instant (0ms)
```

---

### Scenario 2: Server Goes Down (Maintenance)

```
1. Server goes offline for maintenance
2. User tries to create property
3. Request fails with 503
4. consecutiveFailures = 1
5. Still shows "online" (might be transient)

6. User tries again
7. Request fails with 503
8. consecutiveFailures = 2
9. Still shows "online" (might be transient)

10. User tries third time
11. Request fails with 503
12. consecutiveFailures = 3 → Threshold reached!
13. isServerReachable = false
14. isOnline = false
15. Banner: "Server unavailable"
16. Mutations pause
17. Start polling health endpoint every 30s

Timeline: 3 failed requests (varies, but typically 5-30 seconds)
```

---

### Scenario 3: Intermittent Network Issues

```
1. Request 1: ❌ Timeout → consecutiveFailures = 1
2. Request 2: ✅ Success → consecutiveFailures = 0 (reset!)
3. Request 3: ❌ Timeout → consecutiveFailures = 1
4. Request 4: ✅ Success → consecutiveFailures = 0 (reset!)

Result: Never goes offline ✅
(Transient failures don't trigger offline mode)
```

---

### Scenario 4: Server Down During Offline Period

```
1. User turns off WiFi
2. isNetworkOnline = false (instant)
3. isOnline = false
4. Banner: "You're offline"

5. While offline, server goes down for maintenance

6. User turns WiFi back on
7. isNetworkOnline = true
8. Health check runs: ❌ Server unreachable
9. isServerReachable = false
10. isOnline = false (still offline!)
11. Banner switches to: "Server unavailable"
12. Start polling health endpoint

13. Server comes back online
14. Next health check: ✅ Success
15. isServerReachable = true
16. isOnline = true
17. Banner disappears
18. Mutations resume
```

---

## Edge Cases

### Edge Case 1: Slow Health Check

**Problem:**

```
WiFi comes back online
Health check takes 5 seconds (slow network)
User waits...
```

**Solution:** Not a problem!

```
isNetworkOnline = true (instant)
isServerReachable = ??? (checking...)
isOnline = false (conservative, wait for server check)
Banner: "Server unavailable" (temporarily)

Health check completes: ✅
isServerReachable = true
isOnline = true
Banner disappears
```

**User sees:** Brief "Server unavailable" message (~5s), then goes online.

---

### Edge Case 2: False Positive from Timeout

**Problem:**

```
User on very slow connection
3 requests timeout in a row
App goes offline even though server is fine
```

**Mitigation:**

- Increase timeout (currently 10s in api/client.ts)
- Increase threshold (3 → 5 failures)
- Health check will detect server is actually reachable

**Recovery:**

```
consecutiveFailures = 3 → Goes offline
Next successful request → consecutiveFailures = 0 → Back online
OR
Health check succeeds → Back online
```

---

### Edge Case 3: Network Flapping

**Problem:**

```
WiFi goes on/off/on/off rapidly
```

**Behavior:**

```
Off → isNetworkOnline = false (instant)
On  → isNetworkOnline = true (instant)
Off → isNetworkOnline = false (instant)
On  → isNetworkOnline = true (instant)
```

**Result:** Banner appears/disappears rapidly, but correctly tracks state ✅

**Potential improvement:** Add debouncing if this becomes annoying

```typescript
const debouncedIsOnline = useDebouncedValue(isOnline, 500)
```

---

## Which Errors Trigger Server Unreachable?

### ✅ Trigger Offline Mode

| Error Type    | Example                        | Why                           |
| ------------- | ------------------------------ | ----------------------------- |
| Network error | `ERR_NETWORK`                  | Can't reach server            |
| Timeout       | `ECONNABORTED`                 | Server too slow/unreachable   |
| No response   | `error.response === undefined` | Connection failed             |
| 500 errors    | `500 Internal Server Error`    | Server broken                 |
| 502 errors    | `502 Bad Gateway`              | Proxy/load balancer issue     |
| 503 errors    | `503 Service Unavailable`      | Server overloaded/maintenance |
| 504 errors    | `504 Gateway Timeout`          | Server too slow               |

### ❌ Don't Trigger Offline Mode

| Error Type | Example                | Why                            |
| ---------- | ---------------------- | ------------------------------ |
| 400 errors | `400 Bad Request`      | Client error, not server issue |
| 401 errors | `401 Unauthorized`     | Auth issue, not offline        |
| 403 errors | `403 Forbidden`        | Permission issue, not offline  |
| 404 errors | `404 Not Found`        | Resource missing, not offline  |
| 409 errors | `409 Conflict`         | Data conflict, not offline     |
| 422 errors | `422 Validation Error` | Data invalid, not offline      |

---

## Technical Implementation

### Axios Integration

Server reachability is detected via response interceptors:

```typescript
// src/api/client.ts

// Success → Reset failure count
api.interceptors.response.use(
	(response) => {
		window.__reportRequestSuccess()
		return response
	},
	(error) => {
		if (isServerError(error)) {
			window.__reportRequestFailure()
		}
		return Promise.reject(error)
	},
)

function isServerError(error: unknown): boolean {
	if (!axios.isAxiosError(error)) return false

	// Network errors
	if (!error.response) return true

	// 5xx errors
	const status = error.response.status
	return status >= 500 && status < 600
}
```

### TanStack Query Integration

```typescript
// src/contexts/network.tsx

// Sync online state to TanStack Query
useEffect(() => {
	onlineManager.setOnline(isOnline)

	if (isOnline) {
		queryClient.resumePausedMutations()
	}
}, [isOnline])
```

---

## Configuration

### Adjust Thresholds

```typescript
// src/contexts/network.tsx

// Network: Always instant (no config needed)

// Server: Adjust these based on your needs
const MAX_FAILURES_BEFORE_OFFLINE = 3 // Increase for slower networks
const HEALTH_CHECK_INTERVAL_MS = 30000 // Decrease for faster recovery
```

**Recommendations:**

| Environment   | MAX_FAILURES | HEALTH_CHECK_INTERVAL | Reasoning             |
| ------------- | ------------ | --------------------- | --------------------- |
| Local dev     | 2            | 10000 (10s)           | Fast feedback         |
| Staging       | 3            | 30000 (30s)           | Balanced              |
| Production    | 3-5          | 30000 (30s)           | Avoid false positives |
| Slow networks | 5            | 60000 (60s)           | Give more time        |

---

## Monitoring

Track these metrics to tune thresholds:

```typescript
// Log when going offline
console.warn('[Network] Going offline', {
  reason: isNetworkOnline ? 'server' : 'network',
  consecutiveFailures,
  timestamp: Date.now(),
})

// Metrics to track:
- How often does offline mode trigger?
- How many failures before triggering? (1? 2? 3?)
- How long until recovery?
- False positive rate?
```

If you see:

- **Many false positives** → Increase MAX_FAILURES
- **Slow offline detection** → Decrease MAX_FAILURES
- **Slow recovery** → Decrease HEALTH_CHECK_INTERVAL

---

## Summary

| Aspect          | Network Detection    | Server Detection                  |
| --------------- | -------------------- | --------------------------------- |
| Trigger         | Browser events       | Failed requests                   |
| Threshold       | None (instant)       | 3 consecutive failures            |
| Why different?  | Events are reliable  | Requests can fail transiently     |
| Speed           | Instant (0ms)        | Varies (5-30s typically)          |
| False positives | None                 | Possible (mitigated by threshold) |
| Recovery        | Instant on reconnect | Health check polling (30s)        |

**Result:** Fast, accurate offline detection with minimal false positives! ✅
