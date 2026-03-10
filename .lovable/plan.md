

# Replace Donation Page Section with Full Template Code

## What changes

Replace Step 10A (lines 208-241) in `docs/ADD_NEW_STREAMER.md` with the complete donation page code (~530 lines), based on `LooteriyaGaming.tsx` — the cleanest and most feature-complete donation page in the codebase.

**Why LooteriyaGaming over Ankit:** LooteriyaGaming (532 lines) uses the standard components (`EnhancedVoiceRecorder`, `MediaUploader`, `HyperSoundSelector`) cleanly. Ankit (734 lines) has custom video background logic, mobile video resume handlers, legacy image upload code, and `VoiceRecorder` instead of `EnhancedVoiceRecorder` — too much custom noise for a template.

## Template structure

The full code block will have every `looteriya_gaming` / `Looteriya Gaming` / `#f59e0b` replaced with the doc's standard placeholders:

- `looteriya_gaming` → `[SLUG]` (4 occurrences: pricing hook, voice upload, order creation, media uploader)
- `Looteriya Gaming` → `[NAME]` (4 occurrences: Razorpay name/description, card title, subtitle)
- `LooteriyaGaming` → `[PASCAL]` (component name + export)
- `#f59e0b` → `[COLOR]` (Razorpay theme, submit button, footer)
- `amber-500` → `[TW_COLOR]` (Tailwind color class used ~20 times for borders, focus rings, text)
- `amber-600` → `[TW_COLOR_DARK]` (gradient endpoint)
- `amber-400` → `[TW_COLOR_LIGHT]` (gradient variant)
- Logo/background imports → placeholder imports with comments

Also adds a color placeholder table at the top explaining the Tailwind color convention, and notes that the template uses 3 asset imports (logo, card background, main background) that must be added to `src/assets/`.

## Additional placeholder additions

Add to the placeholder table at the top of the doc:

| `[TW_COLOR]` | `amber-500` | Tailwind color class (no `#`, no `text-`/`border-` prefix) |
| `[TW_COLOR_DARK]` | `amber-600` | Darker Tailwind variant for gradients |
| `[TW_COLOR_LIGHT]` | `amber-400` | Lighter Tailwind variant for gradients |

## Line 357 fix

Also fix the stale "Only needed if using Option A (DonationPageWrapper)" note in Step 13 — replace with accurate guidance since the template now directly imports assets.

## File changed
- `docs/ADD_NEW_STREAMER.md` — replace lines 206-241 with full template code (~540 lines of markdown), update placeholder table (lines 5-14), fix Step 13 note (line 357)

