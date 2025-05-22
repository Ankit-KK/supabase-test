
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ObsConfig {
  isDraggable: boolean;
  showBorder: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface ObsConfigContextType {
  obsConfig: ObsConfig;
  setObsConfig: React.Dispatch<React.SetStateAction<ObsConfig>>;
  toggleDraggable: () => void;
}

const defaultConfig: ObsConfig = {
  isDraggable: false,
  showBorder: false,
  position: { x: 20, y: 20 },
  size: { width: 400, height: 'auto' },
};

const ObsConfigContext = createContext<ObsConfigContextType | undefined>(undefined);

export function ObsConfigProvider({ children }: { children: React.ReactNode }) {
  const [obsConfig, setObsConfig] = useState<ObsConfig>(() => {
    // Load from localStorage if available
    const savedConfig = localStorage.getItem('ankitObsConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('ankitObsConfig', JSON.stringify(obsConfig));
  }, [obsConfig]);

  const toggleDraggable = () => {
    setObsConfig(prev => ({
      ...prev,
      isDraggable: !prev.isDraggable,
      showBorder: !prev.isDraggable
    }));
  };

  return (
    <ObsConfigContext.Provider value={{ obsConfig, setObsConfig, toggleDraggable }}>
      {children}
    </ObsConfigContext.Provider>
  );
}

export function useObsConfig() {
  const context = useContext(ObsConfigContext);
  if (context === undefined) {
    throw new Error('useObsConfig must be used within an ObsConfigProvider');
  }
  return context;
}
