
# Plan: Fix Dashboard Real-Time Moderation Sync

## Problem Summary

The dashboard has three interconnected issues affecting all streamers:

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| Approved items stay in Pending | Donations remain in moderation tab after approval | Event name mismatch: backend sends `donation-approved`, frontend listens for `donation-updated` |
| New pending donations don't appear | Must switch tabs to see new items needing moderation | Backend doesn't send `pending` action events for new moderation items |
| Approved Donations tab stale | Tab doesn't update after approvals | Same event mismatch + missing explicit refetch after state change |

---

## Solution Overview

Fix the real-time sync by:
1. Adding missing Pusher event listener for `donation-approved` 
2. Sending `pending` action events from payment webhooks when donations need moderation
3. Adding immediate refetch after moderation actions (per Stack Overflow proven pattern)

---

## Step 1: Fix Pusher Event Listener (Frontend)

### File: `src/hooks/usePusherDashboard.ts`

**Problem:** The hook only binds to `donation-updated` but the backend sends `donation-approved` for approvals.

**Fix:** Add a listener for `donation-approved` event:

```typescript
// Add after line 147 (after 'donation-updated' binding)
channel.bind('donation-approved', (data: DonationUpdateEvent) => {
  console.log('[PusherDashboard] Donation approved:', data);
  // Transform to standard format with 'approve' action
  if (onDonationUpdatedRef.current) {
    onDonationUpdatedRef.current({ ...data, action: 'approve' });
  }
});
```

---

## Step 2: Add Immediate Refetch After Moderation Actions (Frontend)

### File: `src/components/dashboard/moderation/ModerationPanel.tsx`

**Problem:** Relying solely on Pusher events creates 200-500ms latency where UI can become stale.

**Fix:** Add immediate refetch after successful moderation action (proven pattern):

```typescript
// In moderateDonation function, after line 247 (success check)
if (response.data?.success) {
  toast({ title: 'Success', description: `Donation ${action}d` });
  
  // IMMEDIATE: Update local state first for instant feedback
  if (action === 'approve') {
    const approvedDonation = pendingDonations.find(d => d.id === donationId);
    if (approvedDonation) {
      setPendingDonations(prev => prev.filter(d => d.id !== donationId));
      setRecentDonations(prev => [
        { ...approvedDonation, moderation_status: 'approved' },
        ...prev.slice(0, 9)
      ]);
      setPendingCount(prev => Math.max(0, prev - 1));
    }
  } else if (action === 'reject' || action === 'ban_donor') {
    setPendingDonations(prev => prev.filter(d => d.id !== donationId));
    setPendingCount(prev => Math.max(0, prev - 1));
  }
}
```

---

## Step 3: Send Pending Events from Webhook (Backend)

### File: `supabase/functions/razorpay-webhook/index.ts`

**Problem:** When a donation needs moderation (manual mode or media moderation), no Pusher event is sent to the dashboard.

**Fix:** Add `pending` action broadcast when donation goes to moderation queue:

After the donation status update (around line 380), add:

```typescript
// When donation needs moderation, notify dashboard
if (shouldHold) {
  await sendPusherEvent(
    [`${channelSlug}-dashboard`],
    'donation-updated',
    {
      id: donationId,
      action: 'pending',
      name: donation.name,
      amount: donation.amount,
      currency: donation.currency || 'INR',
      message: donation.message,
      voice_message_url: donation.voice_message_url,
      media_url: donation.media_url,
      media_type: donation.media_type,
      created_at: donation.created_at
    },
    pusherGroup
  );
  console.log(`Dashboard notified of pending donation requiring moderation`);
}
```

### File: `supabase/functions/check-payment-status-unified/index.ts`

**Same fix:** Add `pending` action broadcast when donation needs moderation.

---

## Step 4: Fix Approved Donations Tab Updates (Frontend)

### File: `src/components/dashboard/StreamerDashboard.tsx`

**Problem:** The `onNewDonation` handler adds ALL new donations to `approvedDonations`, but in manual mode, new donations should be pending.

**Fix:** Only add to approved list if moderation status is approved/auto_approved:

```typescript
// In onNewDonation handler (line 84-123), add condition:
onNewDonation: (donation) => {
  console.log('[Dashboard] New donation via Pusher:', donation);
  
  // Only add to approved list if already approved (auto_approve mode)
  const isApproved = donation.moderation_status === 'approved' || 
                     donation.moderation_status === 'auto_approved';
  
  if (isApproved) {
    const newDonation: DonationRecord = {
      // ... existing mapping
    };
    setApprovedDonations(prev => [newDonation, ...prev.slice(0, 49)]);
    // ... stats update
  }
  // Non-approved donations will be handled by moderation panel
}
```

---

## Technical Summary

| File | Change |
|------|--------|
| `src/hooks/usePusherDashboard.ts` | Add `donation-approved` event binding |
| `src/components/dashboard/moderation/ModerationPanel.tsx` | Add immediate local state updates after actions |
| `src/components/dashboard/StreamerDashboard.tsx` | Filter `onNewDonation` to only add approved donations |
| `supabase/functions/razorpay-webhook/index.ts` | Send `pending` action event for moderation queue |
| `supabase/functions/check-payment-status-unified/index.ts` | Send `pending` action event for moderation queue |

---

## Expected Behavior After Fix

1. **Approve donation** → Immediately removed from Pending tab, appears in Recent Approved
2. **New donation needing moderation** → Instantly appears in Pending tab with toast notification
3. **Approved Donations tab** → Only shows approved/auto_approved donations, updates in real-time
4. **No page switching required** → All updates happen via Pusher + immediate local state changes

---

## Files to Modify

- `src/hooks/usePusherDashboard.ts` (add event binding)
- `src/components/dashboard/moderation/ModerationPanel.tsx` (immediate state updates)
- `src/components/dashboard/StreamerDashboard.tsx` (filter by moderation status)
- `supabase/functions/razorpay-webhook/index.ts` (send pending events)
- `supabase/functions/check-payment-status-unified/index.ts` (send pending events)
