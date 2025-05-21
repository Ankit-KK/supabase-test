
import React, { createContext, useContext, useState } from "react";

interface ObsConfigContextType {
  showBorder: boolean;
  toggleBorder: () => void;
  isDraggable: boolean;
  toggleDraggable: () => void;
  isResizable: boolean;
  toggleResizable: () => void;
}

const ObsConfigContext = createContext<ObsConfigContextType | undefined>(undefined);

export const ObsConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showBorder, setShowBorder] = useState<boolean>(false);
  const [isDraggable, setIsDraggable] = useState<boolean>(false);
  const [isResizable, setIsResizable] = useState<boolean>(false);

  const toggleBorder = () => {
    const newValue = !showBorder;
    setShowBorder(newValue);
    localStorage.setItem("ankitObsShowBorder", newValue.toString());
  };

  const toggleDraggable = () => {
    const newValue = !isDraggable;
    setIsDraggable(newValue);
    localStorage.setItem("ankitObsDraggable", newValue.toString());
  };

  const toggleResizable = () => {
    const newValue = !isResizable;
    setIsResizable(newValue);
    localStorage.setItem("ankitObsResizable", newValue.toString());
  };

  return (
    <ObsConfigContext.Provider
      value={{
        showBorder,
        toggleBorder,
        isDraggable,
        toggleDraggable,
        isResizable,
        toggleResizable,
      }}
    >
      {children}
    </ObsConfigContext.Provider>
  );
};

export const useObsConfig = () => {
  const context = useContext(ObsConfigContext);
  if (context === undefined) {
    throw new Error("useObsConfig must be used within an ObsConfigProvider");
  }
  return context;
};
