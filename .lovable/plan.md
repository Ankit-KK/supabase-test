
## Root Cause: RESTRICTIVE RLS Policies Blocking All Dashboard Data

### The Problem

Both RLS policies on `brigzard_donations` are set as **RESTRICTIVE** instead of **PERMISSIVE**. This is a critical PostgreSQL RLS distinction:

- **PERMISSIVE** policies: rows are accessible if ANY permissive policy passes (OR logic)
- **RESTRICTIVE** policies: rows are ONLY accessible if ALL restrictive policies pass (AND logic)

Current state on `brigzard_donations`:
- Policy 1 (RESTRICTIVE, for `public`): approved + success rows pass
- Policy 2 (RESTRICTIVE, for `service_role`): only passes when the DB role is literally `service_role`

When the frontend queries using the **anon key**, it's operating as the `anon` role, not `service_role`. Because both policies are RESTRICTIVE, BOTH must pass simultaneously — but policy #2 fails for anon role users. Result: **zero rows returned**, even for the ₹150 approved+success donation.

This explains why:
- Total revenue shows ₹0
- No donations appear in any tab
- Stats show all zeros

This is the same issue previously fixed for other tables (see memory: `global-rls-and-service-role-fix`), but `brigzard_donations` was not included in that fix.

---

### The Fix

The RLS policies need to be restructured to use **PERMISSIVE** policies with proper role targeting:

**Drop and recreate the policies as PERMISSIVE:**

```sql
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can view approved brigzard donations" ON brigzard_donations;
DROP POLICY IF EXISTS "Service role can manage brigzard donations" ON brigzard_donations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can view approved brigzard donations"
  ON brigzard_donations
  FOR SELECT
  TO anon, authenticated
  USING (
    moderation_status = ANY (ARRAY['approved', 'auto_approved']) 
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage brigzard donations"
  ON brigzard_donations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

This mirrors the working pattern used on tables like `wolfy_donations`, `w_era_donations`, `mr_champion_donations`, etc.

---

### Files Changed

**Database migration only** — no frontend code changes required. The ₹150 donation from Secret Admirer will immediately appear in the dashboard after the fix.

### Scope

Only `brigzard_donations` is affected. No other streamer pages, edge functions, or UI components will be touched.
