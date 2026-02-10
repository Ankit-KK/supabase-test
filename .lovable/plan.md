

# Fix: TTS Not Generated for USD Donations (Currency Conversion Bug)

## Root Cause

The `moderate-donation` edge function compares the raw donation amount against the TTS threshold (40 INR minimum) **without converting foreign currencies to INR**.

- A $2 USD donation (worth ~178 INR) is compared as `2 < 40`, so it gets silent audio instead of TTS.
- A 100 INR donation correctly passes as `100 >= 40` and gets TTS.

The `razorpay-webhook` function handles this correctly with `convertToINR()`, but `moderate-donation` does not.

## Evidence

| Donation | Amount | Currency | TTS Result | Expected |
|----------|--------|----------|------------|----------|
| bb872fcc | 100 | INR | TTS generated | Correct |
| 0125fa6c | 2 | USD | Silent audio | Should have TTS (2 USD = ~178 INR) |
| 5750bb6d | 2 | USD | Silent audio | Should have TTS (2 USD = ~178 INR) |

## Fix (single file: `supabase/functions/moderate-donation/index.ts`)

1. Add the `EXCHANGE_RATES_TO_INR` map and `convertToINR` helper (same one used in `razorpay-webhook`).
2. Convert `donation.amount` to INR before comparing against `ttsMinAmount` on lines 358 and 368.

```text
Before:  donation.amount >= ttsMinAmount
After:   convertToINR(donation.amount, donation.currency || 'INR') >= ttsMinAmount

Before:  donation.amount < ttsMinAmount  
After:   convertToINR(donation.amount, donation.currency || 'INR') < ttsMinAmount
```

No other files or edge functions are modified. The fix ensures currency-aware TTS threshold checks during manual moderation approval, matching the existing behavior in the webhook.

