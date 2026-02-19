

## Remove Inner Circle from W Era and Mr Champion Pages

### Problem
Both the W Era and Mr Champion donation pages have a circular avatar element (the "inner circle") in the card header that should be removed.

### Changes

**File 1: `src/pages/WEra.tsx`** (lines 209-211)
- Remove the `<div className="w-20 h-20 rounded-full ...">` block containing the "W" letter avatar

**File 2: `src/pages/MrChampion.tsx`** (lines 209-211)
- Remove the `<div className="w-20 h-20 rounded-full ...">` block containing the "MC" letter avatar

### No Other Changes
- Only the avatar circle elements are removed
- The streamer name title and subtitle text remain intact
- No backend, database, or edge function changes
