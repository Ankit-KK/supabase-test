-- PART 2 CORRECTED: Complete Security Fix for Donation Tables

-- Complete newstreamer donations security
CREATE POLICY "Allow donation creation"
ON public.newstreamer_donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Streamers can view their donations"
ON public.newstreamer_donations
FOR SELECT
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

CREATE POLICY "System can update donation status"
ON public.newstreamer_donations
FOR UPDATE
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- Add donation modification audit logging (no SELECT triggers as they're not supported)
CREATE OR REPLACE FUNCTION public.log_donation_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log modifications to donation data for security monitoring
  PERFORM public.log_sensitive_access(
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create audit triggers for donation modifications only
CREATE TRIGGER ankit_donation_modification_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.ankit_donations
  FOR EACH ROW EXECUTE FUNCTION public.log_donation_modification();

CREATE TRIGGER chia_donation_modification_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.chia_gaming_donations
  FOR EACH ROW EXECUTE FUNCTION public.log_donation_modification();

CREATE TRIGGER newstreamer_donation_modification_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.newstreamer_donations
  FOR EACH ROW EXECUTE FUNCTION public.log_donation_modification();

-- Secure function to get sanitized recent donations for public display
CREATE OR REPLACE FUNCTION public.get_recent_donations_public(
  p_streamer_slug text,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  donor_name text,
  amount numeric,
  sanitized_message text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streamer_record RECORD;
BEGIN
  -- Get streamer info
  SELECT id INTO streamer_record
  FROM public.streamers
  WHERE streamer_slug = p_streamer_slug;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return sanitized recent donations (last 24 hours only)
  RETURN QUERY
  SELECT 
    CASE 
      WHEN LENGTH(d.name) > 20 THEN LEFT(d.name, 15) || '...'
      ELSE d.name
    END as donor_name,
    d.amount,
    CASE 
      WHEN d.message IS NULL THEN NULL
      WHEN LENGTH(d.message) > 100 THEN LEFT(d.message, 97) || '...'
      ELSE d.message
    END as sanitized_message,
    d.created_at
  FROM (
    SELECT name, amount, message, created_at
    FROM public.ankit_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
    
    UNION ALL
    
    SELECT name, amount, message, created_at
    FROM public.chia_gaming_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
    
    UNION ALL
    
    SELECT name, amount, message, created_at
    FROM public.newstreamer_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
  ) d
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$$;