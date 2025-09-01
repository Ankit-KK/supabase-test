-- Auto-approve hyperemotes for Chia Gaming donations via trigger on insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_approve_hyperemotes_chia'
  ) THEN
    CREATE TRIGGER trg_auto_approve_hyperemotes_chia
    BEFORE INSERT OR UPDATE ON public.chia_gaming_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_hyperemotes();
  END IF;
END $$;

-- Optionally ensure ankit has IU trigger using its specific function (no-ops if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_approve_ankit_hyperemotes_iu'
  ) THEN
    CREATE TRIGGER trg_auto_approve_ankit_hyperemotes_iu
    BEFORE INSERT OR UPDATE ON public.ankit_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_ankit_hyperemotes_iu();
  END IF;
END $$;