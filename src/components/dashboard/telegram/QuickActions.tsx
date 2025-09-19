import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  Filter, 
  DollarSign,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';

interface QuickActionsProps {
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

const QuickActions: React.FC<QuickActionsProps> = ({
  donations,
  tableName,
  onModerationAction
}) => {
  const [processing, setProcessing] = useState<string | null>(null);

  const hyperemoteDonations = donations.filter(d => d.is_hyperemote);
  const regularDonations = donations.filter(d => !d.is_hyperemote);
  const highValueDonations = donations.filter(d => d.amount >= 100);
  const oldPendingDonations = donations.filter(d => {
    const donationTime = new Date(d.created_at).getTime();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return donationTime < oneHourAgo;
  });

  const handleBulkAction = async (donationIds: string[], action: 'approve' | 'reject', actionType: string) => {
    if (donationIds.length === 0) {
      toast({
        title: "No donations to process",
        description: "There are no donations matching the selected criteria.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(actionType);
    
    try {
      const updateData = {
        moderation_status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        approved_by: 'bulk_action'
      };

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .in('id', donationIds);

      if (error) throw error;

      toast({
        title: `✅ Bulk ${action === 'approve' ? 'Approval' : 'Rejection'} Complete`,
        description: `${donationIds.length} donations ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      onModerationAction();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const approveHyperemotes = () => {
    const ids = hyperemoteDonations.map(d => d.id);
    handleBulkAction(ids, 'approve', 'hyperemotes');
  };

  const approveHighValue = () => {
    const ids = highValueDonations.map(d => d.id);
    handleBulkAction(ids, 'approve', 'highvalue');
  };

  const approveOld = () => {
    const ids = oldPendingDonations.map(d => d.id);
    handleBulkAction(ids, 'approve', 'old');
  };

  const approveAll = () => {
    const ids = donations.map(d => d.id);
    handleBulkAction(ids, 'approve', 'all');
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Smart Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Smart Actions</h4>
          
          {hyperemoteDonations.length > 0 && (
            <Button
              onClick={approveHyperemotes}
              disabled={processing !== null}
              className="w-full justify-between bg-pink-600 hover:bg-pink-700"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Approve Hyperemotes</span>
              </div>
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                {hyperemoteDonations.length}
              </Badge>
            </Button>
          )}

          {highValueDonations.length > 0 && (
            <Button
              onClick={approveHighValue}
              disabled={processing !== null}
              className="w-full justify-between bg-green-600 hover:bg-green-700"
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Approve High Value (₹100+)</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {highValueDonations.length}
              </Badge>
            </Button>
          )}

          {oldPendingDonations.length > 0 && (
            <Button
              onClick={approveOld}
              disabled={processing !== null}
              variant="outline"
              className="w-full justify-between border-orange-200 hover:bg-orange-50"
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Approve Old Pending</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {oldPendingDonations.length}
              </Badge>
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bulk Actions</h4>
          
          <Button
            onClick={approveAll}
            disabled={processing !== null}
            variant="outline"
            className="w-full justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Approve All</span>
            </div>
            <Badge variant="secondary">
              {donations.length}
            </Badge>
          </Button>
        </div>

        {/* Processing State */}
        {processing && (
          <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Processing {processing}...</span>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Hyperemotes: {hyperemoteDonations.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>High Value: {highValueDonations.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Regular: {regularDonations.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Old: {oldPendingDonations.length}</span>
            </div>
          </div>
        </div>

        {/* Warning for many pending */}
        {donations.length > 10 && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              <strong>High volume:</strong> {donations.length} donations pending. 
              Consider using bulk actions or adding more moderators.
            </AlertDescription>
          </Alert>
        )}

        {/* Telegram Tip */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-300">💡 Pro Tip</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Set up Telegram moderators to handle approvals instantly on mobile!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;