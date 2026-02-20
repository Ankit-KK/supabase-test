
## Root Cause: MD5 Computed on Wrong String

The `sendPusherEvent` function in `check-payment-status-unified` computes the MD5 hash on the **inner data payload** but sends a **different, larger string** as the actual HTTP body. Pusher verifies the MD5 against the actual body it receives — so the hashes never match, and every Pusher event is rejected with "Invalid body_md5".

### The Bug (Current broken code)

```typescript
const sendPusherEvent = async (channel: string, eventName: string, data: any) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyStr = JSON.stringify(data);              // ← MD5 computed on THIS
  const md5Hex = createHash('md5').update(bodyStr).digest('hex');

  // ... signature calculation using md5Hex ...

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: eventName, channel, data: bodyStr })  // ← But THIS is actually sent
    //                                                                      ^^^ DIFFERENT string!
  });
};
```

The MD5 is computed on `{"amount":100,"name":"Test"}` but the actual POST body sent is `{"name":"new-donation","channel":"mr_champion-dashboard","data":"{\"amount\":100,\"name\":\"Test\"}"}` — Pusher rejects this mismatch every time.

### The Fix (Matching the working razorpay-webhook pattern exactly)

Build the **full body first**, compute MD5 on that full body, then send that same body string:

```typescript
const sendPusherEvent = async (channel: string, eventName: string, data: any) => {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Build the full POST body first
  const body = JSON.stringify({
    name: eventName,
    channel: channel,
    data: JSON.stringify(data)    // inner data is JSON-stringified
  });
  
  // Compute MD5 on the ACTUAL body being sent
  const md5Hex = createHash('md5').update(body).digest('hex');
  
  const stringToSign = `POST\n/apps/${pusherCreds.appId}/events\nauth_key=${pusherCreds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hex}`;
  const signature = createHmac('sha256', pusherCreds.secret!).update(stringToSign).digest('hex');
  
  const url = `https://api-${pusherCreds.cluster}.pusher.com/apps/${pusherCreds.appId}/events?auth_key=${pusherCreds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hex}&auth_signature=${signature}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body    // Send the SAME string the MD5 was computed on
  });
  
  if (!response.ok) {
    console.error(`[Unified] Pusher ${eventName} failed:`, await response.text());
  } else {
    console.log(`[Unified] Pusher ${eventName} sent to ${channel}`);
  }
};
```

### Technical Details

- File to edit: `supabase/functions/check-payment-status-unified/index.ts`
- Lines to replace: the `sendPusherEvent` function body (lines 245-266)
- No other files, functions, database tables, or streamer pages are affected
- This is identical to the pattern already working in `razorpay-webhook`
- After the fix, all Pusher events (dashboard, audio, goal, leaderboard) will fire correctly for Mr Champion and all other streamers using this function
