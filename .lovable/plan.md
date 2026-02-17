

## Use Zishu Images on the Donation Page

### Problem
The uploaded images were saved to `public/assets/streamers/zishu-logo.png` and `zishu-background.png`, but `src/pages/Zishu.tsx` never references them. The page only shows a plain purple CSS gradient.

### Solution
Update `src/pages/Zishu.tsx` to display both images, following the same pattern used by ChiaaGaming:

### Changes (all in `src/pages/Zishu.tsx`)

1. **Full-page background** -- Replace the plain gradient `div` with one that uses `zishu-background.png` as a `background-image`:
   ```
   style={{ backgroundImage: "url('/assets/streamers/zishu-background.png')" }}
   ```
   Keep the dark overlay (`bg-black/40`) on top for readability.

2. **Card background** -- Add the background image to the Card as well (with overlay), matching how ChiaaGaming layers its card:
   ```
   style={{ backgroundImage: "url('/assets/streamers/zishu-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}
   ```

3. **Circular logo** -- Add a circular logo image above the title text in the CardHeader:
   ```html
   <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500 shadow-xl">
     <img src="/assets/streamers/zishu-logo.png" alt="Zishu Logo" />
   </div>
   ```

### No other files are modified
Only `src/pages/Zishu.tsx` is changed. No other streamer pages, configs, or edge functions are touched.

