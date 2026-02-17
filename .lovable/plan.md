

## Update Zishu Branding: Purple Theme and New Images

### What Changes
1. **Save uploaded images** to the project as Zishu's logo and background
2. **Change brand color** from red (`#e11d48`) to purple (`#a855f7`) across all Zishu-related files

### Files to Update

**New assets (copy from uploads):**
- `user-uploads://channels4_profile-15.jpg` -> `public/assets/streamers/zishu-logo.png`
- `user-uploads://channels4_banner-15.jpg` -> `public/assets/streamers/zishu-background.png`

**Color changes (`#e11d48` -> `#a855f7`):**

1. **`src/config/streamers.ts`** (line 55) - Central brand color
2. **`src/config/donationPageConfigs.ts`** (line 75) - Donation page config
3. **`src/pages/Zishu.tsx`** - Three hardcoded color references (lines 194, 356, 388) plus all `rose-*` Tailwind classes replaced with `purple-*` equivalents:
   - Background gradient: `from-rose-950 via-red-900 to-pink-900` -> `from-purple-950 via-violet-900 to-purple-900`
   - Border/accent colors: `rose-500` -> `purple-500`, `rose-300` -> `purple-300`, `rose-400` -> `purple-400`
   - Button: `bg-rose-600 hover:bg-rose-700` -> `bg-purple-600 hover:bg-purple-700`
   - Glow overlays: `from-rose-500/20 via-red-500/20 to-pink-500/20` -> `from-purple-500/20 via-violet-500/20 to-purple-500/20`
4. **`src/pages/audio-player/ZishuMediaSourcePlayer.tsx`** (line 9) - Brand color prop

### Technical Details
- All `rose-*` Tailwind utility classes in `Zishu.tsx` will be replaced with `purple-*` equivalents
- The hex color `#a855f7` (Tailwind purple-500) matches the purple glow aesthetic from Zishu's profile image
- No other streamer pages or shared components are modified
- The uploaded profile image will serve as the logo, and the banner as the background

