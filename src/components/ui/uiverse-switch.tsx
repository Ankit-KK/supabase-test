import React from 'react';
import { cn } from '@/lib/utils';

interface UiverseSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const UiverseSwitch: React.FC<UiverseSwitchProps> = ({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  className
}) => {
  return (
    <div className={cn("checkbox-wrapper-25", className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
    </div>
  );
};
