import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, MessageSquare, Mic, Heart, Play, Volume2 } from 'lucide-react';

interface DonationCardProps {
  donation: {
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
  };
  brandColor?: string;
  showModerationActions?: boolean;
  onModerationAction?: (donationId: string, action: 'approve' | 'reject') => void;
}

const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  brandColor = '#3b82f6',
  showModerationActions = false,
  onModerationAction
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const playVoiceMessage = () => {
    if (donation.voice_message_url) {
      const audio = new Audio(donation.voice_message_url);
      audio.play().catch(console.error);
    }
  };

  const getDonationTypeIcon = () => {
    if (donation.is_hyperemote) {
      return <Heart className="h-4 w-4 text-pink-500" />;
    }
    if (donation.voice_message_url) {
      return <Mic className="h-4 w-4 text-blue-500" />;
    }
    if (donation.message) {
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    }
    return <DollarSign className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback 
              className="text-white font-medium"
              style={{ backgroundColor: brandColor }}
            >
              {donation.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-foreground truncate">
                  {donation.name}
                </h4>
                {getDonationTypeIcon()}
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className="font-bold text-lg"
                  style={{ color: brandColor }}
                >
                  ₹{donation.amount}
                </span>
              </div>
            </div>

            {/* Message */}
            {donation.message && donation.message_visible && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  "{donation.message}"
                </p>
              </div>
            )}

            {/* Voice Message */}
            {donation.voice_message_url && (
              <div className="mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playVoiceMessage}
                  className="flex items-center space-x-2"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Play Voice Message</span>
                </Button>
              </div>
            )}

            {/* Hyperemote indicator */}
            {donation.is_hyperemote && (
              <div className="mb-3">
                <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 border-pink-500/20">
                  <Heart className="h-3 w-3 mr-1" />
                  Hyperemote
                </Badge>
              </div>
            )}

            {/* Status and timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(donation.moderation_status)}>
                  {donation.moderation_status}
                </Badge>
                <Badge className={getPaymentStatusColor(donation.payment_status)}>
                  {donation.payment_status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Moderation Actions */}
            {showModerationActions && donation.moderation_status === 'pending' && onModerationAction && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={() => onModerationAction(donation.id, 'approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onModerationAction(donation.id, 'reject')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationCard;