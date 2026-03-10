

# Save Complete Streamer Addition Guide

I'll create a single comprehensive markdown document at `docs/ADD_NEW_STREAMER.md` containing every step, every file, every SQL statement, and every config entry needed to add a new streamer — all in one place.

The document will cover all 14 steps from the verified guide, with exact code snippets for each file, using `[SLUG]`, `[NAME]`, `[COLOR]`, `[PREFIX]`, and `[TABLE_ID]` as placeholders that you replace with real values.

## What the doc will contain

1. Database SQL (table + RLS + view + streamer record insert)
2. All 4 edge function config additions (exact objects to add)
3. Both frontend config files (`streamers.ts` + `donationPageConfigs.ts`)
4. All 5 page files (donation via `DonationPageWrapper`, dashboard, OBS alerts, goal overlay, audio player) — complete copy-pasteable code
5. `App.tsx` route additions
6. `Status.tsx` prefix mapping additions
7. Asset requirements
8. Post-signup SQL for account linking
9. Security checklist
10. List of functions that do NOT need changes

Single file, everything included, no cross-references needed.

