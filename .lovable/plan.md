
## Root Cause: MD5 Not Supported by Deno's Built-in Web Crypto

The `.tableName` typo is now fixed, but there is a second crash in the same function. The `sendPusherEvent` helper inside `check-payment-status-unified` uses:

```typescript
crypto.subtle.digest('MD5', ...)
```

Deno's built-in `crypto.subtle` (Web Crypto API) **does not support MD5** — only SHA-family algorithms. This throws `NotSupportedError: Unrecognized algorithm name` every time a payment succeeds and the function tries to send a Pusher event.

The other two functions that send Pusher events solve this correctly:
- **`razorpay-webhook`** uses `createHash('md5')` from `https://deno.land/std@0.177.0/node/crypto.ts`
- **`moderate-donation`** uses `stdCrypto.subtle.digest("MD5", ...)` from `https://deno.land/std@0.190.0/crypto/mod.ts` (Deno's std crypto library, which extends Web Crypto with MD5 support)

### The Fix

**File:** `supabase/functions/check-payment-status-unified/index.ts`

**Step 1 — Add the missing import at the top of the file:**

The file currently imports `createHmac` from `node/crypto` for HMAC signing, but is missing `createHash` for MD5. Add it:

```typescript
// FROM:
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// TO:
import { createHmac, createHash } from "https://deno.land/std@0.177.0/node/crypto.ts";
```

**Step 2 — Replace the broken MD5 computation inside `sendPusherEvent` (lines 248–249):**

```typescript
// FROM (broken — Deno Web Crypto doesn't support MD5):
const md5Hash = await crypto.subtle.digest('MD5', new TextEncoder().encode(bodyStr));
const md5Hex = Array.from(new Uint8Array(md5Hash)).map(b => b.toString(16).padStart(2, '0')).join('');

// TO (correct — uses node/crypto createHash which supports MD5):
const md5Hex = createHash('md5').update(bodyStr).digest('hex');
```

This is the exact same pattern used by `razorpay-webhook` and is already imported in the file (just missing `createHash`).

### What This Fix Does
- Resolves the `NotSupportedError: Unrecognized algorithm name` crash
- Allows `sendPusherEvent` to complete successfully
- Pusher events (dashboard notification, audio queue, goal progress, leaderboard) will all fire correctly after payment
- The status page will show "success" instead of "payment failed"
- No other streamer pages, functions, or database tables are affected
- Consistent with how `razorpay-webhook` already handles this
