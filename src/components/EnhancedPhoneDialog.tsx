import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface EnhancedPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  phoneError: string;
  onContinue: () => void;
  isSubmitting: boolean;
  brandColor?: string;
}

export const EnhancedPhoneDialog: React.FC<EnhancedPhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneNumber,
  onPhoneChange,
  phoneError,
  onContinue,
  isSubmitting,
  brandColor = '#6366f1'
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" style={{ color: brandColor }} />
            Enter Your Mobile Number
          </DialogTitle>
          <DialogDescription>
            We need your mobile number to process the payment securely
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              className={phoneError ? 'border-red-500' : ''}
              style={{ borderColor: phoneError ? '#ef4444' : `${brandColor}50` }}
            />
            {phoneError && (
              <p className="text-sm text-red-500">{phoneError}</p>
            )}
          </div>
          <Button
            onClick={onContinue}
            disabled={isSubmitting}
            className="w-full text-white"
            style={{ backgroundColor: brandColor }}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
