import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-pink:        #f472b6;
    --lf-pink-dark:   #db2777;
    --lf-magenta:     #e879f9;
    --lf-bg:          #08050f;
    --lf-card:        #0d0a1a;
    --lf-text:        #e9d5ff;
    --lf-muted:       rgba(233,213,255,0.4);
  }

  * { box-sizing: border-box; }
  .lf-root { font-family: 'Rajdhani', sans-serif; }

  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .lf-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.45; }

  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 60% 55% at 50% 30%, rgba(80,10,140,0.4) 0%, transparent 65%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(168,85,247,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%);
  }

  .lf-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.04;
    background-image: linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .lf-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
  }

  .lf-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  /* ── Scanline reveal ── */
  .lf-reveal-wrap {
    position: relative;
    animation: lf-reveal-clip 0.85s cubic-bezier(0.4,0,0.2,1) 0.1s both;
  }
  @keyframes lf-reveal-clip { 0%{clip-path:inset(0 0 100% 0);} 100%{clip-path:inset(0 0 0% 0);} }
  .lf-reveal-line {
    position: absolute; left: 0; right: 0; height: 3px; z-index: 200; pointer-events: none;
    background: linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.4) 15%, rgba(244,114,182,0.9) 40%, #fff 50%, rgba(244,114,182,0.9) 60%, rgba(168,85,247,0.4) 85%, transparent 100%);
    box-shadow: 0 0 8px rgba(244,114,182,0.8), 0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3);
    animation: lf-scan-sweep 0.85s cubic-bezier(0.4,0,0.2,1) 0.1s both;
  }
  @keyframes lf-scan-sweep { 0%{top:0%;opacity:1;} 85%{top:100%;opacity:1;} 100%{top:100%;opacity:0;} }

  /* ── Card ── */
  .lf-card {
    width: 420px; background: var(--lf-card); border-radius: 2px;
    border: 1px solid rgba(168,85,247,0.45);
    box-shadow:
      0 0 0 1px rgba(244,114,182,0.07),
      0 0 35px rgba(124,58,237,0.28),
      0 0 80px rgba(124,58,237,0.1),
      0 30px 80px rgba(0,0,0,0.9);
    overflow: hidden; position: relative;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    transition: transform 0.08s ease;
  }
  .lf-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 100;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px);
  }

  .lf-bracket { position: absolute; width: 14px; height: 14px; z-index: 101; pointer-events: none; }
  .lf-bracket-tl { top:5px; left:5px; border-top:1.5px solid var(--lf-purple); border-left:1.5px solid var(--lf-purple); opacity:0.7; }
  .lf-bracket-tr { top:5px; right:28px; border-top:1.5px solid var(--lf-purple); border-right:1.5px solid var(--lf-purple); opacity:0.7; }
  .lf-bracket-bl { bottom:28px; left:5px; border-bottom:1.5px solid var(--lf-purple); border-left:1.5px solid var(--lf-purple); opacity:0.7; }
  .lf-bracket-br { bottom:5px; right:5px; border-bottom:1.5px solid var(--lf-purple); border-right:1.5px solid var(--lf-purple); opacity:0.7; }

  /* ── HERO ── */
  .lf-hero {
    position: relative; overflow: hidden;
    background: linear-gradient(180deg, rgba(50,5,90,0.98) 0%, rgba(20,5,40,0.99) 100%);
    border-bottom: 1px solid rgba(168,85,247,0.3);
  }
  .lf-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
    background: linear-gradient(90deg, var(--lf-purple-dark), var(--lf-purple), var(--lf-pink), var(--lf-magenta), var(--lf-purple), var(--lf-purple-dark));
    background-size: 200% 100%; animation: lf-shift 3s linear infinite;
    box-shadow: 0 0 12px var(--lf-purple), 0 0 24px rgba(244,114,182,0.5);
  }
  @keyframes lf-shift { 0%{background-position:0%} 100%{background-position:200%} }

  /* Light rays */
  .lf-rays { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 420px; height: 100%; pointer-events: none; z-index: 0; }
  .lf-ray { position: absolute; bottom: 0; left: 50%; width: 2px; transform-origin: bottom center; }
  .lf-ray:nth-child(1) { height:75%; transform:translateX(-50%) rotate(-55deg); background:linear-gradient(0deg,rgba(168,85,247,0.4),transparent); animation:lf-rpulse 3s ease-in-out infinite 0s; }
  .lf-ray:nth-child(2) { height:85%; transform:translateX(-50%) rotate(-38deg); background:linear-gradient(0deg,rgba(244,114,182,0.45),transparent); animation:lf-rpulse 3s ease-in-out infinite 0.3s; }
  .lf-ray:nth-child(3) { height:90%; transform:translateX(-50%) rotate(-20deg); background:linear-gradient(0deg,rgba(232,121,249,0.5),transparent); animation:lf-rpulse 3s ease-in-out infinite 0.6s; }
  .lf-ray:nth-child(4) { height:95%; width:3px; transform:translateX(-50%) rotate(0deg); background:linear-gradient(0deg,rgba(255,255,255,0.25),transparent); animation:lf-rpulse 3s ease-in-out infinite 0s; }
  .lf-ray:nth-child(5) { height:90%; transform:translateX(-50%) rotate(20deg); background:linear-gradient(0deg,rgba(232,121,249,0.5),transparent); animation:lf-rpulse 3s ease-in-out infinite 0.6s; }
  .lf-ray:nth-child(6) { height:85%; transform:translateX(-50%) rotate(38deg); background:linear-gradient(0deg,rgba(244,114,182,0.45),transparent); animation:lf-rpulse 3s ease-in-out infinite 0.3s; }
  .lf-ray:nth-child(7) { height:75%; transform:translateX(-50%) rotate(55deg); background:linear-gradient(0deg,rgba(168,85,247,0.4),transparent); animation:lf-rpulse 3s ease-in-out infinite 0s; }
  @keyframes lf-rpulse { 0%,100%{opacity:1;} 50%{opacity:0.25;} }

  .lf-ground-glow {
    position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
    background: linear-gradient(0deg, rgba(168,85,247,0.3) 0%, transparent 100%);
    pointer-events: none; z-index: 1;
  }

  /* Avatar */
  .lf-avatar-wrap { position: relative; z-index: 2; display: flex; justify-content: center; padding-top: 22px; }
  .lf-avatar-outer { position: relative; width: 96px; height: 96px; }
  .lf-avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    background: conic-gradient(var(--lf-purple), var(--lf-pink), var(--lf-magenta), var(--lf-purple-dark), var(--lf-purple));
    animation: lf-ring-rot 3s linear infinite;
    box-shadow: 0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(244,114,182,0.35);
  }
  @keyframes lf-ring-rot { to{transform:rotate(360deg);} }
  .lf-avatar-ring::after { content:''; position:absolute; inset:3px; border-radius:50%; background:var(--lf-card); }
  .lf-avatar-img { position:absolute; inset:3px; border-radius:50%; width:calc(100% - 6px); height:calc(100% - 6px); object-fit:cover; object-position:center top; z-index:2; }
  .lf-avatar-glow { position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); width:70px; height:18px; border-radius:50%; background:rgba(168,85,247,0.55); filter:blur(8px); animation:lf-aglow 2s ease-in-out infinite; }
  @keyframes lf-aglow { 0%,100%{opacity:0.5;transform:translateX(-50%) scaleX(1);} 50%{opacity:1;transform:translateX(-50%) scaleX(1.2);} }

  /* Name */
  .lf-name-section { position:relative; z-index:2; text-align:center; padding:12px 16px 0; }
  .lf-ambassador-tag {
    display:inline-flex; align-items:center; gap:6px;
    font-family:'Orbitron',monospace; font-size:7px; font-weight:700;
    color:var(--lf-pink); letter-spacing:0.3em; text-transform:uppercase; margin-bottom:5px;
  }
  .lf-ambassador-tag::before,.lf-ambassador-tag::after { content:''; display:block; width:18px; height:1px; background:var(--lf-pink); opacity:0.6; }
  @keyframes lf-cursor { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-big-name {
    font-family:'Black Ops One',cursive; font-size:30px; font-weight:400; color:#fff;
    line-height:1.05; letter-spacing:0.04em;
    text-shadow: 0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.35);
  }
  .lf-big-name-pink { color:var(--lf-pink); text-shadow:0 0 14px rgba(244,114,182,0.9),0 0 28px rgba(244,114,182,0.4); }
  .lf-name-cursor { display:inline-block; width:3px; height:26px; background:var(--lf-pink); margin-left:2px; vertical-align:middle; animation:lf-cursor .7s ease-in-out infinite; }
  .lf-tagline { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(233,213,255,0.3); letter-spacing:0.2em; text-transform:uppercase; margin-top:5px; }

  /* Live badge */
  @keyframes lf-lpulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .lf-live { position:absolute; top:10px; right:12px; z-index:10; display:inline-flex; align-items:center; gap:5px; background:rgba(168,85,247,0.12); border:1px solid rgba(168,85,247,0.45); padding:4px 10px; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
  .lf-live-dot { width:5px; height:5px; border-radius:50%; background:var(--lf-purple); animation:lf-lpulse 1.2s ease-in-out infinite; box-shadow:0 0 6px var(--lf-purple); }
  .lf-live-text { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:var(--lf-purple); letter-spacing:0.18em; text-shadow:0 0 8px var(--lf-purple); }

  /* Stats bar */
  .lf-stats { display:flex; justify-content:center; gap:0; margin-top:12px; border-top:1px solid rgba(168,85,247,0.15); }
  .lf-stat { flex:1; padding:7px 4px; text-align:center; border-right:1px solid rgba(168,85,247,0.12); }
  .lf-stat:last-child { border-right:none; }
  .lf-stat-val { font-family:'Black Ops One',cursive; font-size:12px; color:var(--lf-purple); letter-spacing:0.04em; text-shadow:0 0 8px rgba(168,85,247,0.5); display:block; }
  .lf-stat-lbl { font-family:'Orbitron',monospace; font-size:6px; font-weight:700; color:rgba(233,213,255,0.28); letter-spacing:0.12em; text-transform:uppercase; display:block; margin-top:1px; }

  /* ── Body ── */
  .lf-body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .lf-lbl { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(168,85,247,0.65); }

  /* Inputs */
  .lf-iw { position:relative; }
  .lf-iw input { width:100% !important; background:rgba(168,85,247,0.05) !important; border:1px solid rgba(168,85,247,0.28) !important; border-radius:2px !important; color:var(--lf-text) !important; font-family:'Rajdhani',sans-serif !important; font-size:15px !important; font-weight:600 !important; padding:9px 12px !important; outline:none !important; transition:all .15s !important; caret-color:var(--lf-pink); letter-spacing:0.04em !important; }
  .lf-iw input:focus { border-color:var(--lf-purple) !important; background:rgba(168,85,247,0.09) !important; box-shadow:0 0 0 2px rgba(168,85,247,0.15),0 0 14px rgba(168,85,247,0.1) !important; }
  .lf-iw input::placeholder { color:rgba(233,213,255,0.2) !important; }
  .lf-iw input:disabled,.lf-iw input[readonly] { opacity:.35 !important; cursor:not-allowed !important; }
  .lf-iw::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:var(--lf-pink); transform:scaleX(0); transform-origin:left; transition:transform 0.2s ease; opacity:0.7; }
  .lf-iw:focus-within::after { transform:scaleX(1); }

  .lf-ta { width:100%; background:rgba(168,85,247,0.05); border:1px solid rgba(168,85,247,0.28); border-radius:2px; color:var(--lf-text); font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:600; padding:9px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--lf-pink); transition:all .15s; letter-spacing:0.04em; }
  .lf-ta:focus { border-color:var(--lf-purple); background:rgba(168,85,247,0.09); box-shadow:0 0 0 2px rgba(168,85,247,0.12); }
  .lf-ta::placeholder { color:rgba(233,213,255,0.2); }

  .lf-cbar { height:2px; margin-top:5px; background:rgba(255,255,255,0.07); overflow:hidden; }
  .lf-cbar-fill { height:100%; transition:width .12s,background .2s; }

  /* ── 3D Type Buttons ── */
  .lf-types { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .lf-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; display:block; width:100%; }
  .lf-tb-face { position:relative; z-index:2; padding:10px 4px 9px; text-align:center; transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-4px); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
  .lf-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 2px); z-index:1; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }

  .lf-tb-pu .lf-tb-face { background:linear-gradient(160deg,rgba(168,85,247,0.2),rgba(100,30,180,0.55)); border:1px solid rgba(168,85,247,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pu::after { background:#2e1060; }
  .lf-tb-pu.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(168,85,247,0.35),rgba(124,58,237,0.65)); border-color:var(--lf-purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.35),0 0 20px rgba(168,85,247,0.8),0 0 40px rgba(168,85,247,0.3); }

  .lf-tb-pk .lf-tb-face { background:linear-gradient(160deg,rgba(244,114,182,0.2),rgba(180,30,120,0.55)); border:1px solid rgba(244,114,182,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pk::after { background:#5a0e35; }
  .lf-tb-pk.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(244,114,182,0.35),rgba(219,39,119,0.65)); border-color:var(--lf-pink); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(244,114,182,0.8),0 0 40px rgba(244,114,182,0.3); }

  .lf-tb-mg .lf-tb-face { background:linear-gradient(160deg,rgba(232,121,249,0.2),rgba(160,30,200,0.55)); border:1px solid rgba(232,121,249,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-mg::after { background:#460e5a; }
  .lf-tb-mg.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(232,121,249,0.35),rgba(192,38,211,0.65)); border-color:var(--lf-magenta); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(232,121,249,0.8),0 0 40px rgba(232,121,249,0.3); }

  .lf-tb-vi .lf-tb-face { background:linear-gradient(160deg,rgba(139,92,246,0.2),rgba(80,20,160,0.55)); border:1px solid rgba(139,92,246,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-vi::after { background:#260c50; }
  .lf-tb-vi.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(139,92,246,0.35),rgba(109,40,217,0.65)); border-color:#8b5cf6; box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(139,92,246,0.8),0 0 40px rgba(139,92,246,0.3); }

  .lf-tb:active .lf-tb-face { transform:translateY(0) !important; }
  .lf-tb:hover .lf-tb-face { filter:brightness(1.12); }
  .lf-tb-emoji { font-size:17px; display:block; line-height:1; }
  .lf-tb-name { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-top:4px; color:rgba(233,213,255,0.4); transition:color .15s; }
  .lf-tb.lf-on .lf-tb-name { color:#fff; text-shadow:0 0 8px rgba(255,255,255,0.5); }
  .lf-tb-min { font-size:7px; font-weight:600; color:rgba(244,114,182,0.6); display:block; margin-top:2px; font-family:'Rajdhani',sans-serif; }

  /* Amount */
  .lf-amt { display:flex; gap:7px; }
  .lf-cur { display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(168,85,247,0.05) !important; border:1px solid rgba(168,85,247,0.28) !important; border-radius:2px !important; color:var(--lf-text) !important; font-family:'Rajdhani',sans-serif !important; font-size:13px !important; font-weight:700 !important; padding:0 10px !important; min-width:90px; height:40px; cursor:pointer; transition:all .15s; flex-shrink:0; letter-spacing:0.04em !important; }
  .lf-cur:hover { border-color:var(--lf-purple) !important; }

  .lf-div { height:1px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.4),rgba(244,114,182,0.2),transparent); position:relative; }
  .lf-div::before { content:'◆'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:6px; color:rgba(244,114,182,0.5); }

  .lf-sp { padding:10px 12px; position:relative; }
  .lf-sp::before,.lf-sp::after { content:''; position:absolute; width:10px; height:10px; pointer-events:none; }
  .lf-sp::before { top:0; left:0; border-top:1px solid var(--lf-purple); border-left:1px solid var(--lf-purple); opacity:0.45; }
  .lf-sp::after  { bottom:0; right:0; border-bottom:1px solid var(--lf-purple); border-right:1px solid var(--lf-purple); opacity:0.45; }
  .lf-sp-pu { background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.3); }
  .lf-sp-pk { background:rgba(244,114,182,0.05); border:1px solid rgba(244,114,182,0.28); }
  .lf-sp-mg { background:rgba(232,121,249,0.05); border:1px solid rgba(232,121,249,0.28); }

  /* ── 3D Donate Button ── */
  .lf-btn-wrap { position:relative; width:100%; border-radius:2px; padding-bottom:6px; }
  .lf-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:2px; z-index:1; background:linear-gradient(90deg,#2e0e6a,#3d1490,#2a0c6a); clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .lf-btn { position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer; font-family:'Black Ops One',cursive; font-size:13px; font-weight:400; letter-spacing:.1em; color:#fff; border-radius:2px; transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-6px); background:linear-gradient(135deg,var(--lf-purple-dark) 0%,var(--lf-purple) 50%,var(--lf-pink-dark) 100%); border-top:1.5px solid rgba(255,255,255,0.2); border-left:1.5px solid rgba(255,255,255,0.1); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 0 22px rgba(168,85,247,0.65),0 0 45px rgba(168,85,247,0.22); overflow:hidden; clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .lf-btn:hover:not(:disabled) { transform:translateY(-7px); box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 35px rgba(168,85,247,0.9),0 0 65px rgba(244,114,182,0.4); }
  .lf-btn:active:not(:disabled) { transform:translateY(0) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.5) !important; }
  .lf-btn:disabled { opacity:.35; cursor:not-allowed; }
  .lf-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent); transform:skewX(-20deg); transition:left .6s; }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  .lf-hint { font-size:9px; font-weight:600; color:rgba(244,114,182,0.55); margin-top:3px; font-family:'Orbitron',monospace; letter-spacing:0.08em; }

  @keyframes lf-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .18s ease forwards; }

  @keyframes lf-spin-a { to{transform:rotate(360deg);} }
  .lf-spinner { width:13px; height:13px; border:1.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-spin-a .65s linear infinite; }

  /* ── Success Overlay ── */
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.4);opacity:0;} 65%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(100px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }
  @keyframes lf-scan-ov { 0%{top:-5%;} 100%{top:110%;} }

  .lf-success-overlay { position:fixed; inset:0; z-index:99999; background:rgba(5,3,12,0.96); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; animation:lf-ov-in .3s ease forwards; }
  .lf-success-overlay.lf-ov-exit { animation:lf-ov-out .4s ease forwards; }
  .lf-success-scan { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.5),rgba(244,114,182,0.4),transparent); animation:lf-scan-ov 2s linear infinite; pointer-events:none; }
  .lf-conf-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .lf-conf-piece { position:absolute; border-radius:2px; animation:lf-conf 1.6s ease-out both; }
  .lf-success-emoji { font-size:64px; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .1s both; }
  .lf-success-title { font-family:'Black Ops One',cursive; font-size:36px; color:#fff; text-shadow:0 0 22px var(--lf-pink),0 0 45px rgba(168,85,247,0.5); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .2s both; letter-spacing:0.06em; }
  .lf-success-sub { font-family:'Orbitron',monospace; font-size:10px; font-weight:700; color:rgba(233,213,255,0.35); letter-spacing:0.18em; text-transform:uppercase; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .3s both; }
  .lf-success-amount { font-family:'Black Ops One',cursive; font-size:20px; color:var(--lf-pink); text-shadow:0 0 14px rgba(244,114,182,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .4s both; letter-spacing:0.08em; }
  .lf-success-bar-wrap { width:220px; height:2px; background:rgba(255,255,255,0.08); margin-top:22px; overflow:hidden; animation:lf-pop .4s ease .5s both; }
  .lf-success-bar { height:100%; background:linear-gradient(90deg,var(--lf-purple),var(--lf-pink)); box-shadow:0 0 8px var(--lf-pink); animation:lf-bar-fill 2.5s linear .6s both; }
  .lf-success-redirect { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(168,85,247,0.4); letter-spacing:0.18em; margin-top:10px; animation:lf-pop .4s ease .7s both; }

  /* ── Kill Feed ── */
  .lf-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(16px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(8,5,15,0.96); border:1px solid rgba(168,85,247,0.35); border-left:3px solid var(--lf-purple); padding:8px 14px; border-radius:2px; animation:lf-kf-in .2s ease forwards; min-width:210px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); }
  .lf-kf-err  { border-left-color:#ef4444; }
  .lf-kf-warn { border-left-color:var(--lf-pink); }
  .lf-kf-icon { font-size:11px; flex-shrink:0; color:var(--lf-purple); font-family:'Orbitron',monospace; }
  .lf-kf-err  .lf-kf-icon { color:#ef4444; }
  .lf-kf-warn .lf-kf-icon { color:var(--lf-pink); }
  .lf-kf-text { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:var(--lf-text); letter-spacing:0.06em; }
`;

/* ── Particle Canvas ── */
const ParticleCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const C = ['168,85,247','244,114,182','139,92,246','232,121,249','255,200,255'];
    type P = { x:number;y:number;r:number;vx:number;vy:number;alpha:number;da:number;color:string; };
    const ps: P[] = [];
    const spawn = (): P => ({ x:Math.random()*canvas.width, y:canvas.height+10, r:0.6+Math.random()*2.2, vx:(Math.random()-0.5)*0.35, vy:-0.15-Math.random()*0.35, alpha:0.15+Math.random()*0.45, da:0, color:C[Math.floor(Math.random()*C.length)] });
    for (let i=0;i<65;i++) { const p=spawn(); p.y=Math.random()*canvas.height; ps.push(p); }
    let frame: number; let t=0;
    const tick = () => {
      t++; ctx.clearRect(0,0,canvas.width,canvas.height);
      if (Math.random()<0.06) ps.push(spawn());
      if (t%6===0) ps.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height*0.7, r:0.5+Math.random()*1.2, vx:(Math.random()-0.5)*1.2, vy:-0.4-Math.random()*1.2, alpha:0.9, da:0.02+Math.random()*0.02, color:C[Math.floor(Math.random()*C.length)] });
      for (let i=ps.length-1;i>=0;i--) {
        const p=ps[i]; p.x+=p.vx; p.y+=p.vy; p.alpha-=p.da;
        if (p.y<-10||p.alpha<=0) { ps.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.color},${p.alpha})`; ctx.fill();
        if (p.r>1&&p.da>0) { ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.5,0,Math.PI*2); ctx.fillStyle=`rgba(${p.color},${p.alpha*0.15})`; ctx.fill(); }
      }
      frame=requestAnimationFrame(tick);
    };
    tick();
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(frame); window.removeEventListener('resize',onResize); };
  }, []);
  return <canvas ref={ref} className="lf-canvas"/>;
};

