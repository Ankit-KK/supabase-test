

# Add Discord Option to "Get Connected" Dialog

## What Changes

Modify `src/components/SignupDialog.tsx` to show a two-option landing screen when the dialog opens:

1. **Discord** -- Links to your Discord server with a "Faster Response" badge
2. **Signup Form** -- The existing form, shown when the user clicks this option

## How It Works

When the user clicks "Get Connected", the dialog opens showing two cards side by side (stacked on mobile):

```text
+----------------------------------+
|    Get Connected with HyperChat  |
|    Choose how you'd like to      |
|    reach us                      |
|                                  |
|  +------------+  +------------+  |
|  | Discord    |  | Signup     |  |
|  | (icon)     |  | Form      |  |
|  |            |  | (icon)     |  |
|  | Join our   |  | Fill in    |  |
|  | server for |  | your       |  |
|  | instant    |  | details    |  |
|  | support    |  |            |  |
|  |            |  |            |  |
|  | [FASTER    |  |            |  |
|  |  RESPONSE] |  |            |  |
|  +------------+  +------------+  |
+----------------------------------+
```

- Clicking **Discord** opens the Discord invite link in a new tab (e.g., `https://discord.gg/your-invite`) and closes the dialog.
- Clicking **Signup Form** transitions the dialog content to show the existing form (no changes to the form itself).
- A back arrow on the form view returns to the two-option screen.

## Technical Details

### File: `src/components/SignupDialog.tsx`

1. Add a `view` state: `'options' | 'form'`, defaulting to `'options'`
2. Reset `view` to `'options'` when dialog closes (in `onOpenChange`)
3. When `view === 'options'`: render two clickable cards
   - Discord card: opens invite link via `window.open()`, closes dialog
   - Form card: sets `view` to `'form'`
4. When `view === 'form'`: render the existing form as-is, with a back button to return to options
5. Use the Discord SVG icon (inline) and a `MessageSquare` icon from lucide-react for the form option
6. Add a small green badge/pill saying "Faster Response" on the Discord card

### No other files changed
- Navbar stays the same (still calls `setShowSignupDialog(true)`)
- No database changes
- No edge function changes

