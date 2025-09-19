import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface TelegramActivityProps {
  streamerId: string;
}

interface ActivityLog {
  id: string;
  action: string;
  moderator_name: string;
  donation_id: string;
  donation_amount: number;
  donor_name: string;
  timestamp: string;
  details?: string;
}

const TelegramActivity: React.FC<TelegramActivityProps> = ({ streamerId }) => {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayApprovals: 0,
    todayRejections: 0,
    activeModerators: 0,
    avgResponseTime: '2m'
  });

  // Mock activity data (in real app, this would come from a proper activity log table)
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        // This is mock data - in a real implementation, you'd have an activity log table
        const mockActivity: ActivityLog[] = [
          {
            id: '1',
            action: 'approved',
            moderator_name: 'Moderator1',
            donation_id: 'don_1',
            donation_amount: 100,
            donor_name: 'John Doe',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            details: 'Approved via Telegram'
          },
          {
            id: '2',
            action: 'rejected',
            moderator_name: 'Moderator2',
            donation_id: 'don_2',
            donation_amount: 50,
            donor_name: 'Jane Smith',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            details: 'Inappropriate content'
          },
          {
            id: '3',
            action: 'approved',
            moderator_name: 'Moderator1',
            donation_id: 'don_3',
            donation_amount: 200,
            donor_name: 'Bob Johnson',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            details: 'Auto-approved (Hyperemote)'
          }
        ];

        // Simulate API delay
        setTimeout(() => {
          setActivity(mockActivity);
          setStats({
            todayApprovals: 15,
            todayRejections: 2,
            activeModerators: 3,
            avgResponseTime: '1.5m'
          });
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Error fetching activity:', error);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [streamerId]);

  const refreshActivity = () => {
    setLoading(true);
    // Re-fetch activity
    setTimeout(() => setLoading(false), 1000);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.todayApprovals}</p>
              <p className="text-xs text-muted-foreground">Approved Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.todayRejections}</p>
              <p className="text-xs text-muted-foreground">Rejected Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.activeModerators}</p>
              <p className="text-xs text-muted-foreground">Active Mods</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshActivity}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity will appear here when moderators approve or reject donations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(item.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getActionColor(item.action)}>
                        {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium">{item.moderator_name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      <strong>{item.donor_name}</strong>'s ₹{item.donation_amount} donation
                    </p>
                    
                    {item.details && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {activity.length >= 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    Load More Activity
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900 dark:text-green-300">High Approval Rate</p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                88% of donations are being approved quickly by your moderation team.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900 dark:text-blue-300">Fast Response</p>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Average response time is under 2 minutes - great for live streams!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramActivity;