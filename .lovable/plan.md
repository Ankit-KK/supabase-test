

# Tiered Character Limits for Clumsy God Message Textarea

## Overview

Add amount-based character limits to the message textarea on the Clumsy God donation page. Higher donations unlock longer messages.

## Tiers (INR)

| Amount Range | Max Characters |
|-------------|---------------|
| 40 - 99     | 70            |
| 100 - 299   | 150           |
| 300+        | 200           |

## File to Modify

**`src/pages/ClumsyGod.tsx`**

### Change 1: Add a helper function to compute max characters based on amount

```typescript
const getMaxMessageLength = (amount: number) => {
  if (amount >= 300) return 200;
  if (amount >= 100) return 150;
  return 70;
};
```

### Change 2: Use it in the textarea section (around lines 329-341)

- Add `maxLength` using the helper
- Truncate `formData.message` if the user lowers the amount and the existing message exceeds the new limit
- Add a live character counter showing `X / Y`

```tsx
{donationType === "text" && (
  <div className="space-y-1">
    <textarea
      name="message"
      value={formData.message.slice(0, getMaxMessageLength(currentAmount))}
      onChange={handleInputChange}
      maxLength={getMaxMessageLength(currentAmount)}
      className="w-full min-h-[90px] rounded-md
                 bg-black/40 text-white placeholder:text-gray-400
                 border border-purple-500/30
                 focus:border-purple-500 focus:ring-purple-500/20
                 px-3 py-2 text-sm"
      placeholder="Your message (optional)"
    />
    <p className="text-xs text-right text-muted-foreground">
      {Math.min(formData.message.length, getMaxMessageLength(currentAmount))} / {getMaxMessageLength(currentAmount)}
    </p>
  </div>
)}
```

### Edge case handling

When the user changes the amount downward (e.g., from 300 to 50), the message will be visually sliced to the new limit and `maxLength` will prevent further typing beyond it. The `handleInputChange` function remains unchanged -- native `maxLength` handles enforcement.

No other files, edge functions, or streamer pages are modified.

