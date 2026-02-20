
## Fix: Remove Space from pspId in Apple Pay Domain Association File

### What's Wrong

The file `public/.well-known/apple-developer-merchantid-domain-association` has a stray space character inside the `pspId` hex string:

Current (broken):
```
"pspId":"1EDBF0FDBF5FA2065E29979C27D7CC7C95341B4E065BD8D883165802200 9A572"
                                                                      ^
                                                              space here!
```

Correct (from Razorpay dashboard, decoded from the uploaded hex file):
```
"pspId":"1EDBF0FDBF5FA2065E29979C27D7CC7C95341B4E065BD8D8831658022009A572"
```

Apple's verification server downloads this file and compares it byte-for-byte against what Razorpay registered. The single space character causes the match to fail every time — even though the file is correctly hosted and reachable via HTTPS.

### The Fix

**File:** `public/.well-known/apple-developer-merchantid-domain-association`

Replace the entire file content with the exact string decoded from the Razorpay dashboard upload:

```json
{"version":1,"pspId":"1EDBF0FDBF5FA2065E29979C27D7CC7C95341B4E065BD8D8831658022009A572","createdOn":1749646752541}
```

The only change is `802200 9A572` → `8022009A572` (space removed).

### Steps After Publishing

1. Publish the project (this deploys the corrected file to hyperchat.site and hyperchat.space)
2. Go to Razorpay Dashboard → Settings → Apple Pay
3. Click Verify for `hyperchat.site`
4. Verification should pass immediately — the file is already reachable at the correct URL with HTTP 200 and no redirects

### Technical Details

- No backend changes needed
- No edge function changes needed
- No DNS changes needed — the hosting infrastructure is already correct
- Both `hyperchat.site` and `hyperchat.space` share the same deployed file, so both will be verifiable after this single fix
- The `vercel.json` exclusion rule for `.well-known` is already correct and does not need modification
