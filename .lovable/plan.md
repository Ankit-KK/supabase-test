

# Add Hyperstore Branding Section to Main Page

## What
A new standalone section on the Index page showcasing the Hyperstore (hyperchat.store) — highlighting product categories, the Hyperpoints rewards system, and a CTA to visit the store.

## New Component: `src/components/HyperstoreShowcase.tsx`

A visually distinct section with:

1. **Header** — "Hyperstore" branding with gradient text, subtitle about exclusive creator merch and rewards
2. **Product category cards** (3) — Merch, Collectibles, Exclusive Drops — each with an icon, title, short description
3. **Rewards highlight strip** — Gold-themed banner explaining: "Earn Hyperpoints with every donation ₹1000+ → Redeem at the Hyperstore" with a Gift icon
4. **CTA button** — "Visit Hyperstore" linking to `https://hyperchat.store/` (opens in new tab)

Styling: Uses existing design language (gradient cards, `bg-secondary/50`, border styling). The rewards strip uses the yellow/gold theme consistent with the RewardsBanner.

## Index Page Change: `src/pages/Index.tsx`

- Import `HyperstoreShowcase`
- Place it between `AudienceValue` and `HowItWorks` sections

## No other files changed
No backend, database, edge function, or existing component modifications.

