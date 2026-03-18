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
    display: none; /* Removed heavy effects */
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
    width: 480px;
    transform-origin: top center;
    position: relative;
    z-index: 10;
    min-height: 200px;
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

  @supports not (backdrop-filter: blur(12px)) {
    .lf-card {
      background: #12121c;
    }
  }

  .lf-card:hover {
    box-shadow: var(--pm-shadow), var(--pm-glow);
  }

  .lf-bracket {
    display: none;
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

  /* LOADOUT BAR */
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

  .lf-iw input {
    width: 100%;
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

  /* TYPE BUTTONS */
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

  /* SPECIAL CONTAINERS */
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

  /* TIERS */
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

  /* KILL FEED */
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
`;

/* ── Smoke Canvas ── */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const COLORS = ['168,85,247','244,114,182','139,92,246','232,121,249'];
    type P = { x:number; y:number; r:number; vx:number; vy:number; alpha:number; color:string; };
    const ps: P[] = [];
    const spawn = (): P => ({ x:Math.random()*canvas.width, y:canvas.height+10, r:0.8+Math.random()*2.2, vx:(Math.random()-0.5)*0.3, vy:-0.15-Math.random()*0.3, alpha:0.15+Math.random()*0.45, color:COLORS[Math.floor(Math.random()*COLORS.length)] });
    for (let i=0;i<65;i++) { const p=spawn(); p.y=Math.random()*canvas.height; ps.push(p); }
    let frame: number;
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (Math.random()<0.06) ps.push(spawn());
      for (let i=ps.length-1;i>=0;i--) {
        const p=ps[i]; p.x+=p.vx; p.y+=p.vy;
        if (p.y<-10) { ps.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.color},${p.alpha})`; ctx.fill();
      }
      frame=requestAnimationFrame(tick);
    };
    tick();
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(frame); window.removeEventListener('resize',onResize); };
  }, []);
  return <canvas ref={canvasRef} className="lf-canvas"/>;
};

/* ── Thank You! 💜 Overlay ── */
const SuccessOverlay: React.FC<{ amount:string; currency:string; onDone:()=>void }> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.classList.add('lf-kc-exit');
      setTimeout(onDone, 400);
    }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="lf-kc-overlay">
      <div className="lf-kc-scanline"/>
      <img src={latifaAvatar} alt="Latifa" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:"3px solid var(--pm-primary)",boxShadow:"0 0 20px rgba(139,92,246,0.6)",marginBottom:8}}/>
      <div className="lf-kc-tag">Thank You! 💜</div>
      <div className="lf-kc-sub">Latifa loves you for this</div>
      <div className="lf-kc-amount">{currency}{amount} Sent!</div>
      <div className="lf-kc-bar-wrap"><div className="lf-kc-bar"/></div>
      <div className="lf-kc-redirecting">Taking you to confirmation...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = { id:number; text:string; icon:string; variant:'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text:string, icon='✦', variant:KFMsg['variant']='default') => {
    const id=++kfId;
    setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)), 3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.setValueAtTime(880,c.currentTime); o.frequency.exponentialRampToValueAtTime(220,c.currentTime+0.06); g.gain.setValueAtTime(0.07,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); } catch {} };
const playConfirm = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [440,550,660].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=f; const t=c.currentTime+i*0.07; g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.start(t); o.stop(t+0.1); }); } catch {} };
const playError   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.setValueAtTime(200,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15); o.start(); o.stop(c.currentTime+0.15); } catch {} };

/* ── Battle Pass Tiers — rank labels + thresholds only ── */
const TIERS = [
  { min:0,   rank:'SUPPORTER',    emoji:'🪖' },
  { min:100, rank:'REGULAR',   emoji:'🎖️' },
  { min:300, rank:'SUPER FAN', emoji:'🔰' },
  { min:500, rank:'CHAMPION',  emoji:'⭐' },
];

