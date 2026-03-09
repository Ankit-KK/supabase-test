

# Move Hyperstore Showcase Higher on Main Page

Move `<HyperstoreShowcase />` from its current position (between `AudienceValue` and `HowItWorks`) to right after `<PartnershipSection />` — making it one of the first things visitors see.

### Change: `src/pages/Index.tsx`

Current order:
```
PartnershipSection → Features → ModerationFeatures → Services → AudienceValue → HyperstoreShowcase → HowItWorks → ...
```

New order:
```
PartnershipSection → HyperstoreShowcase → Features → ModerationFeatures → Services → AudienceValue → HowItWorks → ...
```

Single line move, no other files affected.

