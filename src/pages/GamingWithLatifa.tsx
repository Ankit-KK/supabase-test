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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-pink:        #f472b6;
    --lf-pink-light:  #f9a8d4;
    --lf-magenta:     #e879f9;
    --lf-violet:      #8b5cf6;
    --lf-cyan:        #00eeff;
    --lf-bg:          #08050f;
    --lf-card:        #0e0a1a;
    --lf-text:        #e9d5ff;
  }

  * { box-sizing: border-box; }
  .lf-root { font-family: 'Rajdhani', sans-serif; }

  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .lf-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5; }

  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 65% 50% at 10% 15%, rgba(124,58,237,0.35) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 88% 80%, rgba(168,85,247,0.12) 0%, transparent 55%),
      radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,10,26,0.5) 0%, transparent 70%);
  }

  .lf-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.05;
    background-image: linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .lf-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
  }

  .lf-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .lf-card {
    width: 420px; background: var(--lf-card); border-radius: 2px;
    border: 1px solid rgba(124,58,237,0.6);
    box-shadow:
      0 0 0 1px rgba(168,85,247,0.06),
      0 0 30px rgba(124,58,237,0.25),
      0 0 70px rgba(124,58,237,0.1),
      0 30px 80px rgba(0,0,0,0.6);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    position: relative;
  }

  .lf-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 100;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px);
  }

  .lf-bracket { position: absolute; width: 14px; height: 14px; z-index: 101; pointer-events: none; }
  .lf-bracket-tl { top: 5px; left: 5px; border-top: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.6; }
  .lf-bracket-tr { top: 5px; right: 28px; border-top: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.6; }
  .lf-bracket-bl { bottom: 28px; left: 5px; border-bottom: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.6; }
  .lf-bracket-br { bottom: 5px; right: 5px; border-bottom: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.6; }

  /* ── HERO ── */
  .lf-hero {
    position: relative; padding: 18px 22px 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(30,10,60,0.25) 60%, transparent 100%);
    border-bottom: 1px solid rgba(124,58,237,0.35);
  }
  .lf-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--lf-pink), var(--lf-purple), var(--lf-pink-light), var(--lf-purple), var(--lf-pink));
    background-size: 200% 100%; animation: lf-shift 4s linear infinite;
    box-shadow: 0 0 8px var(--lf-purple), 0 0 20px rgba(168,85,247,0.3);
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
    border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 65%); pointer-events: none;
  }

  .lf-operator-tag { display: flex; flex-direction: column; position: relative; z-index: 1; }
  .lf-tag-prefix { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(168,85,247,0.5); letter-spacing:0.25em; text-transform:uppercase; margin-bottom:3px; }

  @keyframes lf-glitch {
    0%,90%,100% { transform:none; text-shadow:none; clip-path:none; opacity:1; }
    91% { transform:translateX(-3px); text-shadow:3px 0 var(--lf-purple),-3px 0 var(--lf-pink); }
    92% { transform:translateX(3px) skewX(-4deg); text-shadow:-3px 0 var(--lf-pink),3px 0 var(--lf-magenta); clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%); }
    93% { transform:translateX(-2px); text-shadow:2px 0 var(--lf-magenta),-2px 0 var(--lf-purple); clip-path:none; }
    94% { transform:translateX(2px) skewX(3deg); text-shadow:none; opacity:0.8; }
    95% { transform:none; opacity:1; }
    96% { transform:translateX(-1px); text-shadow:1px 0 var(--lf-pink); clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%); }
    97% { transform:none; clip-path:none; }
  }

  .lf-name {
    font-family:'Black Ops One',cursive; font-size:30px; font-weight:400; color:#fff;
    line-height:1; letter-spacing:0.08em; animation:lf-glitch 9s infinite;
    position:relative; z-index:1; text-shadow:0 0 20px rgba(168,85,247,0.25);
  }
  .lf-hero-sub { font-size:9px; font-weight:600; color:rgba(255,255,255,0.3); margin-top:5px; position:relative; z-index:1; letter-spacing:0.18em; text-transform:uppercase; font-family:'Orbitron',monospace; }

  @keyframes lf-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .lf-live { display:inline-flex; align-items:center; gap:5px; background:rgba(124,58,237,0.2); border:1px solid rgba(249,168,212,0.5); padding:5px 11px; flex-shrink:0; position:relative; z-index:1; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
  .lf-live-dot { width:5px; height:5px; border-radius:50%; background:var(--lf-pink-light); animation:lf-pulse 1.2s ease-in-out infinite; }
  .lf-live-text { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:var(--lf-pink-light); letter-spacing:0.18em; text-shadow:0 0 8px var(--lf-pink-light); }

  /* ── Operator Loadout Bar ── */
  .lf-loadout {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 18px; border-bottom: 1px solid rgba(124,58,237,0.25);
    background: rgba(124,58,237,0.1); position: relative; z-index: 10;
  }
  .lf-rank-info { display: flex; align-items: center; gap: 8px; }
  .lf-rank-badge {
    font-family: 'Black Ops One', cursive; font-size: 10px;
    color: #08050f; background: var(--lf-purple);
    padding: 2px 7px; letter-spacing: 0.08em;
    clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
  }
  .lf-rank-name { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:rgba(168,85,247,0.7); letter-spacing:0.12em; }
  .lf-xp-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
  .lf-xp-label { font-family:'Orbitron',monospace; font-size:7px; color:rgba(255,255,255,0.3); letter-spacing:0.15em; }
  .lf-xp-bar { width:90px; height:3px; background:rgba(255,255,255,0.1); overflow:hidden; }
  .lf-xp-fill { height:100%; background:linear-gradient(90deg,var(--lf-pink),var(--lf-purple)); width:68%; box-shadow:0 0 6px var(--lf-purple); }

  /* ── Body ── */
  .lf-body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .lf-lbl { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(168,85,247,0.6); }

  .lf-iw { position:relative; }
  .lf-iw input {
    width:100% !important; background:rgba(124,58,237,0.08) !important; border:1px solid rgba(124,58,237,0.35) !important;
    border-radius:1px !important; color:#e8e0cc !important; font-family:'Rajdhani',sans-serif !important;
    font-size:15px !important; font-weight:600 !important; padding:8px 12px !important;
    outline:none !important; transition:all .15s !important; caret-color:var(--lf-purple); letter-spacing:0.05em !important;
  }
  .lf-iw input:focus { border-color:var(--lf-purple) !important; background:rgba(168,85,247,0.07) !important; box-shadow:0 0 0 1px rgba(168,85,247,0.12),0 0 12px rgba(168,85,247,0.08) !important; }
  .lf-iw input::placeholder { color:rgba(255,255,255,0.22) !important; }
  .lf-iw input:disabled,.lf-iw input[readonly] { opacity:.35 !important; cursor:not-allowed !important; }
  .lf-iw::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:var(--lf-purple); transform:scaleX(0); transform-origin:left; transition:transform 0.2s ease; opacity:0.6; }
  .lf-iw:focus-within::after { transform:scaleX(1); }

  .lf-ta { width:100%; background:rgba(124,58,237,0.08); border:1px solid rgba(124,58,237,0.35); border-radius:1px; color:#e8e0cc; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:600; padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--lf-purple); transition:all .15s; letter-spacing:0.04em; }
  .lf-ta:focus { border-color:var(--lf-purple); background:rgba(168,85,247,0.07); box-shadow:0 0 0 1px rgba(168,85,247,0.1); }
  .lf-ta::placeholder { color:rgba(255,255,255,0.22); }

  .lf-cbar { height:2px; margin-top:5px; background:rgba(255,255,255,0.08); overflow:hidden; }
  .lf-cbar-fill { height:100%; transition:width .12s,background .2s; }

  /* ── Type Buttons ── */
  .lf-types { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .lf-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; display:block; width:100%; }
  .lf-tb-face { position:relative; z-index:2; padding:10px 4px 9px; text-align:center; transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-4px); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
  .lf-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 2px); z-index:1; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }

  .lf-tb-gd .lf-tb-face { background:linear-gradient(160deg,rgba(168,85,247,0.18),rgba(100,80,20,0.5)); border:1px solid rgba(168,85,247,0.5); }
  .lf-tb-gd::after { background:#2e1060; }
  .lf-tb-gd.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(168,85,247,0.32),rgba(140,110,30,0.55)); border-color:var(--lf-purple); box-shadow:0 0 16px rgba(168,85,247,0.6),0 0 30px rgba(168,85,247,0.2); }

  .lf-tb-gn .lf-tb-face { background:linear-gradient(160deg,rgba(124,58,237,0.25),rgba(30,50,20,0.55)); border:1px solid rgba(124,58,237,0.6); }
  .lf-tb-gn::after { background:#1a0840; }
  .lf-tb-gn.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(124,58,237,0.38),rgba(80,20,120,0.6)); border-color:var(--lf-pink-light); box-shadow:0 0 16px rgba(249,168,212,0.6),0 0 30px rgba(124,58,237,0.2); }

  .lf-tb-or .lf-tb-face { background:linear-gradient(160deg,rgba(200,100,20,0.2),rgba(120,50,0,0.5)); border:1px solid rgba(200,120,30,0.5); }
  .lf-tb-or::after { background:#460e5a; }
  .lf-tb-or.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(200,120,30,0.32),rgba(160,80,0,0.55)); border-color:var(--lf-magenta); box-shadow:0 0 16px rgba(200,120,30,0.6),0 0 30px rgba(200,100,20,0.2); }

  .lf-tb-rd .lf-tb-face { background:linear-gradient(160deg,rgba(180,30,30,0.2),rgba(100,10,10,0.5)); border:1px solid rgba(180,40,40,0.5); }
  .lf-tb-rd::after { background:#1e0850; }
  .lf-tb-rd.lf-on .lf-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(180,40,40,0.32),rgba(140,20,20,0.55)); border-color:var(--lf-violet); box-shadow:0 0 16px rgba(200,50,50,0.6),0 0 30px rgba(180,30,30,0.2); }

  .lf-tb:active .lf-tb-face { transform:translateY(0) !important; }
  .lf-tb:hover .lf-tb-face { filter:brightness(1.12); }
  .lf-tb-emoji { font-size:17px; display:block; line-height:1; }
  .lf-tb-name { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s,text-shadow .15s; }
  .lf-tb-min { font-size:7px; font-weight:600; color:rgba(168,85,247,0.6); display:block; margin-top:2px; font-family:'Rajdhani',sans-serif; }

  .lf-amt { display:flex; gap:7px; }
  .lf-cur { display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(124,58,237,0.08) !important; border:1px solid rgba(124,58,237,0.35) !important; border-radius:1px !important; color:#e8e0cc !important; font-family:'Rajdhani',sans-serif !important; font-size:13px !important; font-weight:700 !important; padding:0 10px !important; min-width:90px; height:38px; cursor:pointer; transition:all .15s; flex-shrink:0; letter-spacing:0.05em !important; }
  .lf-cur:hover { border-color:var(--lf-purple) !important; }

  .lf-div { height:1px; background:linear-gradient(90deg,transparent,rgba(124,58,237,0.5),rgba(168,85,247,0.18),transparent); position:relative; }
  .lf-div::before { content:'◆'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:6px; color:rgba(168,85,247,0.45); }

  .lf-sp { padding:10px 12px; position:relative; }
  .lf-sp::before,.lf-sp::after { content:''; position:absolute; width:10px; height:10px; pointer-events:none; }
  .lf-sp::before { top:0; left:0; border-top:1px solid var(--lf-purple); border-left:1px solid var(--lf-purple); opacity:0.4; }
  .lf-sp::after  { bottom:0; right:0; border-bottom:1px solid var(--lf-purple); border-right:1px solid var(--lf-purple); opacity:0.4; }
  .lf-sp-gn { background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.4); }
  .lf-sp-or { background:rgba(200,100,20,0.07); border:1px solid rgba(200,120,30,0.32); }
  .lf-sp-rd { background:rgba(180,30,30,0.07); border:1px solid rgba(180,40,40,0.28); }

  /* ── Battle Pass Tiers ── */
  .lf-tiers { display:flex; gap:5px; }
  .lf-tier {
    flex: 1; display:flex; flex-direction:column; align-items:center; gap:3px;
    padding: 7px 4px;
    border: 1px solid rgba(124,58,237,0.25);
    background: rgba(124,58,237,0.06);
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
    transition: all .2s; position: relative; overflow: hidden;
  }
  .lf-tier.lf-tier-active {
    border-color: var(--lf-purple);
    background: rgba(168,85,247,0.1);
    box-shadow: 0 0 12px rgba(168,85,247,0.18);
  }
  .lf-tier.lf-tier-active::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(168,85,247,0.07), transparent);
    animation: lf-sweep 2.5s linear infinite;
  }
  .lf-tier-done {
    border-color: rgba(249,168,212,0.4);
    background: rgba(124,58,237,0.12);
  }
  @keyframes lf-sweep { to { left: 160%; } }
  .lf-tier-emoji { font-size:14px; line-height:1; }
  .lf-tier-rank { font-family:'Black Ops One',cursive; font-size:7px; color:rgba(168,85,247,0.4); letter-spacing:0.06em; text-align:center; }
  .lf-tier.lf-tier-active .lf-tier-rank { color:var(--lf-purple); text-shadow:0 0 8px rgba(168,85,247,0.5); }
  .lf-tier.lf-tier-done .lf-tier-rank { color:var(--lf-pink-light); }
  .lf-tier-amt { font-family:'Orbitron',monospace; font-size:7px; color:rgba(255,255,255,0.2); letter-spacing:0.05em; }
  .lf-tier.lf-tier-active .lf-tier-amt { color:rgba(168,85,247,0.6); }
  .lf-tier.lf-tier-done .lf-tier-amt { color:rgba(249,168,212,0.7); }

  /* ── Reconnecting HUD ── */
  @keyframes lf-rc-blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .lf-reconnecting { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99998; pointer-events:none; display:flex; flex-direction:column; align-items:center; gap:6px; }
  .lf-rc-text { font-family:'Orbitron',monospace; font-size:11px; font-weight:700; color:var(--lf-purple); letter-spacing:0.2em; animation:lf-rc-blink 1s ease-in-out infinite; text-shadow:0 0 12px var(--lf-purple); }
  .lf-rc-dots { display:flex; gap:4px; }
  .lf-rc-dot { width:4px; height:4px; border-radius:50%; background:var(--lf-purple); animation:lf-rc-blink 1s ease-in-out infinite; }
  .lf-rc-dot:nth-child(2) { animation-delay:.2s; }
  .lf-rc-dot:nth-child(3) { animation-delay:.4s; }

  /* ── Thank You! 💜 Overlay ── */
  @keyframes lf-kc-in  { from{opacity:0;transform:scale(1.06);} to{opacity:1;transform:scale(1);} }
  @keyframes lf-kc-out { from{opacity:1;transform:scale(1);} to{opacity:0;transform:scale(0.96);} }
  @keyframes lf-kc-bar { from{width:0;} to{width:100%;} }
  @keyframes lf-kc-tag { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
  @keyframes lf-kc-scan { 0%{top:-10%;} 100%{top:110%;} }

  .lf-kc-overlay { position:fixed; inset:0; z-index:99999; background:rgba(10,14,8,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; animation:lf-kc-in .3s ease forwards; }
  .lf-kc-overlay.lf-kc-exit { animation:lf-kc-out .4s ease forwards; }
  .lf-kc-scanline { position:absolute; left:0; right:0; height:3px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.4),transparent); animation:lf-kc-scan 1.8s linear infinite; pointer-events:none; }
  .lf-kc-icon { font-size:54px; margin-bottom:14px; filter:drop-shadow(0 0 20px rgba(168,85,247,0.7)); }
  .lf-kc-tag { font-family:'Black Ops One',cursive; font-size:40px; color:var(--lf-purple); letter-spacing:0.12em; text-transform:uppercase; text-shadow:0 0 20px rgba(168,85,247,0.6),0 0 50px rgba(168,85,247,0.25); animation:lf-kc-tag .4s ease .15s both; }
  .lf-kc-sub { font-family:'Orbitron',monospace; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); letter-spacing:0.22em; text-transform:uppercase; margin-top:8px; animation:lf-kc-tag .4s ease .3s both; }
  .lf-kc-amount { font-family:'Orbitron',monospace; font-size:14px; font-weight:700; color:var(--lf-purple); letter-spacing:0.1em; margin-top:12px; animation:lf-kc-tag .4s ease .45s both; text-shadow:0 0 14px rgba(168,85,247,0.5); }
  .lf-kc-bar-wrap { width:220px; height:2px; background:rgba(255,255,255,0.08); margin-top:24px; overflow:hidden; }
  .lf-kc-bar { height:100%; background:var(--lf-purple); box-shadow:0 0 8px var(--lf-purple); animation:lf-kc-bar 2.2s linear .5s both; }
  .lf-kc-redirecting { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(168,85,247,0.4); letter-spacing:0.18em; margin-top:10px; animation:lf-kc-tag .3s ease .6s both; }

  /* ── Donate Button ── */
  .lf-btn-wrap { position:relative; width:100%; padding-bottom:5px; }
  .lf-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); z-index:1; background:linear-gradient(90deg,#1a2610,#16083a,#1a0640); clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .lf-btn { position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer; font-family:'Black Ops One',cursive; font-size:13px; font-weight:400; letter-spacing:.12em; color:var(--lf-purple); transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-5px); background:linear-gradient(135deg,#2a0a5a 0%,#4a1290 50%,#380e6a 100%); border-top:1px solid rgba(168,85,247,0.28); border-left:1px solid rgba(168,85,247,0.14); box-shadow:inset 0 1px 0 rgba(168,85,247,0.12),0 0 18px rgba(124,58,237,0.4); overflow:hidden; clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .lf-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(168,85,247,0.2),0 0 26px rgba(168,85,247,0.38),0 0 50px rgba(124,58,237,0.22); text-shadow:0 0 14px var(--lf-purple); }
  .lf-btn:active:not(:disabled) { transform:translateY(0) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.5) !important; }
  .lf-btn:disabled { opacity:.35; cursor:not-allowed; }
  .lf-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.1),transparent); transform:skewX(-20deg); transition:left .6s; }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  .lf-hint { font-size:9px; font-weight:600; color:rgba(168,85,247,0.5); margin-top:3px; font-family:'Orbitron',monospace; letter-spacing:0.08em; }

  @keyframes lf-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .18s ease forwards; }

  @keyframes lf-spin-a { to{transform:rotate(360deg);} }
  .lf-spin { width:13px; height:13px; border:1.5px solid rgba(168,85,247,0.3); border-top-color:var(--lf-purple); border-radius:50%; display:inline-block; animation:lf-spin-a .65s linear infinite; }

  @keyframes lf-in { from{opacity:0;transform:scale(0.97) translateY(8px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .lf-in { animation:lf-in .45s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Kill Feed ── */
  .lf-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(20,26,16,0.95); border:1px solid rgba(124,58,237,0.5); border-left:3px solid var(--lf-purple); padding:8px 14px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); animation:lf-kf-in .2s ease forwards; min-width:220px; }
  .lf-kf-err  { border-left-color:var(--lf-violet); }
  .lf-kf-warn { border-left-color:var(--lf-magenta); }
  .lf-kf-icon { font-size:11px; flex-shrink:0; color:var(--lf-purple); font-family:'Orbitron',monospace; }
  .lf-kf-err  .lf-kf-icon { color:var(--lf-violet); }
  .lf-kf-warn .lf-kf-icon { color:var(--lf-magenta); }
  .lf-kf-text { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:var(--lf-text); letter-spacing:0.06em; }
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
      <img src={latifaAvatar} alt="Latifa" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:"3px solid var(--lf-purple)",boxShadow:"0 0 20px rgba(168,85,247,0.6)",marginBottom:8}}/>
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
  const msgClr=msgPct>90?'var(--lf-violet)':msgPct>70?'var(--lf-purple)':'var(--lf-pink-light)';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'lf-tb-gd',nc:'var(--lf-purple)'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'lf-tb-gn',nc:'var(--lf-pink-light)'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'lf-tb-or',nc:'var(--lf-magenta)'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'lf-tb-rd',nc:'var(--lf-violet)'},
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
              <img src={latifaAvatar} alt="Gaming With Latifa" style={{width:58,height:58,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',flexShrink:0,position:'relative',zIndex:1,border:'2px solid rgba(168,85,247,0.7)',boxShadow:'0 0 16px rgba(168,85,247,0.5),0 0 32px rgba(244,114,182,0.2)'}}/>
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
                      <span style={{fontSize:9,fontWeight:700,color:msgClr,textShadow:`0 0 6px ${msgClr}`,fontFamily:'Orbitron,monospace',letterSpacing:'0.08em'}}>{formData.message.length}/{maxMessageLength}</span>
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
                      <span style={{fontSize:11,fontWeight:700,color:'var(--lf-magenta)',textShadow:'0 0 8px var(--lf-magenta)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>HYPERSOUNDS</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="lf-fu lf-sp lf-sp-rd">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🖼️</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--lf-violet)',textShadow:'0 0 8px var(--lf-violet)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>MEDIA DROP</span>
                    </div>
                    <MediaUploader streamerSlug="brigzard" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
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

                <p style={{fontSize:8,fontWeight:600,color:'rgba(255,255,255,0.15)',textAlign:'center',lineHeight:1.6,fontFamily:'Orbitron,monospace',letterSpacing:'0.06em'}}>
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
