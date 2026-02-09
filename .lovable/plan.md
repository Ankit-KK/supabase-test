

# Add Per-Streamer TTS Accent/Language Setting

## Overview

Currently, the `language_boost` parameter in the MiniMax TTS API call is hardcoded to `"Hindi"` for all streamers. This change adds a configurable `tts_language_boost` column to the `streamers` table so each streamer can pick their preferred accent.

## Changes

### 1. Database Migration

Add a new column `tts_language_boost` to the `streamers` table:

```sql
ALTER TABLE public.streamers
ADD COLUMN tts_language_boost text DEFAULT 'Hindi';
```

Default is `'Hindi'` so existing behavior is preserved.

### 2. Edge Function: `generate-donation-tts/index.ts`

- Update the `.select()` query (line 204) to also fetch `tts_language_boost`
- Replace the hardcoded `language_boost: "Hindi"` (line 329) with `streamerData.tts_language_boost || "Hindi"`

### 3. Edge Function: `update-streamer-settings/index.ts`

- Add `'tts_language_boost'` to the `allowedSettings` array (line 35) so it can be changed from the dashboard

### 4. Frontend: `src/components/dashboard/SettingsPanel.tsx`

- Add a dropdown/select for "TTS Accent" with options matching MiniMax's supported `language_boost` values (e.g., Hindi, English, Arabic, Chinese, etc.)
- Wire it to call `update-streamer-settings` with setting `tts_language_boost`

### 5. Types: `src/integrations/supabase/types.ts`

- Add `tts_language_boost` to the `streamers` table type definitions (Row, Insert, Update)

## Supported Language Options

Based on MiniMax API, these are the `language_boost` options to offer:

- Hindi
- English
- Arabic
- Chinese
- French
- German
- Indonesian
- Italian
- Japanese
- Korean
- Portuguese
- Russian
- Spanish
- Thai
- Turkish
- Vietnamese

## Technical Notes

- No existing streamer pages or backends are modified beyond the specific lines listed
- Default value ensures zero disruption to current behavior
- The setting follows the same pattern as `tts_voice_id` and `tts_volume`

