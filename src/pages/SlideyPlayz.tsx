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
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@600;700;900&display=swap');

  :root {
    --v-green:   #10ffa0;
    --v-emerald: #10b981;
    --v-pink:    #ff4655;
    --v-cyan:    #00e4ff;
    --v-yellow:  #ffe500;
    --v-orange:  #ff9000;
    --v-purple:  #9b59ff;
    --v-bg:      #0f1923;
    --v-card:    #131f2b;
  }

  .vl-root { font-family: 'Rajdhani', sans-serif; }

  .vl-page {
    width: 100vw; height: 100dvh;
    background: var(--v-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  /* Valorant grid */
  .vl-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(16,255,160,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,255,160,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .vl-grid::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 35%, var(--v-bg) 100%);
  }

  .vl-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 55% 45% at 5%  5%,  rgba(16,255,160,0.1)  0%, transparent 55%),
      radial-gradient(ellipse 45% 40% at 95% 90%, rgba(255,70,85,0.08)  0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 60% 40%, rgba(0,228,255,0.04)  0%, transparent 55%);
  }

  /* Scale wrapper */
  .vl-scale-wrap { width: 440px; transform-origin: top center; position: relative; z-index: 10; }

  /* Card — Valorant diagonal cut */
  .vl-card {
    width: 440px;
    background: var(--v-card);
    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
    position: relative;
    border: 1px solid rgba(16,255,160,0.2);
    box-shadow:
      0 0 0 1px rgba(16,255,160,0.06),
      0 0 30px rgba(16,255,160,0.12),
      0 0 80px rgba(16,255,160,0.05),
      0 24px 64px rgba(0,0,0,0.6);
    overflow: visible;
  }
  .vl-card::before {
    content: '';
    position: absolute; inset: 0;
    clip-path: inherit;
    background: linear-gradient(145deg, rgba(16,255,160,0.04) 0%, transparent 50%, rgba(255,70,85,0.02) 100%);
    pointer-events: none; z-index: 0;
  }

  /* HERO */
  .vl-hero {
    position: relative; z-index: 1;
    padding: 16px 20px 14px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(16,255,160,0.1) 0%, rgba(0,228,255,0.05) 50%, transparent 100%);
    border-bottom: 1px solid rgba(16,255,160,0.15);
  }
  .vl-hero::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--v-green), var(--v-cyan), var(--v-green));
    background-size: 200% 100%;
    animation: vl-slide 2.5s linear infinite;
    box-shadow: 0 0 8px var(--v-green), 0 0 18px rgba(16,255,160,0.4);
  }
  @keyframes vl-slide { 0%{background-position:0%} 100%{background-position:200%} }
  .vl-hero::after {
    content: '';
    position: absolute; bottom: -1px; right: 0;
    border-bottom: 28px solid var(--v-card);
    border-left: 28px solid transparent;
  }
  .vl-hero-blob {
    position: absolute; top: -20px; right: -20px;
    width: 110px; height: 110px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,255,160,0.18) 0%, transparent 65%);
    pointer-events: none;
  }
  .vl-corner-tl {
    position: absolute; top: 8px; left: 8px;
    width: 12px; height: 12px;
    border-top: 2px solid var(--v-green); border-left: 2px solid var(--v-green);
    z-index: 2;
  }

  @keyframes vl-g1 {
    0%,90%,100%{clip-path:none;transform:none;}
    91%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-3px);}
    92%{clip-path:polygon(0 58%,100% 58%,100% 76%,0 76%);transform:translateX(3px);}
    93%{clip-path:none;transform:none;}
  }
  @keyframes vl-g2 {
    0%,90%,100%{opacity:0;}
    91%{opacity:0.55;transform:translateX(5px);clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);}
    92%{opacity:0.55;transform:translateX(-5px);clip-path:polygon(0 58%,100% 58%,100% 76%,0 76%);}
    93%{opacity:0;}
  }
  .vl-name {
    font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 900;
    letter-spacing: 0.06em; color: #fff; line-height: 1;
    position: relative; z-index: 1;
    animation: vl-g1 10s ease-in-out infinite;
    text-shadow: 0 0 6px #fff, 0 0 14px var(--v-green), 0 0 28px rgba(16,255,160,0.4);
  }
  .vl-name::after {
    content: attr(data-text); position: absolute; inset: 0;
    color: var(--v-green); animation: vl-g2 10s ease-in-out infinite;
    pointer-events: none; text-shadow: 0 0 8px var(--v-green);
  }
  .vl-hero-sub {
    font-family: 'Rajdhani', sans-serif;
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(16,255,160,0.45); margin-top: 3px; position: relative; z-index: 1;
  }

  @keyframes vl-pulse { 0%,100%{box-shadow:0 0 5px var(--v-green);} 50%{box-shadow:none;} }
  .vl-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(16,255,160,0.08); border: 1px solid rgba(16,255,160,0.4);
    border-radius: 2px; padding: 3px 10px; flex-shrink: 0; position: relative; z-index: 1;
  }
  .vl-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--v-green); animation: vl-pulse 1.5s ease-in-out infinite; }

  /* Body */
  .vl-body { padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 1; }

  .vl-lbl {
    font-family: 'Rajdhani', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    display: block; margin-bottom: 5px; color: rgba(16,255,160,0.5);
  }

  /* Inputs */
  .vl-iw input {
    width: 100% !important;
    background: rgba(0,0,0,0.4) !important;
    border: 1px solid rgba(16,255,160,0.2) !important;
    border-left: 2px solid rgba(16,255,160,0.4) !important;
    border-radius: 2px !important;
    color: #e0fff8 !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 15px !important; font-weight: 600 !important;
    padding: 8px 12px !important;
    outline: none !important; transition: all .2s !important;
    caret-color: var(--v-green);
  }
  .vl-iw input:focus {
    border-color: rgba(16,255,160,0.6) !important;
    border-left-color: var(--v-green) !important;
    background: rgba(16,255,160,0.04) !important;
    box-shadow: 0 0 0 1px rgba(16,255,160,0.1), 0 0 16px rgba(16,255,160,0.1) !important;
  }
  .vl-iw input::placeholder { color: rgba(16,255,160,0.2) !important; }
  .vl-iw input:disabled, .vl-iw input[readonly] { opacity: .35 !important; cursor: not-allowed !important; }

  .vl-ta {
    width: 100%; background: rgba(0,0,0,0.4);
    border: 1px solid rgba(16,255,160,0.2); border-left: 2px solid rgba(16,255,160,0.4);
    border-radius: 2px; color: #e0fff8;
    font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600;
    padding: 8px 12px; resize: none; outline: none; line-height: 1.5;
    caret-color: var(--v-green); transition: all .2s;
  }
  .vl-ta:focus {
    border-color: rgba(16,255,160,0.6); border-left-color: var(--v-green);
    background: rgba(16,255,160,0.04);
    box-shadow: 0 0 0 1px rgba(16,255,160,0.1), 0 0 16px rgba(16,255,160,0.1);
  }
  .vl-ta::placeholder { color: rgba(16,255,160,0.2); }

  .vl-cbar { height: 2px; margin-top: 4px; background: rgba(16,255,160,0.08); overflow: hidden; }
  .vl-cbar-fill { height: 100%; transition: width .12s, background .2s; }

  .vl-div { height: 1px; background: linear-gradient(90deg, transparent, rgba(16,255,160,0.18), rgba(0,228,255,0.12), transparent); }

  /* ═══════════════════════════════════════════════
     3D TYPE BUTTONS — NO clip-path on wrapper/after
     clip-path only on the .vl-tb-face (visual only)
  ═══════════════════════════════════════════════ */
  .vl-types { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; padding-bottom: 6px; }

  /* Wrapper: plain rectangle — clip-path would hide ::after */
  .vl-tb {
    position: relative;
    padding: 0; border: none; background: none;
    cursor: pointer; outline: none;
    display: block; width: 100%;
    border-radius: 4px;
  }

  /* Face: gets the Valorant cut-corner look */
  .vl-tb-face {
    position: relative; z-index: 2;
    padding: 9px 3px 8px; text-align: center;
    clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%);
    transition: transform .1s ease, box-shadow .1s ease;
    transform: translateY(-6px);
  }

  /* Side face: plain rect so it's always fully visible */
  .vl-tb::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: calc(100% - 4px);
    border-radius: 4px;
    z-index: 1;
  }

  /* GREEN */
  .vl-tb-gn .vl-tb-face {
    background: linear-gradient(160deg, rgba(16,255,160,0.18), rgba(0,80,50,0.6));
    border: 1.5px solid rgba(16,255,160,0.6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 10px rgba(16,255,160,0.2);
  }
  .vl-tb-gn::after { background: #003d28; border: 1.5px solid rgba(16,255,160,0.3); }
  .vl-tb-gn:hover .vl-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(16,255,160,0.5), 0 0 30px rgba(16,255,160,0.15); transform: translateY(-8px); }
  .vl-tb-gn.vl-on .vl-tb-face {
    transform: translateY(0);
    background: linear-gradient(160deg, rgba(16,255,160,0.3), rgba(0,110,65,0.65));
    border-color: var(--v-green);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(16,255,160,0.75), 0 0 36px rgba(16,255,160,0.28), inset 0 0 12px rgba(16,255,160,0.14);
  }

  /* CYAN */
  .vl-tb-cy .vl-tb-face {
    background: linear-gradient(160deg, rgba(0,228,255,0.18), rgba(0,80,110,0.6));
    border: 1.5px solid rgba(0,228,255,0.6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 10px rgba(0,228,255,0.2);
  }
  .vl-tb-cy::after { background: #003348; border: 1.5px solid rgba(0,228,255,0.3); }
  .vl-tb-cy:hover .vl-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(0,228,255,0.5), 0 0 30px rgba(0,228,255,0.15); transform: translateY(-8px); }
  .vl-tb-cy.vl-on .vl-tb-face {
    transform: translateY(0);
    background: linear-gradient(160deg, rgba(0,228,255,0.3), rgba(0,130,160,0.65));
    border-color: var(--v-cyan);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(0,228,255,0.75), 0 0 36px rgba(0,228,255,0.28), inset 0 0 12px rgba(0,228,255,0.14);
  }

  /* ORANGE */
  .vl-tb-or .vl-tb-face {
    background: linear-gradient(160deg, rgba(255,144,0,0.2), rgba(130,55,0,0.6));
    border: 1.5px solid rgba(255,144,0,0.6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 10px rgba(255,144,0,0.2);
  }
  .vl-tb-or::after { background: #512200; border: 1.5px solid rgba(255,144,0,0.3); }
  .vl-tb-or:hover .vl-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(255,144,0,0.5), 0 0 30px rgba(255,144,0,0.15); transform: translateY(-8px); }
  .vl-tb-or.vl-on .vl-tb-face {
    transform: translateY(0);
    background: linear-gradient(160deg, rgba(255,144,0,0.3), rgba(170,75,0,0.65));
    border-color: var(--v-orange);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(255,144,0,0.75), 0 0 36px rgba(255,144,0,0.28), inset 0 0 12px rgba(255,144,0,0.14);
  }

  /* PURPLE */
  .vl-tb-pu .vl-tb-face {
    background: linear-gradient(160deg, rgba(155,89,255,0.2), rgba(75,0,140,0.6));
    border: 1.5px solid rgba(155,89,255,0.6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 10px rgba(155,89,255,0.2);
  }
  .vl-tb-pu::after { background: #300058; border: 1.5px solid rgba(155,89,255,0.3); }
  .vl-tb-pu:hover .vl-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(155,89,255,0.5), 0 0 30px rgba(155,89,255,0.15); transform: translateY(-8px); }
  .vl-tb-pu.vl-on .vl-tb-face {
    transform: translateY(0);
    background: linear-gradient(160deg, rgba(155,89,255,0.3), rgba(100,0,180,0.65));
    border-color: var(--v-purple);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 18px rgba(155,89,255,0.75), 0 0 36px rgba(155,89,255,0.28), inset 0 0 12px rgba(155,89,255,0.14);
  }

  /* Press */
  .vl-tb:active .vl-tb-face { transform: translateY(0px) !important; }

  .vl-tb-emoji { font-size: 17px; display: block; line-height: 1; }
  .vl-tb-name {
    font-family: 'Rajdhani', sans-serif;
    font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    display: block; margin-top: 4px; transition: color .15s, text-shadow .15s;
  }
  .vl-tb-min { font-family: 'Rajdhani', sans-serif; font-size: 8px; font-weight: 600; color: rgba(255,229,0,0.65); display: block; margin-top: 1px; }

  /* Amount */
  .vl-amt { display: flex; gap: 7px; }
  .vl-cur {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(0,0,0,0.4) !important;
    border: 1px solid rgba(16,255,160,0.2) !important;
    border-left: 2px solid rgba(16,255,160,0.4) !important;
    border-radius: 2px !important; color: #e0fff8 !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 13px !important; font-weight: 700 !important; padding: 0 10px !important;
    min-width: 88px; height: 38px; cursor: pointer; transition: all .2s; flex-shrink: 0;
  }
  .vl-cur:hover {
    border-color: rgba(16,255,160,0.5) !important;
    border-left-color: var(--v-green) !important;
    box-shadow: 0 0 10px rgba(16,255,160,0.12) !important;
  }

  /* Sub panels */
  .vl-sp { padding: 10px 12px; }
  .vl-sp-or { background: rgba(255,144,0,0.05); border: 1px solid rgba(255,144,0,0.3); border-left: 2px solid rgba(255,144,0,0.6); box-shadow: 0 0 12px rgba(255,144,0,0.08); }
  .vl-sp-pu { background: rgba(155,89,255,0.05); border: 1px solid rgba(155,89,255,0.3); border-left: 2px solid rgba(155,89,255,0.6); box-shadow: 0 0 12px rgba(155,89,255,0.08); }
  .vl-sp-gn { background: rgba(16,255,160,0.04); border: 1px solid rgba(16,255,160,0.25); border-left: 2px solid rgba(16,255,160,0.5); box-shadow: 0 0 12px rgba(16,255,160,0.07); }

  /* ═══════════════════════════════════════════
     3D DONATE BUTTON — no clip-path on wrapper
     Clip-path only on the .vl-btn face
  ═══════════════════════════════════════════ */
  .vl-btn-wrap {
    position: relative; width: 100%;
    padding-bottom: 7px; /* space for the side */
    border-radius: 4px;
  }
  /* Side face — plain rect, fully visible */
  .vl-btn-wrap::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: calc(100% - 5px);
    border-radius: 4px; z-index: 1;
    background: linear-gradient(90deg, #004d30, #006840, #003820);
    border: 1px solid rgba(16,255,160,0.25);
  }
  .vl-btn {
    position: relative; z-index: 2;
    width: 100%; padding: 13px; border: none; cursor: pointer;
    font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: #071a0f;
    /* Cut-corner on the face only */
    clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
    transition: transform .1s ease, box-shadow .1s ease;
    transform: translateY(-7px);
    background: linear-gradient(135deg, #10ffa0 0%, #00e4aa 50%, #00c890 100%);
    border-top: 1px solid rgba(255,255,255,0.35);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px rgba(16,255,160,0.5), 0 0 40px rgba(16,255,160,0.2);
    overflow: hidden;
  }
  .vl-btn:hover:not(:disabled) {
    transform: translateY(-9px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 0 32px rgba(16,255,160,0.75), 0 0 64px rgba(16,255,160,0.3);
  }
  .vl-btn:active:not(:disabled) { transform: translateY(0px) !important; box-shadow: inset 0 2px 6px rgba(0,0,0,0.3), 0 0 14px rgba(16,255,160,0.3) !important; }
  .vl-btn:disabled { opacity: .35; cursor: not-allowed; }
  .vl-btn::before {
    content: ''; position: absolute; top: 0; left: -110%; width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    transform: skewX(-20deg); transition: left .5s;
  }
  .vl-btn:hover:not(:disabled)::before { left: 160%; }

  .vl-hint { font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 600; color: rgba(16,255,160,0.4); margin-top: 3px; letter-spacing: .06em; }

  @keyframes vl-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .vl-fu { animation: vl-fu .2s ease forwards; }

  @keyframes vl-sp-a { to{transform:rotate(360deg);} }
  .vl-spin { width: 14px; height: 14px; border: 2px solid rgba(7,26,15,0.4); border-top-color: #071a0f; border-radius: 50%; display: inline-block; animation: vl-sp-a .6s linear infinite; }

  @keyframes vl-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .vl-in { animation: vl-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const SlideyPlayz = () => {
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded]         = useState(false);

  const { pricing }      = useStreamerPricing('slidey_playz', selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency==="INR") { if (amount>=500) return 15; if (amount>=300) return 12; return 8; }
    if (amount>=6) return 15; if (amount>=4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale = useCallback(() => {
    const wrap=wrapRef.current; const card=cardRef.current;
    if (!wrap||!card) return;
    const scaleW = Math.min(1,(window.innerWidth-32)/440);
    const scaleH = card.scrollHeight>0 ? Math.min(1,(window.innerHeight-48)/card.scrollHeight) : 1;
    const scale  = Math.min(scaleW,scaleH);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.height    = `${card.scrollHeight*scale}px`;
  }, []);

  useEffect(() => {
    const t=setTimeout(applyScale,80);
    window.addEventListener('resize',applyScale);
    return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); };
  }, [applyScale]);

  useEffect(() => { const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); }, [donationType,applyScale]);

  useEffect(() => {
    const s=document.createElement("script");
    s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>{ setRazorpayLoaded(true); console.log('Razorpay SDK loaded'); };
    s.onerror=()=>console.error('Failed to load Razorpay SDK');
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target; setFormData(prev=>({...prev,[name]:value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded||!(window as any).Razorpay) { toast.error("Payment system is still loading."); return; }
    if (!formData.name||!formData.amount) { toast.error("Please fill in all required fields"); return; }
    const amount=parseFloat(formData.amount);
    if (isNaN(amount)||amount<=0) { toast.error("Please enter a valid amount"); return; }
    const minAmount=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<minAmount) { toast.error(`Minimum for ${donationType} is ${currencySymbol}${minAmount}`); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { toast.error("Please record a voice message"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { toast.error("Please select a sound"); return; }
    if (donationType==="media"&&!mediaUrl) { toast.error("Please upload a media file"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==="voice"&&voiceRecorder.audioBlob) {
        if (!voiceRecorder.audioBlob||voiceRecorder.audioBlob.size===0) throw new Error("No voice recording found.");
        const voiceDataBase64=await new Promise<string>((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>{ const r=reader.result as string; if(!r||!r.includes(",")){ reject(new Error("Failed to read voice data")); return; } resolve(r.split(",")[1]); };
          reader.onerror=()=>reject(new Error("Failed to read voice recording"));
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const {data:up,error:ue}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:voiceDataBase64,streamerSlug:"slidey_playz"}});
        if (ue) throw new Error("Failed to upload voice message");
        voiceMessageUrl=up.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{streamer_slug:'slidey_playz',name:formData.name,amount:parseFloat(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl,hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null,mediaType:donationType==="media"?mediaType:null,
          currency:selectedCurrency}
      });
      if (error) throw error;
      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id,amount:data.amount,currency:data.currency,
        order_id:data.razorpay_order_id,name:"Slidey Playz",description:"Support Slidey Playz",
        handler:(response:any)=>navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#10b981"},
      });
      rzp.open();
    } catch(error) {
      console.error("Payment error:",error);
      toast.error("Failed to process payment. Please try again.");
    } finally { setIsProcessingPayment(false); }
  };

  const handleDonationTypeChange=(value:"text"|"voice"|"hypersound"|"media")=>{
    setDonationType(value);
    if (value==="hypersound") setFormData(p=>({...p,amount:String(pricing.minHypersound),message:""}));
    else if (value==="voice") setFormData(p=>({...p,amount:String(pricing.minVoice),message:""}));
    else if (value==="media"){setFormData(p=>({...p,amount:String(pricing.minMedia),message:""}));setMediaUrl(null);setMediaType(null);}
    else setFormData(p=>({...p,amount:String(pricing.minText),message:""}));
  };

  const msgPct = maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr = msgPct>90?'var(--v-pink)':msgPct>70?'var(--v-yellow)':'var(--v-green)';

  const TYPES=[
    {key:'text' as const,      emoji:'💬', label:'Text',  min:pricing.minText,       tc:'vl-tb-gn', nc:'var(--v-green)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'vl-tb-cy', nc:'var(--v-cyan)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'vl-tb-or', nc:'var(--v-orange)'},
    {key:'media' as const,     emoji:'🖼️', label:'Media', min:pricing.minMedia,      tc:'vl-tb-pu', nc:'var(--v-purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <div className="vl-root vl-page">
        <div className="vl-grid"/>
        <div className="vl-atm"/>

        <div ref={wrapRef} className="vl-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="vl-card vl-in">

            {/* HERO */}
            <div className="vl-hero">
              <div className="vl-hero-blob"/>
              <div className="vl-corner-tl"/>
              <div>
                <div className="vl-name" data-text="SLIDEY PLAYZ">SLIDEY PLAYZ</div>
                <div className="vl-hero-sub">// Support with a donation</div>
              </div>
              <div className="vl-live">
                <div className="vl-live-dot"/>
                <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,color:'#00ff88',letterSpacing:'0.1em',textShadow:'0 0 6px #00ff88'}}>LIVE</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="vl-body">

                {/* Name */}
                <div>
                  <label className="vl-lbl">Your Name</label>
                  <div className="vl-iw"><Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                {/* 3D Type buttons */}
                <div>
                  <label className="vl-lbl">Donation Type</label>
                  <div className="vl-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('vl-tb',t.tc,donationType===t.key?'vl-on':'')}>
                        <div className="vl-tb-face">
                          <span className="vl-tb-emoji">{t.emoji}</span>
                          <span className="vl-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.4)',textShadow:donationType===t.key?`0 0 10px ${t.nc},0 0 20px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="vl-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="vl-lbl">Amount</label>
                  <div className="vl-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="vl-cur">
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
                              {SUPPORTED_CURRENCIES.map(currency=>(
                                <CommandItem key={currency.code} value={currency.code} onSelect={v=>{setSelectedCurrency(v.toUpperCase());setCurrencyOpen(false);}}>
                                  <Check className={cn("mr-2 h-4 w-4",selectedCurrency===currency.code?"opacity-100":"opacity-0")}/>
                                  {currency.symbol} {currency.code} - {currency.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="vl-iw" style={{flex:1}}>
                      <Input id="amount" name="amount" type="number" placeholder="0" value={formData.amount}
                        onChange={handleInputChange} readOnly={donationType==="hypersound"} required min="1"/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="vl-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="vl-div"/>

                {/* Text */}
                {donationType==="text"&&(
                  <div className="vl-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="vl-lbl" style={{margin:0}}>Message</label>
                      <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,color:msgClr,textShadow:`0 0 6px ${msgClr}`,letterSpacing:'0.06em'}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Enter your message..." className="vl-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="vl-cbar"><div className="vl-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 6px ${msgClr}`}}/></div>
                  </div>
                )}

                {/* Voice */}
                {donationType==="voice"&&(
                  <div className="vl-fu">
                    <label className="vl-lbl">Voice Message</label>
                    <div className="vl-sp vl-sp-gn">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}}
                        maxDurationSeconds={getVoiceDuration(currentAmount)} brandColor="#10b981"
                        requiredAmount={pricing.minVoice} currentAmount={currentAmount}/>
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType==="hypersound"&&(
                  <div className="vl-fu vl-sp vl-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:15}}>🔊</span>
                      <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.1em',color:'var(--v-orange)',textShadow:'0 0 8px var(--v-orange)',textTransform:'uppercase'}}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="vl-fu vl-sp vl-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:15}}>🖼️</span>
                      <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.1em',color:'var(--v-purple)',textShadow:'0 0 8px var(--v-purple)',textTransform:'uppercase'}}>Media Upload</span>
                    </div>
                    <MediaUploader streamerSlug="slidey_playz"
                      onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}}
                      onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}
                      maxFileSizeMB={10} maxVideoDurationSeconds={15}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* 3D Donate */}
                <div className="vl-btn-wrap">
                  <button type="submit" className="vl-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="vl-spin"/>PROCESSING
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Heart style={{width:14,height:14}}/>
                        SUPPORT {currencySymbol}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.5,letterSpacing:'0.06em'}}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY · RBI COMPLIANCE
                </p>
                <DonationPageFooter brandColor="#10b981"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlideyPlayz;
