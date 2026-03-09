# Make Rewards Banner Text Bigger + Add Hyperpoints CTA on Status Page

## Changes

### 1. `src/components/RewardsBanner.tsx`

- Change "Earn Reward Points" text from `text-xs text-white/40` to `text-sm font-semibold text-yellow-400/80` — bigger, bolder, stands out
- Increase Gift icon size from `h-3 w-3` to `h-4 w-4`

### 2. `src/pages/Status.tsx`

- Add a standout "Check your Hyperpoints here" banner on the success status screen
- Styled as a glowing yellow/gold card with a Gift icon, placed after the order details and before the action buttons
- Links to `/hyperpoints` (or a placeholder route — needs clarification if there's an existing Hyperpoints page, use this : [https://hyperchat.store/](https://hyperchat.store/))
- Only shown on successful payments

Both changes are frontend-only, no backend or database modifications.