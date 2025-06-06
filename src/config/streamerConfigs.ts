
export interface StreamerConfig {
  name: string;
  displayName: string;
  tableName: string;
  authKey: string;
  minAmount: number;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    gradientFrom: string;
    gradientTo: string;
    cardBackground: string;
    borderColor: string;
  };
  features: {
    hasGif?: boolean;
    hasSound?: boolean;
    characterLengthTiers?: boolean;
    hasLogo?: boolean;
    logoUrl?: string;
    hasCustomBackground?: boolean;
    backgroundUrl?: string;
  };
  specialStyling?: {
    isGaming?: boolean;
    isDark?: boolean;
    hasNeonEffects?: boolean;
  };
}

export const streamerConfigs: Record<string, StreamerConfig> = {
  ankit: {
    name: "ankit",
    displayName: "Ankit",
    tableName: "ankit_donations",
    authKey: "ankitAuth",
    minAmount: 1,
    theme: {
      primaryColor: "purple-600",
      secondaryColor: "pink-600",
      backgroundColor: "gradient-to-r from-purple-600 to-pink-600",
      gradientFrom: "purple-400",
      gradientTo: "pink-600",
      cardBackground: "black/40",
      borderColor: "purple-500/30"
    },
    features: {
      hasGif: true,
      characterLengthTiers: true
    },
    specialStyling: {
      isGaming: true,
      hasNeonEffects: true
    }
  },
  harish: {
    name: "harish",
    displayName: "Harish",
    tableName: "harish_donations",
    authKey: "harishAuth",
    minAmount: 50,
    theme: {
      primaryColor: "blue-600",
      secondaryColor: "blue-800",
      backgroundColor: "bg-background",
      gradientFrom: "blue-600",
      gradientTo: "blue-800",
      cardBackground: "bg-card",
      borderColor: "border"
    },
    features: {
      hasGif: true,
      characterLengthTiers: true
    },
    specialStyling: {
      isGaming: false,
      isDark: false
    }
  },
  mackle: {
    name: "mackle",
    displayName: "Mackle",
    tableName: "mackle_donations",
    authKey: "mackleAuth",
    minAmount: 50,
    theme: {
      primaryColor: "green-600",
      secondaryColor: "green-800",
      backgroundColor: "bg-background",
      gradientFrom: "green-600",
      gradientTo: "green-800",
      cardBackground: "bg-card",
      borderColor: "border"
    },
    features: {
      hasSound: true,
      hasGif: true,
      characterLengthTiers: true
    },
    specialStyling: {
      isGaming: false,
      isDark: false
    }
  },
  rakazone: {
    name: "rakazone",
    displayName: "Rakazone",
    tableName: "rakazone_donations",
    authKey: "rakazoneAuth",
    minAmount: 50,
    theme: {
      primaryColor: "red-600",
      secondaryColor: "red-800",
      backgroundColor: "linear-gradient(rgba(30, 0, 0, 0.95), rgba(30, 0, 0, 0.95))",
      gradientFrom: "red-700",
      gradientTo: "red-900",
      cardBackground: "black/80",
      borderColor: "red-500/30"
    },
    features: {
      hasSound: true,
      hasLogo: true,
      logoUrl: "/lovable-uploads/495326f5-a1c6-47a4-9e68-39f8372910a9.png",
      hasCustomBackground: true,
      backgroundUrl: "/lovable-uploads/27e5dfd7-9e94-4323-83d7-c758e1f525a2.png"
    },
    specialStyling: {
      isGaming: true,
      isDark: true
    }
  },
  "chiaa_gaming": {
    name: "chiaa_gaming",
    displayName: "Chiaa Gaming",
    tableName: "chiaa_gaming_donations",
    authKey: "chiaa_gamingAuth",
    minAmount: 50,
    theme: {
      primaryColor: "pink-600",
      secondaryColor: "purple-700",
      backgroundColor: "radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%), linear-gradient(135deg, #fef7ff 0%, #faf5ff 25%, #fdf2f8 50%, #f0f9ff 75%, #fef7ff 100%)",
      gradientFrom: "pink-600",
      gradientTo: "purple-700",
      cardBackground: "white/95",
      borderColor: "pink-300"
    },
    features: {
      hasSound: true,
      characterLengthTiers: true
    },
    specialStyling: {
      isGaming: true,
      isDark: false
    }
  }
};

export const getStreamerConfig = (streamerName: string): StreamerConfig | null => {
  return streamerConfigs[streamerName] || null;
};
