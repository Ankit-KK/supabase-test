

# Fix Network Buffer Bug + Add Media Source Documentation

## Changes

### 1. `src/components/dashboard/OBSTokenManager.tsx` — Line 688
Fix the dangerous instruction that crashes OBS:
```
// Before:
<li>Set "Network Buffer" to 0 or minimal value</li>

// After:
<li>Set "Network Buffering" to 2 MB or above (do NOT set to 0 — it crashes OBS)</li>
```

### 2. `docs/ADD_NEW_STREAMER.md` — Insert after line 143 (after the `---`)

Add a detailed section explaining the Media Source Audio Alternative feature:

```markdown
### How "🎧 Media Source Audio (Alternative)" Works

The streamer's **dashboard** (`OBSTokenManager` component) automatically shows a
"🎧 Media Source Audio (Alternative)" section once the streamer has an active OBS token.

This provides:
- A **Media Source URL** in the format:
  `{SUPABASE_FUNCTIONS_BASE}/get-current-audio?token={OBS_TOKEN}`
- **OBS Setup Instructions** for streamers to configure a Media Source instead of Browser Source

**How it works:**
1. Streamer copies the Media Source URL from their dashboard
2. In OBS, they add a **Media Source** (not Browser Source)
3. They uncheck "Local File" and paste the URL
4. OBS polls the `get-current-audio` edge function
5. The edge function checks the streamer's donation table for unplayed audio
6. If audio is found → returns a **302 redirect** to the static R2 audio file
7. If no audio → returns **204 No Content**

**What enables it (no extra per-streamer code needed):**
- ✅ Step 5 mappings in `get-current-audio` (`STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP`)
- ✅ Streamer has generated an OBS token from their dashboard
- The UI is built into the shared `OBSTokenManager` component automatically

**OBS Settings (Critical):**
- ✅ Enable "Restart playback when source becomes active"
- ✅ Enable "Close file when inactive"
- ✅ Set "Network Buffering" to **2 MB or above** (do NOT set to 0 — it will crash OBS)
- 💡 Use Advanced Scene Switcher plugin to auto-reload the source every 3-5 seconds
```

## Files changed
1. `src/components/dashboard/OBSTokenManager.tsx` — 1 line fix
2. `docs/ADD_NEW_STREAMER.md` — insert ~25 lines after line 143

