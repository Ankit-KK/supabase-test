import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity, DollarSign, MessageSquare, Mic, Heart, Zap } from 'lucide-react';

interface ActivityFeedProps {
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
  }>;
  brandColor?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  donations,
  brandColor = '#3b82f6'
}) => {
  const getActivityIcon = (donation: any) => {
    if (donation.is_hyperemote) {
      return <Heart className="h-4 w-4 text-pink-500" />;
    }
    if (donation.voice_message_url) {
      return <Mic className="h-4 w-4 text-blue-500" />;  
    }
    if (donation.message) {
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    }
    return <DollarSign className="h-4 w-4 text-yellow-500" />;
  };

  const getActivityDescription = (donation: any) => {
    if (donation.is_hyperemote) {
      return `sent a Hyperemote for ₹${donation.amount}`;
    }
    if (donation.voice_message_url) {
      return `sent a voice message with ₹${donation.amount}`;
    }
    if (donation.message) {
      return `donated ₹${donation.amount} with message: "${donation.message.slice(0, 50)}${donation.message.length > 50 ? '...' : ''}"`;
    }
    return `donated ₹${donation.amount}`;
  };

  const getAmountColor = (amount: number) => {
    if (amount >= 500) return 'text-red-500 font-bold';
    if (amount >= 100) return 'text-orange-500 font-semibold';
    if (amount >= 50) return 'text-blue-500 font-medium';
    return 'text-green-500';
  };

  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Donations will appear here when received
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
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </div>
          <Badge variant="secondary" className="animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {donations.map((donation) => (
            <div 
              key={donation.id} 
              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback 
                  className="text-white text-xs font-medium"
                  style={{ backgroundColor: brandColor }}
                >
                  {donation.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{donation.name}</span>
                  {getActivityIcon(donation)}
                  <span className={`text-sm ${getAmountColor(donation.amount)}`}>
                    ₹{donation.amount}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getActivityDescription(donation)}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {donation.payment_status === 'success' ? (
                      <Badge 
                        className="bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                      >
                        Paid
                      </Badge>
                    ) : (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {donation.payment_status}
                      </Badge>
                    )}
                    
                    {donation.moderation_status === 'auto_approved' && (
                      <Badge 
                        className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"
                      >
                        Live
                      </Badge>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {donations.length >= 10 && (
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing latest 10 activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;