/* ── Main ── */
const GamingWithLatifa = () => {
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const { msgs, push } = useKillFeed();

  const [formData, setFormData]                       = useState({ name:"", amount:"", message:"" });
  const [selectedCurrency, setSelectedCurrency]       = useState("INR");
  const [currencyOpen, setCurrencyOpen]               = useState(false);
  const [donationType, setDonationType]               = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound]   = useState<string|null>(null);
  const [mediaUrl, setMediaUrl]                       = useState<string|null>(null);
  const [mediaType, setMediaType]                     = useState<string|null>(null);
  const [razorpayLoaded, setRazorpayLoaded]           = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [showReconnecting, setShowReconnecting]       = useState(false);
  const [redirectUrl, setRedirectUrl]                 = useState('');

  const { pricing }      = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  /* Active tier index */
  const activeTierIdx = TIERS.reduce((best, tier, i) => currentAmount >= tier.min ? i : best, 0);

  const getVoiceDuration = (amount:number) => {
    if (selectedCurrency==="INR") { if (amount>=500) return 15; if (amount>=300) return 12; return 8; }
    if (amount>=6) return 15; if (amount>=4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale = useCallback(() => {
    const wrap=wrapRef.current; const card=cardRef.current; if (!wrap||!card) return;
    const scaleW=Math.min(1,(window.innerWidth-32)/420);
    const scaleH=card.scrollHeight>0?Math.min(1,(window.innerHeight-48)/card.scrollHeight):1;
    const scale=Math.min(scaleW,scaleH);
    wrap.style.transform=`scale(${scale})`; wrap.style.height=`${card.scrollHeight*scale}px`;
  }, []);

  useEffect(() => { const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; }, [applyScale]);
  useEffect(() => { const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); }, [donationType,applyScale]);

  useEffect(() => {
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed to load","✖","err");
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target; setFormData(prev=>({...prev,[name]:value}));
  };

  const handleDonationTypeChange = (value:"text"|"voice"|"hypersound"|"media") => {
    playClick(); setDonationType(value);
    const amount=value==="voice"?pricing.minVoice:value==="hypersound"?pricing.minHypersound:value==="media"?pricing.minMedia:pricing.minText;
    setFormData({name:formData.name,amount:String(amount),message:""});
    setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded||!(window as any).Razorpay) { playError(); push("Payment system loading","⚠","warn"); return; }
    const amount=Number(formData.amount);
    if (!formData.name) { playError(); push("Tell us your name first","✖","err"); return; }
    if (!amount||amount<=0) { playError(); push("Enter a valid amount","✖","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`,"✖","err"); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { playError(); push("Record your voice first","⚠","warn"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { playError(); push("Select a sound","⚠","warn"); return; }
    if (donationType==="media"&&!mediaUrl) { playError(); push("Upload a media file","⚠","warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Getting things ready...","◈","default");
    const reconnectTimer = setTimeout(()=>setShowReconnecting(true), 4000);
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==="voice"&&voiceRecorder.audioBlob) {
        const base64=await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve((r.result as string).split(",")[1]); r.onerror=reject; r.readAsDataURL(voiceRecorder.audioBlob!); });
        const {data,error}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:base64,streamerSlug:"gaming_with_latifa"}});
        if (error) throw error;
        voiceMessageUrl=data.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:"gaming_with_latifa", name:formData.name, amount:Number(formData.amount), message:donationType==="text"?formData.message:null, voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null, mediaUrl:donationType==="media"?mediaUrl:null, mediaType, currency:selectedCurrency }
      });
      if (error) throw error;
      clearTimeout(reconnectTimer); setShowReconnecting(false);
      new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency, order_id:data.razorpay_order_id,
        name:"Gaming With Latifa", description:"Support Gaming With Latifa 💜",
        handler:()=>{ playConfirm(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#a855f7"},
      }).open();
    } catch {
      clearTimeout(reconnectTimer); setShowReconnecting(false);
      playError(); push("Payment failed. Try again.","✖","err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?'var(--pm-primary)':msgPct>70?'var(--pm-primary)':'var(--pm-accent)';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'lf-tb-gd',nc:'var(--pm-primary)'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'lf-tb-gn',nc:'var(--pm-accent)'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'lf-tb-or',nc:'var(--pm-primary)'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'lf-tb-rd',nc:'var(--pm-accent)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <ParticleCanvas/>

      {showSuccess&&(
        <SuccessOverlay amount={formData.amount} currency={currencySymbol} onDone={()=>navigate(redirectUrl)}/>
      )}

      {showReconnecting&&(
        <div className="lf-reconnecting">
          <div className="lf-rc-text">RECONNECTING</div>
          <div className="lf-rc-dots">
            <div className="lf-rc-dot"/><div className="lf-rc-dot"/><div className="lf-rc-dot"/>
          </div>
        </div>
      )}

      <div className="lf-killfeed">
        {msgs.map(m=>(
          <div key={m.id} className={cn('lf-kf',m.variant==='err'?'lf-kf-err':m.variant==='warn'?'lf-kf-warn':'')}>
            <span className="lf-kf-icon">{m.icon}</span>
            <span className="lf-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="lf-root lf-page">
        <div className="lf-atm"/>
        <div className="lf-grid"/>
        <div className="lf-scanlines"/>

        <div ref={wrapRef} className="lf-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="lf-card lf-in">

            <div className="lf-bracket lf-bracket-tl"/>
            <div className="lf-bracket lf-bracket-tr"/>
            <div className="lf-bracket lf-bracket-bl"/>
            <div className="lf-bracket lf-bracket-br"/>

            {/* HERO */}
            <div className="lf-hero">
              <div className="lf-hero-blob"/>
              <img src={latifaAvatar} alt="Gaming With Latifa" style={{width:58,height:58,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',flexShrink:0,position:'relative',zIndex:1,border:'2px solid var(--pm-primary)',boxShadow:'0 0 16px rgba(139,92,246,0.5),0 0 32px rgba(244,114,182,0.2)'}}/>
              <div className="lf-operator-tag">
                <span className="lf-tag-prefix">▸ Streamer</span>
                <div className="lf-name">GAMING WITH LATIFA</div>
                <div className="lf-hero-sub">Drop in and show some love 💜</div>
              </div>
              <div className="lf-live">
                <div className="lf-live-dot"/>
                <span className="lf-live-text">LIVE</span>
              </div>
            </div>

            {/* Loadout Bar */}
            <div className="lf-loadout">
              <div className="lf-rank-info">
                <div className="lf-rank-badge">PRO</div>
                <div className="lf-rank-name">LATIFA</div>
              </div>
              <div className="lf-xp-wrap">
                <div className="lf-xp-label">SUPPORTER XP</div>
                <div className="lf-xp-bar"><div className="lf-xp-fill"/></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-body">

                {/* Callsign */}
                <div>
                  <label className="lf-lbl">▸ Your Name</label>
                  <div className="lf-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="What do we call you?" required/></div>
                </div>

                {/* Mission Type */}
                <div>
                  <label className="lf-lbl">▸ Support Type</label>
                  <div className="lf-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('lf-tb',t.tc,donationType===t.key?'lf-on':'')}>
                        <div className="lf-tb-face">
                          <span className="lf-tb-emoji">{t.emoji}</span>
                          <span className="lf-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.35)',textShadow:donationType===t.key?`0 0 10px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="lf-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deploy Credits */}
                <div>
                  <label className="lf-lbl">▸ Amount</label>
                  <div className="lf-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="lf-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{width:10,height:10,opacity:0.35,marginLeft:'auto',flexShrink:0}}/>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search currency..."/>
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {SUPPORTED_CURRENCIES.map(c=>(
                                <CommandItem key={c.code} value={c.code} onSelect={()=>{setSelectedCurrency(c.code);setCurrencyOpen(false);}}>
                                  <Check className={cn("mr-2 h-4 w-4",selectedCurrency===c.code?"opacity-100":"opacity-0")}/>
                                  {c.symbol} {c.code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="lf-iw" style={{flex:1}}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="lf-hint">⚡ TTS ENABLED ABOVE {currencySymbol}{pricing.minTts}</p>}
                </div>

                {/* Battle Pass Tiers — rank + threshold only */}
                {currentAmount > 0 && (
                  <div className="lf-fu">
                    <label className="lf-lbl">▸ Support Tier</label>
                    <div className="lf-tiers">
                      {TIERS.map((tier, i) => (
                        <div key={i} className={cn('lf-tier', i === activeTierIdx ? 'lf-tier-active' : i < activeTierIdx ? 'lf-tier-done' : '')}>
                          <span className="lf-tier-emoji">{tier.emoji}</span>
                          <div className="lf-tier-rank">{tier.rank}</div>
                          <div className="lf-tier-amt">
                            {i < activeTierIdx ? '✓' : i === activeTierIdx ? `${currencySymbol}${tier.min}+` : `${currencySymbol}${tier.min}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="lf-div"/>

                {/* Intel Message */}
                {donationType==="text"&&(
                  <div className="lf-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="lf-lbl" style={{margin:0}}>▸ Your Message</label>
                      <span style={{fontSize:9,fontWeight:700,color:msgClr,textShadow:`0 0 6px ${msgClr}`,fontFamily:'Inter,monospace',letterSpacing:'0.08em'}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Say something to Latifa!" className="lf-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 5px ${msgClr}`}}/></div>
                  </div>
                )}

                {/* Voice */}
                {donationType==="voice"&&(
                  <div className="lf-fu">
                    <label className="lf-lbl">▸ Voice Message</label>
                    <div className="lf-sp lf-sp-gn">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#a855f7"/>
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType==="hypersound"&&(
                  <div className="lf-fu lf-sp lf-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🔊</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--pm-primary)',textShadow:'0 0 8px var(--pm-primary)',fontFamily:'Inter,monospace',letterSpacing:'0.1em'}}>HYPERSOUNDS</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="lf-fu lf-sp lf-sp-rd">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🖼️</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--pm-accent)',textShadow:'0 0 8px var(--pm-accent)',fontFamily:'Inter,monospace',letterSpacing:'0.1em'}}>MEDIA DROP</span>
                    </div>
                    <MediaUploader streamerSlug="gaming_with_latifa" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* Deploy Button */}
                <div className="lf-btn-wrap">
                  <button type="submit" className="lf-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="lf-spin"/> SENDING...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Heart style={{width:14,height:14}}/>
                        SUPPORT {currencySymbol}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:8,fontWeight:600,color:'rgba(255,255,255,0.15)',textAlign:'center',lineHeight:1.6,fontFamily:'Inter,monospace',letterSpacing:'0.06em'}}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                </p>
                <DonationPageFooter brandColor="#a855f7"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingWithLatifa;
