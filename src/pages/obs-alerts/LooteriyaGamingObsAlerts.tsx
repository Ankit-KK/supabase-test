import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LooteriyaGamingAlertDisplay } from '@/components/LooteriyaGamingAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';
import { convertToINR, getCurrencySymbol } from '@/constants/currencies';
import { Crown, MessageSquare } from 'lucide-react';
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

interface WidgetState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ROTATION_INTERVAL = 5000;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 120;

const ResizableWidget = ({
  id,
  children,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 400, height: 160 }
}: {
  id: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
}) => {
  const [state, setState] = useState<WidgetState>(() => {
    const saved = localStorage.getItem(`looteriya-widget-${id}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return { ...defaultPosition, ...defaultSize };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startState: WidgetState } | null>(null);

  useEffect(() => {
    localStorage.setItem(`looteriya-widget-${id}`, JSON.stringify(state));
  }, [id, state]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startState: { ...state }
    };
  };

  const handleResizeStart = (corner: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(corner);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startState: { ...state }
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const start = dragRef.current.startState;

    if (isDragging) {
      setState(prev => ({
        ...prev,
        x: start.x + deltaX,
        y: start.y + deltaY
      }));
    } else if (isResizing) {
      let newWidth = start.width;
      let newHeight = start.height;
      let newX = start.x;
      let newY = start.y;

      if (isResizing.includes('right')) {
        newWidth = Math.max(MIN_WIDTH, start.width + deltaX);
      }
      if (isResizing.includes('left')) {
        newWidth = Math.max(MIN_WIDTH, start.width - deltaX);
        newX = start.x + (start.width - newWidth);
      }
      if (isResizing.includes('bottom')) {
        newHeight = Math.max(MIN_HEIGHT, start.height + deltaY);
      }
      if (isResizing.includes('top')) {
        newHeight = Math.max(MIN_HEIGHT, start.height - deltaY);
        newY = start.y + (start.height - newHeight);
      }

      setState({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    background: 'rgba(168, 85, 247, 0.6)',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    zIndex: 10
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        userSelect: 'none',
        zIndex: isDragging || isResizing ? 1000 : 1
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {children}
      </div>
      
      {/* Corner resize handles */}
      <div onMouseDown={handleResizeStart('top-left')} style={{ ...handleStyle, top: -6, left: -6, cursor: 'nwse-resize' }} />
      <div onMouseDown={handleResizeStart('top-right')} style={{ ...handleStyle, top: -6, right: -6, cursor: 'nesw-resize' }} />
      <div onMouseDown={handleResizeStart('bottom-left')} style={{ ...handleStyle, bottom: -6, left: -6, cursor: 'nesw-resize' }} />
      <div onMouseDown={handleResizeStart('bottom-right')} style={{ ...handleStyle, bottom: -6, right: -6, cursor: 'nwse-resize' }} />
    </div>
  );
};

const LeaderboardWidget = ({ 
  topDonator, 
  latestDonations 
}: { 
  topDonator: TopDonator | null; 
  latestDonations: DonationData[];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (latestDonations.length === 0) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % latestDonations.length);
        setIsTransitioning(false);
      }, 300);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [latestDonations.length]);

  useEffect(() => {
    if (currentIndex >= latestDonations.length && latestDonations.length > 0) {
      setCurrentIndex(0);
    }
  }, [latestDonations.length, currentIndex]);

  const currentDonation = latestDonations[currentIndex];

  return (
    <div
      style={{
        background: 'rgba(45, 20, 60, 0.9)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: '16px',
        padding: '16px 24px',
        boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around'
      }}
    >
      {/* Top Donator Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown size={22} style={{ color: '#fbbf24' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #9333ea, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Top Donator
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {topDonator ? (
            <>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                {topDonator.name}
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ₹{topDonator.totalAmount.toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              No donations yet
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(168, 85, 247, 0.3)', margin: '4px 0' }} />

      {/* !hyperchat Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} style={{ color: '#c084fc' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #9333ea, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            !hyperchat
          </span>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateX(10px)' : 'translateX(0)',
            transition: 'all 0.3s ease-out'
          }}
        >
          {currentDonation ? (
            <>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                {currentDonation.name}
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {getCurrencySymbol(currentDonation.currency)}{currentDonation.amount.toLocaleString('en-IN')}
              </span>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                {latestDonations.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: index === currentIndex
                        ? 'linear-gradient(90deg, #9333ea, #c084fc)'
                        : 'rgba(168, 85, 247, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              No donations yet
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const LooteriyaGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [topDonator, setTopDonator] = useState<TopDonator | null>(null);
  const [latestDonations, setLatestDonations] = useState<DonationData[]>([]);
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OBS] Error fetching donations:', error);
        return;
      }

      if (!donations || donations.length === 0) {
        setTopDonator(null);
        setLatestDonations([]);
        return;
      }

      // Calculate top donator (sum by name)
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

      // Get latest 5 donations (already sorted by created_at desc)
      setLatestDonations(donations.slice(0, 5));
    } catch (error) {
      console.error('[OBS] Error processing donations:', error);
    }
  }, []);

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

      <ResizableWidget id="leaderboard" defaultPosition={{ x: 50, y: 50 }} defaultSize={{ width: 450, height: 140 }}>
        <LeaderboardWidget topDonator={topDonator} latestDonations={latestDonations} />
      </ResizableWidget>
    </div>
  );
};

export default LooteriyaGamingObsAlerts;
