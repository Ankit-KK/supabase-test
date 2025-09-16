// Global OBS token cache to prevent regeneration across component mounts
import { supabase } from '@/integrations/supabase/client';

interface TokenCacheEntry {
  token: string;
  streamerId: string;
  generatedAt: number;
  isGenerating: boolean;
}

class OBSTokenCache {
  private cache = new Map<string, TokenCacheEntry>();
  private generatePromises = new Map<string, Promise<string>>();

  async getOrGenerateToken(streamerId: string): Promise<string> {
    console.log('🔑 Getting token for streamer:', streamerId);
    
    // Check if we have a cached token
    const cached = this.cache.get(streamerId);
    if (cached && !cached.isGenerating) {
      console.log('🔑 Using cached token');
      return cached.token;
    }

    // Check if we're already generating a token for this streamer
    const existingPromise = this.generatePromises.get(streamerId);
    if (existingPromise) {
      console.log('🔑 Token generation in progress, waiting...');
      return existingPromise;
    }

    // Generate new token
    const generatePromise = this.generateToken(streamerId);
    this.generatePromises.set(streamerId, generatePromise);

    try {
      const token = await generatePromise;
      this.generatePromises.delete(streamerId);
      return token;
    } catch (error) {
      this.generatePromises.delete(streamerId);
      throw error;
    }
  }

  private async generateToken(streamerId: string): Promise<string> {
    console.log('🔑 Starting token generation for streamer:', streamerId);
    
    // Mark as generating
    this.cache.set(streamerId, {
      token: '',
      streamerId,
      generatedAt: Date.now(),
      isGenerating: true
    });

    try {
      // First check if active token exists in database
      const { data: activeToken, error: tokenError } = await supabase
        .from('obs_tokens')
        .select('token')
        .eq('streamer_id', streamerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenError && activeToken?.token) {
        console.log('🔑 Found existing active token in database');
        const token = activeToken.token;
        
        // Cache the existing token
        this.cache.set(streamerId, {
          token,
          streamerId,
          generatedAt: Date.now(),
          isGenerating: false
        });
        
        return token;
      }

      // Generate new token via edge function
      console.log('🔑 No active token found, generating new one via edge function');
      const { data, error } = await supabase.functions.invoke('generate-obs-token', {
        body: { streamerId, forceRegenerate: false }
      });

      if (error) throw error;
      if (!data?.token) throw new Error('No token received');

      const token = data.token;
      console.log('🔑 New token generated successfully');
      
      // Cache the new token
      this.cache.set(streamerId, {
        token,
        streamerId,
        generatedAt: Date.now(),
        isGenerating: false
      });
      
      return token;
    } catch (error) {
      // Remove from cache on error
      this.cache.delete(streamerId);
      console.error('🔑 Token generation failed:', error);
      throw error;
    }
  }

  async regenerateToken(streamerId: string): Promise<string> {
    console.log('🔑 Regenerating token for streamer:', streamerId);
    
    // Clear cache
    this.cache.delete(streamerId);
    this.generatePromises.delete(streamerId);
    
    // Generate new token (force regeneration)
    const { data, error } = await supabase.functions.invoke('generate-obs-token', {
      body: { streamerId, forceRegenerate: true }
    });

    if (error) throw error;
    if (!data?.token) throw new Error('No token received');

    const token = data.token;
    
    // Cache the new token
    this.cache.set(streamerId, {
      token,
      streamerId,
      generatedAt: Date.now(),
      isGenerating: false
    });
    
    return token;
  }

  clearCache(streamerId?: string) {
    if (streamerId) {
      this.cache.delete(streamerId);
      this.generatePromises.delete(streamerId);
    } else {
      this.cache.clear();
      this.generatePromises.clear();
    }
  }

  getCachedToken(streamerId: string): string | null {
    const cached = this.cache.get(streamerId);
    return (cached && !cached.isGenerating) ? cached.token : null;
  }
}

// Export singleton instance
export const obsTokenCache = new OBSTokenCache();