

# Lock Amount Field for HyperSound Donations

## Problem
When users select HyperSound donation type and then change the amount, the sound doesn't play correctly. The amount should be locked to the minimum HyperSound price.

## Change
Across all 11 streamer donation pages, make the amount `Input` field **read-only** when `donationType === "hypersound"`:

**Files to edit:**
- `src/pages/Ankit.tsx`
- `src/pages/Brigzard.tsx`
- `src/pages/ChiaaGaming.tsx`
- `src/pages/ClumsyGod.tsx`
- `src/pages/Demigod.tsx`
- `src/pages/DorpPlays.tsx`
- `src/pages/LooteriyaGaming.tsx`
- `src/pages/MrChampion.tsx`
- `src/pages/WEra.tsx`
- `src/pages/Wolfy.tsx`
- `src/pages/Zishu.tsx`

**What changes per file:**
Add `readOnly={donationType === "hypersound"}` and a dimmed style (`opacity-50 cursor-not-allowed`) to the amount `<Input>` when hypersound is selected. This ensures the amount stays at `pricing.minHypersound` and users can't modify it.

