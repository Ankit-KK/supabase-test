import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  phoneError: string;
  onContinue: () => void;
  isSubmitting: boolean;
  buttonColor?: string;
}

export const PhoneDialog: React.FC<PhoneDialogProps> = ({
  open,
  onOpenChange,
  phoneNumber,
  onPhoneChange,
  phoneError,
  onContinue,
  isSubmitting,
  buttonColor = '#8b5cf6',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Options</DialogTitle>
          <DialogDescription>
            Enter your mobile number to proceed with payment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              maxLength={10}
            />
            {phoneError && (
              <p className="text-sm text-destructive mt-1">{phoneError}</p>
            )}
          </div>
          <Button 
            onClick={onContinue} 
            className="w-full"
            disabled={isSubmitting}
            style={{ backgroundColor: buttonColor }}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
