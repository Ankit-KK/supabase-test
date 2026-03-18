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
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-purple-dim:  #3b1570;
    --lf-pink:        #f472b6;
    --lf-pink-dark:   #db2777;
    --lf-pink-dim:    #6b1040;
    --lf-cyan:        #e879f9;
    --lf-bg:          #08050f;
    --lf-card:        #0e0a1a;
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

  /* ── Canvas ── */
  .lf-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.4; }

  /* ── Atmospheric glow ── */
  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 60% 50% at 15% 20%, rgba(124,58,237,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 75%, rgba(244,114,182,0.16) 0%, transparent 55%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 60%);
  }

  /* ── Grid ── */
  .lf-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.04;
    background-image: linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ── Scanlines ── */
  .lf-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px);
  }

  /* ── Scale wrap ── */
  .lf-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  /* ── Parachute drop entrance ── */
  @keyframes lf-drop {
    0%   { opacity: 0; transform: translateY(-140px) scale(0.95); }
    55%  { opacity: 1; transform: translateY(14px) scale(1.01); }
    72%  { transform: translateY(-7px) scale(0.99); }
    85%  { transform: translateY(4px) scale(1.005); }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  .lf-drop-in { animation: lf-drop 1s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Card ── */
  .lf-card {
    width: 420px; background: var(--lf-card); border-radius: 3px;
    border: 1px solid rgba(168,85,247,0.4);
    box-shadow:
      0 0 0 1px rgba(244,114,182,0.06),
      0 0 35px rgba(124,58,237,0.22),
      0 0 80px rgba(124,58,237,0.08),
      0 30px 80px rgba(0,0,0,0.9);
    overflow: hidden; position: relative;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    transition: transform 0.08s ease;
  }

  .lf-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 100;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px);
  }

  /* Corner brackets */
  .lf-bracket { position: absolute; width: 14px; height: 14px; z-index: 101; pointer-events: none; }
  .lf-bracket-tl { top: 5px; left: 5px; border-top: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-tr { top: 5px; right: 28px; border-top: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-bl { bottom: 28px; left: 5px; border-bottom: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-br { bottom: 5px; right: 5px; border-bottom: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.7; }

  /* ── HERO ── */
  .lf-hero {
    position: relative; padding: 18px 22px 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(168,85,247,0.12) 50%, rgba(244,114,182,0.08) 100%);
    border-bottom: 1px solid rgba(168,85,247,0.25);
  }

  /* Animated top border */
  .lf-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--lf-purple-dark), var(--lf-purple), var(--lf-pink), var(--lf-cyan), var(--lf-purple), var(--lf-purple-dark));
    background-size: 200% 100%; animation: lf-shift 4s linear infinite;
    box-shadow: 0 0 10px var(--lf-purple), 0 0 22px rgba(244,114,182,0.4);
  }

  .lf-hero::after {
    content: ''; position: absolute; bottom: 0; right: 0;
    width: 0; height: 0; border-style: solid;
    border-width: 0 0 20px 20px;
    border-color: transparent transparent rgba(168,85,247,0.2) transparent;
  }

  @keyframes lf-shift { 0%{background-position:0%} 100%{background-position:200%} }

  .lf-hero-blob {
    position: absolute; top: -40px; right: -40px; width: 160px; height: 160px;
    border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 65%); pointer-events: none;
  }

  /* ── Animated ring ── */
  .lf-ring-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
  .lf-ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid transparent; }
  .lf-ring-1 { border-color: var(--lf-purple); animation: lf-spin 3s linear infinite; box-shadow: 0 0 12px rgba(168,85,247,0.55); }
  .lf-ring-2 { inset: 8px; border-color: var(--lf-pink); animation: lf-spin 2s linear infinite reverse; box-shadow: 0 0 10px rgba(244,114,182,0.5); }
  .lf-ring-3 { inset: 16px; border-color: rgba(168,85,247,0.5); animation: lf-spin 5s linear infinite; }
  .lf-ring-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 18px; height: 18px; border-radius: 50%; background: radial-gradient(circle, #fff 0%, var(--lf-pink) 50%, var(--lf-purple) 100%); box-shadow: 0 0 14px var(--lf-pink), 0 0 28px rgba(168,85,247,0.6); animation: lf-dot-pulse 1.8s ease-in-out infinite; }
  .lf-ring-cross { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 44px; height: 44px; }
  .lf-ring-cross::before,.lf-ring-cross::after { content: ''; position: absolute; background: rgba(168,85,247,0.35); }
  .lf-ring-cross::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
  .lf-ring-cross::after  { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
  .lf-orbit { position: absolute; inset: 0; animation: lf-spin 2.8s linear infinite; }
  .lf-orbit-dot { position: absolute; top: 3px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: var(--lf-pink); box-shadow: 0 0 8px var(--lf-pink); }

  @keyframes lf-spin { to{transform:rotate(360deg);} }
  @keyframes lf-dot-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.2);} }

  /* Name + typewriter */
  .lf-operator-tag { display: flex; flex-direction: column; position: relative; z-index: 1; flex: 1; }
  .lf-tag-prefix { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(168,85,247,0.5); letter-spacing:0.25em; text-transform:uppercase; margin-bottom:3px; }

  @keyframes lf-cursor-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-name {
    font-family: 'Black Ops One', cursive; font-size: 22px; font-weight: 400;
    color: #fff; line-height: 1.1; letter-spacing: 0.04em;
    text-shadow: 0 0 18px rgba(168,85,247,0.4), 0 0 35px rgba(244,114,182,0.2);
    min-height: 50px;
  }
  .lf-name-pink { color: var(--lf-pink); text-shadow: 0 0 14px rgba(244,114,182,0.6); }
  .lf-name-cursor { display: inline-block; width: 2px; height: 20px; background: var(--lf-pink); margin-left: 2px; vertical-align: middle; animation: lf-cursor-blink .7s ease-in-out infinite; }
  .lf-hero-sub { font-size:9px; font-weight:600; color:rgba(233,213,255,0.28); margin-top:5px; letter-spacing:0.18em; text-transform:uppercase; font-family:'Orbitron',monospace; }

  /* Live badge */
  @keyframes lf-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .lf-live { display:inline-flex; align-items:center; gap:5px; background:rgba(168,85,247,0.12); border:1px solid rgba(168,85,247,0.45); padding:4px 10px; flex-shrink:0; position:relative; z-index:1; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
  .lf-live-dot { width:5px; height:5px; border-radius:50%; background:var(--lf-purple); animation:lf-pulse 1.2s ease-in-out infinite; }
  .lf-live-text { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:var(--lf-purple); letter-spacing:0.18em; text-shadow:0 0 8px var(--lf-purple); }

  /* ── Body ── */
  .lf-body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .lf-lbl { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(168,85,247,0.65); }

  /* ── Inputs ── */
  .lf-iw { position: relative; }
  .lf-iw input {
    width:100% !important; background:rgba(168,85,247,0.05) !important;
    border:1px solid rgba(168,85,247,0.28) !important; border-radius:2px !important;
    color:var(--lf-text) !important; font-family:'Rajdhani',sans-serif !important;
    font-size:15px !important; font-weight:600 !important; padding:9px 12px !important;
    outline:none !important; transition:all .15s !important; caret-color:var(--lf-pink);
    letter-spacing:0.04em !important;
  }
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

  /* Purple */
  .lf-tb-pu .lf-tb-face { background:linear-gradient(160deg,rgba(168,85,247,0.18),rgba(100,30,180,0.5)); border:1px solid rgba(168,85,247,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pu::after { background:#2e1060; }
  .lf-tb-pu.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(168,85,247,0.32),rgba(124,58,237,0.6)); border-color:var(--lf-purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.35),0 0 18px rgba(168,85,247,0.75),0 0 36px rgba(168,85,247,0.28); }

  /* Pink */
  .lf-tb-pk .lf-tb-face { background:linear-gradient(160deg,rgba(244,114,182,0.18),rgba(180,30,120,0.5)); border:1px solid rgba(244,114,182,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pk::after { background:#5a0e35; }
  .lf-tb-pk.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(244,114,182,0.32),rgba(219,39,119,0.6)); border-color:var(--lf-pink); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(244,114,182,0.75),0 0 36px rgba(244,114,182,0.28); }

  /* Cyan/Magenta */
  .lf-tb-cy .lf-tb-face { background:linear-gradient(160deg,rgba(232,121,249,0.18),rgba(160,30,200,0.5)); border:1px solid rgba(232,121,249,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-cy::after { background:#460e5a; }
  .lf-tb-cy.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(232,121,249,0.32),rgba(192,38,211,0.6)); border-color:var(--lf-cyan); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(232,121,249,0.75),0 0 36px rgba(232,121,249,0.28); }

  /* Deep purple */
  .lf-tb-dp .lf-tb-face { background:linear-gradient(160deg,rgba(139,92,246,0.18),rgba(80,20,160,0.5)); border:1px solid rgba(139,92,246,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-dp::after { background:#260c50; }
  .lf-tb-dp.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(139,92,246,0.32),rgba(109,40,217,0.6)); border-color:#8b5cf6; box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(139,92,246,0.75),0 0 36px rgba(139,92,246,0.28); }

  .lf-tb:active .lf-tb-face { transform:translateY(0) !important; }
  .lf-tb:hover .lf-tb-face { filter:brightness(1.1); }
  .lf-tb-emoji { font-size:17px; display:block; line-height:1; }
  .lf-tb-name { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-top:4px; color:rgba(233,213,255,0.4); transition:color .15s,text-shadow .15s; }
  .lf-tb.lf-on .lf-tb-name { color:#fff; text-shadow:0 0 8px rgba(255,255,255,0.5); }
  .lf-tb-min { font-size:7px; font-weight:600; color:rgba(244,114,182,0.6); display:block; margin-top:2px; font-family:'Rajdhani',sans-serif; }

  /* ── Amount ── */
  .lf-amt { display:flex; gap:7px; }
  .lf-cur { display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(168,85,247,0.05) !important; border:1px solid rgba(168,85,247,0.28) !important; border-radius:2px !important; color:var(--lf-text) !important; font-family:'Rajdhani',sans-serif !important; font-size:13px !important; font-weight:700 !important; padding:0 10px !important; min-width:90px; height:40px; cursor:pointer; transition:all .15s; flex-shrink:0; letter-spacing:0.04em !important; }
  .lf-cur:hover { border-color:var(--lf-purple) !important; }

  .lf-div { height:1px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.4),rgba(244,114,182,0.2),transparent); position:relative; }
  .lf-div::before { content:'◆'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:6px; color:rgba(244,114,182,0.5); }

  /* Sub panels */
  .lf-sp { padding:10px 12px; position:relative; }
  .lf-sp::before,.lf-sp::after { content:''; position:absolute; width:10px; height:10px; pointer-events:none; }
  .lf-sp::before { top:0; left:0; border-top:1px solid var(--lf-purple); border-left:1px solid var(--lf-purple); opacity:0.45; }
  .lf-sp::after  { bottom:0; right:0; border-bottom:1px solid var(--lf-purple); border-right:1px solid var(--lf-purple); opacity:0.45; }
  .lf-sp-pu { background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.3); }
  .lf-sp-pk { background:rgba(244,114,182,0.05); border:1px solid rgba(244,114,182,0.28); }
  .lf-sp-cy { background:rgba(232,121,249,0.05); border:1px solid rgba(232,121,249,0.28); }

  /* ── 3D Donate Button ── */
  .lf-btn-wrap { position:relative; width:100%; border-radius:3px; padding-bottom:6px; }
  .lf-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:3px; z-index:1; background:linear-gradient(90deg,#2e0e6a,#3d1490,#2a0c6a); clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .lf-btn {
    position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer;
    font-family:'Black Ops One',cursive; font-size:13px; font-weight:400;
    letter-spacing:.1em; color:#fff;
    border-radius:3px; transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,var(--lf-purple-dark) 0%,var(--lf-purple) 50%,var(--lf-pink-dark) 100%);
    border-top:1.5px solid rgba(255,255,255,0.18); border-left:1.5px solid rgba(255,255,255,0.08);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 22px rgba(168,85,247,0.6),0 0 45px rgba(168,85,247,0.2);
    overflow:hidden;
    clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  }
  .lf-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,255,255,0.22),0 0 35px rgba(168,85,247,0.8),0 0 65px rgba(244,114,182,0.35); transform:translateY(-7px); }
  .lf-btn:active:not(:disabled) { transform:translateY(0) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.5) !important; }
  .lf-btn:disabled { opacity:.35; cursor:not-allowed; }
  .lf-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:skewX(-20deg); transition:left .6s; }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  .lf-hint { font-size:9px; font-weight:600; color:rgba(244,114,182,0.55); margin-top:3px; font-family:'Orbitron',monospace; letter-spacing:0.08em; }

  @keyframes lf-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .18s ease forwards; }

  @keyframes lf-spin-a { to{transform:rotate(360deg);} }
  .lf-spinner { width:13px; height:13px; border:1.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-spin-a .65s linear infinite; }

  @keyframes lf-in { from{opacity:0;transform:scale(0.97) translateY(8px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .lf-in { animation:lf-in .45s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Success Overlay ── */
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.4);opacity:0;} 65%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(100px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }
  @keyframes lf-scan { 0%{top:-5%;} 100%{top:110%;} }

  .lf-success-overlay { position:fixed; inset:0; z-index:99999; background:rgba(5,3,12,0.96); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; animation:lf-ov-in .3s ease forwards; }
  .lf-success-overlay.lf-ov-exit { animation:lf-ov-out .4s ease forwards; }
  .lf-success-scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.5),rgba(244,114,182,0.4),transparent); animation:lf-scan 2s linear infinite; pointer-events:none; }
  .lf-conf-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .lf-conf-piece { position:absolute; border-radius:2px; animation:lf-conf 1.6s ease-out both; }
  .lf-success-emoji { font-size:64px; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .1s both; }
  .lf-success-title { font-family:'Black Ops One',cursive; font-size:38px; color:#fff; text-shadow:0 0 22px var(--lf-pink),0 0 45px rgba(168,85,247,0.5); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .2s both; letter-spacing:0.06em; }
  .lf-success-sub { font-family:'Orbitron',monospace; font-size:10px; font-weight:700; color:rgba(233,213,255,0.35); letter-spacing:0.18em; text-transform:uppercase; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .3s both; }
  .lf-success-amount { font-family:'Black Ops One',cursive; font-size:20px; color:var(--lf-pink); text-shadow:0 0 14px rgba(244,114,182,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .4s both; letter-spacing:0.08em; }
  .lf-success-bar-wrap { width:220px; height:2px; background:rgba(255,255,255,0.08); margin-top:22px; overflow:hidden; animation:lf-pop .4s ease .5s both; }
  .lf-success-bar { height:100%; background:linear-gradient(90deg,var(--lf-purple),var(--lf-pink)); box-shadow:0 0 8px var(--lf-pink); animation:lf-bar-fill 2.5s linear .6s both; }
  .lf-success-redirect { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(168,85,247,0.4); letter-spacing:0.18em; margin-top:10px; animation:lf-pop .4s ease .7s both; }

  /* ── Kill Feed ── */
  .lf-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(16px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(8,5,15,0.95); border:1px solid rgba(168,85,247,0.35); border-left:3px solid var(--lf-purple); padding:8px 14px; border-radius:2px; animation:lf-kf-in .2s ease forwards; min-width:210px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); }
  .lf-kf-err  { border-left-color:#ef4444; }
  .lf-kf-warn { border-left-color:var(--lf-pink); }
  .lf-kf-icon { font-size:11px; flex-shrink:0; color:var(--lf-purple); font-family:'Orbitron',monospace; }
  .lf-kf-err  .lf-kf-icon { color:#ef4444; }
  .lf-kf-warn .lf-kf-icon { color:var(--lf-pink); }
  .lf-kf-text { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:var(--lf-text); letter-spacing:0.06em; }
`;

/* ── Particle Canvas ── */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const COLORS = ['168,85,247','244,114,182','139,92,246','232,121,249'];
    type P = { x:number; y:number; r:number; vx:number; vy:number; alpha:number; color:string; };
    const ps: P[] = [];
    const spawn = () => ps.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:0.8+Math.random()*2.5, vx:(Math.random()-0.5)*0.3, vy:-0.15-Math.random()*0.25, alpha:0.15+Math.random()*0.45, color:COLORS[Math.floor(Math.random()*COLORS.length)] });
    for (let i=0;i<60;i++) spawn();
    let frame: number;
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (Math.random()<0.05) spawn();
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

/* ── Typewriter hook ── */
const useTypewriter = (text:string, speed=55, delay=700) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false); let i=0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++; setDisplayed(text.slice(0,i));
        if (i>=text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return ()=>clearInterval(iv);
    }, delay);
    return ()=>clearTimeout(t);
  }, [text]);
  return { displayed, done };
};

/* ── Parallax hook ── */
const useParallax = (ref: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e:MouseEvent) => {
      const cx=window.innerWidth/2; const cy=window.innerHeight/2;
      const rx=(e.clientY-cy)/cy*5; const ry=-(e.clientX-cx)/cx*5;
      el.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onLeave = () => { el.style.transform='perspective(900px) rotateX(0deg) rotateY(0deg)'; };
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseleave',onLeave);
    return ()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseleave',onLeave); };
  }, []);
};

/* ── Success Overlay ── */
const SuccessOverlay: React.FC<{ amount:string; currency:string; onDone:()=>void }> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const confetti = Array.from({length:28},(_,i)=>({
    left:`${Math.random()*100}%`, top:`${5+Math.random()*45}%`,
    bg:['#a855f7','#f472b6','#e879f9','#c084fc','#f9a8d4','#7c3aed'][i%6],
    delay:`${Math.random()*0.5}s`, dur:`${1.3+Math.random()*0.8}s`,
    size:`${7+Math.random()*6}px`,
  }));
  useEffect(() => {
    const t=setTimeout(()=>{ ref.current?.classList.add('lf-ov-exit'); setTimeout(onDone,400); },3000);
    return ()=>clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="lf-success-overlay">
      <div className="lf-success-scanline"/>
      <div className="lf-conf-wrap">
        {confetti.map((c,i)=>(
          <div key={i} className="lf-conf-piece" style={{left:c.left,top:c.top,background:c.bg,animationDelay:c.delay,animationDuration:c.dur,width:c.size,height:c.size}}/>
        ))}
      </div>
      <div className="lf-success-emoji">🎯</div>
      <div className="lf-success-title">Support Confirmed</div>
      <div className="lf-success-sub">Mission accomplished</div>
      <div className="lf-success-amount">{currency}{amount} Deployed</div>
      <div className="lf-success-bar-wrap"><div className="lf-success-bar"/></div>
      <div className="lf-success-redirect">▸ Redirecting to debrief...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = { id:number; text:string; icon:string; variant:'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text:string, icon='✦', variant:KFMsg['variant']='default') => {
    const id=++kfId; setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)),3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(700,c.currentTime); o.frequency.exponentialRampToValueAtTime(460,c.currentTime+0.05); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); } catch {} };
const playSuccess = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; const t=c.currentTime+i*0.1; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15); o.start(t); o.stop(t+0.15); }); } catch {} };
const playError   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.setValueAtTime(220,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15); o.start(); o.stop(c.currentTime+0.15); } catch {} };

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

  const { displayed, done } = useTypewriter("Gaming With Latifa", 55, 700);
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
    wrap.style.transform=`scale(${scale})`;
  }, []);

  useEffect(()=>{ const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; },[applyScale]);
  useEffect(()=>{ const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); },[donationType,applyScale]);

  useEffect(()=>{
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed","✖","err");
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
    if (!razorpayLoaded||!(window as any).Razorpay) { playError(); push("Payment system loading","⚠","warn"); return; }
    const amount=Number(formData.amount);
    if (!formData.name) { playError(); push("Name required","✖","err"); return; }
    if (!amount||amount<=0) { playError(); push("Enter a valid amount","✖","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`,"✖","err"); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { playError(); push("Record voice message first","⚠","warn"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { playError(); push("Select a sound","⚠","warn"); return; }
    if (donationType==="media"&&!mediaUrl) { playError(); push("Upload a media file","⚠","warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Initiating payment...","◈","default");
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
        name:"Gaming With Latifa", description:"Support Gaming With Latifa",
        handler:()=>{ playSuccess(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#a855f7"},
      }).open();
    } catch {
      playError(); push("Payment failed. Try again.","✖","err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?'#ef4444':msgPct>70?'var(--lf-pink)':'var(--lf-purple)';

  /* Split typewriter for pink "Latifa" */
  const prefix="Gaming With "; const suffix="Latifa";
  const dispPre=displayed.slice(0,Math.min(displayed.length,prefix.length));
  const dispSuf=displayed.length>prefix.length?displayed.slice(prefix.length):'';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'lf-tb-pu'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'lf-tb-pk'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'lf-tb-cy'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'lf-tb-dp'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <ParticleCanvas/>

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
        <div className="lf-grid"/>
        <div className="lf-scanlines"/>

        <div ref={wrapRef} className="lf-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="lf-card lf-drop-in">

            <div className="lf-bracket lf-bracket-tl"/>
            <div className="lf-bracket lf-bracket-tr"/>
            <div className="lf-bracket lf-bracket-bl"/>
            <div className="lf-bracket lf-bracket-br"/>

            {/* HERO */}
            <div className="lf-hero">
              <div className="lf-hero-blob"/>

              {/* Ring */}
              <div className="lf-ring-wrap">
                <div className="lf-ring lf-ring-1"/>
                <div className="lf-ring lf-ring-2"/>
                <div className="lf-ring lf-ring-3"/>
                <div className="lf-ring-cross"/>
                <div className="lf-orbit"><div className="lf-orbit-dot"/></div>
                <div className="lf-ring-dot"/>
              </div>

              {/* Name + typewriter */}
              <div className="lf-operator-tag">
                <span className="lf-tag-prefix">▸ Operator ID</span>
                <div className="lf-name">
                  {dispPre}
                  {dispSuf&&<span className="lf-name-pink">{dispSuf}</span>}
                  {!done&&<span className="lf-name-cursor"/>}
                </div>
                <div className="lf-hero-sub">Support · Drop · Deploy</div>
              </div>

              <div className="lf-live">
                <div className="lf-live-dot"/>
                <span className="lf-live-text">LIVE</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-body">

                <div>
                  <label className="lf-lbl">▸ Operator Name</label>
                  <div className="lf-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                <div>
                  <label className="lf-lbl">▸ Mission Type</label>
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
                  <label className="lf-lbl">▸ Deploy Amount</label>
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
                  {pricing.ttsEnabled&&<p className="lf-hint">⚡ TTS ABOVE {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="lf-div"/>

                {donationType==="text"&&(
                  <div className="lf-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="lf-lbl" style={{margin:0}}>▸ Intel Message</label>
                      <span style={{fontSize:9,fontWeight:700,color:msgClr,fontFamily:'Orbitron,monospace',letterSpacing:'0.08em'}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Your message (optional)" className="lf-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 5px ${msgClr}`}}/></div>
                  </div>
                )}

                {donationType==="voice"&&(
                  <div className="lf-fu">
                    <label className="lf-lbl">▸ Voice Transmission</label>
                    <div className="lf-sp lf-sp-pk">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#a855f7"/>
                    </div>
                  </div>
                )}

                {donationType==="hypersound"&&(
                  <div className="lf-fu lf-sp lf-sp-cy">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🔊</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--lf-cyan)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>HYPERSOUNDS</span>
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
                  <button type="submit" className="lf-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="lf-spinner"/> DEPLOYING...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        <Heart style={{width:14,height:14}}/>
                        SUPPORT {currencySymbol}{formData.amount||'0'}
                      </span>
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
    </>
  );
};

export default GamingWithLatifa;
