-- Fix trigger error by adding missing column used in notify_moderators_on_success
ALTER TABLE public.chia_gaming_donations
  ADD COLUMN IF NOT EXISTS mod_notified boolean NOT NULL DEFAULT false;