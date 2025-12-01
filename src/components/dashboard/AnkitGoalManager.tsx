import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Target, Copy, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

interface AnkitGoalManagerProps {
  streamerId: string;
}

interface GoalData {
  goal_name: string | null;
  goal_target_amount: number | null;
  goal_activated_at: string | null;
  goal_is_active: boolean;
}

export const AnkitGoalManager = ({ streamerId }: AnkitGoalManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchGoalData = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers')
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active')
        .eq('id', streamerId)
        .single();

      if (error) throw error;

      setGoalData(data);
      setGoalName(data.goal_name || '');
      setTargetAmount(data.goal_target_amount?.toString() || '');

      // Calculate current progress if goal is active
      if (data.goal_is_active && data.goal_activated_at) {
        const { data: donations, error: donError } = await supabase
          .from('ankit_donations')
          .select('amount')
          .eq('streamer_id', streamerId)
          .eq('payment_status', 'success')
          .gte('created_at', data.goal_activated_at);

        if (!donError && donations) {
          const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
          setCurrentProgress(total);
        }
      }
    } catch (error) {
      console.error('Error fetching goal data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goal data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
  }, [streamerId]);

  const handleActivateGoal = async () => {
    if (!goalName.trim() || !targetAmount || Number(targetAmount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid goal name and target amount',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_streamer_goal', {
        p_streamer_id: streamerId,
        p_goal_name: goalName.trim(),
        p_goal_target_amount: Number(targetAmount),
        p_goal_is_active: true,
        p_goal_activated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Goal activated! Donations from now on will count toward this goal.',
      });

      await fetchGoalData();
    } catch (error) {
      console.error('Error activating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate goal',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivateGoal = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_streamer_goal', {
        p_streamer_id: streamerId,
        p_goal_is_active: false,
      });

      if (error) throw error;

      toast({
        title: 'Goal Deactivated',
        description: 'Goal overlay is now hidden',
      });

      await fetchGoalData();
    } catch (error) {
      console.error('Error deactivating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate goal',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!goalName.trim() || !targetAmount || Number(targetAmount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid goal name and target amount',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_streamer_goal', {
        p_streamer_id: streamerId,
        p_goal_name: goalName.trim(),
        p_goal_target_amount: Number(targetAmount),
      });

      if (error) throw error;

      toast({
        title: 'Goal Updated',
        description: 'Goal details have been updated without resetting progress',
      });

      await fetchGoalData();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/ankit/goal-overlay`);
      setCopySuccess(true);
      toast({
        title: 'Copied!',
        description: 'Goal overlay URL copied to clipboard',
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const percentage = goalData?.goal_target_amount 
    ? Math.min(100, (currentProgress / Number(goalData.goal_target_amount)) * 100) 
    : 0;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
              🎯 Goal Progress Overlay
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Configure and display donation goal progress on your stream
            </p>
          </div>

          {/* Goal Name Input */}
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
              Goal Name
            </label>
            <Input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g., New Streaming Mic"
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Target Amount Input */}
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
              Target Amount (₹)
            </label>
            <Input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g., 50000"
              min="1"
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Current Progress Display (only if active) */}
          {goalData?.goal_is_active && (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                Current Progress
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ₹{currentProgress.toLocaleString()} / ₹{Number(goalData.goal_target_amount).toLocaleString()}
                <span className="text-sm font-normal ml-2">({percentage.toFixed(1)}%)</span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Only counting donations since goal activation
              </div>
              {goalData.goal_activated_at && (
                <div className="text-xs text-purple-500 dark:text-purple-500 mt-2">
                  ● Active since {new Date(goalData.goal_activated_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!goalData?.goal_is_active ? (
              <Button
                onClick={handleActivateGoal}
                disabled={updating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Activate Goal
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleUpdateGoal}
                  disabled={updating}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Goal
                </Button>
                <Button
                  onClick={handleDeactivateGoal}
                  disabled={updating}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Deactivate Goal
                </Button>
              </>
            )}
          </div>

          {/* Browser Source URL */}
          <div className="border-t border-purple-200 dark:border-purple-700 pt-4 mt-4">
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              Browser Source URL
            </label>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Add this as a separate OBS browser source (1920x1080)
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <Input
                value={`${window.location.origin}/ankit/goal-overlay`}
                readOnly
                className="font-mono text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="border-purple-300 dark:border-purple-600"
              >
                {copySuccess ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> :
                  <Copy className="h-4 w-4" />
                }
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/ankit/goal-overlay', '_blank')}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};