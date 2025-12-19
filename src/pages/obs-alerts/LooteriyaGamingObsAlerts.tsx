import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LooteriyaGamingAlertDisplay } from '@/components/LooteriyaGamingAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';
import { convertToINR, getCurrencySymbol } from '@/constants/currencies';
import { Crown, Trophy } from 'lucide-react';
import Pusher from 'pusher-js';

interface DonationData {
  name: string;
  amount: number;
  currency: string;
  created_at: string;
}

interface TopDonator {
  name: string;
  totalAmount: number;
}

interface WidgetPosition {
  x: number;
  y: number;
  scale: number;
}

const SCALE_LEVELS = [0.8, 1.0, 1.2, 1.5];
const ROTATION_INTERVAL = 5000;

const DraggableWidget = ({
  id,
  children,
  defaultPosition = { x: 50, y: 50 }
}: {
  id: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
}) => {
  const [position, setPosition] = useState<WidgetPosition>(() => {
    const saved = localStorage.getItem(`looteriya-widget-${id}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return { ...defaultPosition, scale: 1.0 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(`looteriya-widget-${id}`, JSON.stringify(position));
  }, [id, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPosition(prev => ({
      ...prev,
      x: dragRef.current!.startPosX + deltaX,
      y: dragRef.current!.startPosY + deltaY
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  const handleDoubleClick = () => {
    const currentIndex = SCALE_LEVELS.indexOf(position.scale);
    const nextIndex = (currentIndex + 1) % SCALE_LEVELS.length;
    setPosition(prev => ({ ...prev, scale: SCALE_LEVELS[nextIndex] }));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `scale(${position.scale})`,
        transformOrigin: 'top left',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : 1
      }}
    >
      {children}
    </div>
  );
};

const TopDonatorCard = ({ topDonator }: { topDonator: TopDonator | null }) => {
  if (!topDonator) {
    return (
      <div
        style={{
          background: 'rgba(45, 20, 60, 0.85)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          padding: '20px 32px',
          boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)',
          minWidth: '280px',
          textAlign: 'center'
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>
          No donations yet today
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(45, 20, 60, 0.85)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: '16px',
        padding: '20px 32px',
        boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)',
        minWidth: '280px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Crown size={28} style={{ color: '#fbbf24' }} />
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: 'linear-gradient(90deg, #9333ea, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Top Donator
        </span>
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '4px'
      }}>
        {topDonator.name}
      </div>
      <div style={{
        fontSize: '22px',
        fontWeight: '600',
        background: 'linear-gradient(90deg, #22c55e, #4ade80)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        ₹{topDonator.totalAmount.toLocaleString('en-IN')}
      </div>
    </div>
  );
};

const Top5DonationsCarousel = ({ donations }: { donations: DonationData[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (donations.length === 0) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % donations.length);
        setIsTransitioning(false);
      }, 300);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [donations.length]);

  useEffect(() => {
    if (currentIndex >= donations.length) {
      setCurrentIndex(0);
    }
  }, [donations.length, currentIndex]);

  if (donations.length === 0) {
    return (
      <div
        style={{
          background: 'rgba(45, 20, 60, 0.85)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          padding: '20px 32px',
          boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)',
          minWidth: '280px',
          textAlign: 'center'
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>
          No donations yet today
        </div>
      </div>
    );
  }

  const currentDonation = donations[currentIndex];
  const rankEmojis = ['🥇', '🥈', '🥉'];
  const rankDisplay = currentIndex < 3 ? rankEmojis[currentIndex] : `#${currentIndex + 1}`;

  return (
    <div
      style={{
        background: 'rgba(45, 20, 60, 0.85)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: '16px',
        padding: '20px 32px',
        boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)',
        minWidth: '300px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <Trophy size={24} style={{ color: '#c084fc' }} />
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: 'linear-gradient(90deg, #9333ea, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Top 5 Donations
        </span>
      </div>
      
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'all 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '32px',
            minWidth: '48px',
            textAlign: 'center'
          }}>
            {rankDisplay}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '2px'
            }}>
              {currentDonation.name}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              background: 'linear-gradient(90deg, #22c55e, #4ade80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {getCurrencySymbol(currentDonation.currency)}{currentDonation.amount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '16px'
      }}>
        {donations.map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index === currentIndex
                ? 'linear-gradient(90deg, #9333ea, #c084fc)'
                : 'rgba(168, 85, 247, 0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

const LooteriyaGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [topDonator, setTopDonator] = useState<TopDonator | null>(null);
  const [top5Donations, setTop5Donations] = useState<DonationData[]>([]);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('looteriya_gaming');
  
  const {
    currentAlert,
    isVisible,
  } = usePusherAlerts({
    channelName: 'looteriya_gaming-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
    alertDuration: {
      text: 15000,
      voice: 60000,
      hyperemote: 5000,
    },
  });

  const fetchDonations = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: donations, error } = await supabase
        .from('looteriya_gaming_donations')
        .select('name, amount, currency, created_at')
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .gte('created_at', todayISO)
        .order('amount', { ascending: false });

      if (error) {
        console.error('[OBS] Error fetching donations:', error);
        return;
      }

      if (!donations || donations.length === 0) {
        setTopDonator(null);
        setTop5Donations([]);
        return;
      }

      // Calculate top donator
      const donatorTotals: Record<string, { name: string; totalAmount: number }> = {};
      donations.forEach(d => {
        const key = d.name.toLowerCase();
        const amountInINR = convertToINR(d.amount, d.currency || 'INR');
        if (!donatorTotals[key]) {
          donatorTotals[key] = { name: d.name, totalAmount: 0 };
        }
        donatorTotals[key].totalAmount += amountInINR;
      });

      const sortedDonators = Object.values(donatorTotals).sort((a, b) => b.totalAmount - a.totalAmount);
      setTopDonator(sortedDonators[0] || null);

      // Get top 5 individual donations
      const sortedDonations = [...donations]
        .map(d => ({
          ...d,
          inrAmount: convertToINR(d.amount, d.currency || 'INR')
        }))
        .sort((a, b) => b.inrAmount - a.inrAmount)
        .slice(0, 5);

      setTop5Donations(sortedDonations);
    } catch (error) {
      console.error('[OBS] Error processing donations:', error);
    }
  }, []);

  // Initial fetch and scale
  useEffect(() => {
    fetchDonations();

    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'looteriya_gaming')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('looteriya_gaming-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.looteriya_gaming'
      }, (payload: any) => {
        if (payload.new?.alert_box_scale) {
          setAlertBoxScale(Number(payload.new.alert_box_scale));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDonations]);

  // Pusher subscription for leaderboard updates
  useEffect(() => {
    if (!pusherConfig?.key || !pusherConfig?.cluster) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster
    });

    const channel = pusher.subscribe('looteriya_gaming-dashboard');
    
    channel.bind('new-donation', () => {
      fetchDonations();
    });

    channel.bind('donation-approved', () => {
      fetchDonations();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('looteriya_gaming-dashboard');
      pusher.disconnect();
    };
  }, [pusherConfig, fetchDonations]);

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Pusher configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <LooteriyaGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        scale={alertBoxScale}
      />

      <DraggableWidget id="top-donator" defaultPosition={{ x: 50, y: 50 }}>
        <TopDonatorCard topDonator={topDonator} />
      </DraggableWidget>

      <DraggableWidget id="top-5-donations" defaultPosition={{ x: 50, y: 200 }}>
        <Top5DonationsCarousel donations={top5Donations} />
      </DraggableWidget>
    </div>
  );
};

export default LooteriyaGamingObsAlerts;
