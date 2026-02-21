

# Voice Transcription Feature for Zishu's Dashboard

## Overview
Add a Sarvam AI-powered speech-to-text transcription feature to Zishu's dashboard. A "Transcribe" button will appear on voice message donations in the Approved Donations tab, letting Zishu read what donors said in their voice messages.

## How It Works
1. Zishu sees a voice donation in the Approved Donations tab
2. Clicks "Transcribe" on that donation
3. The voice audio is sent to Sarvam AI via an edge function
4. The transcript text appears below the voice player

## Implementation Steps

### Step 1: Add Sarvam API Key Secret
The `SARVAM_API_KEY` secret needs to be added to Supabase. You will be prompted to paste your API key from the Sarvam AI dashboard.

### Step 2: Create Edge Function - `transcribe-voice-sarvam`
**File:** `supabase/functions/transcribe-voice-sarvam/index.ts`

- Accepts `{ voiceUrl: string, streamerSlug: string }`
- Validates the request with auth token (following existing security pattern)
- Only allows `zishu` as streamer slug (for now)
- Downloads the voice audio from the URL
- Sends it to Sarvam AI's `speechToText.transcribe` endpoint (REST API, not SDK -- SDK won't work in Deno)
- Returns `{ transcript: string }`

### Step 3: Create Reusable Component - `VoiceTranscriber`
**File:** `src/components/dashboard/VoiceTranscriber.tsx`

- Props: `voiceUrl`, `donationId`, `streamerSlug`, `brandColor`
- Shows a "Transcribe" button next to voice donations
- On click: calls the edge function, shows loading state, displays transcript
- Caches transcripts locally (in component state) so re-clicking doesn't re-fetch
- Designed as a standalone, reusable component that can be added to other dashboards later

### Step 4: Add `enableVoiceTranscription` Prop to StreamerDashboard
**File:** `src/components/dashboard/StreamerDashboard.tsx` (minimal change)

- Add optional `enableVoiceTranscription?: boolean` prop
- Pass it through to the donations rendering section
- When enabled, render `VoiceTranscriber` below voice messages in the Approved Donations tab

### Step 5: Add Prop to StreamerDashboardWrapper
**File:** `src/components/dashboard/StreamerDashboardWrapper.tsx`

- Pass through the new `enableVoiceTranscription` prop

### Step 6: Enable in ZishuDashboard Only
**File:** `src/pages/dashboard/ZishuDashboard.tsx`

- Add `enableVoiceTranscription={true}` to the wrapper -- no other dashboard files are touched

## Technical Details

### Sarvam AI REST API Call (Edge Function)
```text
POST https://api.sarvam.ai/speech-to-text-translate
Headers: api-subscription-key: {SARVAM_API_KEY}
Body (multipart/form-data): file, model="saaras:v3", mode="transcribe"
Response: { transcript: "..." }
```

### Files Created
- `supabase/functions/transcribe-voice-sarvam/index.ts`
- `src/components/dashboard/VoiceTranscriber.tsx`

### Files Modified (minimal, additive only)
- `src/components/dashboard/StreamerDashboard.tsx` -- add optional prop + conditional render
- `src/components/dashboard/StreamerDashboardWrapper.tsx` -- pass through prop
- `src/pages/dashboard/ZishuDashboard.tsx` -- enable the feature
- `supabase/config.toml` -- add function config with `verify_jwt = false`

### What Is NOT Changed
- No other streamer dashboard pages
- No donation page UI changes
- No existing edge functions modified
- No database schema changes needed

