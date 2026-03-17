import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Crosshair } from "lucide-react";
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
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

  :root {
    --bz-gold:        #c4a747;
    --bz-gold-dark:   #8a7a3a;
    --bz-gold-dim:    #5a4f25;
    --bz-green:       #4a5c3e;
    --bz-green-light: #6a8a55;
    --bz-bg:          #080a06;
    --bz-card:        #0c0f09;
    --bz-text:        #d4c9a8;
  }

  .bz-root { font-family: 'Rajdhani', sans-serif; }

  .bz-page {
    width: 100vw; height: 100dvh;
    background: var(--bz-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  /* Atmospheric BG */
  .bz-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 65% 50% at 10% 15%, rgba(74,92,62,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 88% 80%, rgba(196,167,71,0.1) 0%, transparent 55%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(74,92,62,0.06) 0%, transparent 60%);
  }

  /* Tactical grid overlay */
  .bz-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035;
    background-image:
      linear-gradient(rgba(196,167,71,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(196,167,71,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .bz-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .bz-card {
    width: 420px;
    background: var(--bz-card);
    border-radius: 3px;
    border: 1px solid rgba(74,92,62,0.5);
    box-shadow:
      0 0 0 1px rgba(196,167,71,0.06),
      0 0 28px rgba(74,92,62,0.2),
      0 0 65px rgba(74,92,62,0.08),
      0 30px 80px rgba(0,0,0,0.85);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
  }

  /* ── HERO ── */
  .bz-hero {
    position: relative;
    padding: 16px 20px 14px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(74,92,62,0.25) 0%, rgba(40,55,30,0.2) 60%, transparent 100%);
    border-bottom: 1px solid rgba(74,92,62,0.3);
  }

  /* Animated top border */
  .bz-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--bz-green), var(--bz-gold), var(--bz-green-light), var(--bz-gold), var(--bz-green));
    background-size: 200% 100%;
    animation: bz-shift 4s linear infinite;
    box-shadow: 0 0 8px var(--bz-gold), 0 0 20px rgba(196,167,71,0.3);
  }

  /* Corner cut decoration */
  .bz-hero::after {
    content: ''; position: absolute; bottom: 0; right: 0;
    width: 0; height: 0;
    border-style: solid;
    border-width: 0 0 24px 24px;
    border-color: transparent transparent rgba(196,167,71,0.2) transparent;
  }

  @keyframes bz-shift { 0%{background-position:0%} 100%{background-position:200%} }

  .bz-hero-blob {
    position: absolute; top: -40px; right: -40px;
    width: 150px; height: 150px; border-radius: 50%;
    background: radial-gradient(circle, rgba(74,92,62,0.3) 0%, transparent 65%);
    pointer-events: none;
  }

  .bz-operator-tag { display: flex; flex-direction: column; position: relative; z-index: 1; }

  .bz-tag-prefix {
    font-family: 'Orbitron', monospace;
    font-size: 9px; font-weight: 700;
    color: rgba(196,167,71,0.5);
    letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 2px;
  }

  @keyframes bz-flicker {
    0%,19%,21%,23%,52%,54%,100% {
      text-shadow: 0 0 4px #fff, 0 0 12px var(--bz-gold), 0 0 28px var(--bz-gold), 0 0 50px var(--bz-gold-dark);
      opacity: 1;
    }
    20%,22%,53% { text-shadow: none; opacity: 0.8; }
  }

  .bz-name {
    font-family: 'Orbitron', monospace;
    font-size: 26px; font-weight: 900;
    color: #fff; line-height: 1;
    letter-spacing: 0.06em;
    animation: bz-flicker 10s infinite;
    position: relative; z-index: 1;
  }

  .bz-hero-sub {
    font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.28);
    margin-top: 4px; position: relative; z-index: 1;
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  /* LIVE badge */
  @keyframes bz-pulse { 0%,100%{box-shadow:0 0 5px var(--bz-green-light);} 50%{box-shadow:none;} }
  .bz-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(74,92,62,0.15);
    border: 1.5px solid rgba(106,138,85,0.5);
    border-radius: 2px; padding: 4px 10px;
    flex-shrink: 0; position: relative; z-index: 1;
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  }
  .bz-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bz-green-light); animation: bz-pulse 1.5s ease-in-out infinite; }
  .bz-live-text { font-family:'Orbitron',monospace; font-size: 9px; font-weight: 700; color: var(--bz-green-light); letter-spacing: 0.12em; text-shadow: 0 0 8px var(--bz-green-light); }

  /* ── Body ── */
  .bz-body { padding: 14px 18px 16px; display: flex; flex-direction: column; gap: 12px; }

  .bz-lbl {
    font-family: 'Orbitron', monospace;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    display: block; margin-bottom: 6px;
    color: rgba(196,167,71,0.65);
  }

  /* Inputs */
  .bz-iw input {
    width: 100% !important;
    background: rgba(74,92,62,0.06) !important;
    border: 1px solid rgba(74,92,62,0.35) !important;
    border-radius: 2px !important;
    color: #fff !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 15px !important; font-weight: 600 !important;
    padding: 8px 12px !important;
    outline: none !important; transition: all .2s !important;
    caret-color: var(--bz-gold);
  }
  .bz-iw input:focus { border-color: var(--bz-gold) !important; background: rgba(196,167,71,0.06) !important; box-shadow: 0 0 0 2px rgba(196,167,71,0.12), 0 0 14px rgba(196,167,71,0.1) !important; }
  .bz-iw input::placeholder { color: rgba(255,255,255,0.2) !important; }
  .bz-iw input:disabled, .bz-iw input[readonly] { opacity: .38 !important; cursor: not-allowed !important; }

  .bz-ta {
    width: 100%; background: rgba(74,92,62,0.06); border: 1px solid rgba(74,92,62,0.35);
    border-radius: 2px; color: #fff; font-family: 'Rajdhani',sans-serif; font-size: 14px; font-weight: 600;
    padding: 8px 12px; resize: none; outline: none; line-height: 1.5; caret-color: var(--bz-gold); transition: all .2s;
  }
  .bz-ta:focus { border-color: var(--bz-gold); background: rgba(196,167,71,0.06); box-shadow: 0 0 0 2px rgba(196,167,71,0.12), 0 0 14px rgba(196,167,71,0.1); }
  .bz-ta::placeholder { color: rgba(255,255,255,0.2); }

  .bz-cbar { height: 2px; margin-top: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
  .bz-cbar-fill { height: 100%; border-radius: 2px; transition: width .12s, background .2s; }

  /* ── Type Buttons ── */
  .bz-types { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; padding-bottom: 4px; }

  .bz-tb { position: relative; padding: 0; border: none; background: none; cursor: pointer; outline: none; border-radius: 3px; display: block; width: 100%; }
  .bz-tb-face { position: relative; z-index: 2; padding: 10px 4px 9px; border-radius: 3px; text-align: center; transition: transform .1s ease, box-shadow .1s ease; transform: translateY(-5px); }
  .bz-tb::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: calc(100% - 3px); border-radius: 3px; z-index: 1; }

  /* Gold — text */
  .bz-tb-gd .bz-tb-face { background: linear-gradient(160deg,rgba(196,167,71,0.18),rgba(100,80,20,0.5)); border: 1.5px solid rgba(196,167,71,0.55); box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 10px rgba(196,167,71,0.15); }
  .bz-tb-gd::after { background: #4a3c10; border: 1.5px solid rgba(196,167,71,0.3); }
  .bz-tb-gd:hover .bz-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(196,167,71,0.45); }
  .bz-tb-gd.bz-on .bz-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(196,167,71,0.3),rgba(140,110,30,0.55)); border-color: var(--bz-gold); box-shadow: inset 0 2px 5px rgba(0,0,0,0.35), 0 0 18px rgba(196,167,71,0.7), 0 0 34px rgba(196,167,71,0.25), inset 0 0 12px rgba(196,167,71,0.1); }

  /* Green — voice */
  .bz-tb-gn .bz-tb-face { background: linear-gradient(160deg,rgba(74,92,62,0.22),rgba(30,50,20,0.55)); border: 1.5px solid rgba(74,92,62,0.6); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 10px rgba(74,92,62,0.15); }
  .bz-tb-gn::after { background: #1a2e14; border: 1.5px solid rgba(74,92,62,0.3); }
  .bz-tb-gn:hover .bz-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px rgba(106,138,85,0.4); }
  .bz-tb-gn.bz-on .bz-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(74,92,62,0.35),rgba(50,75,35,0.6)); border-color: var(--bz-green-light); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(106,138,85,0.65), 0 0 32px rgba(74,92,62,0.25), inset 0 0 12px rgba(74,92,62,0.12); }

  /* Orange — hypersound */
  .bz-tb-or .bz-tb-face { background: linear-gradient(160deg,rgba(200,100,20,0.2),rgba(120,50,0,0.5)); border: 1.5px solid rgba(200,120,30,0.55); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 10px rgba(200,100,20,0.15); }
  .bz-tb-or::after { background: #5a2800; border: 1.5px solid rgba(200,100,20,0.3); }
  .bz-tb-or:hover .bz-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px rgba(200,120,30,0.45); }
  .bz-tb-or.bz-on .bz-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(200,120,30,0.32),rgba(160,80,0,0.55)); border-color: #e08020; box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(200,120,30,0.65), 0 0 32px rgba(200,100,20,0.25), inset 0 0 12px rgba(200,100,20,0.1); }

  /* Red — media */
  .bz-tb-rd .bz-tb-face { background: linear-gradient(160deg,rgba(180,30,30,0.2),rgba(100,10,10,0.5)); border: 1.5px solid rgba(180,40,40,0.55); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 10px rgba(180,30,30,0.15); }
  .bz-tb-rd::after { background: #4a0a0a; border: 1.5px solid rgba(180,30,30,0.3); }
  .bz-tb-rd:hover .bz-tb-face { box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px rgba(200,50,50,0.45); }
  .bz-tb-rd.bz-on .bz-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(180,40,40,0.32),rgba(140,20,20,0.55)); border-color: #e04040; box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(200,50,50,0.65), 0 0 32px rgba(180,30,30,0.25), inset 0 0 12px rgba(180,30,30,0.1); }

  .bz-tb:active .bz-tb-face { transform: translateY(0px) !important; }
  .bz-tb-emoji { font-size: 18px; display: block; line-height: 1; }
  .bz-tb-name  { font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; display: block; margin-top: 4px; transition: color .15s, text-shadow .15s; }
  .bz-tb-min   { font-size: 7px; font-weight: 700; color: rgba(196,167,71,0.6); display: block; margin-top: 2px; }

  /* Amount row */
  .bz-amt { display: flex; gap: 7px; }
  .bz-cur {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(74,92,62,0.06) !important; border: 1px solid rgba(74,92,62,0.35) !important;
    border-radius: 2px !important; color: #fff !important;
    font-family: 'Rajdhani', sans-serif !important; font-size: 13px !important; font-weight: 700 !important;
    padding: 0 10px !important; min-width: 90px; height: 38px; cursor: pointer; transition: all .2s; flex-shrink: 0;
  }
  .bz-cur:hover { border-color: var(--bz-gold) !important; box-shadow: 0 0 10px rgba(196,167,71,0.15) !important; }

  .bz-div { height: 1px; background: linear-gradient(90deg, transparent, rgba(74,92,62,0.4), rgba(196,167,71,0.2), transparent); }

  /* Sub panels */
  .bz-sp { border-radius: 3px; padding: 10px 12px; }
  .bz-sp-gn { background: rgba(74,92,62,0.08); border: 1px solid rgba(74,92,62,0.4); box-shadow: 0 0 14px rgba(74,92,62,0.08); }
  .bz-sp-or { background: rgba(200,100,20,0.06); border: 1px solid rgba(200,120,30,0.35); box-shadow: 0 0 14px rgba(200,100,20,0.06); }
  .bz-sp-rd { background: rgba(180,30,30,0.06); border: 1px solid rgba(180,40,40,0.3); box-shadow: 0 0 14px rgba(180,30,30,0.06); }

  /* ── Donate Button ── */
  .bz-btn-wrap { position: relative; width: 100%; border-radius: 3px; padding-bottom: 5px; }
  .bz-btn-wrap::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: calc(100% - 4px); border-radius: 3px; z-index: 1; background: linear-gradient(90deg, #1a2810, #2a3c18, #1e3010); }
  .bz-btn {
    position: relative; z-index: 2; width: 100%; padding: 13px; border: none; cursor: pointer;
    font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 900; letter-spacing: .08em; color: var(--bz-gold);
    border-radius: 3px; transition: transform .1s ease, box-shadow .1s ease; transform: translateY(-5px);
    background: linear-gradient(135deg, #2a3c18 0%, #3a5022 50%, #2e4418 100%);
    border-top: 1.5px solid rgba(196,167,71,0.3); border-left: 1.5px solid rgba(196,167,71,0.15);
    box-shadow: inset 0 1px 0 rgba(196,167,71,0.12), 0 0 18px rgba(74,92,62,0.4), 0 0 36px rgba(74,92,62,0.15);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  }
  .bz-btn:hover:not(:disabled) { box-shadow: inset 0 1px 0 rgba(196,167,71,0.2), 0 0 28px rgba(196,167,71,0.4), 0 0 55px rgba(74,92,62,0.25); text-shadow: 0 0 12px var(--bz-gold); }
  .bz-btn:active:not(:disabled) { transform: translateY(0px) !important; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5) !important; }
  .bz-btn:disabled { opacity: .38; cursor: not-allowed; }
  .bz-btn::before { content: ''; position: absolute; top: 0; left: -110%; width: 55%; height: 100%; background: linear-gradient(90deg,transparent,rgba(196,167,71,0.12),transparent); transform: skewX(-20deg); transition: left .5s; }
  .bz-btn:hover:not(:disabled)::before { left: 160%; }

  .bz-hint { font-size: 10px; font-weight: 600; color: rgba(196,167,71,0.5); margin-top: 3px; font-family: 'Rajdhani', sans-serif; }

  @keyframes bz-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .bz-fu { animation: bz-fu .2s ease forwards; }

  @keyframes bz-sp-a { to{transform:rotate(360deg);} }
  .bz-spin { width: 14px; height: 14px; border: 2px solid rgba(196,167,71,0.35); border-top-color: var(--bz-gold); border-radius: 50%; display: inline-block; animation: bz-sp-a .65s linear infinite; }

  @keyframes bz-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .bz-in { animation: bz-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const Brigzard = () => {
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [formData, setFormData]                       = useState({ name: "", amount: "", message: "" });
  const [selectedCurrency, setSelectedCurrency]       = useState("INR");
  const [currencyOpen, setCurrencyOpen]               = useState(false);
  const [donationType, setDonationType]               = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound]   = useState<string|null>(null);
  const [mediaUrl, setMediaUrl]                       = useState<string|null>(null);
  const [mediaType, setMediaType]                     = useState<string|null>(null);
  const [razorpayLoaded, setRazorpayLoaded]           = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { pricing }      = useStreamerPricing("brigzard", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") { if (amount >= 500) return 15; if (amount >= 300) return 12; return 8; }
    if (amount >= 6) return 15; if (amount >= 4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  /* Auto-scale */
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
    s.onload  = () => setRazorpayLoaded(true);
    s.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(s);
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (value: "text"|"voice"|"hypersound"|"media") => {
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
      let voiceMessageUrl: string|null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", {
          body: { voiceData: base64, streamerSlug: "brigzard" },
        });
        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "brigzard",
          name: formData.name,
          amount: Number(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null,
          mediaType,
          currency: selectedCurrency,
        },
      });
      if (error) throw error;

      new (window as any).Razorpay({
        key: data.razorpay_key_id, amount: data.amount, currency: data.currency,
        order_id: data.razorpay_order_id, name: "BRIGZARD", description: "Support BRIGZARD",
        handler:      () => navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal: { ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`) },
        theme: { color: "#4a5c3e" },
      }).open();
    } catch {
      toast.error("Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const msgPct = maxMessageLength > 0 ? (formData.message.length / maxMessageLength) * 100 : 0;
  const msgClr = msgPct > 90 ? '#e04040' : msgPct > 70 ? '#c4a747' : '#6a8a55';

  const TYPES = [
    { key: 'text'       as const, emoji: '💬', label: 'Text',  min: pricing.minText,       tc: 'bz-tb-gd', nc: 'var(--bz-gold)' },
    { key: 'voice'      as const, emoji: '🎤', label: 'Voice', min: pricing.minVoice,      tc: 'bz-tb-gn', nc: 'var(--bz-green-light)' },
    { key: 'hypersound' as const, emoji: '🔊', label: 'Sound', min: pricing.minHypersound, tc: 'bz-tb-or', nc: '#e08020' },
    { key: 'media'      as const, emoji: '🖼️', label: 'Media', min: pricing.minMedia,      tc: 'bz-tb-rd', nc: '#e04040' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="bz-root bz-page">
        <div className="bz-atm" />
        <div className="bz-grid" />

        <div ref={wrapRef} className="bz-scale-wrap" style={{ transformOrigin: 'top center' }}>
          <div ref={cardRef} className="bz-card bz-in">

            {/* HERO */}
            <div className="bz-hero">
              <div className="bz-hero-blob" />
              <div className="bz-operator-tag">
                <span className="bz-tag-prefix">// Operator</span>
                <div className="bz-name">BRIGZARD</div>
                <div className="bz-hero-sub">Support with a donation ✦</div>
              </div>
              <div className="bz-live">
                <div className="bz-live-dot" />
                <span className="bz-live-text">LIVE</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="bz-body">

                {/* Name */}
                <div>
                  <label className="bz-lbl">// Operator Name</label>
                  <div className="bz-iw">
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required />
                  </div>
                </div>

                {/* Type buttons */}
                <div>
                  <label className="bz-lbl">// Mission Type</label>
                  <div className="bz-types">
                    {TYPES.map(t => (
                      <button key={t.key} type="button" onClick={() => handleDonationTypeChange(t.key)} className={cn('bz-tb', t.tc, donationType === t.key ? 'bz-on' : '')}>
                        <div className="bz-tb-face">
                          <span className="bz-tb-emoji">{t.emoji}</span>
                          <span className="bz-tb-name" style={{ color: donationType === t.key ? t.nc : 'rgba(255,255,255,0.4)', textShadow: donationType === t.key ? `0 0 10px ${t.nc}, 0 0 20px ${t.nc}` : 'none' }}>{t.label}</span>
                          <span className="bz-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="bz-lbl">// Support Amount</label>
                  <div className="bz-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="bz-cur">
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
                    <div className="bz-iw" style={{ flex: 1 }}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange}
                        min="1" placeholder="0" readOnly={donationType === "hypersound"} required />
                    </div>
                  </div>
                  {pricing.ttsEnabled && <p className="bz-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="bz-div" />

                {/* Text message */}
                {donationType === "text" && (
                  <div className="bz-fu">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <label className="bz-lbl" style={{ margin: 0 }}>// Message</label>
                      <span style={{ fontSize: 10, fontWeight: 700, color: msgClr, textShadow: `0 0 6px ${msgClr}`, fontFamily: 'Orbitron,monospace' }}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Your message (optional)" className="bz-ta" rows={2} maxLength={maxMessageLength} />
                    <div className="bz-cbar"><div className="bz-cbar-fill" style={{ width: `${msgPct}%`, background: msgClr, boxShadow: `0 0 6px ${msgClr}` }} /></div>
                  </div>
                )}

                {/* Voice */}
                {donationType === "voice" && (
                  <div className="bz-fu">
                    <label className="bz-lbl">// Voice Message</label>
                    <div className="bz-sp bz-sp-gn">
                      <EnhancedVoiceRecorder
                        controller={voiceRecorder}
                        onRecordingComplete={() => {}}
                        maxDurationSeconds={getVoiceDuration(currentAmount)}
                        requiredAmount={pricing.minVoice}
                        currentAmount={currentAmount}
                        brandColor="#4a5c3e" />
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType === "hypersound" && (
                  <div className="bz-fu bz-sp bz-sp-or">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🔊</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e08020', textShadow: '0 0 8px #e08020', fontFamily: 'Orbitron,monospace', letterSpacing: '0.08em' }}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
                  </div>
                )}

                {/* Media */}
                {donationType === "media" && (
                  <div className="bz-fu bz-sp bz-sp-rd">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🖼️</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e04040', textShadow: '0 0 8px #e04040', fontFamily: 'Orbitron,monospace', letterSpacing: '0.08em' }}>Media Upload</span>
                    </div>
                    <MediaUploader
                      streamerSlug="brigzard"
                      onMediaUploaded={(url, type) => { setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={() => { setMediaUrl(null); setMediaType(null); }} />
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

                {/* 3D Donate Button */}
                <div className="bz-btn-wrap">
                  <button type="submit" className="bz-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                        <span className="bz-spin" /> Processing...
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                        <Crosshair style={{ width: 15, height: 15 }} />
                        Support {currencySymbol}{formData.amount || '0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Rajdhani,sans-serif' }}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>
                <DonationPageFooter brandColor="#4a5c3e" />
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default Brigzard;
