import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Check, X, Eye, EyeOff, Volume2, AlertTriangle } from 'lucide-react';
import DonationCard from './DonationCard';

interface ModerationQueueProps {
  donations: Array<{
    id: string;
    name: string;
    amount: number;
    message?: string;
    voice_message_url?: string;
    is_hyperemote?: boolean;
    moderation_status: string;
    payment_status: string;
    created_at: string;
    message_visible?: boolean;
  }>;
  tableName: string;
  onModerationAction: () => void;
}

const ModerationQueue: React.FC<ModerationQueueProps> = ({
  donations,
  tableName,
  onModerationAction
}) => {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleModerationAction = async (donationId: string, action: 'approve' | 'reject') => {
    setProcessing(donationId);
    
    try {
      let updateData: any = {
        moderation_status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        approved_by: 'manual'
      };

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Donation Approved" : "Donation Rejected",
        description: `The donation has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      onModerationAction();
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast({
        title: "Error",
        description: "Failed to update donation status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleVisibilityToggle = async (donationId: string, currentVisibility: boolean) => {
    setProcessing(donationId);
    
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ message_visible: !currentVisibility })
        .eq('id', donationId);

      if (error) throw error;

      toast({
        title: currentVisibility ? "Message Hidden" : "Message Shown",
        description: `The donation message is now ${!currentVisibility ? 'visible' : 'hidden'} on stream.`,
      });

      onModerationAction();
    } catch (error) {
      console.error('Error updating message visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update message visibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const playVoiceMessage = (url: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Moderation Queue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No pending donations</p>
            <p className="text-sm text-muted-foreground mt-1">
              All donations are up to date!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Moderation Queue</span>
          </div>
          <Badge variant="secondary">
            {donations.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {donations.map((donation) => (
            <Card key={donation.id} className="border-l-4 border-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{donation.name}</h4>
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        ₹{donation.amount}
                      </Badge>
                      {donation.is_hyperemote && (
                        <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/20">
                          Hyperemote
                        </Badge>
                      )}
                    </div>
                    
                    {donation.message && (
                      <div className="mb-3">
                        <p className="text-sm bg-muted p-2 rounded">
                          "{donation.message}"
                        </p>
                      </div>
                    )}
                    
                    {donation.voice_message_url && (
                      <div className="mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playVoiceMessage(donation.voice_message_url!)}
                          className="flex items-center space-x-2"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play Voice Message</span>
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Payment: {donation.payment_status}</span>
                      <span>•</span>
                      <span>Created: {new Date(donation.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleModerationAction(donation.id, 'approve')}
                      disabled={processing === donation.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleModerationAction(donation.id, 'reject')}
                      disabled={processing === donation.id}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                  
                  {(donation.message || donation.voice_message_url) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVisibilityToggle(donation.id, donation.message_visible ?? true)}
                      disabled={processing === donation.id}
                    >
                      {donation.message_visible ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hide Message
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Show Message
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {processing === donation.id && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {donations.length > 5 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>
                You have {donations.length} donations pending moderation. 
                Consider setting up auto-approval for trusted donors.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModerationQueue;