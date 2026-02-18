

## Fix: Add Media/Voice Preview Buttons to Moderation Notifications

### Problem

When a donation includes an image, GIF, video, or voice message, moderators on Telegram and Discord only see a text label like "Media: Image attached" or "Voice: Available" -- they cannot actually view the content before approving/rejecting.

### Solution

Instead of embedding media files directly (which would increase egress costs), add clickable URL buttons that link moderators to the content. This keeps the notification lightweight while giving moderators the ability to review media before making a decision.

### Changes Required

**File:** `supabase/functions/notify-new-donations/index.ts`

**1. Telegram section (~lines 256-328):** Add URL buttons for media and voice before the Dashboard button row.

- If `donation.voice_message_url` exists, add a button row:
  `[{ text: '🎵 Listen Voice', url: donation.voice_message_url }]`

- If `donation.media_url` exists, add a button row:
  `[{ text: '📎 View Media', url: donation.media_url }]`

These buttons go into the `keyboard` array right before the Dashboard link row (line 297).

**2. Discord section (~lines 331-440):** Add URL buttons for media and voice before the Dashboard button row.

- If `donation.voice_message_url` exists, add a component row:
  `{ type: 1, components: [{ type: 2, style: 5, label: '🎵 Listen Voice', url: donation.voice_message_url }] }`

- If `donation.media_url` exists, add a component row:
  `{ type: 1, components: [{ type: 2, style: 5, label: '📎 View Media', url: donation.media_url }] }`

These go into the `components` array right before the Dashboard link component.

**3. Telegram `/pending` command -- `sendDonationCard` function (~lines 355-398):** Add the same URL buttons for voice and media so moderators using `/pending` can also preview content.

### No Other Changes

- No frontend changes needed
- No database changes needed
- No other edge functions affected
- Existing notification text labels ("Voice: Available", "Media: Image attached") remain as-is for context

### Egress Consideration

URL buttons only open the link when clicked by a moderator -- no automatic download or embedding occurs. This approach has zero additional egress cost compared to the current text-only approach, while giving moderators the ability to review content on demand.

