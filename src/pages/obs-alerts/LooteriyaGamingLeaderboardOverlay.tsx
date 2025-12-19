import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { convertToINR, getCurrencySymbol } from '@/constants/currencies';
import { Crown, Trophy } from 'lucide-react';

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
const ROTATION_INTERVAL = 5000; // 5 seconds

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
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`looteriya-widget-${id}`, JSON.stringify(position));
  }, [id, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) return; // Ignore double-clicks
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
      ref={widgetRef}
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

  // Reset index when donations change
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

      {/* Progress dots */}
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

const LooteriyaGamingLeaderboardOverlay = () => {
  const [topDonator, setTopDonator] = useState<TopDonator | null>(null);
  const [top5Donations, setTop5Donations] = useState<DonationData[]>([]);
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);

  // Fetch Pusher config
  useEffect(() => {
    const fetchPusherConfig = async () => {
      try {
        const { data } = await supabase
          .from('streamers')
          .select('pusher_group')
          .eq('streamer_slug', 'looteriya_gaming')
          .single();
        
        const pusherGroup = data?.pusher_group || 1;
        const configResponse = await supabase.functions.invoke('get-pusher-config', {
          body: { pusherGroup }
        });
        
        if (configResponse.data) {
          setPusherConfig({
            key: configResponse.data.key,
            cluster: configResponse.data.cluster
          });
        }
      } catch (error) {
        console.error('[Leaderboard] Error fetching Pusher config:', error);
      }
    };
    fetchPusherConfig();
  }, []);

  const fetchDonations = useCallback(async () => {
    try {
      // Get today's start in UTC
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch all successful donations for today
      const { data: donations, error } = await supabase
        .from('looteriya_gaming_donations')
        .select('name, amount, currency, created_at')
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .gte('created_at', todayISO)
        .order('amount', { ascending: false });

      if (error) {
        console.error('[Leaderboard] Error fetching donations:', error);
        return;
      }

      if (!donations || donations.length === 0) {
        setTopDonator(null);
        setTop5Donations([]);
        return;
      }

      // Calculate top donator (group by name, sum amounts in INR)
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

      // Get top 5 individual donations (sorted by INR amount)
      const sortedDonations = [...donations]
        .map(d => ({
          ...d,
          inrAmount: convertToINR(d.amount, d.currency || 'INR')
        }))
        .sort((a, b) => b.inrAmount - a.inrAmount)
        .slice(0, 5);

      setTop5Donations(sortedDonations);
    } catch (error) {
      console.error('[Leaderboard] Error processing donations:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Pusher subscription for real-time updates
  useEffect(() => {
    if (!pusherConfig) return;

    console.log('[Leaderboard] Connecting to Pusher...');
    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster
    });

    const channel = pusher.subscribe('looteriya_gaming-dashboard');
    
    channel.bind('new-donation', () => {
      console.log('[Leaderboard] New donation received, refreshing...');
      fetchDonations();
    });

    channel.bind('donation-approved', () => {
      console.log('[Leaderboard] Donation approved, refreshing...');
      fetchDonations();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('looteriya_gaming-dashboard');
      pusher.disconnect();
    };
  }, [pusherConfig, fetchDonations]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <DraggableWidget id="top-donator" defaultPosition={{ x: 50, y: 50 }}>
        <TopDonatorCard topDonator={topDonator} />
      </DraggableWidget>

      <DraggableWidget id="top-5-donations" defaultPosition={{ x: 50, y: 200 }}>
        <Top5DonationsCarousel donations={top5Donations} />
      </DraggableWidget>
    </div>
  );
};

export default LooteriyaGamingLeaderboardOverlay;
