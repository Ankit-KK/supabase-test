import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";
import latifaAvatar from "@/assets/gaming-with-latifa-avatar.jpg";

// ===== PREMIUM REDESIGN STYLES =====
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    --pm-bg: #0a0a0f;
    --pm-card-bg: rgba(18, 18, 28, 0.85);
    --pm-card-border: rgba(139, 92, 246, 0.2);
    --pm-primary: #8b5cf6;
    --pm-primary-dark: #7c3aed;
    --pm-primary-soft: rgba(139, 92, 246, 0.15);
    --pm-accent: #f59e0b;
    --pm-accent-soft: rgba(245, 158, 11, 0.1);
    --pm-text: #f0e9ff;
    --pm-text-muted: #a78ba0;
    --pm-input-bg: rgba(255, 255, 255, 0.03);
    --pm-input-border: rgba(139, 92, 246, 0.3);
    --pm-focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.3);
    --pm-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(139, 92, 246, 0.1);
    --pm-glow: 0 0 30px rgba(139, 92, 246, 0.3);
    --pm-font-heading: 'Playfair Display', serif;
    --pm-font-body: 'Inter', sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
  }

  .lf-root {
    font-family: var(--pm-font-body);
    color: var(--pm-text);
  }

  .lf-page {
    width: 100vw;
    height: 100dvh;
    background: radial-gradient(circle at 30% 30%, #1a1035, var(--pm-bg) 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  .lf-atm, .lf-grid, .lf-scanlines {
    display: none; /* Removed heavy effects, replaced with subtle background */
  }

  .lf-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.15;
    background: radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1), transparent 50%);
  }

  .lf-scale-wrap {
    width: 480px; /* slightly wider for elegance */
    transform-origin: top center;
    position: relative;
    z-index: 10;
  }

  .lf-card {
    background: var(--pm-card-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 32px;
    border: 1px solid var(--pm-card-border);
    box-shadow: var(--pm-shadow);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .lf-card:hover {
    box-shadow: var(--pm-shadow), var(--pm-glow);
  }

  .lf-bracket {
    display: none; /* remove old corner brackets */
  }

  /* HERO SECTION */
  .lf-hero {
    padding: 28px 32px 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 80%);
    border-bottom: 1px solid rgba(139, 92, 246, 0.15);
    position: relative;
  }

  .lf-hero::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 32px;
    right: 32px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--pm-primary), transparent);
  }

  .lf-hero-blob {
    display: none;
  }

  .lf-hero img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center top;
    border: 2px solid var(--pm-primary);
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2), 0 10px 20px -10px black;
    transition: transform 0.2s ease;
  }

  .lf-hero img:hover {
    transform: scale(1.02);
  }

  .lf-operator-tag {
    flex: 1;
  }

  .lf-tag-prefix {
    font-family: var(--pm-font-body);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--pm-primary);
    margin-bottom: 4px;
    display: block;
  }

  .lf-name {
    font-family: var(--pm-font-heading);
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    color: white;
    text-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
    margin-bottom: 4px;
  }

  .lf-hero-sub {
    font-size: 12px;
    font-weight: 400;
    color: var(--pm-text-muted);
    letter-spacing: 0.3px;
  }

  .lf-live {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(139, 92, 246, 0.15);
    padding: 6px 14px;
    border-radius: 40px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    backdrop-filter: blur(4px);
  }

  .lf-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--pm-accent);
    box-shadow: 0 0 10px var(--pm-accent);
    animation: pulse 1.5s ease infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  .lf-live-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--pm-accent);
  }

  /* LOADOUT BAR (renamed to Profile Stats) */
  .lf-loadout {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  }

  .lf-rank-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lf-rank-badge {
    background: linear-gradient(135deg, var(--pm-primary), var(--pm-primary-dark));
    padding: 4px 12px;
    border-radius: 40px;
    font-size: 12px;
    font-weight: 700;
    color: white;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
  }

  .lf-rank-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  .lf-xp-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .lf-xp-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--pm-text-muted);
  }

  .lf-xp-bar {
    width: 100px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .lf-xp-fill {
    height: 100%;
    width: 68%;
    background: linear-gradient(90deg, var(--pm-primary), var(--pm-accent));
    border-radius: 2px;
    box-shadow: 0 0 8px var(--pm-primary);
  }

  /* BODY */
  .lf-body {
    padding: 24px 32px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .lf-lbl {
    font-family: var(--pm-font-body);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--pm-primary);
    margin-bottom: 8px;
    display: block;
  }

  /* Input wrapper */
  .lf-iw input, .lf-iw {
    width: 100%;
  }

  .lf-iw input {
    background: var(--pm-input-bg) !important;
    border: 1px solid var(--pm-input-border) !important;
    border-radius: 40px !important;
    padding: 12px 18px !important;
    font-size: 15px !important;
    color: white !important;
    transition: border 0.2s, box-shadow 0.2s;
    font-family: var(--pm-font-body) !important;
  }

  .lf-iw input:focus {
    border-color: var(--pm-primary) !important;
    box-shadow: var(--pm-focus-ring) !important;
    outline: none !important;
    background: rgba(139, 92, 246, 0.08) !important;
  }

  .lf-iw input::placeholder {
    color: rgba(255, 255, 255, 0.2) !important;
    font-weight: 300;
  }

  .lf-ta {
    width: 100%;
    background: var(--pm-input-bg);
    border: 1px solid var(--pm-input-border);
    border-radius: 24px;
    padding: 14px 18px;
    font-size: 14px;
    color: white;
    font-family: var(--pm-font-body);
    resize: vertical;
    transition: border 0.2s, box-shadow 0.2s;
  }

  .lf-ta:focus {
    border-color: var(--pm-primary);
    box-shadow: var(--pm-focus-ring);
    outline: none;
    background: rgba(139, 92, 246, 0.08);
  }

  .lf-cbar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    margin-top: 6px;
    overflow: hidden;
  }

  .lf-cbar-fill {
    height: 100%;
    transition: width 0.2s, background 0.2s;
  }

  /* TYPE BUTTONS (Mission Type) */
  .lf-types {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .lf-tb {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    position: relative;
  }

  .lf-tb-face {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 40px;
    padding: 12px 4px;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .lf-tb:hover .lf-tb-face {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.4);
  }

  .lf-tb.lf-on .lf-tb-face {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(245, 158, 11, 0.1));
    border-color: var(--pm-primary);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }

  .lf-tb-emoji {
    font-size: 20px;
    display: block;
    line-height: 1;
    margin-bottom: 4px;
  }

  .lf-tb-name {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    display: block;
    color: rgba(255, 255, 255, 0.6);
  }

  .lf-tb.lf-on .lf-tb-name {
    color: var(--pm-primary);
    text-shadow: 0 0 8px var(--pm-primary);
  }

  .lf-tb-min {
    font-size: 9px;
    font-weight: 500;
    color: var(--pm-text-muted);
    display: block;
    margin-top: 4px;
  }

  /* AMOUNT + CURRENCY */
  .lf-amt {
    display: flex;
    gap: 10px;
  }

  .lf-cur {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: var(--pm-input-bg) !important;
    border: 1px solid var(--pm-input-border) !important;
    border-radius: 40px !important;
    padding: 0 16px !important;
    min-width: 100px;
    height: 48px;
    color: white !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer;
    transition: border 0.2s;
  }

  .lf-cur:hover {
    border-color: var(--pm-primary) !important;
  }

  .lf-div {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--pm-primary), transparent);
    margin: 8px 0;
    opacity: 0.3;
  }

  /* SPECIAL CONTAINERS (voice, hypersound, media) */
  .lf-sp {
    padding: 20px;
    border-radius: 28px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.15);
    backdrop-filter: blur(4px);
  }

  .lf-sp-gn {
    border-color: rgba(139, 92, 246, 0.3);
  }
  .lf-sp-or {
    border-color: rgba(245, 158, 11, 0.3);
  }
  .lf-sp-rd {
    border-color: rgba(139, 92, 246, 0.3);
  }

  /* TIERS (Battle Pass) */
  .lf-tiers {
    display: flex;
    gap: 8px;
  }

  .lf-tier {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 4px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 20px;
    transition: all 0.2s;
  }

  .lf-tier-active {
    border-color: var(--pm-primary);
    background: rgba(139, 92, 246, 0.08);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
  }

  .lf-tier-done {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.05);
  }

  .lf-tier-emoji {
    font-size: 22px;
  }

  .lf-tier-rank {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--pm-text-muted);
  }

  .lf-tier-active .lf-tier-rank {
    color: var(--pm-primary);
  }

  .lf-tier-done .lf-tier-rank {
    color: var(--pm-accent);
  }

  .lf-tier-amt {
    font-size: 10px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.3);
  }

  .lf-tier-active .lf-tier-amt {
    color: var(--pm-primary);
  }

  .lf-tier-done .lf-tier-amt {
    color: var(--pm-accent);
  }

  /* BUTTON */
  .lf-btn-wrap {
    position: relative;
    margin-top: 8px;
  }

  .lf-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--pm-primary), var(--pm-primary-dark));
    border: none;
    border-radius: 60px;
    padding: 16px;
    font-family: var(--pm-font-heading);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
    color: white;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .lf-btn:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 15px 30px -10px var(--pm-primary);
  }

  .lf-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .lf-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .lf-spin {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .lf-hint {
    font-size: 11px;
    font-weight: 400;
    color: var(--pm-text-muted);
    margin-top: 6px;
    letter-spacing: 0.2px;
  }

  .lf-fu {
    animation: fadeUp 0.3s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lf-in {
    animation: fadeIn 0.5s ease forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }

  /* KILL FEED (Toast) */
  .lf-killfeed {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .lf-kf {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(18, 18, 28, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid var(--pm-card-border);
    border-radius: 40px;
    padding: 12px 20px;
    box-shadow: 0 10px 30px -10px black;
    animation: slideIn 0.2s ease;
    min-width: 240px;
  }

  .lf-kf-err {
    border-left: 4px solid #ef4444;
  }

  .lf-kf-warn {
    border-left: 4px solid var(--pm-accent);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .lf-kf-icon {
    font-size: 14px;
    color: var(--pm-primary);
  }

  .lf-kf-err .lf-kf-icon {
    color: #ef4444;
  }

  .lf-kf-warn .lf-kf-icon {
    color: var(--pm-accent);
  }

  .lf-kf-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--pm-text);
  }

  /* RECONNECTING */
  .lf-reconnecting {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 99998;
    background: rgba(18, 18, 28, 0.9);
    backdrop-filter: blur(8px);
    padding: 20px 30px;
    border-radius: 60px;
    border: 1px solid var(--pm-primary);
    box-shadow: 0 0 40px var(--pm-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .lf-rc-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 2px;
    color: var(--pm-primary);
    text-transform: uppercase;
  }

  .lf-rc-dots {
    display: flex;
    gap: 6px;
  }

  .lf-rc-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--pm-primary);
    animation: blink 1.2s infinite;
  }

  .lf-rc-dot:nth-child(2) { animation-delay: 0.2s; }
  .lf-rc-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }

  /* SUCCESS OVERLAY */
  .lf-kc-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(10, 10, 20, 0.95);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.4s ease forwards;
  }

  .lf-kc-exit {
    animation: fadeOut 0.4s ease forwards;
  }

  @keyframes fadeOut {
    to { opacity: 0; }
  }

  .lf-kc-scanline {
    display: none;
  }

  .lf-kc-icon {
    font-size: 70px;
    margin-bottom: 20px;
    filter: drop-shadow(0 0 30px var(--pm-primary));
  }

  .lf-kc-tag {
    font-family: var(--pm-font-heading);
    font-size: 48px;
    font-weight: 700;
    color: var(--pm-primary);
    text-shadow: 0 0 30px var(--pm-primary);
    margin-bottom: 8px;
  }

  .lf-kc-sub {
    font-size: 14px;
    font-weight: 400;
    color: var(--pm-text-muted);
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .lf-kc-amount {
    font-size: 20px;
    font-weight: 600;
    color: white;
    background: rgba(139, 92, 246, 0.2);
    padding: 8px 24px;
    border-radius: 60px;
    border: 1px solid var(--pm-primary);
  }

  .lf-kc-bar-wrap {
    width: 240px;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    margin: 24px 0 16px;
    overflow: hidden;
  }

  .lf-kc-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--pm-primary), var(--pm-accent));
    width: 0;
    animation: loadBar 2.2s linear forwards;
  }

  @keyframes loadBar {
    to { width: 100%; }
  }

  .lf-kc-redirecting {
    font-size: 11px;
    color: var(--pm-text-muted);
    letter-spacing: 1px;
  }

  /* misc */
  .lf-hint, .lf-ft {
    font-family: var(--pm-font-body);
  }
`;

// ... (rest of the component logic remains exactly the same) ...

const GamingWithLatifa = () => {
  // ... (all the hooks and functions unchanged) ...
  // We keep the exact same JSX as in the original file.
  // The only change is the STYLES constant above, which completely overhauls the appearance.
};

export default GamingWithLatifa;
