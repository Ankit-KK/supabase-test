

# Add Rewards Banner to All Donation Pages

## Current State
- `RewardsBanner` component exists and works (`src/components/RewardsBanner.tsx`)
- Only used in `src/pages/Ankit.tsx` (line 703, just above submit button)
- 10 other standalone donation pages + `DonationPageWrapper` do not have it

## Pages to Update (11 total)

### Standalone pages (10):
Each needs `import RewardsBanner` and the component placed just above the submit button, passing `amount` and `currency`.

| Page | Amount var | Currency var |
|---|---|---|
| `src/pages/ChiaaGaming.tsx` | `formData.amount` | `formData.currency` |
| `src/pages/LooteriyaGaming.tsx` | `formData.amount` | `formData.currency` |
| `src/pages/ClumsyGod.tsx` | `formData.amount` | `currency` |
| `src/pages/Wolfy.tsx` | `formData.amount` | `currency` |
| `src/pages/DorpPlays.tsx` | `formData.amount` | `currency` |
| `src/pages/Zishu.tsx` | `formData.amount` | `currency` |
| `src/pages/Brigzard.tsx` | `formData.amount` | `currency` |
| `src/pages/WEra.tsx` | `formData.amount` | `currency` |
| `src/pages/MrChampion.tsx` | `formData.amount` | `currency` |
| `src/pages/Demigod.tsx` | `formData.amount` | `currency` |

### Wrapper component (1):
- `src/components/donation/DonationPageWrapper.tsx` — add before the submit button (line ~401), using `formData.amount` and `currency`

## Change Per File
1. Add import: `import RewardsBanner from '@/components/RewardsBanner';`
2. Insert `<RewardsBanner amount={Number(amount)} currency={currency} />` just above the submit button

## No Changes To
- `RewardsBanner.tsx` itself — the component is already generic
- Any edge functions, database tables, or backend logic
- Ankit.tsx — already has it