/* ── Typewriter ── */
const useTypewriter = (text:string, speed=60, delay=900) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false); let i=0;
    const t=setTimeout(()=>{ const iv=setInterval(()=>{ i++; setDisplayed(text.slice(0,i)); if (i>=text.length){clearInterval(iv);setDone(true);} },speed); return()=>clearInterval(iv); },delay);
    return()=>clearTimeout(t);
  },[text]);
  return { displayed, done };
};

/* ── Parallax ── */
const useParallax = (ref: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const el=ref.current; if (!el) return;
    const onMove=(e:MouseEvent)=>{ const cx=window.innerWidth/2; const cy=window.innerHeight/2; const rx=(e.clientY-cy)/cy*4; const ry=-(e.clientX-cx)/cx*4; el.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; };
    const onLeave=()=>{ el.style.transform='perspective(900px) rotateX(0deg) rotateY(0deg)'; };
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseleave',onLeave);
    return()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseleave',onLeave); };
  },[]);
};

/* ── Success Overlay ── */
const SuccessOverlay: React.FC<{amount:string;currency:string;onDone:()=>void}> = ({amount,currency,onDone}) => {
  const ref = useRef<HTMLDivElement>(null);
  const conf = Array.from({length:30},(_,i)=>({ left:`${Math.random()*100}%`, top:`${5+Math.random()*45}%`, bg:['#a855f7','#f472b6','#e879f9','#c084fc','#f9a8d4','#7c3aed'][i%6], delay:`${Math.random()*0.6}s`, dur:`${1.3+Math.random()*0.9}s`, size:`${7+Math.random()*6}px` }));
  useEffect(()=>{ const t=setTimeout(()=>{ ref.current?.classList.add('lf-ov-exit'); setTimeout(onDone,400); },3200); return()=>clearTimeout(t); },[onDone]);
  return (
    <div ref={ref} className="lf-success-overlay">
      <div className="lf-success-scan"/>
      <div className="lf-conf-wrap">{conf.map((c,i)=><div key={i} className="lf-conf-piece" style={{left:c.left,top:c.top,background:c.bg,animationDelay:c.delay,animationDuration:c.dur,width:c.size,height:c.size}}/>)}</div>
      <div className="lf-success-emoji">🎯</div>
      <div className="lf-success-title">Thank You!</div>
      <div className="lf-success-sub">Latifa loves you for this 💜</div>
      <div className="lf-success-amount">{currency}{amount} Deployed</div>
      <div className="lf-success-bar-wrap"><div className="lf-success-bar"/></div>
      <div className="lf-success-redirect">Taking you to confirmation...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = {id:number;text:string;icon:string;variant:'default'|'err'|'warn';};
let kfId=0;
const useKillFeed = () => {
  const [msgs,setMsgs]=useState<KFMsg[]>([]);
  const push=useCallback((text:string,icon='✦',variant:KFMsg['variant']='default')=>{ const id=++kfId; setMsgs(p=>[...p,{id,text,icon,variant}]); setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)),3200); },[]);
  return {msgs,push};
};

