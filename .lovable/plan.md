

# Plan: Add Two-Layered Moderation Showcase to Homepage

## Overview

Add the "World's First Two-Layered Moderation System" showcase section to the main landing page (Index.tsx) so visitors can immediately see HyperChat's best security feature.

---

## Current State

**Homepage sections (in order):**
1. Navbar
2. HeroWithCanyonAnimation
3. PartnershipSection
4. Features
5. Services
6. AudienceValue
7. HowItWorks
8. BlogSection
9. FAQSection
10. Footer

**ModerationFeatures is only on:** `/feature-showcase` route

---

## Proposed Change

### File: `src/pages/Index.tsx`

Add the ModerationFeatures component to the homepage, positioned after the Features section and before Services. This placement makes sense because:

- Features introduces general capabilities
- ModerationFeatures showcases the flagship security feature
- Services then explains why creators choose HyperChat

**New section order:**
1. Navbar
2. HeroWithCanyonAnimation
3. PartnershipSection
4. Features
5. **ModerationFeatures** (NEW)
6. Services
7. AudienceValue
8. HowItWorks
9. BlogSection
10. FAQSection
11. Footer

---

## Code Changes

```typescript
// src/pages/Index.tsx

// Add import at top:
import ModerationFeatures from "@/components/feature-showcase/ModerationFeatures";

// Add to JSX (after Features, before Services):
<Navbar />
<HeroWithCanyonAnimation />
<PartnershipSection />
<Features />
<ModerationFeatures />  {/* NEW */}
<Services />
<AudienceValue />
<HowItWorks />
<BlogSection />
<FAQSection />
<Footer />
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Import and add `<ModerationFeatures />` component |

---

## Result

After this change, every visitor to the homepage will see the complete Two-Layered Moderation System showcase including:

- "World's First" badge with hero headline
- Protection stats grid (2 layers, media types, action options)
- Visual flow diagram (Dashboard → Telegram → Stream)
- Anti-hate speech shield animation
- HyperChat vs Traditional comparison table
- Feature cards (Dashboard Control, Telegram Integration, etc.)

