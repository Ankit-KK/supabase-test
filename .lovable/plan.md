

# Update `docs/ADD_NEW_STREAMER.md` — Fix All Gaps

The current doc has these problems:
1. References `DonationPageWrapper` as "Option A" but **no donation page actually uses it** — all 11 streamers use custom standalone pages (~375 lines each, like `Demigod.tsx`)
2. No concrete line-by-line replacement guide for creating a donation page from the Demigod template
3. `[TABLE_ID]` selection is vague ("next available smallint")
4. No "redeploy edge functions" reminder
5. `storagePrefix` convention is inconsistent — the codebase uses **snake_case matching the slug** for all streamers except `chiaa_gaming` (which uses `chiaa-gaming`)

## What changes

Rewrite `docs/ADD_NEW_STREAMER.md` with these fixes:

### Fix 1: Replace "Option A / Option B" with a single concrete approach
Remove the DonationPageWrapper option entirely. The guide will say: "Copy `src/pages/Demigod.tsx` and make these replacements." Then provide an **exact replacement table** covering every hardcoded value in Demigod.tsx:

| Find | Replace with | Lines |
|------|-------------|-------|
| `"demigod"` (streamer slug, 4 occurrences) | `"[SLUG]"` | 43, 161, 168, 348 |
| `"Demigod"` (display name, 4 occurrences) | `"[NAME]"` | 189, 190, 210, 213 |
| `#ac1117` / `#AC1117` (brand color, 5 occurrences) | `[COLOR]` | 195, 234, 236, 303, 338, 363, 370 |
| `#24201D` (background dark) | Custom bg color |
| `#3D4158` (border/secondary) | Custom border color |
| `#EDE7E7` (text color) | Custom text color |
| `#7E797D` (muted text) | Custom muted color |
| `#8e0e13` (hover state) | Darker variant of `[COLOR]` |
| Component name `Demigod` | `[ComponentName]` (PascalCase) |
| File name | `src/pages/[ComponentName].tsx` |

### Fix 2: Explicit TABLE_ID selection
Add a concrete step: "Check `src/config/streamers.ts` → `DONATION_TABLE_ID_MAP`. The current highest ID is `10` (demigod_donations). Your new streamer gets `11`."

### Fix 3: Edge function deployment reminder
Add a callout after edge function steps: "Edge functions in this project auto-deploy when saved. No manual deployment needed."

### Fix 4: storagePrefix convention
Document that `storagePrefix` should use **snake_case matching the slug** (e.g., `shadow_x`). Note the one exception: `chiaa_gaming` uses `chiaa-gaming` for legacy reasons.

### Fix 5: Remove DonationPageWrapper references
The wrapper component exists in the codebase but is unused. The doc should not reference it as an option to avoid confusion.

## Files to change
- `docs/ADD_NEW_STREAMER.md` — full rewrite of the donation page section + add TABLE_ID guidance + add deploy note + fix storagePrefix

