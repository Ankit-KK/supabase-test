export interface EmotionConfig {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  tier: 'basic' | 'premium' | 'vip';
  minAmount: number;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style_exaggeration: number;
  };
}

export const EMOTION_CONFIGS: Record<string, EmotionConfig> = {
  // Basic Tier (≥₹1) - Lowered for testing
  happy: {
    name: 'happy',
    displayName: 'Happy',
    icon: '😊',
    description: 'Cheerful and upbeat tone',
    tier: 'basic',
    minAmount: 1,
    voiceSettings: {
      stability: 0.5,
      similarity_boost: 0.7,
      style_exaggeration: 0.6
    }
  },
  sad: {
    name: 'sad',
    displayName: 'Sad',
    icon: '😢',
    description: 'Melancholic and emotional tone',
    tier: 'basic',
    minAmount: 1,
    voiceSettings: {
      stability: 0.8,
      similarity_boost: 0.6,
      style_exaggeration: 0.7
    }
  },
  excited: {
    name: 'excited',
    displayName: 'Excited',
    icon: '🤩',
    description: 'Energetic and enthusiastic',
    tier: 'basic',
    minAmount: 1,
    voiceSettings: {
      stability: 0.3,
      similarity_boost: 0.7,
      style_exaggeration: 0.8
    }
  },
  calm: {
    name: 'calm',
    displayName: 'Calm',
    icon: '😌',
    description: 'Peaceful and soothing tone',
    tier: 'basic',
    minAmount: 1,
    voiceSettings: {
      stability: 0.9,
      similarity_boost: 0.8,
      style_exaggeration: 0.3
    }
  },

  // Premium Tier (≥₹25)
  laughing: {
    name: 'laughing',
    displayName: 'Laughing',
    icon: '😂',
    description: 'Joyful laughter and giggles',
    tier: 'premium',
    minAmount: 25,
    voiceSettings: {
      stability: 0.2,
      similarity_boost: 0.8,
      style_exaggeration: 0.9
    }
  },
  angrily: {
    name: 'angrily',
    displayName: 'Angry',
    icon: '😠',
    description: 'Intense and fierce tone',
    tier: 'premium',
    minAmount: 25,
    voiceSettings: {
      stability: 0.1,
      similarity_boost: 0.9,
      style_exaggeration: 1.0
    }
  },
  surprised: {
    name: 'surprised',
    displayName: 'Surprised',
    icon: '😲',
    description: 'Shocked and amazed tone',
    tier: 'premium',
    minAmount: 25,
    voiceSettings: {
      stability: 0.2,
      similarity_boost: 0.7,
      style_exaggeration: 0.8
    }
  },
  whispering: {
    name: 'whispering',
    displayName: 'Whispering',
    icon: '🤫',
    description: 'Soft and secretive tone',
    tier: 'premium',
    minAmount: 25,
    voiceSettings: {
      stability: 0.9,
      similarity_boost: 0.5,
      style_exaggeration: 0.4
    }
  },
  cheerful: {
    name: 'cheerful',
    displayName: 'Cheerful',
    icon: '😄',
    description: 'Bright and optimistic tone',
    tier: 'premium',
    minAmount: 25,
    voiceSettings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style_exaggeration: 0.7
    }
  },

  // VIP Tier (≥₹100)
  dramatic: {
    name: 'dramatic',
    displayName: 'Dramatic',
    icon: '🎭',
    description: 'Theatrical and intense',
    tier: 'vip',
    minAmount: 100,
    voiceSettings: {
      stability: 0.1,
      similarity_boost: 0.9,
      style_exaggeration: 1.0
    }
  },
  villain: {
    name: 'villain',
    displayName: 'Villain',
    icon: '😈',
    description: 'Dark and menacing tone',
    tier: 'vip',
    minAmount: 100,
    voiceSettings: {
      stability: 0.2,
      similarity_boost: 0.9,
      style_exaggeration: 1.0
    }
  },
  mysterious: {
    name: 'mysterious',
    displayName: 'Mysterious',
    icon: '🕵️',
    description: 'Enigmatic and intriguing',
    tier: 'vip',
    minAmount: 100,
    voiceSettings: {
      stability: 0.7,
      similarity_boost: 0.6,
      style_exaggeration: 0.8
    }
  },
  romantic: {
    name: 'romantic',
    displayName: 'Romantic',
    icon: '💕',
    description: 'Loving and passionate tone',
    tier: 'vip',
    minAmount: 100,
    voiceSettings: {
      stability: 0.8,
      similarity_boost: 0.7,
      style_exaggeration: 0.6
    }
  },
  energetic: {
    name: 'energetic',
    displayName: 'Energetic',
    icon: '⚡',
    description: 'High-energy and dynamic',
    tier: 'vip',
    minAmount: 100,
    voiceSettings: {
      stability: 0.1,
      similarity_boost: 0.8,
      style_exaggeration: 0.9
    }
  }
};