/* ── Audio ── */
const playClick   = ()=>{ try{ const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(700,c.currentTime); o.frequency.exponentialRampToValueAtTime(460,c.currentTime+0.05); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); }catch{} };
const playSuccess = ()=>{ try{ const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; const t=c.currentTime+i*0.1; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15); o.start(t); o.stop(t+0.15); }); }catch{} };
const playError   = ()=>{ try{ const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.setValueAtTime(220,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15); o.start(); o.stop(c.currentTime+0.15); }catch{} };

/* ── Main ── */
const GamingWithLatifa = () => {
  const navigate  = useNavigate();
  const cardRef   = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const {msgs,push} = useKillFeed();

  const [formData,setFormData]                       = useState({name:"",amount:"",message:""});
  const [selectedCurrency,setSelectedCurrency]       = useState("INR");
  const [currencyOpen,setCurrencyOpen]               = useState(false);
  const [donationType,setDonationType]               = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound,setSelectedHypersound]   = useState<string|null>(null);
  const [mediaUrl,setMediaUrl]                       = useState<string|null>(null);
  const [mediaType,setMediaType]                     = useState<string|null>(null);
  const [razorpayLoaded,setRazorpayLoaded]           = useState(false);
  const [isProcessing,setIsProcessing]               = useState(false);
  const [showSuccess,setShowSuccess]                 = useState(false);
  const [redirectUrl,setRedirectUrl]                 = useState('');

  const {pricing}      = useStreamerPricing("gaming_with_latifa",selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const currentAmount  = parseFloat(formData.amount)||0;
  const maxMsgLen      = getMaxMessageLength(pricing.messageCharTiers,currentAmount);

  const getVoiceDur = (a:number)=>{ if(selectedCurrency==="INR"){if(a>=500)return 15;if(a>=300)return 12;return 8;} if(a>=6)return 15;if(a>=4)return 12;return 8; };
  const voiceRecorder = useVoiceRecorder(getVoiceDur(currentAmount));

  const {displayed,done} = useTypewriter("Gaming With Latifa",60,1000);
  useParallax(cardRef);

  const applyScale = useCallback(()=>{
    const wrap=wrapRef.current; const card=cardRef.current; if(!wrap||!card) return;
    const sw=Math.min(1,(window.innerWidth-32)/420);
    const sh=card.scrollHeight>0?Math.min(1,(window.innerHeight-48)/card.scrollHeight):1;
    const s=Math.min(sw,sh);
    wrap.style.height=`${card.scrollHeight*s}px`; wrap.style.transform=`scale(${s})`;
  },[]);

  useEffect(()=>{ const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; },[applyScale]);
  useEffect(()=>{ const t=setTimeout(applyScale,60); return()=>clearTimeout(t); },[donationType,applyScale]);

  useEffect(()=>{
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true); s.onerror=()=>push("Payment gateway failed","✖","err");
    document.body.appendChild(s); return()=>{ if(document.body.contains(s)) document.body.removeChild(s); };
  },[]);

  const handleInputChange=(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{ const{name,value}=e.target; setFormData(p=>({...p,[name]:value})); };

  const handleTypeChange=(value:"text"|"voice"|"hypersound"|"media")=>{
    playClick(); setDonationType(value);
    const a=value==="voice"?pricing.minVoice:value==="hypersound"?pricing.minHypersound:value==="media"?pricing.minMedia:pricing.minText;
    setFormData({name:formData.name,amount:String(a),message:""}); setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!razorpayLoaded||!(window as any).Razorpay){ playError(); push("Payment system loading","⚠","warn"); return; }
    const amount=Number(formData.amount);
    if(!formData.name){ playError(); push("Tell us your name first","✖","err"); return; }
    if(!amount||amount<=0){ playError(); push("Enter an amount first","✖","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if(amount<min){ playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`,"✖","err"); return; }
    if(donationType==="voice"&&!voiceRecorder.audioBlob){ playError(); push("Record your voice message first","⚠","warn"); return; }
    if(donationType==="hypersound"&&!selectedHypersound){ playError(); push("Select a sound","⚠","warn"); return; }
    if(donationType==="media"&&!mediaUrl){ playError(); push("Upload a media file","⚠","warn"); return; }
    await processPayment();
  };

  const processPayment=async()=>{
    setIsProcessing(true); push("Getting things ready...","◈","default");
    try{
      let voiceMessageUrl:string|null=null;
      if(donationType==="voice"&&voiceRecorder.audioBlob){
        const base64=await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(",")[1]); r.onerror=rej; r.readAsDataURL(voiceRecorder.audioBlob!); });
        const{data,error}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:base64,streamerSlug:"gaming_with_latifa"}});
        if(error) throw error; voiceMessageUrl=data.voice_message_url;
      }
      const{data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{streamer_slug:"gaming_with_latifa",name:formData.name,amount:Number(formData.amount),message:donationType==="text"?formData.message:null,voiceMessageUrl,hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,mediaUrl:donationType==="media"?mediaUrl:null,mediaType,currency:selectedCurrency}
      });
      if(error) throw error;
      new (window as any).Razorpay({
        key:data.razorpay_key_id,amount:data.amount,currency:data.currency,order_id:data.razorpay_order_id,
        name:"Gaming With Latifa",description:"Support Gaming With Latifa",
        handler:()=>{ playSuccess(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#a855f7"},
      }).open();
    }catch{ playError(); push("Payment failed. Try again.","✖","err"); }
    finally{ setIsProcessing(false); }
  };

  const msgPct=maxMsgLen>0?(formData.message.length/maxMsgLen)*100:0;
  const msgClr=msgPct>90?'#ef4444':msgPct>70?'var(--lf-pink)':'var(--lf-purple)';
  const prefix="Gaming With "; const dispPre=displayed.slice(0,Math.min(displayed.length,prefix.length)); const dispSuf=displayed.length>prefix.length?displayed.slice(prefix.length):'';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'lf-tb-pu'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'lf-tb-pk'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'lf-tb-mg'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'lf-tb-vi'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <ParticleCanvas/>
      {showSuccess&&<SuccessOverlay amount={formData.amount} currency={currencySymbol} onDone={()=>navigate(redirectUrl)}/>}
      <div className="lf-killfeed">{msgs.map(m=><div key={m.id} className={cn('lf-kf',m.variant==='err'?'lf-kf-err':m.variant==='warn'?'lf-kf-warn':'')}><span className="lf-kf-icon">{m.icon}</span><span className="lf-kf-text">{m.text}</span></div>)}</div>

      <div className="lf-root lf-page">
        <div className="lf-atm"/><div className="lf-grid"/><div className="lf-scanlines"/>

        <div ref={wrapRef} className="lf-scale-wrap" style={{transformOrigin:'top center'}}>
          <div className="lf-reveal-wrap">
            <div className="lf-reveal-line"/>
            <div ref={cardRef} className="lf-card">
              <div className="lf-bracket lf-bracket-tl"/><div className="lf-bracket lf-bracket-tr"/>
              <div className="lf-bracket lf-bracket-bl"/><div className="lf-bracket lf-bracket-br"/>

              {/* ── HERO ── */}
              <div className="lf-hero">
                <div className="lf-live"><div className="lf-live-dot"/><span className="lf-live-text">LIVE</span></div>
                <div className="lf-rays">
                  <div className="lf-ray"/><div className="lf-ray"/><div className="lf-ray"/>
                  <div className="lf-ray"/><div className="lf-ray"/><div className="lf-ray"/>
                  <div className="lf-ray"/>
                </div>
                <div className="lf-ground-glow"/>
                <div className="lf-avatar-wrap">
                  <div className="lf-avatar-outer">
                    <div className="lf-avatar-ring"/>
                    <img src={latifaAvatar} alt="Gaming With Latifa" className="lf-avatar-img"/>
                    <div className="lf-avatar-glow"/>
                  </div>
                </div>
                <div className="lf-name-section">
                  
                  <div className="lf-big-name">
                    {dispPre}
                    {dispSuf&&<span className="lf-big-name-pink">{dispSuf}</span>}
                    {!done&&<span className="lf-name-cursor"/>}
                  </div>
                  <div className="lf-tagline">Drop in and show some love 💜</div>
                </div>
                <div className="lf-stats">
                  <div className="lf-stat"><span className="lf-stat-val">BGMI</span><span className="lf-stat-lbl">Game</span></div>
                  <div className="lf-stat"><span className="lf-stat-val">🇮🇳 IND</span><span className="lf-stat-lbl">Region</span></div>
                  <div className="lf-stat"><span className="lf-stat-val">PRO</span><span className="lf-stat-lbl">Tier</span></div>
                </div>
              </div>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit}>
                <div className="lf-body">

                  <div>
                    <label className="lf-lbl">▸ Your Name</label>
                    <div className="lf-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="What do we call you?" required/></div>
                  </div>

                  <div>
                    <label className="lf-lbl">▸ Support Type</label>
                    <div className="lf-types">
                      {TYPES.map(t=>(
                        <button key={t.key} type="button" onClick={()=>handleTypeChange(t.key)} className={cn('lf-tb',t.tc,donationType===t.key?'lf-on':'')}>
                          <div className="lf-tb-face">
                            <span className="lf-tb-emoji">{t.emoji}</span>
                            <span className="lf-tb-name">{t.label}</span>
                            <span className="lf-tb-min">{currencySymbol}{t.min}+</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

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
                          <Command><CommandInput placeholder="Search currency..."/><CommandList><CommandEmpty>No currency found.</CommandEmpty><CommandGroup>
                            {SUPPORTED_CURRENCIES.map(c=>(
                              <CommandItem key={c.code} value={c.code} onSelect={()=>{setSelectedCurrency(c.code);setCurrencyOpen(false);}}>
                                <Check className={cn("mr-2 h-4 w-4",selectedCurrency===c.code?"opacity-100":"opacity-0")}/>{c.symbol} {c.code}
                              </CommandItem>
                            ))}
                          </CommandGroup></CommandList></Command>
                        </PopoverContent>
                      </Popover>
                      <div className="lf-iw" style={{flex:1}}>
                        <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                      </div>
                    </div>
                    {pricing.ttsEnabled&&<p className="lf-hint">⚡ TTS ABOVE {currencySymbol}{pricing.minTts}</p>}
                  </div>

                  <div className="lf-div"/>

                  {donationType==="text"&&(
                    <div className="lf-fu">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <label className="lf-lbl" style={{margin:0}}>▸ Your Message</label>
                        <span style={{fontSize:9,fontWeight:700,color:msgClr,fontFamily:'Orbitron,monospace',letterSpacing:'0.08em'}}>{formData.message.length}/{maxMsgLen}</span>
                      </div>
                      <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Say something to Latifa!" className="lf-ta" rows={2} maxLength={maxMsgLen}/>
                      <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 5px ${msgClr}`}}/></div>
                    </div>
                  )}

                  {donationType==="voice"&&(
                    <div className="lf-fu">
                      <label className="lf-lbl">▸ Voice Message</label>
                      <div className="lf-sp lf-sp-pk">
                        <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDur(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#a855f7"/>
                      </div>
                    </div>
                  )}

                  {donationType==="hypersound"&&(
                    <div className="lf-fu lf-sp lf-sp-mg">
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <span style={{fontSize:14}}>🔊</span>
                        <span style={{fontSize:11,fontWeight:700,color:'var(--lf-magenta)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>HYPERSOUNDS</span>
                      </div>
                      <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                    </div>
                  )}

                  {donationType==="media"&&(
                    <div className="lf-fu lf-sp lf-sp-pu">
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <span style={{fontSize:14}}>🖼️</span>
                        <span style={{fontSize:11,fontWeight:700,color:'var(--lf-purple)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>MEDIA DROP</span>
                      </div>
                      <MediaUploader streamerSlug="gaming_with_latifa" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                    </div>
                  )}

                  <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                  <div className="lf-btn-wrap">
                    <button type="submit" className="lf-btn" disabled={isProcessing}>
                      {isProcessing?(
                        <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}><span className="lf-spinner"/> SENDING...</span>
                      ):(
                        <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Heart style={{width:14,height:14}}/> SUPPORT {currencySymbol}{formData.amount||'0'}</span>
                      )}
                    </button>
                  </div>

                  <p style={{fontSize:8,fontWeight:600,color:'rgba(233,213,255,0.14)',textAlign:'center',lineHeight:1.6,fontFamily:'Orbitron,monospace',letterSpacing:'0.06em'}}>
                    PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                  </p>
                  <DonationPageFooter brandColor="#a855f7"/>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingWithLatifa;
