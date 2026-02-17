

## Improve Zishu Donation Card Readability

### Problem
The donation card blends into the page background, making text hard to read because both use the same background image with similar dark overlays.

### Solution
Make the inner card visually distinct with a stronger dark overlay and subtle border glow.

### Changes (only `src/pages/Zishu.tsx`)

1. **Increase card overlay darkness**: Change `bg-black/70` to `bg-black/80` for better text contrast
2. **Add a backdrop-blur** to the card overlay div so the background image becomes softer: `bg-black/80 backdrop-blur-md`
3. **Strengthen card border**: Change `border-purple-500/20` to `border-purple-500/40` so the card edge is more visible
4. **Add a subtle inner shadow/glow** to the Card: add `shadow-[0_0_30px_rgba(168,85,247,0.15)]` for a soft purple glow that separates it from the page

### No other files modified
Only styling tweaks in `src/pages/Zishu.tsx`. No other streamer pages, configs, or edge functions are touched.

