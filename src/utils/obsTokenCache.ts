// Global OBS token cache to prevent regeneration across component mounts
import { supabase } from '@/integrations/supabase/client';

interface TokenCacheEntry {
  token: string;
  streamerId: string;
  generatedAt: number;
  isGenerating: boolean;
  expiresAt: number;
}

class OBSTokenCache {
  private cache = new Map<string, TokenCacheEntry>();
  private generatePromises = new Map<string, Promise<string>>();

  async getOrGenerateToken(streamerId: string): Promise<string> {
    // Check if we have a valid cached token (not expired)
    const cached = this.cache.get(streamerId);
    if (cached && !cached.isGenerating && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    // Check if we're already generating a token for this streamer (prevent duplicates)
    const existingPromise = this.generatePromises.get(streamerId);
    if (existingPromise) {
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
    const now = Date.now();
    
    // Mark as generating
    this.cache.set(streamerId, {
      token: '',
      streamerId,
      generatedAt: now,
      isGenerating: true,
      expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
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
        const token = activeToken.token;
        const now = Date.now();
        
        // Cache the existing token with 24 hour expiration
        this.cache.set(streamerId, {
          token,
          streamerId,
          generatedAt: now,
          isGenerating: false,
          expiresAt: now + (24 * 60 * 60 * 1000)
        });
        
        return token;
      }

      // Generate new token via edge function
      const { data, error } = await supabase.functions.invoke('generate-obs-token', {
        body: { streamerId, forceRegenerate: false }
      });

      if (error) throw error;
      if (!data?.token) throw new Error('No token received');

      const token = data.token;
      const now = Date.now();
      
      // Cache the new token with 24 hour expiration
      this.cache.set(streamerId, {
        token,
        streamerId,
        generatedAt: now,
        isGenerating: false,
        expiresAt: now + (24 * 60 * 60 * 1000)
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
    const now = Date.now();
    
    // Cache the new token with 24 hour expiration
    this.cache.set(streamerId, {
      token,
      streamerId,
      generatedAt: now,
      isGenerating: false,
      expiresAt: now + (24 * 60 * 60 * 1000)
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
    return (cached && !cached.isGenerating && cached.expiresAt > Date.now()) ? cached.token : null;
  }

  // Cleanup expired tokens from cache
  cleanupExpired() {
    const now = Date.now();
    for (const [streamerId, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(streamerId);
      }
    }
  }
}

// Export singleton instance
export const obsTokenCache = new OBSTokenCache();