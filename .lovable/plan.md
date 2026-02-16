

# Update "Telegram" Tab to Include Discord UI

## Problem
The "Telegram" tab in the streamer dashboard only renders the legacy `TelegramDashboard` component, which has no Discord functionality. The `ModeratorManager` component already has full Discord support (bot setup, Discord User IDs, instructions) but is not wired into the dashboard.

## Solution
Replace the `TelegramDashboard` usage in `StreamerDashboard.tsx` with `ModeratorManager`, and rename the tab to "Notifications" to reflect that it now covers both Telegram and Discord.

## Changes

### 1. `src/components/dashboard/StreamerDashboard.tsx`
- Replace `import TelegramDashboard` with `import { ModeratorManager }`
- Rename the tab trigger from "Telegram" to "Notifications"
- Replace `<TelegramDashboard>` with `<ModeratorManager streamerId={streamerData.id} />`

This is a minimal 3-line change. The `ModeratorManager` already has:
- Telegram bot setup button
- Discord bot setup button
- Moderator add form with Telegram ID + Discord ID fields
- Moderator list showing both IDs
- Instructions for obtaining both IDs

No other files need to change. The `TelegramDashboard` component file will remain intact (per project rules -- do not modify/delete existing components unless explicitly instructed).

