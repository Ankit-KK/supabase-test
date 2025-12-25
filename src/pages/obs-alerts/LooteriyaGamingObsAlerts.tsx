import React, { useState, useEffect, useRef, useCallback } from "react";
import { LooteriyaGamingAlertDisplay } from "@/components/LooteriyaGamingAlertDisplay";
import { usePusherAlerts } from "@/hooks/usePusherAlerts";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import { supabase } from "@/integrations/supabase/client";
import { convertToINR, getCurrencySymbol } from "@/constants/currencies";
import { Crown, MessageSquare } from "lucide-react";
import Pusher from "pusher-js";

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

const ResizableWidget = ({
  id,
  children,
  defaultState = { x: 50, y: 50, width: 400, height: 120 },
}: {
  id: string;
  children: React.ReactNode;
  defaultState?: WidgetState;
}) => {
  const [state, setState] = useState<WidgetState>(() => {
    const saved = localStorage.getItem(`looteriya-widget-${id}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultState;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
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
      startState: { ...state },
    };
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startState: { ...state },
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      if (isDragging) {
        setState((prev) => ({
          ...prev,
          x: dragRef.current!.startState.x + deltaX,
          y: dragRef.current!.startState.y + deltaY,
        }));
      } else if (isResizing && resizeCorner) {
        const { startState } = dragRef.current;
        let newState = { ...startState };

        if (resizeCorner.includes("e")) {
          newState.width = Math.max(200, startState.width + deltaX);
        }
        if (resizeCorner.includes("w")) {
          const newWidth = Math.max(200, startState.width - deltaX);
          newState.width = newWidth;
          newState.x = startState.x + (startState.width - newWidth);
        }
        if (resizeCorner.includes("s")) {
          newState.height = Math.max(80, startState.height + deltaY);
        }
        if (resizeCorner.includes("n")) {
          const newHeight = Math.max(80, startState.height - deltaY);
          newState.height = newHeight;
          newState.y = startState.y + (startState.height - newHeight);
        }

        setState(newState);
      }
    },
    [isDragging, isResizing, resizeCorner],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      style={{
        position: "absolute",
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        userSelect: "none",
        zIndex: isDragging || isResizing ? 1000 : 1,
      }}
    >
      {/* Main draggable area */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {children}
      </div>

      {/* Edge resize handles */}
      <div
        style={{ position: "absolute", top: 0, left: 16, right: 16, height: 8, cursor: "ns-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "n")}
      />
      <div
        style={{ position: "absolute", bottom: 0, left: 16, right: 16, height: 8, cursor: "ns-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "s")}
      />
      <div
        style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 8, cursor: "ew-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "w")}
      />
      <div
        style={{ position: "absolute", right: 0, top: 16, bottom: 16, width: 8, cursor: "ew-resize", zIndex: 10 }}
        onMouseDown={(e) => handleResizeStart(e, "e")}
      />

      {/* Corner resize handles */}
      <div
        style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, cursor: "nw-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "nw")}
      />
      <div
        style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, cursor: "ne-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "ne")}
      />
      <div
        style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, cursor: "sw-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "sw")}
      />
      <div
        style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, cursor: "se-resize", zIndex: 11 }}
        onMouseDown={(e) => handleResizeStart(e, "se")}
      />
    </div>
  );
};

const LeaderboardWidget = ({
  topDonator,
  latestDonations,
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
        setCurrentIndex((prev) => (prev + 1) % latestDonations.length);
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
        background: "rgba(45, 20, 60, 0.9)",
        border: "1px solid rgba(168, 85, 247, 0.4)",
        borderRadius: "16px",
        padding: "16px 24px",
        boxShadow: "0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
      }}
    >
      {/* Top Donator Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Crown size={22} style={{ color: "#fbbf24" }} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#ffffff",
            }}
          >
            Top Donator
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {topDonator ? (
            <>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>{topDonator.name}</span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  background: "linear-gradient(90deg, #22c55e, #4ade80)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ₹{topDonator.totalAmount.toLocaleString("en-IN")}
              </span>
            </>
          ) : (
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>No donations yet</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(168, 85, 247, 0.3)", margin: "4px 0" }} />

      {/* !hyperchat Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={20} style={{ color: "#c084fc" }} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              letterSpacing: "1px",
              color: "#ffffff",
            }}
          >
            !hyperchat
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? "translateX(10px)" : "translateX(0)",
            transition: "all 0.3s ease-out",
          }}
        >
          {currentDonation ? (
            <>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>{currentDonation.name}</span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  background: "linear-gradient(90deg, #22c55e, #4ade80)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {getCurrencySymbol(currentDonation.currency)}
                {currentDonation.amount.toLocaleString("en-IN")}
              </span>
            </>
          ) : (
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>No donations yet</span>
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
  const { config: pusherConfig, loading: configLoading } = usePusherConfig("looteriya_gaming");

  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: "looteriya_gaming-alerts",
    pusherKey: pusherConfig?.key || "",
    pusherCluster: pusherConfig?.cluster || "",
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

      // Query 1: Fetch today's donations for Top Donator calculation
      const { data: todayDonations, error: todayError } = await supabase
        .from("looteriya_gaming_donations")
        .select("name, amount, currency, created_at")
        .eq("payment_status", "success")
        .in("moderation_status", ["approved", "auto_approved"])
        .order("created_at", { ascending: false });

      // Query 2: Fetch latest 5 donations from all time for !hyperchat
      const { data: latestDonationsData, error: latestError } = await supabase
        .from("looteriya_gaming_donations")
        .select("name, amount, currency, created_at")
        .eq("payment_status", "success")
        .in("moderation_status", ["approved", "auto_approved"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (todayError) {
        console.error("[OBS] Error fetching today donations:", todayError);
      }
      if (latestError) {
        console.error("[OBS] Error fetching latest donations:", latestError);
      }

      // Calculate top donator from today's donations only
      if (todayDonations && todayDonations.length > 0) {
        const donatorTotals: Record<string, { name: string; totalAmount: number }> = {};
        todayDonations.forEach((d) => {
          const key = d.name.toLowerCase();
          const amountInINR = convertToINR(d.amount, d.currency || "INR");
          if (!donatorTotals[key]) {
            donatorTotals[key] = { name: d.name, totalAmount: 0 };
          }
          donatorTotals[key].totalAmount += amountInINR;
        });

        const sortedDonators = Object.values(donatorTotals).sort((a, b) => b.totalAmount - a.totalAmount);
        setTopDonator(sortedDonators[0] || null);
      } else {
        setTopDonator(null);
      }

      // Set latest 5 donations from all time for !hyperchat rotation
      setLatestDonations(latestDonationsData || []);
    } catch (error) {
      console.error("[OBS] Error processing donations:", error);
    }
  }, []);

  useEffect(() => {
    fetchDonations();

    const fetchScale = async () => {
      const { data, error } = await supabase
        .from("streamers")
        .select("alert_box_scale")
        .eq("streamer_slug", "looteriya_gaming")
        .single();

      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel("looteriya_gaming-settings")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "streamers",
          filter: "streamer_slug=eq.looteriya_gaming",
        },
        (payload: any) => {
          if (payload.new?.alert_box_scale) {
            setAlertBoxScale(Number(payload.new.alert_box_scale));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDonations]);

  useEffect(() => {
    if (!pusherConfig?.key || !pusherConfig?.cluster) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe("looteriya_gaming-dashboard");

    channel.bind("new-donation", () => {
      fetchDonations();
    });

    channel.bind("donation-approved", () => {
      fetchDonations();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("looteriya_gaming-dashboard");
      pusher.disconnect();
    };
  }, [pusherConfig, fetchDonations]);

  if (configLoading) {
    return <div className="min-h-screen bg-transparent" />;
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <LooteriyaGamingAlertDisplay donation={currentAlert} isVisible={isVisible} scale={alertBoxScale} />

      <ResizableWidget id="leaderboard" defaultState={{ x: 50, y: 50, width: 400, height: 120 }}>
        <LeaderboardWidget topDonator={topDonator} latestDonations={latestDonations} />
      </ResizableWidget>
    </div>
  );
};

export default LooteriyaGamingObsAlerts;
