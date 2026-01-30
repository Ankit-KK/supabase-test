
# Fix: Approved Donations Tab Not Updating After Approval

## Root Cause

The `StreamerDashboard.tsx` has a logic bug in the `onDonationUpdated` handler (lines 135-154):

```typescript
// CURRENT CODE - Only modifies EXISTING items
setApprovedDonations(prev => prev.map(d => 
  d.id === data.id ? { ...d, moderation_status: newStatus } : d
));
```

**The problem**: When a donation is approved, it was never in `approvedDonations` to begin with (pending donations aren't added there). The `map()` function only modifies existing items - it doesn't add new ones.

---

## Solution

When `action === 'approve'`, we need to **add** the donation to `approvedDonations`, not just update it. The Pusher event already contains all the data we need.

### File: `src/components/dashboard/StreamerDashboard.tsx`

**Change the `onDonationUpdated` handler (lines 135-155):**

```typescript
onDonationUpdated: (data) => {
  console.log('[Dashboard] Donation update via Pusher:', data);
  setLastDonationUpdate(data);
  
  if (data.id) {
    if (data.action === 'approve' || data.action === 'auto_approved') {
      // ADD newly approved donation to the list (it wasn't there before)
      setApprovedDonations(prev => {
        // Check if already exists to prevent duplicates
        if (prev.some(d => d.id === data.id)) {
          return prev.map(d => 
            d.id === data.id 
              ? { ...d, moderation_status: 'approved', message_visible: data.message_visible ?? d.message_visible }
              : d
          );
        }
        // Add new approved donation
        const newDonation: DonationRecord = {
          id: data.id,
          name: data.name,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
          voice_message_url: data.voice_message_url,
          tts_audio_url: data.tts_audio_url,
          hypersound_url: data.hypersound_url,
          media_url: data.media_url,
          media_type: data.media_type,
          message_visible: data.message_visible ?? true,
          moderation_status: 'approved',
          payment_status: 'success',
          created_at: data.created_at,
          streamer_id: streamerData?.id || '',
        };
        return [newDonation, ...prev.slice(0, 49)];
      });
    } else if (data.action === 'reject') {
      // Remove rejected donation from list
      setApprovedDonations(prev => prev.filter(d => d.id !== data.id));
    } else if (data.action === 'hide_message' || data.action === 'unhide_message') {
      // Update visibility only
      setApprovedDonations(prev => prev.map(d => 
        d.id === data.id 
          ? { ...d, message_visible: data.action === 'unhide_message' }
          : d
      ));
    }
  }
},
```

---

## What This Fixes

| Before | After |
|--------|-------|
| `map()` only updates existing items | Adds new approved donations to list |
| Approved donations never appear | Approved donations appear immediately |
| Only works if donation was already in list | Works for all approval actions |

---

## File to Modify

- `src/components/dashboard/StreamerDashboard.tsx` - Fix `onDonationUpdated` handler to add newly approved donations
