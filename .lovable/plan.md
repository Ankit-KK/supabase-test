
## Fix: Apple Pay Verification File Has Wrong Content (Hex Instead of JSON)

### Root Cause

When the binary file was uploaded to Lovable, it was stored as a hex-encoded string instead of its actual content. The file currently contains:

```
7b2276657273696f6e223a312c...7d
```

But Apple's verification servers expect the decoded JSON content:

```json
{"version":1,"pspId":"1EDBF0FDBF5FA2065E29979C27D7CC7C95341B4E065BD8D883165802200 9A572","createdOn":1749646752541}
```

Apple reads this file directly. If it receives a hex string instead of valid content, it rejects the domain verification.

---

### The Fix

Replace the hex content in `public/.well-known/apple-developer-merchantid-domain-association` with the decoded JSON content.

The hex string decodes to exactly:

```json
{"version":1,"pspId":"1EDBF0FDBF5FA2065E29979C27D7CC7C95341B4E065BD8D883165802200 9A572","createdOn":1749646752541}
```

This is the content Apple needs to read and verify.

---

### Files to Change

| File | Change |
|---|---|
| `public/.well-known/apple-developer-merchantid-domain-association` | Replace hex string with the decoded JSON content |

---

### After the Fix

Once published (NOT just previewed — the published URL is what Razorpay/Apple checks):

1. Go to: `https://hyperchat.site/.well-known/apple-developer-merchantid-domain-association`
2. You should see the raw JSON text in the browser
3. Then go to **Razorpay Dashboard** → Account & Settings → International Payments → Apple Pay → **Verify domains**

---

### Note on Hosting

The `vercel.json` is already correctly configured with the negative lookahead to bypass the SPA rewrite for `.well-known`. No changes needed there. This fix is purely the file content.

### Scope

Only `public/.well-known/apple-developer-merchantid-domain-association` is changed. No edge functions, no streamer pages, no other files are touched.
