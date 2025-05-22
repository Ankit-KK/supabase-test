
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ObsConfig {
  isDraggable: boolean;
  showBorder: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number | string };
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

const LOCAL_STORAGE_KEY = 'ankitObsConfig';

const ObsConfigContext = createContext<ObsConfigContextType | undefined>(undefined);

export function ObsConfigProvider({ children }: { children: React.ReactNode }) {
  const [obsConfig, setObsConfig] = useState<ObsConfig>(() => {
    // Load from localStorage if available
    const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obsConfig));
    
    // Dispatch a custom event to notify other tabs/windows
    const event = new CustomEvent('obsConfigChanged', { 
      detail: { config: obsConfig } 
    });
    window.dispatchEvent(event);
    
    console.log("OBS Config updated and saved to localStorage:", obsConfig);
  }, [obsConfig]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        console.log("Config changed in another tab, updating...");
        setObsConfig(JSON.parse(e.newValue));
      }
    };
    
    const handleCustomEvent = (e: any) => {
      if (e.detail && e.detail.config) {
        console.log("Received custom event with config:", e.detail.config);
        setObsConfig(e.detail.config);
      }
    };
    
    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('obsConfigChanged', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('obsConfigChanged', handleCustomEvent);
    };
  }, []);

  const toggleDraggable = () => {
    setObsConfig(prev => {
      const newConfig = {
        ...prev,
        isDraggable: !prev.isDraggable,
        showBorder: !prev.isDraggable
      };
      console.log("Toggling draggable mode:", newConfig);
      return newConfig;
    });
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
