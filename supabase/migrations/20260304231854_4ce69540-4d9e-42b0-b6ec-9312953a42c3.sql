
-- Phase 1A: streamer_donator_totals table
CREATE TABLE IF NOT EXISTS streamer_donator_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_slug text NOT NULL,
  donator_name text NOT NULL,
  donator_name_lower text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  donation_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (streamer_slug, donator_name_lower)
);

ALTER TABLE streamer_donator_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donator totals"
  ON streamer_donator_totals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role manages donator totals"
  ON streamer_donator_totals FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_streamer_top_donator
  ON streamer_donator_totals (streamer_slug, total_amount DESC)
  INCLUDE (donator_name);

-- Phase 1B: order_lookup table
CREATE TABLE IF NOT EXISTS order_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text NOT NULL UNIQUE,
  order_id text NOT NULL,
  streamer_slug text NOT NULL,
  donation_table_id smallint NOT NULL,
  donation_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages order_lookup"
  ON order_lookup FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_order_lookup_fast
  ON order_lookup (razorpay_order_id)
  INCLUDE (streamer_slug, donation_table_id, donation_id);

-- Phase 1C: Atomic increment/decrement RPCs
CREATE OR REPLACE FUNCTION increment_donator_total(
  p_streamer_slug text,
  p_donator_name text,
  p_amount numeric
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO streamer_donator_totals
    (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
  VALUES (p_streamer_slug, p_donator_name, lower(p_donator_name), p_amount, 1)
  ON CONFLICT (streamer_slug, donator_name_lower)
  DO UPDATE SET
    total_amount = streamer_donator_totals.total_amount + EXCLUDED.total_amount,
    donation_count = streamer_donator_totals.donation_count + 1,
    donator_name = EXCLUDED.donator_name,
    updated_at = now();
$$;

CREATE OR REPLACE FUNCTION decrement_donator_total(
  p_streamer_slug text,
  p_donator_name text,
  p_amount numeric
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE streamer_donator_totals
  SET total_amount = GREATEST(0, total_amount - p_amount),
      donation_count = GREATEST(0, donation_count - 1),
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug
    AND donator_name_lower = lower(p_donator_name);
$$;

-- Phase 1D: amount_inr column on all donation tables
ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE looteriya_gaming_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE clumsy_god_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE wolfy_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE dorp_plays_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE zishu_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE brigzard_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE w_era_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE mr_champion_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);

-- Phase 1E: Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_ankit_donations_mod_queue
  ON ankit_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_mod_queue
  ON chiaa_gaming_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_looteriya_gaming_donations_mod_queue
  ON looteriya_gaming_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_clumsy_god_donations_mod_queue
  ON clumsy_god_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_wolfy_donations_mod_queue
  ON wolfy_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_dorp_plays_donations_mod_queue
  ON dorp_plays_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_zishu_donations_mod_queue
  ON zishu_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_brigzard_donations_mod_queue
  ON brigzard_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_w_era_donations_mod_queue
  ON w_era_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mr_champion_donations_mod_queue
  ON mr_champion_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';

-- Phase 1F: Backfill using pre-aggregated subquery to avoid duplicate conflicts
-- Group by lower(name) first, pick one representative name per group
INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'ankit' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM ankit_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'chiaa_gaming' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM chiaa_gaming_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'looteriya_gaming' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM looteriya_gaming_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'clumsy_god' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM clumsy_god_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'wolfy' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM wolfy_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'dorp_plays' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM dorp_plays_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'zishu' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM zishu_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'brigzard' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM brigzard_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'w_era' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM w_era_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT slug, donator_name, donator_name_lower, total_amount, donation_count FROM (
  SELECT 'mr_champion' AS slug, (array_agg(name ORDER BY created_at DESC))[1] AS donator_name, lower(name) AS donator_name_lower,
    SUM(amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END) AS total_amount, COUNT(*) AS donation_count
  FROM mr_champion_donations WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved') GROUP BY lower(name)
) sub ON CONFLICT (streamer_slug, donator_name_lower) DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, donator_name = EXCLUDED.donator_name, updated_at = now();

-- Phase 1G: Backfill amount_inr
UPDATE ankit_donations SET amount_inr = amount * CASE currency WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE chiaa_gaming_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE looteriya_gaming_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE clumsy_god_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE wolfy_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE dorp_plays_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE zishu_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE brigzard_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE w_era_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
UPDATE mr_champion_donations SET amount_inr = amount * CASE currency::text WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;

-- Phase 8: order_lookup auto-expiry cron job
SELECT cron.schedule('cleanup-order-lookup', '0 3 * * *',
  $$DELETE FROM order_lookup WHERE created_at < now() - interval '30 days'$$
);
