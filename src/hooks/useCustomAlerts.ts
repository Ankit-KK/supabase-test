
import { useState, useEffect } from 'react';

export const useCustomAlerts = () => {
  const [customAlertsEnabled, setCustomAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('chiaaGamingCustomAlertsEnabled');
    return saved === 'true';
  });

  const toggleCustomAlerts = (enabled: boolean) => {
    setCustomAlertsEnabled(enabled);
    localStorage.setItem('chiaaGamingCustomAlertsEnabled', enabled.toString());
  };

  return {
    customAlertsEnabled,
    toggleCustomAlerts
  };
};
