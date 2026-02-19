
## Apple Pay Domain Verification Setup for HyperChat

### What Needs to Happen

Apple Pay's domain verification requires hosting a specific file at an exact path on your website:

```
https://www.hyperchat.site/.well-known/apple-developer-merchantid-domain-association
```

The file must:
- Return HTTP **200** directly (no redirects)
- Be served as `Content-Type: text/plain`
- Be publicly accessible with no authentication

### The Problem with the Current Setup

The `vercel.json` currently has a **catch-all rewrite rule**:
```json
"source": "/(.*)",
"destination": "/index.html"
```

This means **every** request — including `/.well-known/apple-developer-merchantid-domain-association` — gets rewritten to `/index.html` with a 200 OK but serving the React app HTML instead of the verification file. Apple's servers will reject this because it expects the raw verification content, not an HTML page.

This rewrite rule must be updated to **exclude** the `.well-known` path.

---

### Changes Required

**1. Extract and place the verification file**

The uploaded zip contains the file `apple-developer-merchantid-domain-association`. This needs to go into:
```
public/.well-known/apple-developer-merchantid-domain-association
```

Placing it in `public/` ensures Vite/Vercel serves it as a static file at the root of the domain.

**2. Update `vercel.json` to exclude `.well-known` from the catch-all rewrite**

The rewrite must be changed to only match paths that are NOT the `.well-known` directory. Vercel supports negative lookaheads in source patterns:

```json
{
  "rewrites": [
    {
      "source": "/((?!.well-known).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [...]
    },
    {
      "source": "/.well-known/apple-developer-merchantid-domain-association",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/plain"
        }
      ]
    }
  ]
}
```

This ensures:
- All React app routes still work (everything except `.well-known` hits `index.html`)
- The Apple verification file is served directly as `text/plain` with HTTP 200
- No redirects occur

---

### Files to Change

| File | Change |
|---|---|
| `public/.well-known/apple-developer-merchantid-domain-association` | New file — copy from the uploaded zip |
| `vercel.json` | Update rewrite to exclude `.well-known`, add `Content-Type: text/plain` header for the verification path |

---

### After Deployment

Once published, verify the file is accessible:
```
https://www.hyperchat.site/.well-known/apple-developer-merchantid-domain-association
```

Then go to Razorpay Dashboard → Account & Settings → International Payments → Apple Pay → click **Verify domains**. The domain status will change to "Verified" and Apple Pay will automatically appear on checkout for eligible Apple device users — no code changes to the checkout flow required.

---

### Scope

Only `vercel.json` and the new static file are affected. No edge functions, no streamer pages, no React components are touched.
