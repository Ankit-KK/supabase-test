-- Add currency and hypersound_url columns to all donation tables that don't have them

-- thunderx_donations
ALTER TABLE public.thunderx_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- vipbhai_donations
ALTER TABLE public.vipbhai_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- sagarujjwalgaming_donations
ALTER TABLE public.sagarujjwalgaming_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- notyourkween_donations
ALTER TABLE public.notyourkween_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- bongflick_donations
ALTER TABLE public.bongflick_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- mriqmaster_donations
ALTER TABLE public.mriqmaster_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- abdevil_donations
ALTER TABLE public.abdevil_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- jhanvoo_donations
ALTER TABLE public.jhanvoo_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- looteriya_gaming_donations
ALTER TABLE public.looteriya_gaming_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- damask_plays_donations
ALTER TABLE public.damask_plays_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- neko_xenpai_donations
ALTER TABLE public.neko_xenpai_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- chiaa_gaming_donations
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;

-- sizzors_donations
ALTER TABLE public.sizzors_donations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS hypersound_url TEXT;