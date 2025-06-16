
-- Update the custom sound alerts with the new URLs from the custom-sounds bucket
UPDATE public.custom_sound_alerts 
SET file_url = 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/knock-left-ear-made-with-Voicemod.mp3'
WHERE id = 'knock_left';

UPDATE public.custom_sound_alerts 
SET file_url = 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/raze-fire-in-the-hole.mp3'
WHERE id = 'raze_ult';

UPDATE public.custom_sound_alerts 
SET file_url = 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/valorant-sova-made-with-Voicemod.mp3'
WHERE id = 'sova_ult';

UPDATE public.custom_sound_alerts 
SET file_url = 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/valorant-spike-plant.mp3'
WHERE id = 'spike_plant';
