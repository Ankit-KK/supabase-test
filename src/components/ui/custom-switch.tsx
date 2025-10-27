import React from 'react';
import { cn } from '@/lib/utils';

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  className
}) => {
  return (
    <label 
      className={cn("inline-block", className)}
      style={{
        // Switch variables
        ['--switch-width' as any]: '46px',
        ['--switch-height' as any]: '24px',
        ['--switch-bg' as any]: 'rgb(131, 131, 131)',
        ['--switch-checked-bg' as any]: 'rgb(0, 218, 80)',
        ['--switch-offset' as any]: 'calc((var(--switch-height) - var(--circle-diameter)) / 2)',
        ['--switch-transition' as any]: 'all .2s cubic-bezier(0.27, 0.2, 0.25, 1.51)',
        // Circle variables
        ['--circle-diameter' as any]: '18px',
        ['--circle-bg' as any]: '#fff',
        ['--circle-shadow' as any]: '1px 1px 2px rgba(146, 146, 146, 0.45)',
        ['--circle-checked-shadow' as any]: '-1px 1px 2px rgba(163, 163, 163, 0.45)',
        ['--circle-transition' as any]: 'var(--switch-transition)',
        // Icon variables
        ['--icon-transition' as any]: 'all .2s cubic-bezier(0.27, 0.2, 0.25, 1.51)',
        ['--icon-cross-color' as any]: 'var(--switch-bg)',
        ['--icon-cross-size' as any]: '6px',
        ['--icon-checkmark-color' as any]: 'var(--switch-checked-bg)',
        ['--icon-checkmark-size' as any]: '10px',
        // Effect variables
        ['--effect-width' as any]: 'calc(var(--circle-diameter) / 2)',
        ['--effect-height' as any]: 'calc(var(--effect-width) / 2 - 1px)',
        ['--effect-bg' as any]: 'var(--circle-bg)',
        ['--effect-border-radius' as any]: '1px',
        ['--effect-transition' as any]: 'all .2s ease-in-out',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        id={id}
        disabled={disabled}
        className="hidden"
      />
      <div 
        className="relative flex items-center transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)] cursor-pointer"
        style={{
          width: 'var(--switch-width)',
          height: 'var(--switch-height)',
          backgroundColor: checked ? 'var(--switch-checked-bg)' : 'var(--switch-bg)',
          borderRadius: '999px',
        }}
      >
        {/* Effect line */}
        <div
          className="absolute transition-all duration-200 ease-in-out"
          style={{
            width: 'var(--effect-width)',
            height: 'var(--effect-height)',
            left: checked 
              ? 'calc(100% - var(--effect-width) - (var(--effect-width) / 2) - var(--switch-offset))'
              : 'calc(var(--switch-offset) + (var(--effect-width) / 2))',
            backgroundColor: 'var(--effect-bg)',
            borderRadius: 'var(--effect-border-radius)',
          }}
        />
        
        {/* Circle */}
        <div
          className="absolute z-10 flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]"
          style={{
            width: 'var(--circle-diameter)',
            height: 'var(--circle-diameter)',
            backgroundColor: 'var(--circle-bg)',
            borderRadius: '999px',
            boxShadow: checked ? 'var(--circle-checked-shadow)' : 'var(--circle-shadow)',
            left: checked 
              ? 'calc(100% - var(--circle-diameter) - var(--switch-offset))'
              : 'var(--switch-offset)',
          }}
        >
          {/* Cross icon (X) */}
          <svg
            className="transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]"
            viewBox="0 0 365.696 365.696"
            style={{
              width: 'var(--icon-cross-size)',
              height: 'auto',
              color: 'var(--icon-cross-color)',
              position: 'absolute',
              transform: checked ? 'scale(0)' : 'scale(1)',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25z"
            />
          </svg>

          {/* Checkmark icon (✓) */}
          <svg
            className="transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]"
            viewBox="0 0 24 24"
            style={{
              width: 'var(--icon-checkmark-size)',
              height: 'auto',
              color: 'var(--icon-checkmark-color)',
              position: 'absolute',
              transform: checked ? 'scale(1)' : 'scale(0)',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
            />
          </svg>
        </div>
      </div>
    </label>
  );
};
