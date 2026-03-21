import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Heart } from "lucide-react";
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
import latifaAvatar from "@/assets/gaming-with-latifa-avatar.jpg";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800;900&display=swap');

  :root {
    --lf-purple:   #c026d3;
    --lf-violet:   #7c3aed;
    --lf-pink:     #ec4899;
    --lf-magenta:  #e879f9;
    --lf-rose:     #fb7185;
    --lf-gold:     #fbbf24;
    --lf-green:    #34d399;
    --lf-bg:       #080510;
    --lf-card:     #0e0818;
    --lf-ink:      #000000;
  }

  .lf-root { font-family: 'Nunito', sans-serif; }

  /* ─────────────────────────────────────────
     PAGE — halftone that breathes with neon
  ───────────────────────────────────────── */
  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  /* Pulsing halftone grid — the dots themselves flicker */
  .lf-page::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: radial-gradient(rgba(192,38,211,0.18) 1px, transparent 1px);
    background-size: 10px 10px;
    animation: lf-dot-pulse 4s ease-in-out infinite;
  }
  @keyframes lf-dot-pulse {
    0%,100% { opacity: 0.6; background-size: 10px 10px; }
    50%      { opacity: 1;   background-size: 10px 10px;
               filter: drop-shadow(0 0 3px rgba(192,38,211,0.5)); }
  }

  /* Neon atmosphere */
  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 70% 55% at 10% 10%, rgba(124,58,237,0.28) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 88% 85%, rgba(236,72,153,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 45% 35% at 55% 50%, rgba(192,38,211,0.1) 0%, transparent 60%);
    animation: lf-atm-breathe 6s ease-in-out infinite;
  }
  @keyframes lf-atm-breathe {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.7; }
  }

  .lf-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  /* ─────────────────────────────────────────
     CARD — ink skeleton, neon chases the border
  ───────────────────────────────────────── */
  .lf-card {
    width: 420px; background: var(--lf-card); border-radius: 16px;
    /* Ink border — the structural outline */
    border: 2.5px solid rgba(255,255,255,0.15);
    /* Hard ink offset shadow + layered neon coronas */
    box-shadow:
      5px 5px 0px var(--lf-ink),
      0 0 0 1px rgba(192,38,211,0.3),
      0 0 20px rgba(124,58,237,0.5),
      0 0 45px rgba(192,38,211,0.3),
      0 0 80px rgba(236,72,153,0.15),
      0 30px 80px rgba(0,0,0,0.8);
    overflow: hidden;
    position: relative;
    /* Card-level neon pulse — the glow breathes */
    animation: lf-card-pulse 5s ease-in-out infinite;
  }
  @keyframes lf-card-pulse {
    0%,100% {
      box-shadow:
        5px 5px 0px var(--lf-ink),
        0 0 0 1px rgba(192,38,211,0.3),
        0 0 20px rgba(124,58,237,0.5),
        0 0 45px rgba(192,38,211,0.3),
        0 0 80px rgba(236,72,153,0.15),
        0 30px 80px rgba(0,0,0,0.8);
    }
    50% {
      box-shadow:
        5px 5px 0px var(--lf-ink),
        0 0 0 1px rgba(236,72,153,0.5),
        0 0 30px rgba(192,38,211,0.7),
        0 0 60px rgba(236,72,153,0.35),
        0 0 100px rgba(124,58,237,0.2),
        0 30px 80px rgba(0,0,0,0.8);
    }
  }

  /* Halftone on card — neon tinted, animated */
  .lf-card::before {
    content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; border-radius: 16px;
    background-image: radial-gradient(rgba(192,38,211,0.16) 1px, transparent 1px);
    background-size: 6px 6px;
    animation: lf-dot-pulse 4s ease-in-out infinite reverse;
  }

  /* Neon chase — animated gradient running around the top edge */
  .lf-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; z-index: 10;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--lf-violet) 20%,
      var(--lf-purple) 35%,
      var(--lf-pink) 50%,
      var(--lf-magenta) 65%,
      var(--lf-pink) 80%,
      transparent 100%
    );
    background-size: 300% 100%;
    animation: lf-chase 2.5s linear infinite;
    box-shadow: 0 0 12px var(--lf-purple), 0 0 28px rgba(192,38,211,0.6);
  }
  @keyframes lf-chase {
    0%   { background-position: 200% 0; }
    100% { background-position: -100% 0; }
  }

  /* ─────────────────────────────────────────
     HERO
  ───────────────────────────────────────── */
  .lf-hero {
    position: relative; padding: 16px 18px 14px;
    display: flex; align-items: center; gap: 13px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(124,58,237,0.24) 0%, rgba(192,38,211,0.14) 60%, transparent 100%);
    border-bottom: 2.5px solid var(--lf-ink);
    /* Neon leaking under the ink border-bottom */
    box-shadow: 0 2.5px 0 var(--lf-ink), 0 4px 20px rgba(192,38,211,0.35);
    z-index: 1;
  }

  /* Speed lines — neon rays shooting from left */
  .lf-hero::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      95deg,
      transparent 0px,
      transparent 18px,
      rgba(192,38,211,0.04) 18px,
      rgba(192,38,211,0.04) 19px
    );
    pointer-events: none; z-index: 0;
    animation: lf-speed 8s linear infinite;
  }
  @keyframes lf-speed {
    from { background-position: 0 0; }
    to   { background-position: 200px 0; }
  }

  .lf-hero-blob {
    position:absolute; top:-30px; right:-30px; width:150px; height:150px; border-radius:50%;
    background:radial-gradient(circle, rgba(192,38,211,0.35) 0%, transparent 65%);
    pointer-events:none;
    animation: lf-blob-spin 10s linear infinite;
  }
  @keyframes lf-blob-spin {
    0%,100% { transform: scale(1); opacity: 0.8; }
    50%      { transform: scale(1.2); opacity: 1; }
  }

  /* ─────────────────────────────────────────
     AVATAR — starburst with intense neon halos
  ───────────────────────────────────────── */
  .lf-avatar-wrap {
    position: relative; flex-shrink: 0; z-index: 1; width: 60px; height: 60px;
  }
  /* Gold starburst — intense neon gold filter */
  .lf-avatar-wrap::before {
    content: '';
    position: absolute; top: 50%; left: 50%;
    width: 82px; height: 82px;
    background: var(--lf-gold);
    clip-path: polygon(
      50% 0%, 61% 20%, 79% 7%, 72% 27%, 95% 25%,
      80% 41%, 100% 50%, 80% 59%, 95% 75%,
      72% 73%, 79% 93%, 61% 80%, 50% 100%,
      39% 80%, 21% 93%, 28% 73%, 5% 75%,
      20% 59%, 0% 50%, 20% 41%, 5% 25%,
      28% 27%, 21% 7%, 39% 20%
    );
    z-index: 0;
    animation: lf-burst 10s linear infinite;
    /* Layered neon gold halos */
    filter:
      drop-shadow(0 0 4px #fbbf24)
      drop-shadow(0 0 10px rgba(251,191,36,0.9))
      drop-shadow(0 0 22px rgba(251,191,36,0.5))
      drop-shadow(0 0 40px rgba(251,191,36,0.25));
    transform: translate(-50%, -50%);
  }
  /* Pink starburst — intense neon pink filter */
  .lf-avatar-wrap::after {
    content: '';
    position: absolute; top: 50%; left: 50%;
    width: 70px; height: 70px;
    background: var(--lf-pink);
    clip-path: polygon(
      50% 0%, 55% 30%, 79% 7%, 65% 35%, 95% 25%,
      70% 45%, 100% 50%, 70% 55%, 95% 75%,
      65% 65%, 79% 93%, 55% 70%, 50% 100%,
      45% 70%, 21% 93%, 35% 65%, 5% 75%,
      30% 55%, 0% 50%, 30% 45%, 5% 25%,
      35% 35%, 21% 7%, 45% 30%
    );
    z-index: 0;
    animation: lf-burst 7s linear infinite reverse;
    filter:
      drop-shadow(0 0 4px #ec4899)
      drop-shadow(0 0 10px rgba(236,72,153,0.9))
      drop-shadow(0 0 22px rgba(236,72,153,0.5))
      drop-shadow(0 0 40px rgba(236,72,153,0.25));
    transform: translate(-50%, -50%);
    opacity: 0.8;
  }
  @keyframes lf-burst {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Avatar — ink outline + neon ring + outer corona */
  .lf-avatar {
    width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
    object-position: center top; position: relative; z-index: 1;
    border: 2.5px solid var(--lf-ink);
    box-shadow:
      2px 2px 0 var(--lf-ink),
      0 0 0 3px rgba(192,38,211,0.7),
      0 0 0 5px rgba(192,38,211,0.2),
      0 0 20px rgba(192,38,211,0.8),
      0 0 40px rgba(236,72,153,0.4),
      0 0 70px rgba(124,58,237,0.2);
    animation: lf-avatar-pulse 3s ease-in-out infinite;
  }
  @keyframes lf-avatar-pulse {
    0%,100% {
      box-shadow:
        2px 2px 0 var(--lf-ink),
        0 0 0 3px rgba(192,38,211,0.7),
        0 0 0 5px rgba(192,38,211,0.2),
        0 0 20px rgba(192,38,211,0.8),
        0 0 40px rgba(236,72,153,0.4),
        0 0 70px rgba(124,58,237,0.2);
    }
    50% {
      box-shadow:
        2px 2px 0 var(--lf-ink),
        0 0 0 3px rgba(236,72,153,0.9),
        0 0 0 6px rgba(192,38,211,0.3),
        0 0 28px rgba(236,72,153,1),
        0 0 55px rgba(192,38,211,0.6),
        0 0 90px rgba(124,58,237,0.3);
    }
  }

  .lf-hero-text { position: relative; z-index: 1; flex: 1; min-width: 0; }

  /* ─────────────────────────────────────────
     NAME — ink outline + cycling neon hue
  ───────────────────────────────────────── */
  .lf-name {
    font-family: 'Bangers', cursive;
    font-size: 30px; color: #fff; line-height: 1; letter-spacing: 0.06em;
    text-shadow:
      /* hard ink outline — structural */
       3px  3px 0 var(--lf-ink),
      -1px -1px 0 var(--lf-ink),
       1px -1px 0 var(--lf-ink),
      -1px  1px 0 var(--lf-ink),
       2px  0   0 var(--lf-ink),
       0    2px 0 var(--lf-ink),
      /* neon layers that cycle in color */
       0 0 10px rgba(236,72,153,0.9),
       0 0 24px rgba(192,38,211,0.7),
       0 0 50px rgba(124,58,237,0.4);
    animation: lf-name-cycle 6s ease-in-out infinite, lf-flicker 9s infinite;
  }
  /* Hue-cycle the neon behind the ink */
  @keyframes lf-name-cycle {
    0%   { text-shadow:  3px  3px 0 #000,-1px -1px 0 #000, 1px -1px 0 #000,-1px  1px 0 #000, 2px 0 0 #000, 0 2px 0 #000, 0 0 10px rgba(236,72,153,0.9),  0 0 24px rgba(192,38,211,0.7),  0 0 50px rgba(124,58,237,0.4); }
    33%  { text-shadow:  3px  3px 0 #000,-1px -1px 0 #000, 1px -1px 0 #000,-1px  1px 0 #000, 2px 0 0 #000, 0 2px 0 #000, 0 0 10px rgba(232,121,249,0.9),  0 0 24px rgba(236,72,153,0.7),  0 0 50px rgba(192,38,211,0.4); }
    66%  { text-shadow:  3px  3px 0 #000,-1px -1px 0 #000, 1px -1px 0 #000,-1px  1px 0 #000, 2px 0 0 #000, 0 2px 0 #000, 0 0 10px rgba(251,113,133,0.9),  0 0 24px rgba(232,121,249,0.7),  0 0 50px rgba(236,72,153,0.4); }
    100% { text-shadow:  3px  3px 0 #000,-1px -1px 0 #000, 1px -1px 0 #000,-1px  1px 0 #000, 2px 0 0 #000, 0 2px 0 #000, 0 0 10px rgba(236,72,153,0.9),  0 0 24px rgba(192,38,211,0.7),  0 0 50px rgba(124,58,237,0.4); }
  }
  @keyframes lf-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% { opacity: 1; }
    19%,21%,53%,63% { opacity: 0.72; }
  }

  /* ─────────────────────────────────────────
     SPEECH BUBBLE — ink structure + neon inner light
  ───────────────────────────────────────── */
  .lf-speech {
    position: relative; display: inline-block;
    /* Not plain white — slightly tinted by inner neon */
    background: linear-gradient(135deg, #fff 60%, rgba(232,121,249,0.15) 100%);
    color: #1a0030;
    font-family: 'Bangers', cursive; font-size: 11px; letter-spacing: 0.05em;
    padding: 4px 10px 4px 8px; margin-top: 7px;
    border: 2px solid var(--lf-ink);
    border-radius: 6px;
    /* ink hard shadow + neon bleeding through + inner neon glow */
    box-shadow:
      2px 2px 0 var(--lf-ink),
      0 0 12px rgba(236,72,153,0.7),
      0 0 28px rgba(192,38,211,0.4),
      inset 0 0 10px rgba(232,121,249,0.12);
    white-space: nowrap;
    animation: lf-bubble-pulse 4s ease-in-out infinite;
  }
  @keyframes lf-bubble-pulse {
    0%,100% { box-shadow: 2px 2px 0 #000, 0 0 12px rgba(236,72,153,0.7), 0 0 28px rgba(192,38,211,0.4), inset 0 0 10px rgba(232,121,249,0.12); }
    50%      { box-shadow: 2px 2px 0 #000, 0 0 20px rgba(236,72,153,1),   0 0 45px rgba(192,38,211,0.6), inset 0 0 18px rgba(232,121,249,0.22); }
  }
  .lf-speech::before {
    content: ''; position: absolute;
    left: -10px; top: 50%; transform: translateY(-50%);
    border-top: 6px solid transparent; border-bottom: 6px solid transparent;
    border-right: 10px solid var(--lf-ink);
  }
  .lf-speech::after {
    content: ''; position: absolute;
    left: -7px; top: 50%; transform: translateY(-50%);
    border-top: 5px solid transparent; border-bottom: 5px solid transparent;
    border-right: 8px solid white;
  }

  /* ─────────────────────────────────────────
     LIVE BADGE — ink structure + neon green invasive
  ───────────────────────────────────────── */
  @keyframes lf-live-pulse {
    0%,100% {
      box-shadow: 2px 2px 0 #000, 0 0 10px rgba(52,211,153,0.8), 0 0 24px rgba(52,211,153,0.4), inset 0 0 8px rgba(52,211,153,0.1);
    }
    50% {
      box-shadow: 2px 2px 0 #000, 0 0 18px rgba(52,211,153,1),   0 0 40px rgba(52,211,153,0.6), inset 0 0 14px rgba(52,211,153,0.2);
    }
  }
  .lf-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(0,0,0,0.7);
    border: 2px solid var(--lf-ink);
    border-radius: 20px; padding: 3px 10px; flex-shrink: 0; position: relative; z-index: 1;
    margin-left: auto;
    animation: lf-live-pulse 2s ease-in-out infinite;
  }
  .lf-live-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--lf-green);
    box-shadow: 0 0 6px var(--lf-green), 0 0 14px rgba(52,211,153,0.8), 0 0 28px rgba(52,211,153,0.4);
    animation: lf-dot-blink 1.5s ease-in-out infinite;
  }
  @keyframes lf-dot-blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .lf-live-text {
    font-family: 'Bangers', cursive; font-size: 12px; letter-spacing: 0.12em; color: var(--lf-green);
    text-shadow: 1px 1px 0 #000, 0 0 8px var(--lf-green), 0 0 18px rgba(52,211,153,0.6);
  }

  /* ─────────────────────────────────────────
     BODY
  ───────────────────────────────────────── */
  .lf-body { padding: 14px 18px 16px; display: flex; flex-direction: column; gap: 11px; position: relative; z-index: 1; }

  /* Labels — Bangers + ink outline + neon cycling color */
  .lf-lbl {
    font-family: 'Bangers', cursive;
    font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
    display: block; margin-bottom: 5px; color: white;
    text-shadow:
       1px  1px 0 var(--lf-ink),
      -1px -1px 0 var(--lf-ink),
       1px -1px 0 var(--lf-ink),
      -1px  1px 0 var(--lf-ink),
       0 0 10px rgba(192,38,211,0.8),
       0 0 22px rgba(124,58,237,0.4);
  }

  /* ─────────────────────────────────────────
     INPUTS — ink offset at rest, neon scan + ring on focus
  ───────────────────────────────────────── */
  .lf-iw { position: relative; }
  /* Neon scan line that sweeps on focus */
  .lf-iw::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(192,38,211,0.15), transparent);
    pointer-events: none; z-index: 2; border-radius: 8px;
    transition: none;
  }
  .lf-iw:focus-within::after {
    animation: lf-scan 0.6s ease forwards;
  }
  @keyframes lf-scan {
    from { left: -60%; }
    to   { left: 110%; }
  }

  .lf-iw input {
    width:100% !important; background:rgba(255,255,255,0.04) !important;
    border: 2px solid rgba(124,58,237,0.45) !important; border-radius:8px !important;
    color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:14px !important; font-weight:700 !important; padding:8px 12px !important;
    outline:none !important; transition:all .25s !important; caret-color:var(--lf-pink);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.8) !important;
  }
  .lf-iw input:focus {
    border-color: var(--lf-pink) !important;
    background: rgba(192,38,211,0.08) !important;
    box-shadow:
      2px 2px 0 var(--lf-ink),
      0 0 0 2px rgba(236,72,153,0.45),
      0 0 0 4px rgba(192,38,211,0.2),
      0 0 20px rgba(192,38,211,0.5),
      0 0 40px rgba(236,72,153,0.25) !important;
  }
  .lf-iw input::placeholder { color:rgba(255,255,255,0.2) !important; }
  .lf-iw input:disabled, .lf-iw input[readonly] { opacity:.38 !important; cursor:not-allowed !important; }

  .lf-ta {
    width:100%; background:rgba(255,255,255,0.04);
    border: 2px solid rgba(124,58,237,0.45);
    border-radius:8px; color:#fff; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700;
    padding:8px 12px; resize:none; outline:none; line-height:1.5;
    caret-color:var(--lf-pink); transition:all .25s;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.8);
  }
  .lf-ta:focus {
    border-color: var(--lf-pink);
    background: rgba(192,38,211,0.08);
    box-shadow:
      2px 2px 0 var(--lf-ink),
      0 0 0 2px rgba(236,72,153,0.45),
      0 0 0 4px rgba(192,38,211,0.2),
      0 0 20px rgba(192,38,211,0.5),
      0 0 40px rgba(236,72,153,0.25);
  }
  .lf-ta::placeholder { color:rgba(255,255,255,0.2); }

  .lf-cbar { height:2px; margin-top:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .lf-cbar-fill {
    height:100%; border-radius:2px; transition:width .12s,background .2s;
    /* Glow on the char fill bar */
    filter: brightness(1.2);
  }

  /* ─────────────────────────────────────────
     3D TYPE BUTTONS
     — ink offset idle
     — neon sign flicker on hover
     — ink collapses, neon erupts on active
  ───────────────────────────────────────── */
  .lf-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding-bottom:6px; }
  .lf-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:10px; display:block; width:100%; }
  .lf-tb-face {
    position:relative; z-index:2; padding:10px 4px 9px; border-radius:10px; text-align:center;
    transition:transform .1s ease, box-shadow .15s ease, filter .15s ease;
    transform:translateY(-5px);
  }
  .lf-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 3px); border-radius:10px; z-index:1; }
  .lf-tb:active .lf-tb-face { transform:translateY(0px) !important; }

  /* Hover: neon sign warming up — slight flicker filter */
  .lf-tb:hover:not(.lf-on) .lf-tb-face { filter: brightness(1.2); }

  /* ── Violet ── */
  .lf-tb-pu .lf-tb-face {
    background:linear-gradient(160deg,rgba(124,58,237,0.22),rgba(60,0,120,0.55));
    border:2px solid rgba(124,58,237,0.65);
    box-shadow: 2px 2px 0 var(--lf-ink), 0 0 8px rgba(124,58,237,0.35), 0 0 18px rgba(124,58,237,0.15);
  }
  .lf-tb-pu::after { background:#2d006b; border:2px solid rgba(124,58,237,0.35); }
  .lf-tb-pu.lf-on .lf-tb-face {
    transform:translateY(0);
    background:linear-gradient(160deg,rgba(124,58,237,0.45),rgba(100,0,180,0.7));
    border-color:var(--lf-violet);
    box-shadow:
      1px 1px 0 var(--lf-ink),
      inset 0 2px 5px rgba(0,0,0,0.35),
      0 0 16px rgba(124,58,237,1),
      0 0 32px rgba(124,58,237,0.7),
      0 0 60px rgba(124,58,237,0.35),
      0 0 90px rgba(124,58,237,0.15);
  }

  /* ── Pink ── */
  .lf-tb-pk .lf-tb-face {
    background:linear-gradient(160deg,rgba(236,72,153,0.22),rgba(140,0,80,0.5));
    border:2px solid rgba(236,72,153,0.65);
    box-shadow: 2px 2px 0 var(--lf-ink), 0 0 8px rgba(236,72,153,0.35), 0 0 18px rgba(236,72,153,0.15);
  }
  .lf-tb-pk::after { background:#6b0040; border:2px solid rgba(236,72,153,0.35); }
  .lf-tb-pk.lf-on .lf-tb-face {
    transform:translateY(0);
    background:linear-gradient(160deg,rgba(236,72,153,0.45),rgba(180,0,100,0.65));
    border-color:var(--lf-pink);
    box-shadow:
      1px 1px 0 var(--lf-ink),
      inset 0 2px 5px rgba(0,0,0,0.3),
      0 0 16px rgba(236,72,153,1),
      0 0 32px rgba(236,72,153,0.7),
      0 0 60px rgba(236,72,153,0.35),
      0 0 90px rgba(236,72,153,0.15);
  }

  /* ── Magenta ── */
  .lf-tb-mg .lf-tb-face {
    background:linear-gradient(160deg,rgba(232,121,249,0.22),rgba(120,0,150,0.5));
    border:2px solid rgba(232,121,249,0.65);
    box-shadow: 2px 2px 0 var(--lf-ink), 0 0 8px rgba(232,121,249,0.35), 0 0 18px rgba(232,121,249,0.15);
  }
  .lf-tb-mg::after { background:#5a0075; border:2px solid rgba(232,121,249,0.35); }
  .lf-tb-mg.lf-on .lf-tb-face {
    transform:translateY(0);
    background:linear-gradient(160deg,rgba(232,121,249,0.45),rgba(160,0,190,0.65));
    border-color:var(--lf-magenta);
    box-shadow:
      1px 1px 0 var(--lf-ink),
      inset 0 2px 5px rgba(0,0,0,0.3),
      0 0 16px rgba(232,121,249,1),
      0 0 32px rgba(232,121,249,0.7),
      0 0 60px rgba(232,121,249,0.35),
      0 0 90px rgba(232,121,249,0.15);
  }

  /* ── Rose ── */
  .lf-tb-rs .lf-tb-face {
    background:linear-gradient(160deg,rgba(251,113,133,0.22),rgba(140,0,50,0.5));
    border:2px solid rgba(251,113,133,0.65);
    box-shadow: 2px 2px 0 var(--lf-ink), 0 0 8px rgba(251,113,133,0.35), 0 0 18px rgba(251,113,133,0.15);
  }
  .lf-tb-rs::after { background:#6b0028; border:2px solid rgba(251,113,133,0.35); }
  .lf-tb-rs.lf-on .lf-tb-face {
    transform:translateY(0);
    background:linear-gradient(160deg,rgba(251,113,133,0.45),rgba(180,0,60,0.65));
    border-color:var(--lf-rose);
    box-shadow:
      1px 1px 0 var(--lf-ink),
      inset 0 2px 5px rgba(0,0,0,0.3),
      0 0 16px rgba(251,113,133,1),
      0 0 32px rgba(251,113,133,0.7),
      0 0 60px rgba(251,113,133,0.35),
      0 0 90px rgba(251,113,133,0.15);
  }

  .lf-tb-emoji { font-size:18px; display:block; line-height:1; }
  .lf-tb-name {
    font-family: 'Bangers', cursive;
    font-size:12px; letter-spacing:.06em; text-transform:uppercase; display:block; margin-top:4px;
    transition: color .15s, text-shadow .15s;
  }
  .lf-tb-min { font-size:7px; font-weight:700; color:rgba(244,114,182,0.7); display:block; margin-top:1px; font-family:'Nunito',sans-serif; }

  /* ─────────────────────────────────────────
     AMOUNT
  ───────────────────────────────────────── */
  .lf-amt { display:flex; gap:7px; }
  .lf-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(255,255,255,0.04) !important;
    border: 2px solid rgba(124,58,237,0.45) !important;
    border-radius:8px !important; color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:12px !important; font-weight:800 !important; padding:0 10px !important;
    min-width:84px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.8) !important;
  }
  .lf-cur:hover {
    border-color:var(--lf-purple) !important;
    box-shadow: 2px 2px 0 var(--lf-ink), 0 0 14px rgba(192,38,211,0.5), 0 0 28px rgba(192,38,211,0.25) !important;
  }

  /* ─────────────────────────────────────────
     DIVIDER — electricity traveling left to right
  ───────────────────────────────────────── */
  .lf-div {
    height: 2px; position: relative; overflow: visible;
    background: rgba(124,58,237,0.2);
  }
  .lf-div::before {
    content: '';
    position: absolute; top: -1px; left: 0; width: 40%; height: 4px;
    background: linear-gradient(90deg, transparent, var(--lf-purple), var(--lf-pink), var(--lf-magenta), transparent);
    border-radius: 2px;
    animation: lf-elec 2s ease-in-out infinite;
    box-shadow: 0 0 8px var(--lf-purple), 0 0 18px rgba(192,38,211,0.6);
    filter: blur(0.5px);
  }
  @keyframes lf-elec {
    0%   { left: -40%; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { left: 100%; opacity: 0; }
  }

  /* Sub panels — ink + strong neon glow */
  .lf-sp { border-radius:10px; padding:10px 12px; }
  .lf-sp-pk {
    background:rgba(236,72,153,0.07); border:2px solid rgba(236,72,153,0.5);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.6), 0 0 18px rgba(236,72,153,0.3), 0 0 35px rgba(236,72,153,0.12);
  }
  .lf-sp-mg {
    background:rgba(232,121,249,0.07); border:2px solid rgba(232,121,249,0.5);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.6), 0 0 18px rgba(232,121,249,0.3), 0 0 35px rgba(232,121,249,0.12);
  }
  .lf-sp-rs {
    background:rgba(251,113,133,0.07); border:2px solid rgba(251,113,133,0.45);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.6), 0 0 18px rgba(251,113,133,0.3), 0 0 35px rgba(251,113,133,0.12);
  }

  /* ─────────────────────────────────────────
     POW SUBMIT — jagged + ink shadow + neon that
     pulses at rest so it never feels dead
  ───────────────────────────────────────── */
  .lf-btn-wrap { position:relative; width:100%; padding-bottom:6px; }
  .lf-btn-wrap::after {
    content:''; position:absolute; bottom:0; left:4px; right:-4px; height:calc(100% - 4px); z-index:1;
    background: var(--lf-ink);
    clip-path: polygon(0% 8%, 3% 0%, 97% 0%, 100% 8%, 100% 92%, 97% 100%, 3% 100%, 0% 92%);
  }
  .lf-btn {
    position:relative; z-index:2; width:100%; padding:13px; border:none; cursor:pointer;
    font-family:'Bangers',cursive; font-size:19px; letter-spacing:.12em; color:#fff;
    transition:transform .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,#7c3aed 0%,#c026d3 45%,#ec4899 100%);
    border: 2.5px solid rgba(255,255,255,0.22);
    clip-path: polygon(0% 8%, 3% 0%, 97% 0%, 100% 8%, 100% 92%, 97% 100%, 3% 100%, 0% 92%);
    text-shadow:
      2px 2px 0 var(--lf-ink),
     -1px -1px 0 rgba(0,0,0,0.4),
      0 0 12px rgba(255,255,255,0.7);
    /* Neon pulses at rest */
    animation: lf-btn-pulse 3s ease-in-out infinite;
    overflow:hidden;
  }
  @keyframes lf-btn-pulse {
    0%,100% {
      box-shadow:
        inset 0 1px 0 rgba(255,200,240,0.15),
        0 0 20px rgba(192,38,211,0.7),
        0 0 45px rgba(236,72,153,0.4),
        0 0 80px rgba(124,58,237,0.2);
    }
    50% {
      box-shadow:
        inset 0 1px 0 rgba(255,200,240,0.25),
        0 0 35px rgba(192,38,211,1),
        0 0 70px rgba(236,72,153,0.6),
        0 0 120px rgba(124,58,237,0.35);
    }
  }
  .lf-btn:hover:not(:disabled) {
    animation: none;
    box-shadow:
      inset 0 1px 0 rgba(255,200,240,0.25),
      0 0 40px rgba(192,38,211,1),
      0 0 80px rgba(236,72,153,0.65),
      0 0 130px rgba(124,58,237,0.4);
  }
  .lf-btn:active:not(:disabled) {
    transform:translateY(0px) !important;
    animation: none;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(192,38,211,0.6) !important;
  }
  .lf-btn:disabled { opacity:.38; cursor:not-allowed; animation: none; }
  .lf-btn::before {
    content:''; position:absolute; top:0; left:-110%; width:55%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    transform:skewX(-20deg); transition:left .5s;
  }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  /* Hint */
  .lf-hint {
    font-family:'Bangers',cursive; font-size:11px; letter-spacing:0.08em;
    color: var(--lf-magenta); margin-top:3px;
    text-shadow: 1px 1px 0 var(--lf-ink), 0 0 10px rgba(232,121,249,0.8), 0 0 22px rgba(192,38,211,0.4);
  }

  @keyframes lf-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .2s ease forwards; }

  @keyframes lf-sp-a { to{transform:rotate(360deg);} }
  .lf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-sp-a .65s linear infinite; }

  @keyframes lf-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .lf-in { animation:lf-in .4s cubic-bezier(0.22,1,0.36,1) both; }

  /* ─────────────────────────────────────────
     REWARDS — jagged + ink + neon gold pulse
  ───────────────────────────────────────── */
  .lf-rewards-btn {
    display:flex; align-items:center; justify-content:center; gap:7px;
    width:100%; padding:11px;
    background:rgba(251,191,36,0.08);
    border: 2px solid rgba(251,191,36,0.5);
    color: var(--lf-gold);
    font-family:'Bangers',cursive; font-size:14px; letter-spacing:0.1em; text-transform:uppercase;
    text-decoration:none; cursor:pointer;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.8), 0 0 10px rgba(251,191,36,0.8);
    clip-path: polygon(0% 8%, 3% 0%, 97% 0%, 100% 8%, 100% 92%, 97% 100%, 3% 100%, 0% 92%);
    animation: lf-gold-pulse 4s ease-in-out infinite;
  }
  @keyframes lf-gold-pulse {
    0%,100% { box-shadow: 2px 2px 0 rgba(0,0,0,0.7), 0 0 14px rgba(251,191,36,0.3), 0 0 30px rgba(251,191,36,0.12); }
    50%      { box-shadow: 2px 2px 0 rgba(0,0,0,0.7), 0 0 24px rgba(251,191,36,0.55), 0 0 50px rgba(251,191,36,0.22); }
  }
  .lf-rewards-btn:hover {
    animation: none;
    background:rgba(251,191,36,0.16); border-color:var(--lf-gold);
    box-shadow: 3px 3px 0 var(--lf-ink), 0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.25);
    text-shadow: 1px 1px 0 var(--lf-ink), 0 0 16px rgba(251,191,36,1);
  }
