import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HyperemoteSettingsProps {
  streamerId: string;
  hyperemotesEnabled: boolean;
  hyperemotesMinAmount: number;
  onUpdate: (enabled: boolean, minAmount: number) => void;
}

export const HyperemoteSettings: React.FC<HyperemoteSettingsProps> = ({
  streamerId,
  hyperemotesEnabled,
  hyperemotesMinAmount,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [enabled, setEnabled] = useState(hyperemotesEnabled);
  const [minAmount, setMinAmount] = useState(hyperemotesMinAmount.toString());

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const minAmountNum = parseFloat(minAmount);
      if (isNaN(minAmountNum) || minAmountNum < 1) {
        toast({
          title: "Invalid Amount",
          description: "Minimum amount must be at least ₹1",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('streamers')
        .update({
          hyperemotes_enabled: enabled,
          hyperemotes_min_amount: minAmountNum
        })
        .eq('id', streamerId);

      if (error) throw error;

      onUpdate(enabled, minAmountNum);
      toast({
        title: "Settings Updated",
        description: "Hyperemote settings have been saved successfully."
      });
    } catch (error) {
      console.error('Failed to update hyperemote settings:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎉</span>
          <span>Hyperemote Settings</span>
        </CardTitle>
        <CardDescription>
          Configure celebration-only donations that trigger animations without showing messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="hyperemotes-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor="hyperemotes-enabled">
            Enable Hyperemotes for donors
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-amount">
            Minimum donation amount to unlock Hyperemotes (₹)
          </Label>
          <Input
            id="min-amount"
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            min="1"
            disabled={!enabled}
            placeholder="50"
          />
          <p className="text-sm text-muted-foreground">
            Donors need to donate at least this amount to access Hyperemote celebrations
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How Hyperemotes Work:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Normal donations show alert boxes with name, amount, and message</li>
            <li>• Hyperemote donations skip the alert and show only celebration animations</li>
            <li>• Great for viewers who want to celebrate without interrupting gameplay</li>
            <li>• Streamers still receive the donation and can see it in their dashboard</li>
          </ul>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Save Hyperemote Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};