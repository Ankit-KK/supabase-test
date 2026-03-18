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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-purple-dim:  #2d1b4e;
    --lf-pink:        #f472b6;
    --lf-pink-dark:   #db2777;
    --lf-orange:      #fb923c;
    --lf-orange-dark: #ea580c;
    --lf-bg:          #0e0c14;
    --lf-card:        rgba(20,14,36,0.82);
    --lf-text:        #e9d5ff;
    --lf-muted:       rgba(233,213,255,0.45);
  }

  * { box-sizing: border-box; }
  .lf-root { font-family: 'Nunito', sans-serif; }

  /* ── Page ── */
  .lf-page {
    width: 100vw; height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
    background: #0a0810;
  }

  /* ── BGMI Aerial Map background canvas ── */
  .lf-map-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

  /* ── Atmospheric glow ── */
  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 55% 45% at 20% 25%, rgba(124,58,237,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 45% 35% at 80% 70%, rgba(244,114,182,0.14) 0%, transparent 55%),
      radial-gradient(ellipse 35% 30% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 60%);
  }

  /* ── Scale wrap — parachute drop entrance ── */
  .lf-scale-wrap {
    width: 420px; transform-origin: top center; position: relative; z-index: 10;
  }

  @keyframes lf-parachute-drop {
    0%   { opacity: 0; transform: scale(1) translateY(-120px); }
    40%  { opacity: 1; transform: scale(1) translateY(12px); }
    60%  { transform: scale(1) translateY(-6px); }
    75%  { transform: scale(1) translateY(4px); }
    88%  { transform: scale(1) translateY(-2px); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  .lf-drop-in { animation: lf-parachute-drop .9s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Card — glassmorphism ── */
  .lf-card {
    width: 420px;
    background: var(--lf-card);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 22px;
    border: 1px solid rgba(168,85,247,0.35);
    box-shadow:
      0 0 0 1px rgba(244,114,182,0.08),
      0 0 50px rgba(168,85,247,0.25),
      0 0 100px rgba(168,85,247,0.1),
      inset 0 1px 0 rgba(255,255,255,0.06),
      0 30px 80px rgba(0,0,0,0.8);
    overflow: hidden; position: relative;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  /* Animated rainbow border */
  .lf-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
    background: linear-gradient(90deg,
      var(--lf-purple-dark), var(--lf-purple), var(--lf-pink),
      var(--lf-orange), var(--lf-pink), var(--lf-purple), var(--lf-purple-dark));
    background-size: 300% 100%;
    animation: lf-border-shift 4s linear infinite;
    box-shadow: 0 0 12px var(--lf-purple), 0 0 25px rgba(244,114,182,0.5);
  }

  /* Subtle inner glow */
  .lf-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; border-radius: 22px;
    background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 60%);
  }

  @keyframes lf-border-shift { 0%{background-position:0%} 100%{background-position:300%} }

  /* ── HERO ── */
  .lf-hero {
    position: relative; padding: 26px 22px 22px;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden; text-align: center; z-index: 1;
    border-bottom: 1px solid rgba(168,85,247,0.15);
  }

  /* ── Animated BGMI ring ── */
  .lf-ring-wrap { position: relative; width: 86px; height: 86px; margin-bottom: 16px; }

  .lf-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; }

  .lf-ring-1 {
    border-color: var(--lf-purple);
    animation: lf-spin 3s linear infinite;
    box-shadow: 0 0 14px rgba(168,85,247,0.6), inset 0 0 14px rgba(168,85,247,0.12);
  }
  .lf-ring-2 {
    inset: 9px; border-color: var(--lf-pink);
    animation: lf-spin 2s linear infinite reverse;
    box-shadow: 0 0 12px rgba(244,114,182,0.5);
  }
  .lf-ring-3 {
    inset: 18px; border-color: var(--lf-orange);
    animation: lf-spin 4.5s linear infinite;
    box-shadow: 0 0 10px rgba(251,146,60,0.45);
  }
  .lf-ring-4 {
    inset: 27px; border-color: rgba(168,85,247,0.4);
    animation: lf-spin 1.5s linear infinite reverse;
  }

  .lf-ring-dot {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 22px; height: 22px; border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, var(--lf-pink) 40%, var(--lf-purple) 100%);
    box-shadow: 0 0 18px var(--lf-pink), 0 0 35px rgba(168,85,247,0.6);
    animation: lf-dot-pulse 1.6s ease-in-out infinite;
  }

  .lf-ring-cross { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 52px; height: 52px; }
  .lf-ring-cross::before,.lf-ring-cross::after { content: ''; position: absolute; background: rgba(168,85,247,0.35); }
  .lf-ring-cross::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
  .lf-ring-cross::after  { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }

  .lf-ring-1::before,.lf-ring-1::after { content: ''; position: absolute; width: 7px; height: 7px; background: #0a0810; border-radius: 50%; }
  .lf-ring-1::before { top: -3px; left: 50%; transform: translateX(-50%); }
  .lf-ring-1::after  { bottom: -3px; left: 50%; transform: translateX(-50%); }

  /* Orbit dot */
  .lf-orbit { position: absolute; inset: 0; animation: lf-spin 2.5s linear infinite; }
  .lf-orbit-dot { position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: var(--lf-pink); box-shadow: 0 0 8px var(--lf-pink); }

  @keyframes lf-spin { to{transform:rotate(360deg);} }
  @keyframes lf-dot-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 18px var(--lf-pink),0 0 35px rgba(168,85,247,0.6);} 50%{transform:translate(-50%,-50%) scale(1.18);box-shadow:0 0 26px var(--lf-pink),0 0 50px rgba(168,85,247,0.8);} }

  /* Typewriter name */
  @keyframes lf-cursor-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-name {
    font-family: 'Fredoka One', cursive; font-size: 30px; color: #fff;
    line-height: 1; letter-spacing: 0.02em;
    text-shadow: 0 0 22px rgba(168,85,247,0.55), 0 0 45px rgba(244,114,182,0.28);
    min-height: 36px;
  }
  .lf-name span { color: var(--lf-pink); }
  .lf-name-cursor { display: inline-block; width: 2px; height: 28px; background: var(--lf-pink); margin-left: 2px; vertical-align: middle; animation: lf-cursor-blink .7s ease-in-out infinite; }

  .lf-hero-sub { font-size: 11px; font-weight: 700; color: var(--lf-muted); margin-top: 6px; letter-spacing: 0.14em; text-transform: uppercase; }

  @keyframes lf-live-pulse { 0%,100%{box-shadow:0 0 8px var(--lf-pink);opacity:1;} 50%{box-shadow:none;opacity:0.5;} }
  .lf-live { display:inline-flex; align-items:center; gap:5px; margin-top:11px; background:rgba(244,114,182,0.12); border:1px solid rgba(244,114,182,0.45); border-radius:20px; padding:4px 13px; }
  .lf-live-dot { width:6px; height:6px; border-radius:50%; background:var(--lf-pink); animation:lf-live-pulse 1.4s ease-in-out infinite; }
  .lf-live-text { font-size:9px; font-weight:800; color:var(--lf-pink); letter-spacing:0.16em; text-shadow:0 0 8px var(--lf-pink); }

  /* ── Body ── */
  .lf-body { padding:16px 18px 18px; display:flex; flex-direction:column; gap:13px; position:relative; z-index:1; }
  .lf-lbl { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(168,85,247,0.85); }

  /* ── Inputs ── */
  .lf-iw input {
    width:100% !important;
    background:rgba(168,85,247,0.07) !important;
    border:1.5px solid rgba(168,85,247,0.28) !important;
    border-radius:11px !important; color:var(--lf-text) !important;
    font-family:'Nunito',sans-serif !important; font-size:15px !important; font-weight:700 !important;
    padding:10px 13px !important; outline:none !important; transition:all .18s !important;
    caret-color:var(--lf-pink);
  }
  .lf-iw input:focus { border-color:var(--lf-purple) !important; background:rgba(168,85,247,0.12) !important; box-shadow:0 0 0 3px rgba(168,85,247,0.18),0 0 16px rgba(168,85,247,0.12) !important; }
  .lf-iw input::placeholder { color:rgba(233,213,255,0.22) !important; }
  .lf-iw input:disabled,.lf-iw input[readonly] { opacity:.4 !important; cursor:not-allowed !important; }

  .lf-ta { width:100%; background:rgba(168,85,247,0.07); border:1.5px solid rgba(168,85,247,0.28); border-radius:11px; color:var(--lf-text); font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; padding:10px 13px; resize:none; outline:none; line-height:1.5; caret-color:var(--lf-pink); transition:all .18s; }
  .lf-ta:focus { border-color:var(--lf-purple); background:rgba(168,85,247,0.12); box-shadow:0 0 0 3px rgba(168,85,247,0.15); }
  .lf-ta::placeholder { color:rgba(233,213,255,0.22); }

  .lf-cbar { height:3px; margin-top:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
  .lf-cbar-fill { height:100%; border-radius:3px; transition:width .12s,background .2s; }

  /* ── 3D Type Buttons ── */
  .lf-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }

  .lf-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:12px; display:block; width:100%; }
  .lf-tb-face {
    position:relative; z-index:2; padding:11px 4px 10px; border-radius:12px;
    text-align:center; transition:transform .12s ease,box-shadow .12s ease;
    transform:translateY(-5px);
  }
  .lf-tb::after {
    content:''; position:absolute; bottom:0; left:0; right:0;
    height:calc(100% - 3px); border-radius:12px; z-index:1;
  }

  /* Purple — text */
  .lf-tb-pu .lf-tb-face { background:linear-gradient(160deg,rgba(168,85,247,0.2),rgba(100,30,180,0.5)); border:1.5px solid rgba(168,85,247,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.15); }
  .lf-tb-pu::after { background:#3b1570; border:1.5px solid rgba(168,85,247,0.3); }
  .lf-tb-pu:hover .lf-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(168,85,247,0.5); }
  .lf-tb-pu.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(168,85,247,0.35),rgba(124,58,237,0.6)); border-color:var(--lf-purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.35),0 0 20px rgba(168,85,247,0.75),0 0 40px rgba(168,85,247,0.3),inset 0 0 14px rgba(168,85,247,0.15); }

  /* Pink — voice */
  .lf-tb-pk .lf-tb-face { background:linear-gradient(160deg,rgba(244,114,182,0.2),rgba(180,30,120,0.5)); border:1.5px solid rgba(244,114,182,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.15); }
  .lf-tb-pk::after { background:#6b1040; border:1.5px solid rgba(244,114,182,0.3); }
  .lf-tb-pk:hover .lf-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(244,114,182,0.5); }
  .lf-tb-pk.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(244,114,182,0.35),rgba(219,39,119,0.6)); border-color:var(--lf-pink); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(244,114,182,0.75),0 0 40px rgba(244,114,182,0.3),inset 0 0 14px rgba(244,114,182,0.12); }

  /* Orange — hypersound */
  .lf-tb-or .lf-tb-face { background:linear-gradient(160deg,rgba(251,146,60,0.2),rgba(180,70,0,0.5)); border:1.5px solid rgba(251,146,60,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.15); }
  .lf-tb-or::after { background:#6a2c00; border:1.5px solid rgba(251,146,60,0.3); }
  .lf-tb-or:hover .lf-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(251,146,60,0.5); }
  .lf-tb-or.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(251,146,60,0.35),rgba(234,88,12,0.6)); border-color:var(--lf-orange); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(251,146,60,0.75),0 0 40px rgba(251,146,60,0.3),inset 0 0 14px rgba(251,146,60,0.12); }

  /* Purple2 — media */
  .lf-tb-p2 .lf-tb-face { background:linear-gradient(160deg,rgba(192,132,252,0.2),rgba(130,60,220,0.5)); border:1.5px solid rgba(192,132,252,0.55); box-shadow:inset 0 1px 0 rgba(255,255,255,0.15); }
  .lf-tb-p2::after { background:#4a1a8a; border:1.5px solid rgba(192,132,252,0.3); }
  .lf-tb-p2:hover .lf-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(192,132,252,0.5); }
  .lf-tb-p2.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(192,132,252,0.35),rgba(168,85,247,0.6)); border-color:#c084fc; box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 20px rgba(192,132,252,0.75),0 0 40px rgba(192,132,252,0.3),inset 0 0 14px rgba(192,132,252,0.12); }

  .lf-tb:active .lf-tb-face { transform:translateY(0) !important; }
  .lf-tb-emoji { font-size:19px; display:block; line-height:1; }
  .lf-tb-name { font-family:'Nunito',sans-serif; font-size:8px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s,text-shadow .15s; color:rgba(233,213,255,0.45); }
  .lf-tb.lf-on .lf-tb-name { color:#fff; }
  .lf-tb-min { font-size:8px; font-weight:700; color:rgba(251,146,60,0.65); display:block; margin-top:2px; font-family:'Nunito',sans-serif; }

  /* ── Amount ── */
  .lf-amt { display:flex; gap:8px; }
  .lf-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(168,85,247,0.07) !important; border:1.5px solid rgba(168,85,247,0.28) !important;
    border-radius:11px !important; color:var(--lf-text) !important;
    font-family:'Nunito',sans-serif !important; font-size:13px !important; font-weight:800 !important;
    padding:0 11px !important; min-width:90px; height:42px; cursor:pointer; transition:all .18s; flex-shrink:0;
  }
  .lf-cur:hover { border-color:var(--lf-purple) !important; box-shadow:0 0 12px rgba(168,85,247,0.2) !important; }

  .lf-div { height:1px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.35),rgba(244,114,182,0.25),transparent); position:relative; }
  .lf-div::before { content:'✦'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:8px; color:rgba(244,114,182,0.6); background:rgba(20,14,36,0.9); padding:0 8px; }

  /* Sub panels */
  .lf-sp { border-radius:12px; padding:11px 13px; }
  .lf-sp-pu { background:rgba(168,85,247,0.08); border:1.5px solid rgba(168,85,247,0.28); }
  .lf-sp-pk { background:rgba(244,114,182,0.07); border:1.5px solid rgba(244,114,182,0.28); }
  .lf-sp-or { background:rgba(251,146,60,0.07); border:1.5px solid rgba(251,146,60,0.28); }

  /* ── 3D Donate Button ── */
  .lf-btn-wrap { position:relative; width:100%; border-radius:14px; padding-bottom:6px; }
  .lf-btn-wrap::after {
    content:''; position:absolute; bottom:0; left:0; right:0;
    height:calc(100% - 4px); border-radius:14px; z-index:1;
    background:linear-gradient(135deg,#4a1090,#5e1aa0,#4a1090);
  }
  .lf-btn {
    position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer;
    font-family:'Fredoka One',cursive; font-size:17px; font-weight:400;
    letter-spacing:.04em; color:#fff;
    border-radius:14px; transition:transform .12s ease,box-shadow .12s ease;
    transform:translateY(-6px);
    background:linear-gradient(135deg,var(--lf-purple-dark) 0%,var(--lf-purple) 45%,var(--lf-pink-dark) 100%);
    border-top:1.5px solid rgba(255,255,255,0.2); border-left:1.5px solid rgba(255,255,255,0.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 22px rgba(168,85,247,0.6),0 0 45px rgba(168,85,247,0.25);
    overflow:hidden;
  }
  .lf-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 35px rgba(168,85,247,0.8),0 0 65px rgba(244,114,182,0.35); }
  .lf-btn:active:not(:disabled) { transform:translateY(0) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.4) !important; }
  .lf-btn:disabled { opacity:.4; cursor:not-allowed; }
  .lf-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent); transform:skewX(-20deg); transition:left .6s; }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  .lf-hint { font-size:10px; font-weight:700; color:rgba(251,146,60,0.65); margin-top:3px; }

  @keyframes lf-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .2s ease forwards; }

  @keyframes lf-spin-a { to{transform:rotate(360deg);} }
  .lf-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-spin-a .65s linear infinite; }

  /* ── Success Overlay ── */
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.4);opacity:0;} 65%{transform:scale(1.12);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(100px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }

  .lf-success-overlay { position:fixed; inset:0; z-index:99999; background:rgba(8,5,16,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; animation:lf-ov-in .3s ease forwards; }
  .lf-success-overlay.lf-ov-exit { animation:lf-ov-out .4s ease forwards; }
  .lf-conf-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .lf-conf-piece { position:absolute; width:9px; height:9px; border-radius:2px; animation:lf-conf 1.6s ease-out both; }
  .lf-success-emoji { font-size:70px; animation:lf-pop .55s cubic-bezier(0.22,1,0.36,1) .1s both; }
  .lf-success-title { font-family:'Fredoka One',cursive; font-size:40px; color:#fff; text-shadow:0 0 25px var(--lf-pink),0 0 50px rgba(168,85,247,0.5); animation:lf-pop .55s cubic-bezier(0.22,1,0.36,1) .2s both; }
  .lf-success-sub { font-size:13px; font-weight:700; color:var(--lf-muted); letter-spacing:0.1em; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .3s both; text-align:center; padding:0 20px; }
  .lf-success-amount { font-family:'Fredoka One',cursive; font-size:22px; color:var(--lf-orange); text-shadow:0 0 14px rgba(251,146,60,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .4s both; }
  .lf-success-bar-wrap { width:220px; height:4px; background:rgba(255,255,255,0.1); border-radius:4px; margin-top:18px; overflow:hidden; animation:lf-pop .4s ease .5s both; }
  .lf-success-bar { height:100%; border-radius:4px; background:linear-gradient(90deg,var(--lf-purple),var(--lf-pink),var(--lf-orange)); animation:lf-bar-fill 2.6s linear .6s both; }
  .lf-success-redirect { font-size:10px; font-weight:700; color:rgba(233,213,255,0.3); letter-spacing:0.12em; margin-top:10px; animation:lf-pop .4s ease .7s both; }

  /* ── Kill Feed ── */
  .lf-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(16px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(14,10,22,0.95); border:1px solid rgba(168,85,247,0.3); border-left:3px solid var(--lf-purple); padding:8px 14px; border-radius:10px; animation:lf-kf-in .2s ease forwards; min-width:210px; backdrop-filter:blur(10px); }
  .lf-kf-err  { border-left-color:#ef4444; }
  .lf-kf-warn { border-left-color:var(--lf-orange); }
  .lf-kf-icon { font-size:13px; flex-shrink:0; }
  .lf-kf-text { font-family:'Nunito',sans-serif; font-size:11px; font-weight:800; color:var(--lf-text); letter-spacing:0.03em; }
`;

/* ── BGMI Aerial Map Canvas ── */
const MapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;

    const W = canvas.width; const H = canvas.height;

    const drawMap = () => {
      ctx.clearRect(0, 0, W, H);

      /* Base terrain */
      ctx.fillStyle = '#0d0a18'; ctx.fillRect(0, 0, W, H);

      /* Terrain patches */
      const patches = [
        { x:0.1,y:0.15,w:0.25,h:0.2, c:'rgba(30,20,55,0.6)' },
        { x:0.6,y:0.05,w:0.3,h:0.25, c:'rgba(25,18,50,0.5)' },
        { x:0.35,y:0.55,w:0.35,h:0.3, c:'rgba(35,22,60,0.55)' },
        { x:0.05,y:0.65,w:0.2,h:0.28, c:'rgba(20,15,45,0.5)' },
        { x:0.7,y:0.6,w:0.28,h:0.35, c:'rgba(28,20,52,0.5)' },
      ];
      patches.forEach(p => {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.roundRect(p.x*W, p.y*H, p.w*W, p.h*H, 8);
        ctx.fill();
      });

      /* Grid lines */
      ctx.strokeStyle = 'rgba(168,85,247,0.06)'; ctx.lineWidth = 1;
      const gSize = 60;
      for (let x = 0; x < W; x += gSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += gSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      /* Diagonal accent lines */
      ctx.strokeStyle = 'rgba(244,114,182,0.04)'; ctx.lineWidth = 1;
      for (let i = -H; i < W; i += 120) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
      }

      /* Zone circle */
      const cx = W * 0.5; const cy = H * 0.45;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W,H)*0.38, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(168,85,247,0.12)'; ctx.lineWidth = 2; ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]);

      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W,H)*0.22, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(244,114,182,0.1)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);

      /* Map dots */
      const dots = [
        {x:0.22,y:0.28,c:'rgba(168,85,247,0.6)',r:2.5},
        {x:0.75,y:0.2,c:'rgba(244,114,182,0.6)',r:2},
        {x:0.48,y:0.7,c:'rgba(251,146,60,0.5)',r:2},
        {x:0.15,y:0.72,c:'rgba(168,85,247,0.4)',r:1.5},
        {x:0.82,y:0.65,c:'rgba(244,114,182,0.45)',r:2},
        {x:0.55,y:0.35,c:'rgba(251,146,60,0.55)',r:1.8},
      ];
      dots.forEach(d => {
        ctx.beginPath(); ctx.arc(d.x*W, d.y*H, d.r*2, 0, Math.PI*2);
        ctx.fillStyle = d.c.replace(/[\d.]+\)/, '0.08)'); ctx.fill();
        ctx.beginPath(); ctx.arc(d.x*W, d.y*H, d.r, 0, Math.PI*2);
        ctx.fillStyle = d.c; ctx.fill();
      });

      /* Floating particles */
      for (let i = 0; i < 40; i++) {
        const x = Math.random()*W; const y = Math.random()*H;
        const r = 0.5 + Math.random()*1.5;
        const colors = ['168,85,247','244,114,182','251,146,60'];
        const c = colors[Math.floor(Math.random()*colors.length)];
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${c},${0.15+Math.random()*0.35})`; ctx.fill();
      }
    };

    drawMap();
    const onResize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; drawMap(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return <canvas ref={canvasRef} className="lf-map-canvas"/>;
};

/* ── Typewriter hook ── */
const useTypewriter = (text: string, speed = 60, startDelay = 400) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return { displayed, done };
};

/* ── Parallax hook ── */
const useParallax = (ref: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; const dy = (e.clientY - cy) / cy;
      const rx = dy * 6; const ry = -dx * 6;
      el.style.transform = `scale(1) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onLeave = () => { el.style.transform = 'scale(1) perspective(800px) rotateX(0deg) rotateY(0deg)'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave); };
  }, []);
};

/* ── Success Overlay ── */
const SuccessOverlay: React.FC<{ amount:string; currency:string; onDone:()=>void }> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const confetti = Array.from({length:32},(_,i)=>({
    left:`${Math.random()*100}%`, top:`${5+Math.random()*50}%`,
    bg:['#a855f7','#f472b6','#fb923c','#fbbf24','#34d399','#60a5fa'][i%6],
    delay:`${Math.random()*0.6}s`, dur:`${1.4+Math.random()*0.8}s`, rot:`${Math.random()*360}deg`,
    size:`${7+Math.random()*6}px`,
  }));
  useEffect(() => {
    const t=setTimeout(()=>{ ref.current?.classList.add('lf-ov-exit'); setTimeout(onDone,400); },3200);
    return ()=>clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="lf-success-overlay">
      <div className="lf-conf-wrap">
        {confetti.map((c,i)=>(
          <div key={i} className="lf-conf-piece" style={{left:c.left,top:c.top,background:c.bg,animationDelay:c.delay,animationDuration:c.dur,transform:`rotate(${c.rot})`,width:c.size,height:c.size}}/>
        ))}
      </div>
      <div className="lf-success-emoji">🎉</div>
      <div className="lf-success-title">Yay, Thanks!</div>
      <div className="lf-success-sub">You just dropped support for Gaming With Latifa! She'll love you for this 💜</div>
      <div className="lf-success-amount">{currency}{amount} deployed! 🎯</div>
      <div className="lf-success-bar-wrap"><div className="lf-success-bar"/></div>
      <div className="lf-success-redirect">Taking you to confirmation...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = { id:number; text:string; icon:string; variant:'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text:string, icon='', variant:KFMsg['variant']='default') => {
    const id=++kfId; setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)),3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(700,c.currentTime); o.frequency.exponentialRampToValueAtTime(460,c.currentTime+0.05); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); } catch {} };
const playSuccess = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; const t=c.currentTime+i*0.1; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18); o.start(t); o.stop(t+0.18); }); } catch {} };
const playError   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(320,c.currentTime); o.frequency.exponentialRampToValueAtTime(160,c.currentTime+0.18); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.2); o.start(); o.stop(c.currentTime+0.2); } catch {} };

/* ── Main ── */
const GamingWithLatifa = () => {
  const navigate  = useNavigate();
  const cardRef   = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
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
  const [showSuccess, setShowSuccess]                 = useState(false);
  const [redirectUrl, setRedirectUrl]                 = useState('');

  const { pricing }      = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  /* Typewriter */
  const fullText = "Gaming With Latifa";
  const { displayed, done } = useTypewriter(fullText, 55, 600);

  /* Parallax */
  useParallax(cardRef);

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
    wrap.style.height=`${card.scrollHeight*scale}px`;
    const currentTransform = card.style.transform || '';
    if (!currentTransform.includes('rotateX')) {
      wrap.style.transform=`scale(${scale})`;
    }
  }, []);

  useEffect(()=>{ const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; },[applyScale]);
  useEffect(()=>{ const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); },[donationType,applyScale]);

  useEffect(()=>{
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed 😬","","err");
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  },[]);

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
    if (!razorpayLoaded||!(window as any).Razorpay) { playError(); push("Payment system still loading 😅","","warn"); return; }
    const amount=Number(formData.amount);
    if (!formData.name) { playError(); push("Tell us your name first! 👀","","err"); return; }
    if (!amount||amount<=0) { playError(); push("Enter an amount! 💸","","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min} 😬`,"","err"); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { playError(); push("Record your voice first 🎤","","warn"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { playError(); push("Pick a sound! 🔊","","warn"); return; }
    if (donationType==="media"&&!mediaUrl) { playError(); push("Upload your media! 🖼️","","warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Getting things ready... 🎮","","default");
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
      new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency, order_id:data.razorpay_order_id,
        name:"Gaming With Latifa", description:"Support Gaming With Latifa 💜",
        handler:()=>{ playSuccess(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#a855f7"},
      }).open();
    } catch {
      playError(); push("Oops! Something went wrong 😬","","err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?'#ef4444':msgPct>70?'var(--lf-orange)':'var(--lf-purple)';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'lf-tb-pu'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'lf-tb-pk'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'lf-tb-or'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'lf-tb-p2'},
  ];

  /* Split typewriter text for pink "Latifa" */
  const prefix = "Gaming With ";
  const suffix = "Latifa";
  const dispPrefix = displayed.slice(0, Math.min(displayed.length, prefix.length));
  const dispSuffix = displayed.length > prefix.length ? displayed.slice(prefix.length) : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <MapCanvas/>

      {showSuccess&&<SuccessOverlay amount={formData.amount} currency={currencySymbol} onDone={()=>navigate(redirectUrl)}/>}

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

        <div ref={wrapRef} className="lf-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="lf-card lf-drop-in">

            {/* HERO */}
            <div className="lf-hero">
              <div className="lf-ring-wrap">
                <div className="lf-ring lf-ring-1"/>
                <div className="lf-ring lf-ring-2"/>
                <div className="lf-ring lf-ring-3"/>
                <div className="lf-ring lf-ring-4"/>
                <div className="lf-ring-cross"/>
                <div className="lf-orbit"><div className="lf-orbit-dot"/></div>
                <div className="lf-ring-dot"/>
              </div>

              {/* Typewriter name */}
              <div className="lf-name">
                {dispPrefix}
                {dispSuffix && <span>{dispSuffix}</span>}
                {!done && <span className="lf-name-cursor"/>}
              </div>

              <div className="lf-hero-sub">Drop your support 🎯</div>
              <div className="lf-live">
                <div className="lf-live-dot"/>
                <span className="lf-live-text">LIVE</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-body">

                <div>
                  <label className="lf-lbl">Your name</label>
                  <div className="lf-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="What do we call you? 👋" required/></div>
                </div>

                <div>
                  <label className="lf-lbl">How are you supporting?</label>
                  <div className="lf-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('lf-tb',t.tc,donationType===t.key?'lf-on':'')}>
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
                  <label className="lf-lbl">Amount</label>
                  <div className="lf-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="lf-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{width:11,height:11,opacity:0.4,marginLeft:'auto',flexShrink:0}}/>
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
                  {pricing.ttsEnabled&&<p className="lf-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="lf-div"/>

                {donationType==="text"&&(
                  <div className="lf-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="lf-lbl" style={{margin:0}}>Your message</label>
                      <span style={{fontSize:10,fontWeight:800,color:msgClr}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Say something fun! 😄" className="lf-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr}}/></div>
                  </div>
                )}

                {donationType==="voice"&&(
                  <div className="lf-fu">
                    <label className="lf-lbl">Voice message</label>
                    <div className="lf-sp lf-sp-pk">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#a855f7"/>
                    </div>
                  </div>
                )}

                {donationType==="hypersound"&&(
                  <div className="lf-fu lf-sp lf-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🔊</span>
                      <span style={{fontSize:13,fontWeight:800,color:'var(--lf-orange)',fontFamily:'Nunito,sans-serif'}}>Pick a HyperSound!</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {donationType==="media"&&(
                  <div className="lf-fu lf-sp lf-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🖼️</span>
                      <span style={{fontSize:13,fontWeight:800,color:'var(--lf-purple)',fontFamily:'Nunito,sans-serif'}}>Drop your media!</span>
                    </div>
                    <MediaUploader streamerSlug="gaming_with_latifa" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* 3D Button */}
                <div className="lf-btn-wrap">
                  <button type="submit" className="lf-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="lf-spinner"/> Hang on...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        <Heart style={{width:17,height:17}}/>
                        Support {currencySymbol}{formData.amount||'0'} 💜
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:9,fontWeight:700,color:'rgba(233,213,255,0.18)',textAlign:'center',lineHeight:1.6,fontFamily:'Nunito,sans-serif'}}>
                  Phone numbers collected by Razorpay as per RBI regulations
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
