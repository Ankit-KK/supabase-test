
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomSound {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
}

export const useCustomSounds = () => {
  const [sounds, setSounds] = useState<CustomSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomSounds = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('custom_sound_alerts')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching custom sounds:', error);
          setError('Failed to load custom sounds');
          return;
        }

        setSounds(data || []);
      } catch (err) {
        console.error('Error in fetchCustomSounds:', err);
        setError('Failed to load custom sounds');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomSounds();
  }, []);

  return { sounds, isLoading, error };
};
