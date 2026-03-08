

## Plan: Restyle Demigod Page with Valorant ISO Colors

Based on ISO's color palette from Valorant:
- **Dark indigo/navy**: `#3d4158` (ISO's suit/armor)
- **Crimson red**: `#ac1117` (ISO's signature energy/accent)
- **Light contrast**: `#ede7e7` (highlights)
- **Deep dark**: `#24201d` (shadows)

### Color Mapping

| Element | Current | New (ISO) |
|---------|---------|-----------|
| Brand color / buttons | `#8b5cf6` (purple) | `#ac1117` (crimson red) |
| Brand light (labels, accents) | `#a78bfa` | `#d43a3a` (lighter red) |
| Background gradient | `#1a0a2e` → `#2d1b4e` | `#1a1520` → `#2a2035` → `#1a1520` (dark indigo-tinted) |
| Card background | `#1a0a2e` → `#2d1b4e` | `#1e1a2a` → `#2a2540` |
| Border colors | `#8b5cf6/30` | `#ac1117/30` |
| Razorpay theme | `#8b5cf6` | `#ac1117` |

### Files to Update

1. **`src/pages/Demigod.tsx`** — Replace all `#8b5cf6` → `#ac1117`, `#a78bfa` → `#d43a3a`, update background gradients to dark indigo tones
2. **`src/config/streamers.ts`** — Update `demigod.brandColor` to `#ac1117`
3. **`src/config/donationPageConfigs.ts`** — Update `demigod.brandColor` to `#ac1117`

No other files change — OBS alerts, dashboard, goal overlay all read `brandColor` dynamically from the database/config, so they auto-sync.

