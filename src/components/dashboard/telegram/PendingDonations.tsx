import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check, 
  X, 
  Volume2, 
  Eye, 
  EyeOff, 
  Clock, 
  DollarSign,
  MessageSquare,
  Smartphone
} from 'lucide-react';

interface PendingDonationsProps {
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

const PendingDonations: React.FC<PendingDonationsProps> = ({
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
        approved_by: 'web_dashboard'
      };

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "✅ Approved" : "❌ Rejected",
        description: `Donation ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      onModerationAction();
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast({
        title: "Error",
        description: "Failed to update donation. Please try again.",
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
        title: currentVisibility ? "🙈 Hidden" : "👁️ Visible",
        description: `Message ${!currentVisibility ? 'shown' : 'hidden'} on stream`,
      });

      onModerationAction();
    } catch (error) {
      console.error('Error updating message visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
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
            <Smartphone className="h-5 w-5 text-green-500" />
            <span>All Caught Up!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-lg font-medium mb-2">No pending donations</p>
            <p className="text-sm text-muted-foreground">
              All donations are reviewed. Great job moderating!
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
            <Clock className="h-5 w-5 text-orange-500" />
            <span>Pending Review</span>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {donations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {donations.map((donation) => (
            <Card key={donation.id} className="relative overflow-hidden">
              {/* Mobile-optimized layout */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-red-500"></div>
              
              <CardContent className="p-4 pl-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-lg truncate">{donation.name}</h4>
                      {donation.is_hyperemote && (
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
                          💫 Hyperemote
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(donation.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-lg px-3 py-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ₹{donation.amount}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                {donation.message && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-blue-200">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{donation.message}</p>
                    </div>
                  </div>
                )}

                {/* Voice Message */}
                {donation.voice_message_url && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playVoiceMessage(donation.voice_message_url!)}
                      className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/20"
                    >
                      <Volume2 className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-700 dark:text-purple-300">Play Voice Message</span>
                    </Button>
                  </div>
                )}

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex space-x-2 flex-1">
                    <Button
                      onClick={() => handleModerationAction(donation.id, 'approve')}
                      disabled={processing === donation.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-base"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Approve
                    </Button>
                    
                    <Button
                      onClick={() => handleModerationAction(donation.id, 'reject')}
                      disabled={processing === donation.id}
                      variant="destructive"
                      className="flex-1 font-medium py-3 text-base"
                      size="lg"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Reject
                    </Button>
                  </div>
                  
                  {(donation.message || donation.voice_message_url) && (
                    <Button
                      onClick={() => handleVisibilityToggle(donation.id, donation.message_visible ?? true)}
                      disabled={processing === donation.id}
                      variant="outline"
                      className="sm:w-auto w-full py-3"
                      size="lg"
                    >
                      {donation.message_visible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Message
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Message
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Loading State */}
                {processing === donation.id && (
                  <div className="flex items-center justify-center mt-3 p-2">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Tip */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-300">💡 Mobile Tip</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Add Telegram moderators to approve donations instantly on your phone while streaming!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingDonations;