

## The Problem

You're correct. Removing `customer_name` from the response is a band-aid. The real vulnerability is: **anyone can call `check-payment-status-unified` with any `order_id` and get confirmation that a payment exists, its status, and amount — with zero authentication.**

The endpoint must be publicly accessible (anonymous donors check their payment status after paying), so we cannot add user authentication. But we can add a **per-donation secret token**.

## The Real Fix: Status Check Token

### How it works

1. **At order creation** (`create-razorpay-order-unified`): Generate a random `status_token` (crypto-random, 32 chars). Store its SHA-256 hash in the donation row. Return the plain token to the frontend.

2. **Frontend** (`Status.tsx`): Store the token in the URL or pass it when calling `check-payment-status-unified`.

3. **At status check** (`check-payment-status-unified`): Require `status_token` in the request body. Hash it, compare against stored `status_token_hash`. Reject if missing or mismatched.

This means only the person who created the order (and received the token) can check its status. Brute-forcing a 32-char random token is computationally infeasible.

### Changes Required

**1. Database migration** — Add `status_token_hash` column to all 11 donation tables.

**2. `create-razorpay-order-unified`** — Generate token, store hash, return plain token in response.

**3. `check-payment-status-unified`** — Require and validate `status_token` on every request. Return 403 on mismatch.

**4. `Status.tsx`** (frontend) — Pass `status_token` from URL params or localStorage when calling the check endpoint. The token would be included in the redirect URL after payment.

**5. Donation page components** — After order creation, store the `status_token` and include it in the payment status redirect URL.

### What this does NOT break

- The `razorpay-webhook` is unaffected (it uses Razorpay signature verification, not this endpoint).
- Existing successful donations without tokens will still show as "success" via the early-return path (line 141), which can optionally skip the token check for already-paid orders.

### Migration scope

11 donation tables need the new column. The column is nullable so existing rows are unaffected.

