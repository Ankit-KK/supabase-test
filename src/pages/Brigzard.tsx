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
  @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Orbitron:wght@400;500;700;900&display=swap');

  :root {
    --mw-black: #0a0a0a;
    --mw-dark: #121212;
    --mw-panel: #1a1a1a;
    --mw-border: #2e2e2e;
    --mw-text: #e0e0e0;
    --mw-text-dim: #888888;
    --mw-accent: #3a6b4c; /* muted military green */
    --mw-accent-glow: rgba(58, 107, 76, 0.5);
    --mw-white: #ffffff;
    --mw-error: #c0392b;
    --mw-success: #2e7d32;
    --mw-grid: rgba(255,255,255,0.03);
    --mw-font-heading: 'Teko', 'Arial Narrow', sans-serif;
    --mw-font-label: 'Orbitron', sans-serif;
    --mw-font-body: Arial, Helvetica, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--mw-black);
    color: var(--mw-text);
  }

  .mw-root {
    font-family: var(--mw-font-body);
  }

  .mw-page {
    width: 100vw;
    min-height: 100dvh;
    background: var(--mw-black);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
    position: relative;
  }

  /* Grid overlay */
  .mw-grid {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(var(--mw-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--mw-grid) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.4;
  }

  /* Scanline effect */
  .mw-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
  }

  .mw-scale-wrap {
    width: 420px;
    transform-origin: top center;
    position: relative;
    z-index: 10;
  }

  /* Card */
  .mw-card {
    width: 420px;
    background: var(--mw-panel);
    border-radius: 0;
    border: 1px solid var(--mw-border);
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset;
    transition: box-shadow 0.3s ease;
  }
  .mw-card.intensity-1 { box-shadow: 0 20px 40px rgba(0,0,0,0.9), 0 0 15px var(--mw-accent-glow); }
  .mw-card.intensity-2 { box-shadow: 0 20px 40px rgba(0,0,0,0.9), 0 0 25px var(--mw-accent-glow); }
  .mw-card.intensity-3 { box-shadow: 0 20px 40px rgba(0,0,0,0.9), 0 0 35px var(--mw-accent-glow); }

  /* Shake animation */
  .mw-card.shake {
    animation: mw-shake 0.4s ease-in-out;
  }
  @keyframes mw-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  /* Header */
  .mw-header {
    padding: 16px 20px;
    background: linear-gradient(180deg, #1e1e1e 0%, #151515 100%);
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }
  .mw-logo {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mw-logo-icon {
    width: 32px;
    height: 32px;
    background: var(--mw-accent);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
    box-shadow: 0 0 10px var(--mw-accent-glow);
  }
  .mw-logo-text {
    font-family: var(--mw-font-heading);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: white;
    text-shadow: 0 0 8px rgba(255,255,255,0.2);
  }

  /* Glitch effect */
  @keyframes mw-glitch {
    0%, 90%, 100% { transform: none; text-shadow: none; clip-path: none; opacity: 1; }
    91% { transform: translateX(-2px); text-shadow: 2px 0 #fff, -2px 0 #000; }
    92% { transform: translateX(2px) skewX(-3deg); text-shadow: -2px 0 #000, 2px 0 #888; clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
    93% { transform: translateX(-1px); text-shadow: 1px 0 #aaa, -1px 0 #333; clip-path: none; }
    94% { transform: translateX(1px) skewX(2deg); opacity: 0.8; }
    95% { transform: none; opacity: 1; }
    96% { transform: translateX(-1px); text-shadow: 1px 0 #fff; clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
    97% { transform: none; clip-path: none; }
  }
  .mw-glitch {
    animation: mw-glitch 9s infinite;
  }

  .mw-operator-tag {
    flex: 1;
  }
  .mw-tag-prefix {
    font-family: var(--mw-font-label);
    font-size: 8px;
    font-weight: 700;
    color: var(--mw-text-dim);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .mw-name {
    font-family: var(--mw-font-heading);
    font-size: 34px;
    font-weight: 700;
    line-height: 1;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 2px;
    animation: mw-glitch 9s infinite, mw-name-glow 4s infinite;
  }
  @keyframes mw-name-glow {
    0%,100% { text-shadow: 0 0 8px var(--mw-accent-glow), 0 0 20px rgba(0,0,0,0.8); }
    50% { text-shadow: 0 0 12px var(--mw-accent-glow), 0 0 28px rgba(0,0,0,0.8); }
  }

  .mw-greeting {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    background: rgba(255,255,255,0.03);
    border: 1px solid #3a3a3a;
    padding: 3px 10px;
    font-family: var(--mw-font-label);
    font-size: 8px;
    font-weight: 700;
    color: var(--mw-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .mw-live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.4);
    border: 1px solid #444;
    padding: 5px 10px;
  }
  .mw-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2e7d32;
    box-shadow: 0 0 8px #2e7d32;
    animation: mw-pulse 1.2s infinite;
  }
  @keyframes mw-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .mw-live-text {
    font-family: var(--mw-font-label);
    font-size: 9px;
    font-weight: 700;
    color: #2e7d32;
    text-shadow: 0 0 5px #2e7d32;
    letter-spacing: 0.15em;
  }

  /* Status bar */
  .mw-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    background: #0f0f0f;
    border-bottom: 1px solid #2a2a2a;
    font-family: var(--mw-font-label);
  }
  .mw-rank-badge {
    background: var(--mw-accent);
    color: white;
    font-weight: 700;
    font-size: 9px;
    padding: 3px 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .mw-rank-name {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.08em;
  }
  .mw-xp-bar {
    width: 100px;
    height: 4px;
    background: #2a2a2a;
  }
  .mw-xp-fill {
    height: 100%;
    width: 74%;
    background: linear-gradient(90deg, #555, var(--mw-accent));
    box-shadow: 0 0 6px var(--mw-accent-glow);
  }

  /* Body */
  .mw-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mw-label {
    font-family: var(--mw-font-label);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 6px;
  }

  /* Inputs */
  .mw-input-wrapper {
    position: relative;
  }
  .mw-input {
    width: 100%;
    background: #1e1e1e !important;
    border: 1px solid #3a3a3a !important;
    border-radius: 0 !important;
    color: white !important;
    font-family: Arial, sans-serif !important;
    font-size: 15px !important;
    padding: 10px 12px !important;
    outline: none !important;
    transition: border 0.2s, box-shadow 0.2s;
    caret-color: var(--mw-accent);
  }
  .mw-input:focus {
    border-color: var(--mw-accent) !important;
    box-shadow: 0 0 8px var(--mw-accent-glow) !important;
  }
  .mw-input::placeholder {
    color: #666 !important;
  }

  /* Mission type buttons */
  .mw-types {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .mw-type-btn {
    background: none;
    border: 1px solid #3a3a3a;
    background: #1a1a1a;
    padding: 10px 4px;
    cursor: pointer;
    transition: all 0.15s;
    color: #aaa;
    font-family: var(--mw-font-label);
    text-transform: uppercase;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .mw-type-btn.active {
    border-color: var(--mw-accent);
    background: #222;
    color: white;
    box-shadow: 0 0 12px var(--mw-accent-glow);
  }
  .mw-type-emoji {
    font-size: 20px;
    display: block;
    margin-bottom: 4px;
  }

  /* Amount row */
  .mw-amount-row {
    display: flex;
    gap: 8px;
  }
  .mw-currency-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1e1e1e;
    border: 1px solid #3a3a3a;
    padding: 0 12px;
    min-width: 90px;
    height: 44px;
    cursor: pointer;
    color: white;
    font-family: Arial, sans-serif;
    font-weight: bold;
  }
  .mw-currency-btn:hover {
    border-color: var(--mw-accent);
  }

  /* Rank tiers */
  .mw-tiers {
    display: flex;
    gap: 5px;
  }
  .mw-tier {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    background: #181818;
    border: 1px solid #2e2e2e;
    transition: all 0.2s;
  }
  .mw-tier.active {
    border-color: var(--mw-accent);
    background: #202020;
    box-shadow: 0 0 10px var(--mw-accent-glow);
  }
  .mw-tier-emoji { font-size: 18px; }
  .mw-tier-rank {
    font-family: var(--mw-font-heading);
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    color: #777;
  }
  .mw-tier.active .mw-tier-rank { color: white; }
  .mw-tier-amt {
    font-family: var(--mw-font-label);
    font-size: 7px;
    color: #555;
  }

  /* Divider */
  .mw-divider {
    height: 1px;
    background: #2e2e2e;
    margin: 4px 0;
  }

  /* Textarea */
  .mw-textarea {
    width: 100%;
    background: #1e1e1e;
    border: 1px solid #3a3a3a;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    padding: 10px 12px;
    resize: vertical;
    outline: none;
  }
  .mw-textarea:focus {
    border-color: var(--mw-accent);
    box-shadow: 0 0 8px var(--mw-accent-glow);
  }

  .mw-char-counter {
    display: flex;
    justify-content: flex-end;
    font-family: var(--mw-font-label);
    font-size: 9px;
    margin-top: 4px;
    color: #aaa;
  }

  /* Deploy button */
  .mw-deploy-btn {
    width: 100%;
    padding: 14px;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    color: white;
    font-family: var(--mw-font-heading);
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .mw-deploy-btn:hover:not(:disabled) {
    background: #252525;
    border-color: var(--mw-accent);
    box-shadow: 0 0 15px var(--mw-accent-glow);
  }
  .mw-deploy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Special panel styles */
  .mw-panel {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    padding: 16px;
  }

  /* Transition wipe overlay */
  .mw-wipe-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background: black;
    transform: scaleX(0);
    transform-origin: left;
    animation: mw-wipe 0.5s ease-in-out forwards;
  }
  @keyframes mw-wipe {
    0% { transform: scaleX(0); }
    50% { transform: scaleX(1); }
    100% { transform: scaleX(0); transform-origin: right; }
  }

  /* Kill feed */
  .mw-killfeed {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9998;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .mw-kf-item {
    background: rgba(20,20,20,0.95);
    border-left: 3px solid var(--mw-accent);
    padding: 8px 16px;
    font-family: var(--mw-font-label);
    font-size: 10px;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 0 15px rgba(0,0,0,0.7);
    animation: mw-kf-in 0.3s ease;
  }
  @keyframes mw-kf-in { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }

  /* Mission complete overlay */
  .mw-mission-complete {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0,0,0,0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: var(--mw-font-heading);
  }
  .mw-mc-title {
    font-size: 48px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    animation: mw-glitch 3s infinite;
  }
`;

const TIERS = [
  { min: 0, rank: "CADET", emoji: "🔰" },       // entry-level
  { min: 100, rank: "SERGEANT", emoji: "⚔️" },
  { min: 300, rank: "CAPTAIN", emoji: "🎖️" },
  { min: 500, rank: "COMMANDER", emoji: "⭐" }, // advanced
];

// Wipe transition component (used for content changes)
const WipeTransition: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 500);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return <div className="mw-wipe-overlay" />;
};

// Kill feed hook
type KFMsg = { id: number; text: string; variant?: "default" | "error" };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text: string, variant: KFMsg["variant"] = "default") => {
    const id = ++kfId;
    setMsgs(prev => [...prev, { id, text, variant }]);
    setTimeout(() => setMsgs(prev => prev.filter(m => m.id !== id)), 3000);
  }, []);
  return { msgs, push };
};

// Audio feedback
const playClick = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch {}
};
const playConfirm = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.1);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.1);
    });
  } catch {}
};
const playError = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  } catch {}
};

const Brigzard = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { msgs, push } = useKillFeed();

  const [formData, setFormData] = useState({ name: "", amount: "", message: "" });
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound" | "media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [showWipe, setShowWipe] = useState(false);

  const { pricing } = useStreamerPricing("brigzard", selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const currentAmount = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
  const activeTierIdx = TIERS.reduce((best, tier, i) => (currentAmount >= tier.min ? i : best), 0);
  const intensityLevel = currentAmount >= 500 ? 3 : currentAmount >= 300 ? 2 : currentAmount >= 100 ? 1 : 0;

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 15;
      if (amount >= 300) return 12;
      return 8;
    }
    if (amount >= 6) return 15;
    if (amount >= 4) return 12;
    return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  // Scaling
  const applyScale = useCallback(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const scaleW = Math.min(1, (window.innerWidth - 32) / 420);
    const scaleH = card.scrollHeight > 0 ? Math.min(1, (window.innerHeight - 48) / card.scrollHeight) : 1;
    const scale = Math.min(scaleW, scaleH);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.height = `${card.scrollHeight * scale}px`;
  }, []);

  useEffect(() => {
    const timer = setTimeout(applyScale, 50);
    window.addEventListener("resize", applyScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", applyScale);
    };
  }, [applyScale]);
  useEffect(() => {
    const timer = setTimeout(applyScale, 30);
    return () => clearTimeout(timer);
  }, [donationType, applyScale]);

  // Razorpay load
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => push("Payment gateway failed to load", "error");
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (value: typeof donationType) => {
    playClick();
    setShowWipe(true);
    setTimeout(() => {
      setDonationType(value);
      const amount = value === "voice" ? pricing.minVoice :
                     value === "hypersound" ? pricing.minHypersound :
                     value === "media" ? pricing.minMedia : pricing.minText;
      setFormData(prev => ({ ...prev, amount: String(amount), message: "" }));
      setSelectedHypersound(null);
      setMediaUrl(null);
      setMediaType(null);
      setShowWipe(false);
    }, 250); // halfway through wipe
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded) {
      playError();
      push("Payment system loading", "error");
      return;
    }
    const amount = Number(formData.amount);
    if (!formData.name) { playError(); push("Operator callsign required", "error"); return; }
    if (!amount || amount <= 0) { playError(); push("Enter valid amount", "error"); return; }
    const min = donationType === "voice" ? pricing.minVoice :
                donationType === "hypersound" ? pricing.minHypersound :
                donationType === "media" ? pricing.minMedia : pricing.minText;
    if (amount < min) { playError(); push(`Minimum ${currencySymbol}${min}`, "error"); return; }
    if (donationType === "voice" && !voiceRecorder.audioBlob) { playError(); push("Record voice message", "error"); return; }
    if (donationType === "hypersound" && !selectedHypersound) { playError(); push("Select a sound", "error"); return; }
    if (donationType === "media" && !mediaUrl) { playError(); push("Upload media", "error"); return; }

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Deployment initiated", "default");
    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
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
      if (error) {
        let msg = "Payment failed";
        if (error instanceof FunctionsHttpError) {
          try { const b = await error.context.json(); msg = b?.error || msg; } catch {}
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      new (window as any).Razorpay({
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "BRIGZARD",
        description: "Support BRIGZARD",
        handler: () => {
          playConfirm();
          setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);
          setShowMissionComplete(true);
        },
        modal: { ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`) },
        theme: { color: "#1a1a1a" },
      }).open();
    } catch (err: any) {
      playError();
      push(err?.message || "Payment failed", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const msgPct = maxMessageLength > 0 ? (formData.message.length / maxMessageLength) * 100 : 0;
  const msgColor = msgPct > 90 ? "#c0392b" : msgPct > 70 ? "#f1c40f" : "#aaa";

  const TYPES = [
    { key: "text" as const, emoji: "💬", label: "Text", min: pricing.minText },
    { key: "voice" as const, emoji: "🎤", label: "Voice", min: pricing.minVoice },
    { key: "hypersound" as const, emoji: "🔊", label: "Sound", min: pricing.minHypersound },
    { key: "media" as const, emoji: "🖼️", label: "Media", min: pricing.minMedia },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {showWipe && <WipeTransition />}
      <div className="mw-killfeed">
        {msgs.map(m => (
          <div key={m.id} className="mw-kf-item" style={{ borderLeftColor: m.variant === "error" ? "#c0392b" : undefined }}>
            {m.text}
          </div>
        ))}
      </div>

      {showMissionComplete && (
        <div className="mw-mission-complete">
          <div className="mw-mc-title">MISSION COMPLETE</div>
          <div style={{ marginTop: 20, fontFamily: "Orbitron", fontSize: 14 }}>
            {currencySymbol}{formData.amount} CREDITS DEPLOYED
          </div>
          <button
            onClick={() => navigate(redirectUrl)}
            style={{
              marginTop: 40,
              padding: "12px 32px",
              background: "transparent",
              border: "1px solid #3a6b4c",
              color: "white",
              fontFamily: "Teko, sans-serif",
              fontSize: 18,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Debrief
          </button>
        </div>
      )}

      <div className="mw-root mw-page">
        <div className="mw-grid" />
        <div className="mw-scanlines" />

        <div ref={wrapRef} className="mw-scale-wrap">
          <div
            ref={cardRef}
            className={`mw-card intensity-${intensityLevel} ${isShaking ? "shake" : ""}`}
          >
            {/* Header with logo */}
            <div className="mw-header">
              <div className="mw-logo">
                <div className="mw-logo-icon">B</div>
                <span className="mw-logo-text">BRIGZARD</span>
              </div>
              <div className="mw-operator-tag">
                <div className="mw-tag-prefix">OPERATOR</div>
                <div className="mw-name">{formData.name.trim() || "ANONYMOUS"}</div>
              </div>
              <div className="mw-live-badge">
                <span className="mw-live-dot" />
                <span className="mw-live-text">LIVE</span>
              </div>
            </div>

            {/* Status bar */}
            <div className="mw-status-bar">
              <div className="mw-rank-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mw-rank-badge">{TIERS[activeTierIdx].rank}</span>
                <span className="mw-rank-name">BRIGZARD FLEET</span>
              </div>
              <div className="mw-xp-bar">
                <div className="mw-xp-fill" />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mw-body">
                <div>
                  <div className="mw-label">Callsign</div>
                  <div className="mw-input-wrapper">
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="mw-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mw-label">Mission Type</div>
                  <div className="mw-types">
                    {TYPES.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => handleDonationTypeChange(t.key)}
                        className={`mw-type-btn ${donationType === t.key ? "active" : ""}`}
                      >
                        <span className="mw-type-emoji">{t.emoji}</span>
                        {t.label}
                        <span style={{ display: "block", fontSize: 7, marginTop: 2 }}>
                          {currencySymbol}{t.min}+
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mw-label">Deploy Credits</div>
                  <div className="mw-amount-row">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="mw-currency-btn">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown size={12} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search currency..." />
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {SUPPORTED_CURRENCIES.map(c => (
                                <CommandItem
                                  key={c.code}
                                  value={c.code}
                                  onSelect={() => {
                                    setSelectedCurrency(c.code);
                                    setCurrencyOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")} />
                                  {c.symbol} {c.code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="mw-input-wrapper" style={{ flex: 1 }}>
                      <Input
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="0"
                        className="mw-input"
                        required
                      />
                    </div>
                  </div>
                  {pricing.ttsEnabled && (
                    <p style={{ fontSize: 9, marginTop: 4, color: "#888", fontFamily: "Orbitron" }}>
                      TTS ENABLED ABOVE {currencySymbol}{pricing.minTts}
                    </p>
                  )}
                </div>

                {currentAmount > 0 && (
                  <div>
                    <div className="mw-label">Rank</div>
                    <div className="mw-tiers">
                      {TIERS.map((tier, i) => (
                        <div key={i} className={`mw-tier ${i === activeTierIdx ? "active" : ""}`}>
                          <span className="mw-tier-emoji">{tier.emoji}</span>
                          <span className="mw-tier-rank">{tier.rank}</span>
                          <span className="mw-tier-amt">
                            {i < activeTierIdx ? "✓" : `${currencySymbol}${tier.min}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mw-divider" />

                {donationType === "text" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div className="mw-label">Intel Message</div>
                      <span className="mw-char-counter" style={{ color: msgColor }}>
                        {formData.message.length}/{maxMessageLength}
                      </span>
                    </div>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Your message (optional)"
                      className="mw-textarea"
                      rows={2}
                      maxLength={maxMessageLength}
                    />
                  </div>
                )}

                {donationType === "voice" && (
                  <div className="mw-panel">
                    <div className="mw-label">Voice Comms</div>
                    <EnhancedVoiceRecorder
                      controller={voiceRecorder}
                      onRecordingComplete={() => {}}
                      maxDurationSeconds={getVoiceDuration(currentAmount)}
                      requiredAmount={pricing.minVoice}
                      currentAmount={currentAmount}
                      brandColor="#1a1a1a"
                    />
                  </div>
                )}

                {donationType === "hypersound" && (
                  <div className="mw-panel">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>🔊</span>
                      <span style={{ fontFamily: "Orbitron", fontSize: 11, fontWeight: 700, color: "#aaa" }}>
                        HYPERSOUNDS
                      </span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
                  </div>
                )}

                {donationType === "media" && (
                  <div className="mw-panel">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>🖼️</span>
                      <span style={{ fontFamily: "Orbitron", fontSize: 11, fontWeight: 700, color: "#aaa" }}>
                        MEDIA DROP
                      </span>
                    </div>
                    <MediaUploader
                      streamerSlug="brigzard"
                      onMediaUploaded={(url, type) => {
                        setMediaUrl(url);
                        setMediaType(type);
                      }}
                      onMediaRemoved={() => {
                        setMediaUrl(null);
                        setMediaType(null);
                      }}
                    />
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

                <button type="submit" className="mw-deploy-btn" disabled={isProcessingPayment}>
                  {isProcessingPayment ? (
                    <>DEPLOYING...</>
                  ) : (
                    <>
                      <Anchor size={16} /> DEPLOY {currencySymbol}{formData.amount || "0"} CREDITS
                    </>
                  )}
                </button>

                <p style={{ fontSize: 8, color: "#555", textAlign: "center", fontFamily: "Arial" }}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                </p>
                <DonationPageFooter brandColor="#1a1a1a" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Brigzard;
