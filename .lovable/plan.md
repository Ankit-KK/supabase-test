

# Replace Donation-Related Terms in Moderation Showcase

## Problem

The `ModerationFeatures.tsx` component, displayed on both the homepage and `/feature-showcase`, uses donation-specific terms that should be avoided on the public-facing website.

## Changes (single file: `src/components/feature-showcase/ModerationFeatures.tsx`)

| Line | Current Text | Replacement |
|------|-------------|-------------|
| 43 | `"Donor ban list"` | `"User ban list"` |
| 78 | `"One-click donor banning with persistent blocklist"` | `"One-click user banning with persistent blocklist"` |
| 138 | `"💰 Donation Arrives"` | `"💬 Message Arrives"` |

## What stays the same

Everything else in the component remains untouched -- layout, animations, icons, comparison table, and all other text that doesn't reference donations or donors.

## Technical Details

- File: `src/components/feature-showcase/ModerationFeatures.tsx`
- Three string replacements on lines 43, 78, and 138
- No other files or edge functions are modified

