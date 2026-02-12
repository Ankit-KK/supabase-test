

# StreamElements Audio Alerts for Looteriya Gaming

## What stays the same
- Visual on-screen alerts (UnifiedAlertDisplay via OBS Browser Source) -- no changes
- The `get-current-audio` edge function -- no changes
- Pusher events, database, payment flow -- no changes
- All other streamers -- no changes

## What changes
Replace the OBS Media Source audio player with a **StreamElements Custom Widget** that does the same job -- polls `get-current-audio` and plays the audio. StreamElements widgets are more reliable as browser sources since they stay alive and auto-recover.

## How it works

The current flow:
1. OBS Media Source polls `get-current-audio` endpoint
2. Edge function returns audio URL + triggers `audio-now-playing` Pusher event
3. OBS Browser Source (alerts page) receives Pusher event and shows visual alert

The new flow:
1. **StreamElements Custom Widget** polls `get-current-audio` endpoint (replaces Media Source)
2. Edge function returns audio URL + triggers `audio-now-playing` Pusher event (unchanged)
3. OBS Browser Source (alerts page) receives Pusher event and shows visual alert (unchanged)

## Implementation

### No code changes needed in the project

The StreamElements custom widget is configured entirely inside StreamElements' overlay editor -- it's just HTML/JS/CSS that runs in their system. Your codebase stays untouched.

### StreamElements Setup Steps

1. Go to **StreamElements Dashboard** -> **My Overlays** -> Create new overlay
2. Add a **Custom Widget** (Static/Custom -> Custom Widget)
3. Paste the following code into the widget's **HTML**, **JS**, and **CSS** tabs:

**JS (Custom Widget):**
```javascript
const AUDIO_ENDPOINT = 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/get-current-audio';
const OBS_TOKEN = 'YOUR_LOOTERIYA_OBS_TOKEN_HERE';
const POLL_INTERVAL = 4000; // Poll every 4 seconds

let isPlaying = false;

async function checkForAudio() {
  if (isPlaying) return;
  
  try {
    const response = await fetch(`${AUDIO_ENDPOINT}?token=${OBS_TOKEN}`, {
      redirect: 'follow'
    });
    
    if (response.status === 204) return; // No audio
    if (!response.ok) return;
    
    // Got audio - play it
    isPlaying = true;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      isPlaying = false;
      URL.revokeObjectURL(url);
    };
    
    audio.onerror = () => {
      isPlaying = false;
      URL.revokeObjectURL(url);
    };
    
    await audio.play();
  } catch (err) {
    console.error('Audio poll error:', err);
    isPlaying = false;
  }
}

setInterval(checkForAudio, POLL_INTERVAL);
checkForAudio();
```

**HTML:** (empty or minimal div)
```html
<div id="audio-widget"></div>
```

**CSS:**
```css
#audio-widget { display: none; }
```

4. Save the overlay and copy the **Overlay URL**
5. In OBS, add a **Browser Source** with the StreamElements overlay URL
6. **Remove** the old Media Source for Looteriya Gaming audio

### Why this works
- `get-current-audio` already handles everything: fetches next queued donation, marks it as played, triggers the Pusher visual alert event, and redirects to the audio file
- The StreamElements widget just replaces the "thing that calls the endpoint and plays the audio"
- StreamElements browser sources are more stable than OBS Media Sources -- they don't need manual reloading or Advanced Scene Switcher plugins

### Important notes
- The OBS token for Looteriya must be pasted into the widget JS
- Only Looteriya Gaming uses this -- all other streamers keep their current setup
- The visual alerts Browser Source stays as a separate OBS source (unchanged)
- No edge functions, database, or frontend code is modified

