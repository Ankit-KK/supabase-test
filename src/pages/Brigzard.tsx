import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
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
    --nv-gold:        #c4a747;
    --nv-gold-dark:   #8a7a3a;
    --nv-scarlet:     #c0392b;
    --nv-scarlet-lt:  #e84040;
    --nv-navy:        #0b1a2e;
    --nv-navy-mid:    #102240;
    --nv-navy-light:  #1a3a6a;
    --nv-steel:       #4a6fa5;
    --nv-steel-lt:    #6a90cc;
    --nv-white:       #d8e4f0;
    --nv-bg:          #060d1a;
    --nv-card:        #0a1628;
    --nv-text:        #c8d8e8;
  }

  * { box-sizing: border-box; }
  .nv-root { font-family: 'Rajdhani', sans-serif; }

  .nv-page {
    width: 100vw; height: 100dvh;
    background: var(--nv-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .nv-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5; }

  .nv-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 65% 50% at 10% 15%, rgba(16,34,64,0.6) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 88% 80%, rgba(192,57,43,0.1) 0%, transparent 55%),
      radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,22,40,0.6) 0%, transparent 70%);
    animation: nv-atm-breathe 6s ease-in-out infinite;
  }
  @keyframes nv-atm-breathe { 0%,100%{opacity:1;} 50%{opacity:0.75;} }

  /* Naval grid — parallax via CSS vars */
  .nv-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: linear-gradient(rgba(196,167,71,1) 1px, transparent 1px), linear-gradient(90deg, rgba(196,167,71,1) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: var(--nv-sx, 0px) var(--nv-sy, 0px);
    transition: background-position 0.1s linear;
    animation: nv-grid-pulse 5s ease-in-out infinite;
  }
  @keyframes nv-grid-pulse { 0%,100%{opacity:0.04;} 50%{opacity:0.07;} }

  .nv-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
  }

  .nv-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  /* ── CARD ── */
  .nv-card {
    width: 420px; background: var(--nv-card); border-radius: 2px;
    border: 1px solid rgba(74,111,165,0.5);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    position: relative;
    animation: nv-card-0 5s ease-in-out infinite;
  }
  @keyframes nv-card-0 {
    0%,100% { box-shadow:0 0 0 1px rgba(196,167,71,0.06), 0 0 30px rgba(16,34,64,0.5), 0 0 70px rgba(192,57,43,0.06), 0 30px 80px rgba(0,0,0,0.7); }
    50%      { box-shadow:0 0 0 1px rgba(196,167,71,0.1), 0 0 40px rgba(16,34,64,0.6), 0 0 80px rgba(192,57,43,0.08), 0 30px 80px rgba(0,0,0,0.7); }
  }
  .nv-card.nv-int-1 { animation:nv-card-1 4s ease-in-out infinite; }
  @keyframes nv-card-1 {
    0%,100% { box-shadow:0 0 0 1px rgba(196,167,71,0.2), 0 0 24px rgba(196,167,71,0.22), 0 0 55px rgba(16,34,64,0.5), 0 30px 80px rgba(0,0,0,0.7); }
    50%      { box-shadow:0 0 0 1px rgba(196,167,71,0.3), 0 0 40px rgba(196,167,71,0.35), 0 0 80px rgba(192,57,43,0.1), 0 30px 80px rgba(0,0,0,0.7); }
  }
  .nv-card.nv-int-2 { animation:nv-card-2 3s ease-in-out infinite; }
  @keyframes nv-card-2 {
    0%,100% { box-shadow:0 0 0 1px rgba(196,167,71,0.38), 0 0 36px rgba(196,167,71,0.38), 0 0 72px rgba(196,167,71,0.12), 0 30px 80px rgba(0,0,0,0.7); }
    50%      { box-shadow:0 0 0 2px rgba(196,167,71,0.55), 0 0 58px rgba(196,167,71,0.55), 0 0 105px rgba(192,57,43,0.2), 0 30px 80px rgba(0,0,0,0.7); }
  }
  .nv-card.nv-int-3 { animation:nv-card-3 2s ease-in-out infinite; border-color:rgba(196,167,71,0.55); }
  @keyframes nv-card-3 {
    0%,100% { box-shadow:0 0 0 1px rgba(196,167,71,0.52), 0 0 52px rgba(196,167,71,0.55), 0 0 95px rgba(196,167,71,0.2), 0 0 135px rgba(192,57,43,0.15), 0 30px 80px rgba(0,0,0,0.7); }
    50%      { box-shadow:0 0 0 2px rgba(232,64,64,0.55), 0 0 75px rgba(196,167,71,0.75), 0 0 130px rgba(196,167,71,0.3), 0 0 190px rgba(192,57,43,0.28), 0 30px 80px rgba(0,0,0,0.7); }
  }

  /* Screen shake */
  .nv-card.nv-shaking { animation: nv-shake 0.35s ease forwards !important; }
  @keyframes nv-shake {
    0%,100%{ transform:translate(0,0); }
    15%    { transform:translate(-5px, 3px); }
    30%    { transform:translate(5px, -3px); }
    45%    { transform:translate(-4px, 2px); }
    60%    { transform:translate(4px, -2px); }
    75%    { transform:translate(-2px, 1px); }
  }

  .nv-card::after {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:100;
    background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.02) 3px,rgba(0,0,0,0.02) 4px);
  }

  /* Brackets */
  .nv-bracket { position:absolute; width:14px; height:14px; z-index:101; pointer-events:none; }
  .nv-bracket-tl { top:5px;left:5px; border-top:1.5px solid var(--nv-gold); border-left:1.5px solid var(--nv-gold); opacity:0.7; }
  .nv-bracket-tr { top:5px;right:28px; border-top:1.5px solid var(--nv-gold); border-right:1.5px solid var(--nv-gold); opacity:0.7; }
  .nv-bracket-bl { bottom:28px;left:5px; border-bottom:1.5px solid var(--nv-gold); border-left:1.5px solid var(--nv-gold); opacity:0.7; }
  .nv-bracket-br { bottom:5px;right:5px; border-bottom:1.5px solid var(--nv-gold); border-right:1.5px solid var(--nv-gold); opacity:0.7; }

  /* ── FULLSCREEN BURST ── */
  .nv-crack-wrap {
    position: fixed; inset: 0; z-index: 99998; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(2px);
    animation: nv-crack-bg 1.8s ease forwards;
  }
  @keyframes nv-crack-bg {
    0%  { opacity:0; }
    12% { opacity:1; }
    70% { opacity:1; }
    100%{ opacity:0; }
  }
  .nv-crack-burst {
    position: absolute;
    width: 340px; height: 340px;
    background: conic-gradient(
      var(--nv-gold) 0deg 14deg, transparent 14deg 28deg,
      var(--nv-scarlet-lt) 28deg 42deg, transparent 42deg 56deg,
      var(--nv-steel-lt) 56deg 70deg, transparent 70deg 84deg,
      var(--nv-gold) 84deg 98deg, transparent 98deg 112deg,
      var(--nv-scarlet) 112deg 126deg, transparent 126deg 140deg,
      var(--nv-gold) 140deg 154deg, transparent 154deg 168deg,
      var(--nv-steel-lt) 168deg 182deg, transparent 182deg 196deg,
      var(--nv-gold) 196deg 210deg, transparent 210deg 224deg,
      var(--nv-scarlet-lt) 224deg 238deg, transparent 238deg 252deg,
      var(--nv-gold) 252deg 266deg, transparent 266deg 280deg,
      var(--nv-steel) 280deg 294deg, transparent 294deg 308deg,
      var(--nv-gold) 308deg 322deg, transparent 322deg 336deg,
      var(--nv-scarlet) 336deg 350deg, transparent 350deg 360deg
    );
    clip-path: polygon(
      50% 50%, 54% 0%, 56% 50%, 100% 46%, 56% 54%,
      52% 100%, 48% 54%, 0% 54%, 44% 48%,
      48% 0%, 50% 50%
    );
    animation: nv-burst-anim 1.8s ease forwards;
    filter: blur(0.5px);
  }
  @keyframes nv-burst-anim {
    0%   { opacity:0; transform:scale(0.15) rotate(-15deg); }
    12%  { opacity:1; transform:scale(1.06) rotate(3deg); }
    50%  { opacity:0.9; transform:scale(1.0) rotate(0deg); }
    100% { opacity:0; transform:scale(1.35) rotate(8deg); }
  }
  .nv-crack-text {
    position: relative; z-index: 2;
    font-family: 'Black Ops One', cursive; font-size: 80px; color: var(--nv-gold);
    letter-spacing: 0.12em;
    text-shadow:
      3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000,
      0 0 30px rgba(196,167,71,1), 0 0 60px rgba(196,167,71,0.7),
      0 0 100px rgba(192,57,43,0.4);
    animation: nv-crack-text 1.8s ease forwards;
  }
  @keyframes nv-crack-text {
    0%   { opacity:0; transform:scale(0.2) rotate(-10deg); }
    15%  { opacity:1; transform:scale(1.14) rotate(2deg); }
    45%  { opacity:1; transform:scale(1.02) rotate(0deg); }
    75%  { opacity:1; transform:scale(1.0) rotate(0deg); }
    100% { opacity:0; transform:scale(1.1) rotate(4deg); }
  }

  /* ── HERO ── */
  .nv-hero {
    position:relative; padding:18px 22px 16px;
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    overflow:hidden;
    background:linear-gradient(135deg,rgba(16,34,64,0.6) 0%,rgba(10,22,40,0.4) 60%,transparent 100%);
    border-bottom:1px solid rgba(74,111,165,0.35);
  }
  .nv-hero::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--nv-navy-light),var(--nv-gold),var(--nv-scarlet),var(--nv-gold),var(--nv-navy-light));
    background-size:200% 100%; animation:nv-shift 4s linear infinite;
    box-shadow:0 0 8px var(--nv-gold), 0 0 20px rgba(196,167,71,0.3);
  }
  .nv-hero::after {
    content:''; position:absolute; bottom:0; right:0;
    width:0; height:0; border-style:solid; border-width:0 0 20px 20px;
    border-color:transparent transparent rgba(196,167,71,0.18) transparent;
  }
  @keyframes nv-shift { 0%{background-position:0%} 100%{background-position:200%} }
  .nv-hero-blob {
    position:absolute; top:-40px; right:-40px; width:160px; height:160px;
    border-radius:50%; background:radial-gradient(circle,rgba(192,57,43,0.2) 0%,transparent 65%);
    pointer-events:none; animation:nv-blob 10s ease-in-out infinite;
  }
  @keyframes nv-blob { 0%,100%{transform:scale(1);opacity:0.8;} 50%{transform:scale(1.2);opacity:1;} }

  .nv-operator-tag { display:flex; flex-direction:column; position:relative; z-index:1; }
  .nv-tag-prefix { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(196,167,71,0.5); letter-spacing:0.25em; text-transform:uppercase; margin-bottom:3px; }

  @keyframes nv-glitch {
    0%,90%,100%{transform:none;text-shadow:none;clip-path:none;opacity:1;}
    91%{transform:translateX(-3px);text-shadow:3px 0 var(--nv-gold),-3px 0 var(--nv-scarlet-lt);}
    92%{transform:translateX(3px) skewX(-4deg);text-shadow:-3px 0 var(--nv-scarlet-lt),3px 0 var(--nv-steel-lt);clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);}
    93%{transform:translateX(-2px);text-shadow:2px 0 var(--nv-steel-lt),-2px 0 var(--nv-gold);clip-path:none;}
    94%{transform:translateX(2px) skewX(3deg);text-shadow:none;opacity:0.8;}
    95%{transform:none;opacity:1;}
    96%{transform:translateX(-1px);text-shadow:1px 0 var(--nv-scarlet);clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%);}
    97%{transform:none;clip-path:none;}
  }
  .nv-name {
    font-family:'Black Ops One',cursive; font-size:30px; font-weight:400; color:#fff;
    line-height:1; letter-spacing:0.08em; position:relative; z-index:1;
    animation:nv-glitch 9s infinite, nv-name-glow 6s ease-in-out infinite;
  }
  @keyframes nv-name-glow {
    0%,100%{ text-shadow:0 0 12px rgba(196,167,71,0.6), 0 0 30px rgba(196,167,71,0.25); }
    33%    { text-shadow:0 0 12px rgba(232,64,64,0.6),  0 0 30px rgba(192,57,43,0.25); }
    66%    { text-shadow:0 0 12px rgba(74,111,165,0.65),0 0 30px rgba(106,144,204,0.25); }
  }

  /* ── Greeting tag ── */
  .nv-greeting {
    display:inline-flex; align-items:center; gap:5px; margin-top:5px;
    background:rgba(196,167,71,0.08); border:1px solid rgba(196,167,71,0.45);
    clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
    padding:2px 10px;
    animation:nv-greet-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow:0 0 10px rgba(196,167,71,0.18), inset 0 0 6px rgba(196,167,71,0.05);
  }
  @keyframes nv-greet-in { from{opacity:0;transform:translateX(-10px) scale(0.88);} to{opacity:1;transform:none;} }
  .nv-greeting-text {
    font-family:'Orbitron',monospace; font-size:8px; font-weight:700;
    color:var(--nv-gold); letter-spacing:0.18em; text-transform:uppercase;
    text-shadow:0 0 8px rgba(196,167,71,0.6);
  }

  /* ── Speech bubble ── */
  .nv-hero-sub-bubble {
    position:relative; display:inline-block; margin-top:6px;
    background:rgba(11,26,46,0.92); border:1px solid rgba(196,167,71,0.4);
    clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
    padding:3px 10px;
    font-size:9px; font-weight:700; color:rgba(196,167,71,0.65);
    letter-spacing:0.16em; text-transform:uppercase; font-family:'Orbitron',monospace;
    animation:nv-bubble-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both 0.3s,
              nv-bubble-glow 4s ease-in-out infinite 0.8s;
  }
  .nv-hero-sub-bubble::before {
    content:''; position:absolute; left:-8px; top:50%; transform:translateY(-50%);
    border-top:5px solid transparent; border-bottom:5px solid transparent; border-right:8px solid rgba(196,167,71,0.4);
  }
  .nv-hero-sub-bubble::after {
    content:''; position:absolute; left:-6px; top:50%; transform:translateY(-50%);
    border-top:4px solid transparent; border-bottom:4px solid transparent; border-right:6px solid rgba(11,26,46,0.92);
  }
  @keyframes nv-bubble-pop {
    0%  {opacity:0;transform:scale(0.4) translateX(-8px);}
    60% {transform:scale(1.06) translateX(1px);}
    100%{opacity:1;transform:scale(1) translateX(0);}
  }
  @keyframes nv-bubble-glow {
    0%,100%{box-shadow:0 0 8px rgba(196,167,71,0.12), inset 0 0 5px rgba(196,167,71,0.04);}
    50%    {box-shadow:0 0 18px rgba(196,167,71,0.28), inset 0 0 10px rgba(196,167,71,0.1);}
  }

  /* ── Live badge ── */
  @keyframes nv-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes nv-live-glow {
    0%,100%{box-shadow:0 0 6px rgba(192,57,43,0.35);}
    50%    {box-shadow:0 0 14px rgba(232,64,64,0.65), inset 0 0 6px rgba(232,64,64,0.08);}
  }
  .nv-live {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(192,57,43,0.15); border:1px solid rgba(192,57,43,0.5);
    padding:5px 11px; flex-shrink:0; position:relative; z-index:1;
    clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    animation:nv-live-glow 2s ease-in-out infinite;
  }
  .nv-live-dot { width:5px; height:5px; border-radius:50%; background:var(--nv-scarlet-lt); animation:nv-pulse 1.2s ease-in-out infinite; box-shadow:0 0 6px var(--nv-scarlet-lt); }
  .nv-live-text { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:var(--nv-scarlet-lt); letter-spacing:0.18em; text-shadow:0 0 8px var(--nv-scarlet-lt); }

  /* ── Naval Command Bar ── */
  .nv-loadout {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 18px; border-bottom:1px solid rgba(74,111,165,0.2);
    background:rgba(16,34,64,0.4); position:relative; z-index:10;
  }
  .nv-rank-info { display:flex; align-items:center; gap:8px; }
  .nv-rank-badge { font-family:'Black Ops One',cursive; font-size:9px; color:var(--nv-navy); background:var(--nv-gold); padding:2px 7px; letter-spacing:0.06em; clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); box-shadow:0 0 8px rgba(196,167,71,0.4); white-space:nowrap; }
  .nv-rank-name { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:rgba(196,167,71,0.7); letter-spacing:0.1em; }
  .nv-xp-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
  .nv-xp-label { font-family:'Orbitron',monospace; font-size:7px; color:rgba(255,255,255,0.3); letter-spacing:0.15em; }
  .nv-xp-bar { width:90px; height:3px; background:rgba(255,255,255,0.08); overflow:hidden; }
  .nv-xp-fill { height:100%; background:linear-gradient(90deg,var(--nv-steel),var(--nv-gold)); width:74%; box-shadow:0 0 6px var(--nv-gold); }

  /* ── Body ── */
  .nv-body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .nv-lbl { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(196,167,71,0.6); }

  /* ── Inputs ── */
  .nv-iw { position:relative; }
  .nv-iw::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:var(--nv-gold); transform:scaleX(0); transform-origin:left; transition:transform 0.2s ease; opacity:0.6; }
  .nv-iw:focus-within::after { transform:scaleX(1); }
  .nv-iw::before { content:''; position:absolute; top:0; left:-60%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(196,167,71,0.1),transparent); pointer-events:none; z-index:2; }
  .nv-iw:focus-within::before { animation:nv-scan 0.5s ease forwards; }
  @keyframes nv-scan { from{left:-60%;} to{left:110%;} }
  .nv-iw input {
    width:100% !important; background:rgba(16,34,64,0.35) !important;
    border:1px solid rgba(74,111,165,0.35) !important; border-radius:1px !important;
    color:#c8d8e8 !important; font-family:'Rajdhani',sans-serif !important;
    font-size:15px !important; font-weight:600 !important; padding:8px 12px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--nv-gold); letter-spacing:0.05em !important;
  }
  .nv-iw input:focus { border-color:var(--nv-gold) !important; background:rgba(196,167,71,0.06) !important; box-shadow:0 0 0 1px rgba(196,167,71,0.12), 0 0 16px rgba(196,167,71,0.15) !important; }
  .nv-iw input::placeholder { color:rgba(255,255,255,0.22) !important; }
  .nv-iw input:disabled,.nv-iw input[readonly] { opacity:.35 !important; cursor:not-allowed !important; }
  .nv-ta {
    width:100%; background:rgba(16,34,64,0.35); border:1px solid rgba(74,111,165,0.35);
    border-radius:1px; color:#c8d8e8; font-family:'Rajdhani',sans-serif;
    font-size:14px; font-weight:600; padding:8px 12px; resize:none; outline:none;
    line-height:1.5; caret-color:var(--nv-gold); transition:all .2s; letter-spacing:0.04em;
  }
  .nv-ta:focus { border-color:var(--nv-gold); background:rgba(196,167,71,0.06); box-shadow:0 0 0 1px rgba(196,167,71,0.1), 0 0 16px rgba(196,167,71,0.12); }
  .nv-ta::placeholder { color:rgba(255,255,255,0.22); }
  .nv-cbar { height:2px; margin-top:5px; background:rgba(255,255,255,0.08); overflow:hidden; }
  .nv-cbar-fill { height:100%; transition:width .12s,background .2s; }

  /* ── TYPE BUTTONS ── */
  .nv-types { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .nv-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; display:block; width:100%; }
  .nv-tb-face {
    position:relative; z-index:2; padding:10px 4px 9px; text-align:center;
    transition:transform .1s ease, box-shadow .15s ease, filter .15s ease; transform:translateY(-4px);
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
  }
  .nv-tb::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 2px); z-index:1;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
  }
  .nv-tb:active .nv-tb-face { transform:translateY(0) !important; }
  .nv-tb:hover:not(.nv-on) .nv-tb-face { filter:brightness(1.18); }
  .nv-tb.nv-cooling .nv-tb-face { animation:nv-afterburn 0.65s ease forwards; }
  @keyframes nv-afterburn { 0%{box-shadow:0 0 18px rgba(196,167,71,0.7), 0 0 36px rgba(196,167,71,0.4);} 100%{box-shadow:none;} }

  .nv-tb-gd .nv-tb-face { background:linear-gradient(160deg,rgba(196,167,71,0.18),rgba(100,80,20,0.5)); border:1px solid rgba(196,167,71,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1); }
  .nv-tb-gd::after { background:#3a2e0c; border:1px solid rgba(196,167,71,0.25); }
  .nv-tb-gd.nv-on .nv-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(196,167,71,0.32),rgba(140,110,30,0.55)); border-color:var(--nv-gold); box-shadow:0 0 16px rgba(196,167,71,0.8), 0 0 32px rgba(196,167,71,0.45), 0 0 55px rgba(196,167,71,0.2), inset 0 0 10px rgba(196,167,71,0.08); }

  .nv-tb-st .nv-tb-face { background:linear-gradient(160deg,rgba(74,111,165,0.2),rgba(20,40,80,0.55)); border:1px solid rgba(74,111,165,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
  .nv-tb-st::after { background:#0d1e40; border:1px solid rgba(74,111,165,0.28); }
  .nv-tb-st.nv-on .nv-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(74,111,165,0.34),rgba(40,70,130,0.6)); border-color:var(--nv-steel-lt); box-shadow:0 0 16px rgba(106,144,204,0.8), 0 0 32px rgba(74,111,165,0.45), 0 0 55px rgba(74,111,165,0.2), inset 0 0 10px rgba(74,111,165,0.08); }

  .nv-tb-sc .nv-tb-face { background:linear-gradient(160deg,rgba(192,57,43,0.18),rgba(100,10,10,0.5)); border:1px solid rgba(192,57,43,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
  .nv-tb-sc::after { background:#2e0808; border:1px solid rgba(192,57,43,0.28); }
  .nv-tb-sc.nv-on .nv-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(192,57,43,0.32),rgba(160,30,20,0.55)); border-color:var(--nv-scarlet-lt); box-shadow:0 0 16px rgba(232,64,64,0.8), 0 0 32px rgba(192,57,43,0.45), 0 0 55px rgba(192,57,43,0.2), inset 0 0 10px rgba(192,57,43,0.08); }

  .nv-tb-nv .nv-tb-face { background:linear-gradient(160deg,rgba(26,58,106,0.25),rgba(10,22,50,0.55)); border:1px solid rgba(26,58,106,0.6); box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
  .nv-tb-nv::after { background:#080e22; border:1px solid rgba(26,58,106,0.3); }
  .nv-tb-nv.nv-on .nv-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(26,58,106,0.38),rgba(20,50,100,0.6)); border-color:var(--nv-navy-light); box-shadow:0 0 16px rgba(26,58,106,0.9), 0 0 32px rgba(26,58,106,0.45), 0 0 55px rgba(26,58,106,0.2), inset 0 0 10px rgba(26,58,106,0.1); }

  .nv-tb-emoji { font-size:17px; display:block; line-height:1; }
  .nv-tb-name { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s,text-shadow .15s; }
  .nv-tb-min { font-size:7px; font-weight:600; color:rgba(196,167,71,0.6); display:block; margin-top:2px; font-family:'Rajdhani',sans-serif; }

  .nv-amt { display:flex; gap:7px; }
  .nv-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(16,34,64,0.35) !important; border:1px solid rgba(74,111,165,0.35) !important;
    border-radius:1px !important; color:#c8d8e8 !important; font-family:'Rajdhani',sans-serif !important;
    font-size:13px !important; font-weight:700 !important; padding:0 10px !important;
    min-width:90px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0; letter-spacing:0.05em !important;
  }
  .nv-cur:hover { border-color:var(--nv-gold) !important; box-shadow:0 0 10px rgba(196,167,71,0.2) !important; }

  /* ── Electricity divider ── */
  .nv-div { height:1px; background:rgba(74,111,165,0.2); position:relative; overflow:visible; }
  .nv-div::before { content:'⚓'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:8px; color:rgba(196,167,71,0.5); z-index:2; }
  .nv-div::after {
    content:''; position:absolute; top:-1px; left:0; width:35%; height:3px;
    background:linear-gradient(90deg,transparent,var(--nv-steel),var(--nv-gold),var(--nv-scarlet-lt),transparent);
    animation:nv-elec 2.2s ease-in-out infinite;
    box-shadow:0 0 6px var(--nv-gold), 0 0 14px rgba(196,167,71,0.5);
  }
  @keyframes nv-elec { 0%{left:-35%;opacity:0;} 10%{opacity:1;} 90%{opacity:1;} 100%{left:100%;opacity:0;} }

  .nv-sp { padding:10px 12px; position:relative; }
  .nv-sp::before,.nv-sp::after { content:''; position:absolute; width:10px; height:10px; pointer-events:none; }
  .nv-sp::before { top:0;left:0; border-top:1px solid var(--nv-gold); border-left:1px solid var(--nv-gold); opacity:0.4; }
  .nv-sp::after  { bottom:0;right:0; border-bottom:1px solid var(--nv-gold); border-right:1px solid var(--nv-gold); opacity:0.4; }
  .nv-sp-st { background:rgba(74,111,165,0.1); border:1px solid rgba(74,111,165,0.35); box-shadow:0 0 12px rgba(74,111,165,0.1); }
  .nv-sp-sc { background:rgba(192,57,43,0.07); border:1px solid rgba(192,57,43,0.3); box-shadow:0 0 12px rgba(192,57,43,0.08); }
  .nv-sp-nv { background:rgba(26,58,106,0.12); border:1px solid rgba(26,58,106,0.45); box-shadow:0 0 12px rgba(26,58,106,0.1); }

  /* ── Rank Tiers ── */
  .nv-tiers { display:flex; gap:5px; }
  .nv-tier { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:7px 4px; border:1px solid rgba(74,111,165,0.2); background:rgba(16,34,64,0.2); clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px)); transition:all .2s; position:relative; overflow:hidden; }
  .nv-tier.nv-tier-active { border-color:var(--nv-gold); background:rgba(196,167,71,0.08); box-shadow:0 0 12px rgba(196,167,71,0.18); }
  .nv-tier.nv-tier-active::before { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(196,167,71,0.07),transparent); animation:nv-sweep 2.5s linear infinite; }
  .nv-tier-done { border-color:rgba(74,111,165,0.45); background:rgba(16,34,64,0.3); }
  @keyframes nv-sweep { to{left:160%;} }
  .nv-tier-emoji { font-size:14px; line-height:1; }
  .nv-tier-rank { font-family:'Black Ops One',cursive; font-size:6px; color:rgba(196,167,71,0.4); letter-spacing:0.06em; text-align:center; line-height:1.2; }
  .nv-tier.nv-tier-active .nv-tier-rank { color:var(--nv-gold); text-shadow:0 0 8px rgba(196,167,71,0.5); }
  .nv-tier.nv-tier-done .nv-tier-rank { color:var(--nv-steel-lt); }
  .nv-tier-amt { font-family:'Orbitron',monospace; font-size:7px; color:rgba(255,255,255,0.2); letter-spacing:0.04em; }
  .nv-tier.nv-tier-active .nv-tier-amt { color:rgba(196,167,71,0.6); }
  .nv-tier.nv-tier-done .nv-tier-amt { color:rgba(106,144,204,0.7); }

  /* ── Reconnecting ── */
  @keyframes nv-rc-blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .nv-reconnecting { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99998; pointer-events:none; display:flex; flex-direction:column; align-items:center; gap:6px; }
  .nv-rc-text { font-family:'Orbitron',monospace; font-size:11px; font-weight:700; color:var(--nv-gold); letter-spacing:0.2em; animation:nv-rc-blink 1s ease-in-out infinite; text-shadow:0 0 12px var(--nv-gold); }
  .nv-rc-dots { display:flex; gap:4px; }
  .nv-rc-dot { width:4px; height:4px; border-radius:50%; background:var(--nv-gold); animation:nv-rc-blink 1s ease-in-out infinite; }
  .nv-rc-dot:nth-child(2){animation-delay:.2s;} .nv-rc-dot:nth-child(3){animation-delay:.4s;}

  /* ── Mission Complete Overlay ── */
  @keyframes nv-kc-in  { from{opacity:0;transform:scale(1.06);} to{opacity:1;transform:scale(1);} }
  @keyframes nv-kc-out { from{opacity:1;transform:scale(1);} to{opacity:0;transform:scale(0.96);} }
  @keyframes nv-kc-bar { from{width:0;} to{width:100%;} }
  @keyframes nv-kc-tag { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
  @keyframes nv-kc-scan { 0%{top:-10%;} 100%{top:110%;} }
  .nv-kc-overlay { position:fixed; inset:0; z-index:99999; background:rgba(4,8,18,0.96); display:flex; flex-direction:column; align-items:center; justify-content:center; animation:nv-kc-in .3s ease forwards; }
  .nv-kc-overlay.nv-kc-exit { animation:nv-kc-out .4s ease forwards; }
  .nv-kc-scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(196,167,71,0.5),transparent); animation:nv-kc-scan 1.8s linear infinite; pointer-events:none; }
  .nv-kc-icon { font-size:54px; margin-bottom:14px; filter:drop-shadow(0 0 20px rgba(196,167,71,0.7)); }
  .nv-kc-tag { font-family:'Black Ops One',cursive; font-size:38px; color:var(--nv-gold); letter-spacing:0.12em; text-shadow:0 0 20px rgba(196,167,71,0.6),0 0 50px rgba(196,167,71,0.25); animation:nv-kc-tag .4s ease .15s both; }
  .nv-kc-sub { font-family:'Orbitron',monospace; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); letter-spacing:0.22em; text-transform:uppercase; margin-top:8px; animation:nv-kc-tag .4s ease .3s both; }
  .nv-kc-amount { font-family:'Orbitron',monospace; font-size:14px; font-weight:700; color:var(--nv-gold); letter-spacing:0.1em; margin-top:12px; animation:nv-kc-tag .4s ease .45s both; text-shadow:0 0 14px rgba(196,167,71,0.5); }
  .nv-kc-bar-wrap { width:220px; height:2px; background:rgba(255,255,255,0.08); margin-top:24px; overflow:hidden; }
  .nv-kc-bar { height:100%; background:linear-gradient(90deg,var(--nv-steel),var(--nv-gold)); box-shadow:0 0 8px var(--nv-gold); animation:nv-kc-bar 2.2s linear .5s both; }
  .nv-kc-redirecting { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(196,167,71,0.4); letter-spacing:0.18em; margin-top:10px; animation:nv-kc-tag .3s ease .6s both; }

  /* ── Deploy button — pulses at rest ── */
  .nv-btn-wrap { position:relative; width:100%; padding-bottom:5px; }
  .nv-btn-wrap::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); z-index:1;
    background:linear-gradient(90deg,#040c1e,#081428,#040a18);
    clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  }
  .nv-btn {
    position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer;
    font-family:'Black Ops One',cursive; font-size:13px; font-weight:400;
    letter-spacing:.12em; color:var(--nv-gold);
    transition:transform .1s ease; transform:translateY(-5px);
    background:linear-gradient(135deg,#0a1e3a 0%,#0e2a50 50%,#0c2240 100%);
    border-top:1px solid rgba(196,167,71,0.3); border-left:1px solid rgba(196,167,71,0.15);
    overflow:hidden;
    clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
    animation:nv-btn-pulse 3s ease-in-out infinite;
  }
  @keyframes nv-btn-pulse {
    0%,100%{ box-shadow:inset 0 1px 0 rgba(196,167,71,0.12), 0 0 16px rgba(196,167,71,0.2), 0 0 35px rgba(16,34,64,0.4); text-shadow:none; }
    50%    { box-shadow:inset 0 1px 0 rgba(196,167,71,0.22), 0 0 28px rgba(196,167,71,0.4), 0 0 55px rgba(16,34,64,0.5); text-shadow:0 0 12px var(--nv-gold); }
  }
  .nv-btn:hover:not(:disabled) { animation:none; box-shadow:inset 0 1px 0 rgba(196,167,71,0.22), 0 0 32px rgba(196,167,71,0.55), 0 0 60px rgba(16,34,64,0.4); text-shadow:0 0 16px var(--nv-gold); }
  .nv-btn:active:not(:disabled) { transform:translateY(0) !important; animation:none; box-shadow:inset 0 2px 8px rgba(0,0,0,0.6) !important; }
  .nv-btn:disabled { opacity:.35; cursor:not-allowed; animation:none; }
  .nv-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(196,167,71,0.08),transparent); transform:skewX(-20deg); transition:left .6s; }
  .nv-btn:hover:not(:disabled)::before { left:160%; }

  .nv-hint { font-size:9px; font-weight:600; color:rgba(196,167,71,0.5); margin-top:3px; font-family:'Orbitron',monospace; letter-spacing:0.08em; }

  @keyframes nv-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .nv-fu { animation:nv-fu .18s ease forwards; }
  @keyframes nv-spin-a { to{transform:rotate(360deg);} }
  .nv-spin { width:13px; height:13px; border:1.5px solid rgba(196,167,71,0.25); border-top-color:var(--nv-gold); border-radius:50%; display:inline-block; animation:nv-spin-a .65s linear infinite; }
  @keyframes nv-in { from{opacity:0;transform:scale(0.97) translateY(8px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .nv-in { animation:nv-in .45s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Kill Feed ── */
  .nv-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes nv-kf-in { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }
  .nv-kf { display:flex; align-items:center; gap:8px; background:rgba(8,16,30,0.95); border:1px solid rgba(74,111,165,0.4); border-left:3px solid var(--nv-gold); padding:8px 14px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); animation:nv-kf-in .2s ease forwards; min-width:220px; }
  .nv-kf-err  { border-left-color:var(--nv-scarlet-lt); }
  .nv-kf-warn { border-left-color:var(--nv-scarlet); }
  .nv-kf-icon { font-size:11px; flex-shrink:0; color:var(--nv-gold); font-family:'Orbitron',monospace; }
  .nv-kf-err  .nv-kf-icon { color:var(--nv-scarlet-lt); }
  .nv-kf-warn .nv-kf-icon { color:var(--nv-scarlet); }
  .nv-kf-text { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:var(--nv-text); letter-spacing:0.06em; }
`;

/* ── Ocean Canvas ── */
const OceanCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    type P={x:number;y:number;r:number;vx:number;vy:number;alpha:number;da:number};
    const ps:P[]=[];
    const spawn=()=>ps.push({x:Math.random()*canvas.width,y:canvas.height+20,r:30+Math.random()*60,vx:(Math.random()-0.5)*0.25,vy:-(0.08+Math.random()*0.18),alpha:0.03+Math.random()*0.06,da:-(0.00006+Math.random()*0.00012)});
    for(let i=0;i<18;i++){spawn();ps[i].y=Math.random()*canvas.height;}
    let frame:number;
    const tick=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if(Math.random()<0.04) spawn();
      for(let i=ps.length-1;i>=0;i--){
        const p=ps[i];p.x+=p.vx;p.y+=p.vy;p.alpha+=p.da;
        if(p.alpha<=0||p.y<-p.r){ps.splice(i,1);continue;}
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        g.addColorStop(0,`rgba(30,50,90,${p.alpha})`);g.addColorStop(1,`rgba(30,50,90,0)`);
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      }
      frame=requestAnimationFrame(tick);
    };
    tick();
    const onResize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    window.addEventListener("resize",onResize);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",onResize);};
  },[]);
  return <canvas ref={canvasRef} className="nv-canvas"/>;
};

/* ── Mission Complete ── */
const MissionCompleteOverlay:React.FC<{amount:string;currency:string;onDone:()=>void}>=({amount,currency,onDone})=>{
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const t=setTimeout(()=>{ref.current?.classList.add("nv-kc-exit");setTimeout(onDone,400);},2800);return()=>clearTimeout(t);},[onDone]);
  return(
    <div ref={ref} className="nv-kc-overlay">
      <div className="nv-kc-scanline"/>
      <div className="nv-kc-icon">⚓</div>
      <div className="nv-kc-tag">Mission Complete</div>
      <div className="nv-kc-sub">Support deployed successfully</div>
      <div className="nv-kc-amount">{currency}{amount} CREDITS DEPLOYED</div>
      <div className="nv-kc-bar-wrap"><div className="nv-kc-bar"/></div>
      <div className="nv-kc-redirecting">▸ Redirecting to debrief...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg={id:number;text:string;icon:string;variant:"default"|"err"|"warn"};
let kfId=0;
const useKillFeed=()=>{
  const[msgs,setMsgs]=useState<KFMsg[]>([]);
  const push=useCallback((text:string,icon="✦",variant:KFMsg["variant"]="default")=>{
    const id=++kfId;setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)),3200);
  },[]);
  return{msgs,push};
};

/* ── Audio ── */
const playClick  =()=>{try{const c=new(window.AudioContext||(window as any).webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.setValueAtTime(880,c.currentTime);o.frequency.exponentialRampToValueAtTime(220,c.currentTime+0.06);g.gain.setValueAtTime(0.07,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08);o.start();o.stop(c.currentTime+0.08);}catch{}};
const playConfirm=()=>{try{const c=new(window.AudioContext||(window as any).webkitAudioContext)();[440,550,660].forEach((f,i)=>{const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;const t=c.currentTime+i*0.07;g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);});}catch{}};
const playError  =()=>{try{const c=new(window.AudioContext||(window as any).webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sawtooth";o.frequency.setValueAtTime(200,c.currentTime);o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15);g.gain.setValueAtTime(0.06,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15);o.start();o.stop(c.currentTime+0.15);}catch{}};

const TIERS=[
  {min:0,   rank:"RECRUIT", emoji:"🪖"},
  {min:100, rank:"ENSIGN",  emoji:"⚓"},
  {min:300, rank:"CAPTAIN", emoji:"🎖️"},
  {min:500, rank:"ADMIRAL", emoji:"⭐"},
];

/* ── Main ── */
const Brigzard=()=>{
  const navigate=useNavigate();
  const cardRef=useRef<HTMLDivElement>(null);
  const wrapRef=useRef<HTMLDivElement>(null);
  const gridRef=useRef<HTMLDivElement>(null);
  const coolingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const{msgs,push}=useKillFeed();

  const[formData,setFormData]                    =useState({name:"",amount:"",message:""});
  const[selectedCurrency,setSelectedCurrency]    =useState("INR");
  const[currencyOpen,setCurrencyOpen]            =useState(false);
  const[donationType,setDonationType]            =useState<"text"|"voice"|"hypersound"|"media">("text");
  const[coolingType,setCoolingType]              =useState<string|null>(null);
  const[selectedHypersound,setSelectedHypersound]=useState<string|null>(null);
  const[mediaUrl,setMediaUrl]                    =useState<string|null>(null);
  const[mediaType,setMediaType]                  =useState<string|null>(null);
  const[razorpayLoaded,setRazorpayLoaded]        =useState(false);
  const[isProcessingPayment,setIsProcessingPayment]=useState(false);
  const[showMissionComplete,setShowMissionComplete]=useState(false);
  const[showReconnecting,setShowReconnecting]    =useState(false);
  const[redirectUrl,setRedirectUrl]              =useState("");
  const[isCracking,setIsCracking]               =useState(false);
  const[isShaking,setIsShaking]                 =useState(false);

  const{pricing}     =useStreamerPricing("brigzard",selectedCurrency);
  const currencySymbol=getCurrencySymbol(selectedCurrency);
  const currentAmount =parseFloat(formData.amount)||0;
  const maxMessageLength=getMaxMessageLength(pricing.messageCharTiers,currentAmount);
  const activeTierIdx=TIERS.reduce((best,tier,i)=>currentAmount>=tier.min?i:best,0);

  const intensityLevel=currentAmount>=500?3:currentAmount>=300?2:currentAmount>=100?1:0;
  const showGreeting=formData.name.trim().length>=2;

  const getVoiceDuration=(amount:number)=>{
    if(selectedCurrency==="INR"){if(amount>=500)return 15;if(amount>=300)return 12;return 8;}
    if(amount>=6)return 15;if(amount>=4)return 12;return 8;
  };
  const voiceRecorder=useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale=useCallback(()=>{
    const wrap=wrapRef.current;const card=cardRef.current;if(!wrap||!card)return;
    const scaleW=Math.min(1,(window.innerWidth-32)/420);
    const scaleH=card.scrollHeight>0?Math.min(1,(window.innerHeight-48)/card.scrollHeight):1;
    const scale=Math.min(scaleW,scaleH);
    wrap.style.transform=`scale(${scale})`;wrap.style.height=`${card.scrollHeight*scale}px`;
  },[]);

  useEffect(()=>{const t=setTimeout(applyScale,80);window.addEventListener("resize",applyScale);return()=>{clearTimeout(t);window.removeEventListener("resize",applyScale);};},[applyScale]);
  useEffect(()=>{const t=setTimeout(applyScale,60);return()=>clearTimeout(t);},[donationType,applyScale]);

  // Scroll parallax on grid
  useEffect(()=>{
    const onScroll=()=>{
      const el=gridRef.current;if(!el)return;
      el.style.setProperty("--nv-sx",`${window.scrollX*0.3}px`);
      el.style.setProperty("--nv-sy",`${window.scrollY*0.3}px`);
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(()=>{
    const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed to load","✖","err");
    document.body.appendChild(s);
    return()=>{if(document.body.contains(s))document.body.removeChild(s);};
  },[]);

  const handleInputChange=(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
    const{name,value}=e.target;setFormData(prev=>({...prev,[name]:value}));
  };

  const handleDonationTypeChange=(value:"text"|"voice"|"hypersound"|"media")=>{
    playClick();
    if(coolingTimer.current)clearTimeout(coolingTimer.current);
    setCoolingType(donationType);
    coolingTimer.current=setTimeout(()=>setCoolingType(null),700);
    setDonationType(value);
    const amount=value==="voice"?pricing.minVoice:value==="hypersound"?pricing.minHypersound:value==="media"?pricing.minMedia:pricing.minText;
    setFormData({name:formData.name,amount:String(amount),message:""});
    setSelectedHypersound(null);setMediaUrl(null);setMediaType(null);
  };

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!razorpayLoaded||!(window as any).Razorpay){playError();push("Payment system still loading","⚠","warn");return;}
    const amount=Number(formData.amount);
    if(!formData.name){playError();push("Operator callsign required","✖","err");return;}
    if(!amount||amount<=0){playError();push("Enter a valid amount","✖","err");return;}
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if(amount<min){playError();push(`Min for ${donationType}: ${currencySymbol}${min}`,"✖","err");return;}
    if(donationType==="voice"&&!voiceRecorder.audioBlob){playError();push("Record voice comms first","⚠","warn");return;}
    if(donationType==="hypersound"&&!selectedHypersound){playError();push("Select a sound","⚠","warn");return;}
    if(donationType==="media"&&!mediaUrl){playError();push("Upload a media file","⚠","warn");return;}

    // Screen shake then fullscreen burst
    setIsShaking(true);
    setTimeout(()=>setIsShaking(false),380);
    setIsCracking(true);
    setTimeout(()=>setIsCracking(false),1900);
    setTimeout(()=>processPayment(),400);
  };

  const processPayment=async()=>{
    setIsProcessingPayment(true);
    push("Initiating deployment...","◈","default");
    const reconnectTimer=setTimeout(()=>setShowReconnecting(true),4000);
    try{
      let voiceMessageUrl:string|null=null;
      if(donationType==="voice"&&voiceRecorder.audioBlob){
        const base64=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve((r.result as string).split(",")[1]);r.onerror=reject;r.readAsDataURL(voiceRecorder.audioBlob!);});
        const{data,error}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:base64,streamerSlug:"brigzard"}});
        if(error)throw error;
        voiceMessageUrl=data.voice_message_url;
      }
      const{data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{streamer_slug:"brigzard",name:formData.name,amount:Number(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl,hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null,mediaType,currency:selectedCurrency}
      });
      if(error){
        let msg="Payment failed";
        if(error instanceof FunctionsHttpError){try{const b=await error.context.json();msg=b?.error||msg;}catch{}}
        throw new Error(msg);
      }
      if(data?.error)throw new Error(data.error);
      clearTimeout(reconnectTimer);setShowReconnecting(false);
      new(window as any).Razorpay({
        key:data.razorpay_key_id,amount:data.amount,currency:data.currency,
        order_id:data.razorpay_order_id,name:"BRIGZARD",description:"Support BRIGZARD",
        handler:()=>{playConfirm();setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);setShowMissionComplete(true);},
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#102240"},
      }).open();
    }catch(err:any){
      clearTimeout(reconnectTimer);setShowReconnecting(false);
      playError();push(err?.message||"Payment failed. Try again.","✖","err");
    }finally{setIsProcessingPayment(false);}
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?"var(--nv-scarlet-lt)":msgPct>70?"var(--nv-gold)":"var(--nv-steel-lt)";

  const TYPES=[
    {key:"text"       as const,emoji:"💬",label:"Text",  min:pricing.minText,       tc:"nv-tb-gd",nc:"var(--nv-gold)"},
    {key:"voice"      as const,emoji:"🎤",label:"Voice", min:pricing.minVoice,      tc:"nv-tb-st",nc:"var(--nv-steel-lt)"},
    {key:"hypersound" as const,emoji:"🔊",label:"Sound", min:pricing.minHypersound, tc:"nv-tb-sc",nc:"var(--nv-scarlet-lt)"},
    {key:"media"      as const,emoji:"🖼️",label:"Media", min:pricing.minMedia,      tc:"nv-tb-nv",nc:"var(--nv-navy-light)"},
  ];

  return(
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <OceanCanvas/>

      {showMissionComplete&&(
        <MissionCompleteOverlay amount={formData.amount} currency={currencySymbol} onDone={()=>navigate(redirectUrl)}/>
      )}
      {showReconnecting&&(
        <div className="nv-reconnecting">
          <div className="nv-rc-text">RECONNECTING</div>
          <div className="nv-rc-dots"><div className="nv-rc-dot"/><div className="nv-rc-dot"/><div className="nv-rc-dot"/></div>
        </div>
      )}

      {/* Fullscreen burst — fixed, covers entire viewport */}
      {isCracking&&(
        <div className="nv-crack-wrap">
          <div className="nv-crack-burst"/>
          <div className="nv-crack-text">DEPLOYED!</div>
        </div>
      )}

      <div className="nv-killfeed">
        {msgs.map(m=>(
          <div key={m.id} className={cn("nv-kf",m.variant==="err"?"nv-kf-err":m.variant==="warn"?"nv-kf-warn":"")}>
            <span className="nv-kf-icon">{m.icon}</span>
            <span className="nv-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="nv-root nv-page">
        <div className="nv-atm"/>
        <div ref={gridRef} className="nv-grid"/>
        <div className="nv-scanlines"/>

        <div ref={wrapRef} className="nv-scale-wrap" style={{transformOrigin:"top center"}}>
          <div ref={cardRef} className={cn(
            "nv-card nv-in",
            intensityLevel>0&&`nv-int-${intensityLevel}`,
            isShaking&&"nv-shaking"
          )}>
            <div className="nv-bracket nv-bracket-tl"/>
            <div className="nv-bracket nv-bracket-tr"/>
            <div className="nv-bracket nv-bracket-bl"/>
            <div className="nv-bracket nv-bracket-br"/>

            {/* HERO — no avatar */}
            <div className="nv-hero">
              <div className="nv-hero-blob"/>
              <div className="nv-operator-tag">
                <span className="nv-tag-prefix">▸ Naval Command</span>
                <div className="nv-name">BRIGZARD</div>
                {showGreeting?(
                  <div className="nv-greeting" key={formData.name}>
                    <span style={{fontSize:10}}>🎖️</span>
                    <span className="nv-greeting-text">Operator: {formData.name.trim()}</span>
                  </div>
                ):(
                  <div className="nv-hero-sub-bubble">Support · Deploy · Dominate</div>
                )}
              </div>
              <div className="nv-live">
                <div className="nv-live-dot"/>
                <span className="nv-live-text">LIVE</span>
              </div>
            </div>

            {/* Naval Command Bar */}
            <div className="nv-loadout">
              <div className="nv-rank-info">
                <div className="nv-rank-badge">ADMIRAL</div>
                <div className="nv-rank-name">BRIGZARD FLEET</div>
              </div>
              <div className="nv-xp-wrap">
                <div className="nv-xp-label">FLEET XP</div>
                <div className="nv-xp-bar"><div className="nv-xp-fill"/></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="nv-body">

                <div>
                  <label className="nv-lbl">▸ Operator Callsign</label>
                  <div className="nv-iw">
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/>
                  </div>
                </div>

                <div>
                  <label className="nv-lbl">▸ Mission Type</label>
                  <div className="nv-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button"
                        onClick={()=>handleDonationTypeChange(t.key)}
                        className={cn("nv-tb",t.tc,donationType===t.key?"nv-on":"",coolingType===t.key?"nv-cooling":"")}
                      >
                        <div className="nv-tb-face">
                          <span className="nv-tb-emoji">{t.emoji}</span>
                          <span className="nv-tb-name" style={{color:donationType===t.key?t.nc:"rgba(255,255,255,0.35)",textShadow:donationType===t.key?`0 0 10px ${t.nc}, 0 0 22px ${t.nc}`:"none"}}>{t.label}</span>
                          <span className="nv-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="nv-lbl">▸ Deploy Credits</label>
                  <div className="nv-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="nv-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{width:10,height:10,opacity:0.35,marginLeft:"auto",flexShrink:0}}/>
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
                    <div className="nv-iw" style={{flex:1}}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="nv-hint">⚡ TTS ENABLED ABOVE {currencySymbol}{pricing.minTts}</p>}
                </div>

                {currentAmount>0&&(
                  <div className="nv-fu">
                    <label className="nv-lbl">▸ Naval Rank</label>
                    <div className="nv-tiers">
                      {TIERS.map((tier,i)=>(
                        <div key={i} className={cn("nv-tier",i===activeTierIdx?"nv-tier-active":i<activeTierIdx?"nv-tier-done":"")}>
                          <span className="nv-tier-emoji">{tier.emoji}</span>
                          <div className="nv-tier-rank">{tier.rank}</div>
                          <div className="nv-tier-amt">{i<activeTierIdx?"✓":i===activeTierIdx?`${currencySymbol}${tier.min}+`:`${currencySymbol}${tier.min}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nv-div"/>

                {donationType==="text"&&(
                  <div className="nv-fu">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <label className="nv-lbl" style={{margin:0}}>▸ Intel Message</label>
                      <span style={{fontSize:9,fontWeight:700,color:msgClr,textShadow:`0 0 6px ${msgClr}`,fontFamily:"Orbitron,monospace",letterSpacing:"0.08em"}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Your message (optional)" className="nv-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="nv-cbar"><div className="nv-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 5px ${msgClr}`}}/></div>
                  </div>
                )}

                {donationType==="voice"&&(
                  <div className="nv-fu">
                    <label className="nv-lbl">▸ Voice Comms</label>
                    <div className="nv-sp nv-sp-st">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#102240"/>
                    </div>
                  </div>
                )}

                {donationType==="hypersound"&&(
                  <div className="nv-fu nv-sp nv-sp-sc">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🔊</span>
                      <span style={{fontSize:11,fontWeight:700,color:"var(--nv-scarlet-lt)",textShadow:"0 0 8px var(--nv-scarlet-lt)",fontFamily:"Orbitron,monospace",letterSpacing:"0.1em"}}>HYPERSOUNDS</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {donationType==="media"&&(
                  <div className="nv-fu nv-sp nv-sp-nv">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🖼️</span>
                      <span style={{fontSize:11,fontWeight:700,color:"var(--nv-steel-lt)",textShadow:"0 0 8px var(--nv-steel-lt)",fontFamily:"Orbitron,monospace",letterSpacing:"0.1em"}}>MEDIA DROP</span>
                    </div>
                    <MediaUploader streamerSlug="brigzard" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                <div className="nv-btn-wrap">
                  <button type="submit" className="nv-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9}}>
                        <span className="nv-spin"/> DEPLOYING...
                      </span>
                    ):(
                      <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9}}>
                        <Anchor style={{width:14,height:14}}/>
                        DEPLOY {currencySymbol}{formData.amount||"0"} CREDITS
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.15)",textAlign:"center",lineHeight:1.6,fontFamily:"Orbitron,monospace",letterSpacing:"0.06em"}}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                </p>
                <DonationPageFooter brandColor="#102240"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Brigzard;