`;

const GamingWithLatifa = () => {
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [formData, setFormData]                     = useState({ name:"", amount:"", message:"" });
  const [selectedCurrency, setSelectedCurrency]     = useState("INR");
  const [currencyOpen, setCurrencyOpen]             = useState(false);
  const [donationType, setDonationType]             = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string|null>(null);
  const [mediaUrl, setMediaUrl]                     = useState<string|null>(null);
  const [mediaType, setMediaType]                   = useState<string|null>(null);
  const [razorpayLoaded, setRazorpayLoaded]         = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { pricing }      = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") { if (amount >= 500) return 15; if (amount >= 300) return 12; return 8; }
    if (amount >= 6) return 15; if (amount >= 4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale = useCallback(() => {
    const wrap = wrapRef.current; const card = cardRef.current;
    if (!wrap || !card) return;
    const scaleW = Math.min(1, (window.innerWidth - 32) / 420);
    const scaleH = card.scrollHeight > 0 ? Math.min(1, (window.innerHeight - 48) / card.scrollHeight) : 1;
    const scale  = Math.min(scaleW, scaleH);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.height    = `${card.scrollHeight * scale}px`;
  }, []);

  useEffect(() => {
    const t = setTimeout(applyScale, 80);
    window.addEventListener('resize', applyScale);
    return () => { clearTimeout(t); window.removeEventListener('resize', applyScale); };
  }, [applyScale]);

  useEffect(() => { const t = setTimeout(applyScale, 60); return () => clearTimeout(t); }, [donationType, applyScale]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => setRazorpayLoaded(true);
    s.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(s);
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (value: "text" | "voice" | "hypersound" | "media") => {
    setDonationType(value);
    const amount = value === "voice" ? pricing.minVoice : value === "hypersound" ? pricing.minHypersound : value === "media" ? pricing.minMedia : pricing.minText;
    setFormData({ name: formData.name, amount: String(amount), message: "" });
    setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded || !(window as any).Razorpay) { toast.error("Payment system still loading"); return; }
    const amount = Number(formData.amount);
    if (!formData.name || !amount || amount <= 0) { toast.error("Enter valid name and amount"); return; }
    const minAmount = donationType === "voice" ? pricing.minVoice : donationType === "hypersound" ? pricing.minHypersound : donationType === "media" ? pricing.minMedia : pricing.minText;
    if (amount < minAmount) { toast.error(`Minimum for ${donationType} is ${currencySymbol}${minAmount}`); return; }
    if (donationType === "voice" && !voiceRecorder.audioBlob) { toast.error("Please record a voice message"); return; }
    if (donationType === "hypersound" && !selectedHypersound) { toast.error("Select a sound"); return; }
    if (donationType === "media" && !mediaUrl) { toast.error("Upload a media file"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", { body: { voiceData: base64, streamerSlug: "gaming_with_latifa" } });
        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }
      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "gaming_with_latifa", name: formData.name, amount: Number(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl, hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null, mediaType, currency: selectedCurrency
        }
      });
      if (error) {
        let msg = 'Payment failed';
        if (error instanceof FunctionsHttpError) {
          try { const errBody = await error.context.json(); msg = errBody?.error || msg; } catch {}
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      new (window as any).Razorpay({
        key: data.razorpay_key_id, amount: data.amount, currency: data.currency,
        order_id: data.razorpay_order_id, name: "Gaming With Latifa", description: "Support Gaming With Latifa",
        handler: () => navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal: { ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`) },
        theme: { color: "#c026d3" },
      }).open();
    } catch (err: any) { toast.error(err?.message || "Payment failed"); }
    finally { setIsProcessingPayment(false); }
  };

  const msgPct = maxMessageLength > 0 ? (formData.message.length / maxMessageLength) * 100 : 0;
  const msgClr = msgPct > 90 ? 'var(--lf-pink)' : msgPct > 70 ? 'var(--lf-magenta)' : 'var(--lf-violet)';

  const TYPES = [
    { key: 'text'       as const, emoji: '💬', label: 'Text',  min: pricing.minText,       tc: 'lf-tb-pu', nc: 'var(--lf-violet)'  },
    { key: 'voice'      as const, emoji: '🎤', label: 'Voice', min: pricing.minVoice,      tc: 'lf-tb-pk', nc: 'var(--lf-pink)'    },
    { key: 'hypersound' as const, emoji: '🔊', label: 'Sound', min: pricing.minHypersound, tc: 'lf-tb-mg', nc: 'var(--lf-magenta)' },
    { key: 'media'      as const, emoji: '🖼️', label: 'Media', min: pricing.minMedia,      tc: 'lf-tb-rs', nc: 'var(--lf-rose)'    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="lf-root lf-page">
        <div className="lf-atm" />

        <div ref={wrapRef} className="lf-scale-wrap" style={{ transformOrigin: 'top center' }}>
          <div ref={cardRef} className="lf-card lf-in">

            <div className="lf-hero">
              <div className="lf-hero-blob" />

              <div className="lf-avatar-wrap">
                <img src={latifaAvatar} alt="Gaming With Latifa" className="lf-avatar" />
              </div>

              <div className="lf-hero-text">
                <div className="lf-name">Gaming With Latifa</div>
                <div className="lf-speech">Drop in &amp; show some love 💜</div>
              </div>

              <div className="lf-live">
                <div className="lf-live-dot" />
                <span className="lf-live-text">LIVE</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-body">

                <div>
                  <label className="lf-lbl">Your Name</label>
                  <div className="lf-iw">
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required />
                  </div>
                </div>

                <div>
                  <label className="lf-lbl">Donation Type</label>
                  <div className="lf-types">
                    {TYPES.map(t => (
                      <button key={t.key} type="button" onClick={() => handleDonationTypeChange(t.key)} className={cn('lf-tb', t.tc, donationType === t.key ? 'lf-on' : '')}>
                        <div className="lf-tb-face">
                          <span className="lf-tb-emoji">{t.emoji}</span>
                          <span className="lf-tb-name" style={{
                            color: donationType === t.key ? t.nc : 'rgba(255,255,255,0.45)',
                            textShadow: donationType === t.key
                              ? `1px 1px 0 #000, 0 0 10px ${t.nc}, 0 0 22px ${t.nc}`
                              : '1px 1px 0 rgba(0,0,0,0.8)'
                          }}>{t.label}</span>
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
                          <ChevronsUpDown style={{ width: 11, height: 11, opacity: 0.4, marginLeft: 'auto', flexShrink: 0 }} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search currency..." />
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {SUPPORTED_CURRENCIES.map(c => (
                                <CommandItem key={c.code} value={c.code} onSelect={() => { setSelectedCurrency(c.code); setCurrencyOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")} />
                                  {c.symbol} {c.code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="lf-iw" style={{ flex: 1 }}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange}
                        min="1" placeholder="0" readOnly={donationType === "hypersound"} required />
                    </div>
                  </div>
                  {pricing.ttsEnabled && <p className="lf-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="lf-div" />

                {donationType === "text" && (
                  <div className="lf-fu">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <label className="lf-lbl" style={{ margin: 0 }}>Message</label>
                      <span style={{ fontFamily: "'Bangers',cursive", fontSize: 11, letterSpacing: '0.08em', color: msgClr, textShadow: `1px 1px 0 #000, 0 0 10px ${msgClr}` }}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Your message to Latifa..." className="lf-ta" rows={2} maxLength={maxMessageLength} />
                    <div className="lf-cbar"><div className="lf-cbar-fill" style={{ width: `${msgPct}%`, background: msgClr, boxShadow: `0 0 8px ${msgClr}, 0 0 16px ${msgClr}` }} /></div>
                  </div>
                )}

                {donationType === "voice" && (
                  <div className="lf-fu">
                    <label className="lf-lbl">Voice Message</label>
                    <div className="lf-sp lf-sp-pk">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={() => {}}
                        maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice}
                        currentAmount={currentAmount} brandColor="#c026d3" />
                    </div>
                  </div>
                )}

                {donationType === "hypersound" && (
                  <div className="lf-fu lf-sp lf-sp-mg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🔊</span>
                      <span style={{ fontFamily: "'Bangers',cursive", fontSize: 14, letterSpacing: '0.08em', color: 'var(--lf-magenta)', textShadow: '1px 1px 0 #000, 0 0 12px rgba(232,121,249,0.9)' }}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
                  </div>
                )}

                {donationType === "media" && (
                  <div className="lf-fu lf-sp lf-sp-rs">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🖼️</span>
                      <span style={{ fontFamily: "'Bangers',cursive", fontSize: 14, letterSpacing: '0.08em', color: 'var(--lf-rose)', textShadow: '1px 1px 0 #000, 0 0 12px rgba(251,113,133,0.9)' }}>Media Upload</span>
                    </div>
                    <MediaUploader streamerSlug="gaming_with_latifa"
                      onMediaUploaded={(url, type) => { setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={() => { setMediaUrl(null); setMediaType(null); }} />
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

                <div className="lf-btn-wrap">
                  <button type="submit" className="lf-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                        <span className="lf-spin" />Processing...
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                        <Heart style={{ width: 15, height: 15 }} />
                        Support {currencySymbol}{formData.amount || '0'} 💜
                      </span>
                    )}
                  </button>
                </div>

                <a href="https://hyperchat.store/auth" target="_blank" rel="noopener noreferrer" className="lf-rewards-btn">
                  🎁 View Rewards &amp; Perks
                </a>

                <p style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.18)', textAlign: 'center', lineHeight: 1.5 }}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>
                <DonationPageFooter brandColor="#c026d3" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingWithLatifa;
