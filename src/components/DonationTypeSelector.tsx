import React from 'react';

interface DonationTypeSelectorProps {
  donationType: 'message' | 'voice' | 'hyperemote';
  onTypeChange: (type: 'message' | 'voice' | 'hyperemote') => void;
  hyperemotesMinAmount?: number;
  brandColor?: string;
}

export const DonationTypeSelector: React.FC<DonationTypeSelectorProps> = ({
  donationType,
  onTypeChange,
  hyperemotesMinAmount = 3,
  brandColor = '#6366f1'
}) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium" style={{ color: brandColor }}>
        Choose your donation type
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onTypeChange('message')}
          className={`p-3 rounded-lg border-2 transition-all ${
            donationType === 'message'
              ? 'bg-opacity-10'
              : 'hover:border-opacity-50'
          }`}
          style={{
            borderColor: donationType === 'message' ? brandColor : `${brandColor}50`,
            backgroundColor: donationType === 'message' ? `${brandColor}20` : 'transparent'
          }}
        >
          <div className="text-center">
            <div className="text-base mb-1">💬</div>
            <div className="font-medium text-xs">Text Message</div>
            <div className="text-xs text-muted-foreground">Min: ₹1</div>
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => onTypeChange('voice')}
          className={`p-3 rounded-lg border-2 transition-all ${
            donationType === 'voice'
              ? 'bg-opacity-10'
              : 'hover:border-opacity-50'
          }`}
          style={{
            borderColor: donationType === 'voice' ? brandColor : `${brandColor}50`,
            backgroundColor: donationType === 'voice' ? `${brandColor}20` : 'transparent'
          }}
        >
          <div className="text-center">
            <div className="text-base mb-1">🎤</div>
            <div className="font-medium text-xs">Voice Message</div>
            <div className="text-xs text-muted-foreground">Min: ₹2</div>
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => onTypeChange('hyperemote')}
          className={`p-3 rounded-lg border-2 transition-all ${
            donationType === 'hyperemote'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-purple-500/30 hover:border-purple-500/50'
          }`}
        >
          <div className="text-center">
            <div className="text-base mb-1">🎉</div>
            <div className="font-medium text-xs">Hyperemotes</div>
            <div className="text-xs text-muted-foreground">
              ₹{hyperemotesMinAmount}+ celebration
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
