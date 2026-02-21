

## Auto-Transcribe Voice Messages

### Change
Remove the "Transcribe" button entirely. Instead, voice messages will automatically transcribe when the component mounts (or when a new voice donation appears via Pusher). The transcript will display inline below the voice player with a loading spinner while processing.

### Technical Details

**File: `src/components/dashboard/VoiceTranscriber.tsx`**
- Replace the button-based UI with a `useEffect` that triggers transcription automatically on mount
- Show a small loading indicator ("Transcribing..." with spinner) while the API call is in progress
- Once complete, display the transcript text inline
- Keep the existing `transcriptCache` Map to avoid redundant API calls when components re-render
- If transcription fails, show a subtle error message instead of a toast (since it's automatic, toasts would be noisy)

### What Stays the Same
- Edge function (`transcribe-voice-sarvam`) -- no changes
- `StreamerDashboard.tsx` -- no changes (already renders VoiceTranscriber for voice donations)
- `ZishuDashboard.tsx` -- no changes
- Cache logic -- same Map-based caching
- Auth token handling -- same pattern

### Result
Every voice message donation in Zishu's Approved Donations tab will automatically show its transcript text beneath the voice player, with no user interaction required.
