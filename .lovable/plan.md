

## Fix: Redeploy `create-razorpay-order-unified` Edge Function

### Problem
The `create-razorpay-order-unified` edge function rejects Zishu donations with "Invalid or missing streamer_slug: zishu" because the currently **deployed** version doesn't include the `zishu` entry in its `STREAMER_CONFIG` map. The source code already has the correct entry -- the deployed version is simply out of date.

### Solution
Redeploy the `create-razorpay-order-unified` edge function. No code changes are needed since the source already contains the `zishu` configuration at line 17.

### Technical Details
- The `STREAMER_CONFIG` in `supabase/functions/create-razorpay-order-unified/index.ts` already maps `'zishu'` to `{ table: 'zishu_donations', prefix: 'zs_rp_' }` (line 17)
- The deployment will push this updated config to the live edge function
- After deployment, donations on the `/zishu` page will flow correctly through the Razorpay checkout

### Steps
1. Redeploy the `create-razorpay-order-unified` edge function
2. Verify the function works by testing a donation on the Zishu page