export interface ParsedMessage {
  segments: MessageSegment[];
  emotions: string[];
  hasEmotions: boolean;
}

export interface MessageSegment {
  text: string;
  emotion?: string;
  isEmotionTag: boolean;
}

/**
 * Parse message text to extract emotion tags and segments
 */
export function parseEmotionalMessage(message: string): ParsedMessage {
  const emotionRegex = /\[([a-zA-Z_]+)\]/g;
  const segments: MessageSegment[] = [];
  const emotions: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emotionRegex.exec(message)) !== null) {
    const [fullMatch, emotionName] = match;
    const startIndex = match.index;
    
    // Add text before emotion tag (if any)
    if (startIndex > lastIndex) {
      const beforeText = message.slice(lastIndex, startIndex);
      if (beforeText.trim()) {
        segments.push({
          text: beforeText.trim(),
          isEmotionTag: false
        });
      }
    }
    
    // Add emotion tag if it's a valid emotion
    if (EMOTION_CONFIGS[emotionName.toLowerCase()]) {
      const emotion = emotionName.toLowerCase();
      segments.push({
        text: fullMatch,
        emotion,
        isEmotionTag: true
      });
      if (!emotions.includes(emotion)) {
        emotions.push(emotion);
      }
    } else {
      // Invalid emotion tag, treat as regular text
      segments.push({
        text: fullMatch,
        isEmotionTag: false
      });
    }
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < message.length) {
    const remainingText = message.slice(lastIndex);
    if (remainingText.trim()) {
      segments.push({
        text: remainingText.trim(),
        isEmotionTag: false
      });
    }
  }
  
  // If no segments were created, add the original message
  if (segments.length === 0) {
    segments.push({
      text: message,
      isEmotionTag: false
    });
  }

  return {
    segments,
    emotions,
    hasEmotions: emotions.length > 0
  };
}

/**
 * Get emotion tier based on donation amount
 */
export function getEmotionTier(amount: number): 'basic' | 'premium' | 'vip' {
  if (amount >= 100) return 'vip';
  if (amount >= 25) return 'premium';
  if (amount >= 1) return 'basic'; // Lowered for testing
  return 'basic';
}

/**
 * Get available emotions for a given tier and amount
 */
export function getAvailableEmotions(amount: number): EmotionConfig[] {
  const tier = getEmotionTier(amount);
  
  return Object.values(EMOTION_CONFIGS).filter(emotion => {
    if (tier === 'basic') return emotion.tier === 'basic';
    if (tier === 'premium') return emotion.tier === 'basic' || emotion.tier === 'premium';
    if (tier === 'vip') return true; // VIP gets all emotions
    return false;
  }).filter(emotion => amount >= emotion.minAmount);
}

/**
 * Validate if emotions are allowed for the given donation amount
 */
export function validateEmotionUsage(emotions: string[], amount: number): { valid: boolean; invalidEmotions: string[] } {
  const availableEmotions = getAvailableEmotions(amount);
  const availableEmotionNames = availableEmotions.map(e => e.name);
  const invalidEmotions = emotions.filter(emotion => !availableEmotionNames.includes(emotion));
  
  return {
    valid: invalidEmotions.length === 0,
    invalidEmotions
  };
}

/**
 * Format message for display with emotion highlighting
 */
export function formatMessageWithEmotions(message: string): string {
  const parsed = parseEmotionalMessage(message);
  return parsed.segments
    .map(segment => {
      if (segment.isEmotionTag && segment.emotion) {
        const config = EMOTION_CONFIGS[segment.emotion];
        return config ? `${config.icon} ${config.displayName}` : segment.text;
      }
      return segment.text;
    })
    .join(' ');
}