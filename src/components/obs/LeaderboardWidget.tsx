import React, { useState, useEffect } from "react";
import { Crown, MessageSquare } from "lucide-react";
import { getCurrencySymbol } from "@/constants/currencies";

export interface DonationData {
  name: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface TopDonator {
  name: string;
  totalAmount: number;
}

interface LeaderboardWidgetProps {
  topDonator: TopDonator | null;
  latestDonations: DonationData[];
  brandColor?: string;
  rotationInterval?: number;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  topDonator,
  latestDonations,
  brandColor = "#a855f7",
  rotationInterval = 5000,
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
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [latestDonations.length, rotationInterval]);

  useEffect(() => {
    if (currentIndex >= latestDonations.length && latestDonations.length > 0) {
      setCurrentIndex(0);
    }
  }, [latestDonations.length, currentIndex]);

  const currentDonation = latestDonations[currentIndex];

  // Convert hex to rgba for backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      style={{
        background: "rgba(20, 20, 30, 0.9)",
        border: `1px solid ${hexToRgba(brandColor, 0.4)}`,
        borderRadius: "16px",
        padding: "16px 24px",
        boxShadow: `0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px ${hexToRgba(brandColor, 0.3)}`,
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
      <div style={{ height: "1px", background: hexToRgba(brandColor, 0.3), margin: "4px 0" }} />

      {/* !hyperchat Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={20} style={{ color: brandColor }} />
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
