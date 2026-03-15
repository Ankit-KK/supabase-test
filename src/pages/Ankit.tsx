import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, X, Heart, Volume2, Image } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import RewardsBanner from "@/components/RewardsBanner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import DonationPageFooter from "@/components/DonationPageFooter";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Pacifico&display=swap');

  :root {
    --hot-pink:  #ff0099;
    --cyan:      #00eeff;
    --purple:    #aa00ff;
    --yellow:    #ffe500;
    --orange:    #ff6600;
    --green:     #00ff88;
    --bg:        #0d0015;
    --card:      #120020;
  }

  .v-root { font-family: 'Nunito', sans-serif; }

  .v-page {
    min-height: 100vh;
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    padding: 28px 16px 44px;
    position: relative; overflow-x: hidden;
  }

  .v-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 10% 10%, rgba(170,0,255,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 90% 90%, rgba(255,0,153,0.2)  0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,238,255,0.07) 0%, transparent 60%);
  }

  /* ── Card ── */
  .v-card {
    width: 100%; max-width: 420px;
    position: relative; z-index: 10;
    background: var(--card);
    border-radius: 20px;
    border: 1px solid rgba(255,0,153,0.3);
    box-shadow:
      0 0 0 1px rgba(170,0,255,0.15),
      0 0 25px rgba(255,0,153,0.2),
      0 0 60px rgba(170,0,255,0.12),
      0 30px 80px rgba(0,0,0,0.7);
    overflow: hidden;
  }

  /* ── HERO ── */
  .v-hero {
    position: relative; padding: 30px 24px 26px;
    text-align: center; overflow: hidden;
    background: linear-gradient(180deg, rgba(170,0,255,0.2) 0%, rgba(255,0,153,0.12) 50%, transparent 100%);
  }
  .v-hero::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--purple), var(--hot-pink), var(--cyan), var(--purple));
    background-size: 200% 100%;
    animation: v-shift 3s linear infinite;
    box-shadow: 0 0 10px var(--hot-pink), 0 0 20px rgba(255,0,153,0.5);
  }
  @keyframes v-shift { 0%{background-position:0%} 100%{background-position:200%} }

  .v-hero-blob1 { position:absolute; top:-40px; left:-40px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle, rgba(170,0,255,0.35) 0%, transparent 65%); pointer-events:none; }
  .v-hero-blob2 { position:absolute; top:-20px; right:-40px; width:150px; height:150px; border-radius:50%; background:radial-gradient(circle, rgba(255,0,153,0.3) 0%, transparent 65%); pointer-events:none; }

  @keyframes v-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% {
      text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px var(--hot-pink), 0 0 40px var(--hot-pink), 0 0 80px var(--hot-pink), 0 0 120px var(--hot-pink);
    }
    19%,21%,53%,63% { text-shadow:none; opacity:0.75; }
  }
  .v-name {
    font-family:'Pacifico',cursive; font-size:54px; color:#fff; line-height:1;
    position:relative; z-index:2;
    animation: v-flicker 9s infinite;
  }
  .v-sub { font-size:13px; font-weight:700; color:rgba(255,255,255,0.5); margin-top:6px; position:relative; z-index:2; }

  @keyframes v-pulse { 0%,100%{box-shadow:0 0 6px var(--green),0 0 12px rgba(0,255,136,0.4);} 50%{box-shadow:none;} }
  .v-live { display:inline-flex; align-items:center; gap:6px; background:rgba(0,255,136,0.1); border:1.5px solid rgba(0,255,136,0.45); border-radius:20px; padding:3px 13px; margin-top:12px; position:relative; z-index:2; }
  .v-live-dot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:v-pulse 1.5s ease-in-out infinite; }

  /* ── Form body ── */
  .v-body { padding: 20px 22px 26px; display:flex; flex-direction:column; gap:16px; }

  .v-lbl { font-size:11px; font-weight:900; letter-spacing:0.12em; text-transform:uppercase; display:block; margin-bottom:8px; color:rgba(255,255,255,0.5); }

  /* Input */
  .v-iw input {
    width:100% !important; background:rgba(255,255,255,0.05) !important;
    border:1.5px solid rgba(255,255,255,0.12) !important; border-radius:10px !important;
    color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:15px !important; font-weight:700 !important; padding:10px 14px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--cyan);
  }
  .v-iw input:focus { border-color:var(--cyan) !important; background:rgba(0,238,255,0.06) !important; box-shadow:0 0 0 3px rgba(0,238,255,0.15),0 0 20px rgba(0,238,255,0.15) !important; }
  .v-iw input::placeholder { color:rgba(255,255,255,0.22) !important; }
  .v-iw input:disabled { opacity:.38 !important; }

  .v-ta {
    width:100%; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.12);
    border-radius:10px; color:#fff; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700;
    padding:10px 14px; resize:none; outline:none; line-height:1.6; caret-color:var(--cyan);
    transition:all .2s;
  }
  .v-ta:focus { border-color:var(--cyan); background:rgba(0,238,255,0.06); box-shadow:0 0 0 3px rgba(0,238,255,0.15),0 0 20px rgba(0,238,255,0.15); }
  .v-ta::placeholder { color:rgba(255,255,255,0.22); }

  .v-cbar { height:3px; margin-top:5px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .v-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* ════════════════════════════════════════
     3D EXTRUDED TYPE BUTTONS
  ════════════════════════════════════════ */
  .v-types { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }

  .v-tb {
    position: relative;
    padding: 11px 4px 10px;
    text-align: center;
    border-radius: 12px;
    cursor: pointer;
    /* The 3D extrusion depth via layered box-shadow acting as the "side face" */
    transition: transform .12s ease, box-shadow .12s ease;
    transform-style: preserve-3d;
    border: none; outline: none;
    user-select: none;
  }

  /* DEFAULT (inactive) 3D extruded style */
  .v-tb-cy {
    background: linear-gradient(160deg, rgba(0,238,255,0.15) 0%, rgba(0,238,255,0.07) 100%);
    border-top: 1.5px solid rgba(0,238,255,0.5);
    border-left: 1.5px solid rgba(0,238,255,0.3);
    border-right: 1.5px solid rgba(0,238,255,0.12);
    border-bottom: 1.5px solid rgba(0,238,255,0.08);
    box-shadow:
      /* 3D depth layers - stacked to create extrusion */
      0 4px 0 rgba(0,120,130,0.9),
      0 5px 0 rgba(0,90,100,0.7),
      0 6px 0 rgba(0,60,70,0.5),
      /* outer glow */
      0 8px 16px rgba(0,238,255,0.2),
      inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .v-tb-pk {
    background: linear-gradient(160deg, rgba(255,0,153,0.15) 0%, rgba(255,0,153,0.07) 100%);
    border-top: 1.5px solid rgba(255,0,153,0.5);
    border-left: 1.5px solid rgba(255,0,153,0.3);
    border-right: 1.5px solid rgba(255,0,153,0.12);
    border-bottom: 1.5px solid rgba(255,0,153,0.08);
    box-shadow:
      0 4px 0 rgba(130,0,80,0.9),
      0 5px 0 rgba(100,0,60,0.7),
      0 6px 0 rgba(70,0,40,0.5),
      0 8px 16px rgba(255,0,153,0.2),
      inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .v-tb-or {
    background: linear-gradient(160deg, rgba(255,102,0,0.15) 0%, rgba(255,102,0,0.07) 100%);
    border-top: 1.5px solid rgba(255,102,0,0.5);
    border-left: 1.5px solid rgba(255,102,0,0.3);
    border-right: 1.5px solid rgba(255,102,0,0.12);
    border-bottom: 1.5px solid rgba(255,102,0,0.08);
    box-shadow:
      0 4px 0 rgba(130,50,0,0.9),
      0 5px 0 rgba(100,38,0,0.7),
      0 6px 0 rgba(70,25,0,0.5),
      0 8px 16px rgba(255,102,0,0.2),
      inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .v-tb-pu {
    background: linear-gradient(160deg, rgba(170,0,255,0.15) 0%, rgba(170,0,255,0.07) 100%);
    border-top: 1.5px solid rgba(170,0,255,0.5);
    border-left: 1.5px solid rgba(170,0,255,0.3);
    border-right: 1.5px solid rgba(170,0,255,0.12);
    border-bottom: 1.5px solid rgba(170,0,255,0.08);
    box-shadow:
      0 4px 0 rgba(85,0,130,0.9),
      0 5px 0 rgba(65,0,100,0.7),
      0 6px 0 rgba(45,0,70,0.5),
      0 8px 16px rgba(170,0,255,0.2),
      inset 0 1px 0 rgba(255,255,255,0.15);
  }

  /* HOVER — lift up, extrusion shrinks */
  .v-tb-cy:hover { transform:translateY(-2px); box-shadow: 0 6px 0 rgba(0,120,130,0.9), 0 7px 0 rgba(0,90,100,0.7), 0 8px 0 rgba(0,60,70,0.5), 0 12px 24px rgba(0,238,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
  .v-tb-pk:hover { transform:translateY(-2px); box-shadow: 0 6px 0 rgba(130,0,80,0.9),  0 7px 0 rgba(100,0,60,0.7),  0 8px 0 rgba(70,0,40,0.5),   0 12px 24px rgba(255,0,153,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
  .v-tb-or:hover { transform:translateY(-2px); box-shadow: 0 6px 0 rgba(130,50,0,0.9),  0 7px 0 rgba(100,38,0,0.7), 0 8px 0 rgba(70,25,0,0.5),   0 12px 24px rgba(255,102,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
  .v-tb-pu:hover { transform:translateY(-2px); box-shadow: 0 6px 0 rgba(85,0,130,0.9),  0 7px 0 rgba(65,0,100,0.7), 0 8px 0 rgba(45,0,70,0.5),   0 12px 24px rgba(170,0,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }

  /* ACTIVE (pressed) — push down, extrusion disappears */
  .v-tb-cy:active, .v-tb-cy.v-on:active { transform:translateY(4px); box-shadow: 0 0px 0 rgba(0,120,130,0.9), 0 8px 12px rgba(0,238,255,0.15) !important; }
  .v-tb-pk:active, .v-tb-pk.v-on:active { transform:translateY(4px); box-shadow: 0 0px 0 rgba(130,0,80,0.9),  0 8px 12px rgba(255,0,153,0.15) !important; }
  .v-tb-or:active, .v-tb-or.v-on:active { transform:translateY(4px); box-shadow: 0 0px 0 rgba(130,50,0,0.9),  0 8px 12px rgba(255,102,0,0.15) !important; }
  .v-tb-pu:active, .v-tb-pu.v-on:active { transform:translateY(4px); box-shadow: 0 0px 0 rgba(85,0,130,0.9),  0 8px 12px rgba(170,0,255,0.15) !important; }

  /* SELECTED (on) — pressed in + full neon glow */
  .v-tb-cy.v-on {
    transform: translateY(3px);
    background: linear-gradient(160deg, rgba(0,238,255,0.25) 0%, rgba(0,238,255,0.14) 100%);
    border-top-color: var(--cyan);
    box-shadow:
      0 1px 0 rgba(0,120,130,0.9),
      0 0 16px rgba(0,238,255,0.6),
      0 0 32px rgba(0,238,255,0.25),
      inset 0 0 14px rgba(0,238,255,0.12),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .v-tb-pk.v-on {
    transform: translateY(3px);
    background: linear-gradient(160deg, rgba(255,0,153,0.25) 0%, rgba(255,0,153,0.14) 100%);
    border-top-color: var(--hot-pink);
    box-shadow:
      0 1px 0 rgba(130,0,80,0.9),
      0 0 16px rgba(255,0,153,0.6),
      0 0 32px rgba(255,0,153,0.25),
      inset 0 0 14px rgba(255,0,153,0.12),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .v-tb-or.v-on {
    transform: translateY(3px);
    background: linear-gradient(160deg, rgba(255,102,0,0.25) 0%, rgba(255,102,0,0.14) 100%);
    border-top-color: var(--orange);
    box-shadow:
      0 1px 0 rgba(130,50,0,0.9),
      0 0 16px rgba(255,102,0,0.6),
      0 0 32px rgba(255,102,0,0.25),
      inset 0 0 14px rgba(255,102,0,0.12),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .v-tb-pu.v-on {
    transform: translateY(3px);
    background: linear-gradient(160deg, rgba(170,0,255,0.25) 0%, rgba(170,0,255,0.14) 100%);
    border-top-color: var(--purple);
    box-shadow:
      0 1px 0 rgba(85,0,130,0.9),
      0 0 16px rgba(170,0,255,0.6),
      0 0 32px rgba(170,0,255,0.25),
      inset 0 0 14px rgba(170,0,255,0.12),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }

  .v-tb-emoji { font-size:20px; display:block; line-height:1; }
  .v-tb-name  { font-size:10px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; display:block; margin-top:5px; transition:color .18s, text-shadow .18s; }
  .v-tb-min   { font-size:8px; font-weight:700; color:rgba(255,228,0,0.7); display:block; margin-top:2px; }

  /* Amount row */
  .v-amt { display:flex; gap:8px; }
  .v-cur {
    display:flex; align-items:center; justify-content:space-between; gap:5px;
    background:rgba(255,255,255,0.05) !important;
    border:1.5px solid rgba(255,255,255,0.12) !important;
    border-radius:10px !important; color:#fff !important;
    font-family:'Nunito',sans-serif !important; font-size:13px !important; font-weight:800 !important;
    padding:0 12px !important; min-width:92px; height:42px;
    cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .v-cur:hover { border-color:var(--cyan) !important; box-shadow:0 0 12px rgba(0,238,255,0.2) !important; }

  .v-div { height:1px; background:linear-gradient(90deg,transparent,rgba(255,0,153,0.35),rgba(0,238,255,0.3),transparent); box-shadow:0 0 6px rgba(255,0,153,0.1); }

  /* Sub panels */
  .v-sp { border-radius:14px; padding:14px 16px; }
  .v-sp-or { background:rgba(255,102,0,0.07); border:1.5px solid rgba(255,102,0,0.45); box-shadow:0 0 18px rgba(255,102,0,0.12),inset 0 0 18px rgba(255,102,0,0.04); }
  .v-sp-pu { background:rgba(170,0,255,0.07); border:1.5px solid rgba(170,0,255,0.45); box-shadow:0 0 18px rgba(170,0,255,0.12),inset 0 0 18px rgba(170,0,255,0.04); }

  /* ════════════════════════════════════════
     3D SUBMIT BUTTON
  ════════════════════════════════════════ */
  .v-btn {
    width:100%; padding:14px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:16px; font-weight:900;
    letter-spacing:.04em; color:#fff;
    position:relative; overflow:hidden; border-radius:14px;
    transition: transform .12s ease, box-shadow .12s ease;
    background: linear-gradient(160deg, #cc00ff 0%, #ff0099 50%, #ff6600 100%);
    border-top: 1.5px solid rgba(255,255,255,0.3);
    border-left: 1.5px solid rgba(255,255,255,0.15);
    border-right: 1.5px solid transparent;
    border-bottom: 1.5px solid transparent;
    /* 3D extrusion */
    box-shadow:
      0 6px 0 rgba(120,0,80,1),
      0 7px 0 rgba(90,0,60,0.9),
      0 8px 0 rgba(60,0,40,0.7),
      0 12px 30px rgba(255,0,153,0.4),
      0 20px 60px rgba(170,0,255,0.2),
      inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .v-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow:
      0 9px 0 rgba(120,0,80,1),
      0 10px 0 rgba(90,0,60,0.9),
      0 11px 0 rgba(60,0,40,0.7),
      0 18px 40px rgba(255,0,153,0.55),
      0 28px 80px rgba(170,0,255,0.25),
      inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .v-btn:active:not(:disabled) {
    transform: translateY(6px);
    box-shadow:
      0 0px 0 rgba(120,0,80,1),
      0 6px 16px rgba(255,0,153,0.3),
      inset 0 2px 4px rgba(0,0,0,0.3);
  }
  .v-btn:disabled { opacity:.35; cursor:not-allowed; }
  .v-btn::before {
    content:''; position:absolute; top:0; left:-110%; width:55%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    transform:skewX(-20deg); transition:left .55s;
  }
  .v-btn:hover:not(:disabled)::before { left:160%; }

  .v-hint { font-size:11px; font-weight:700; color:rgba(0,238,255,0.6); margin-top:5px; }
  .v-lock { font-size:11px; font-weight:700; color:rgba(255,228,0,0.8); display:flex; align-items:center; gap:4px; margin-top:5px; }

  @keyframes v-fu { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
  .v-fu { animation:v-fu .22s ease forwards; }

  @keyframes v-sp-a { to{transform:rotate(360deg);} }
  .v-spin { width:16px; height:16px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:v-sp-a .65s linear infinite; }

  @keyframes v-hs { 0%{opacity:1;transform:scale(1) translateY(0);} 50%{transform:scale(1.7) translateY(-30px);} 100%{opacity:0;transform:scale(1.3) translateY(-65px);} }
  .v-hs-fx { animation:v-hs .9s ease forwards; }

  @keyframes v-in { from{opacity:0;transform:translateY(20px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
  .v-in { animation:v-in .45s cubic-bezier(0.22,1,0.36,1) both; }

  .v-scroll::-webkit-scrollbar { width:3px; }
  .v-scroll::-webkit-scrollbar-thumb { background:rgba(255,0,153,0.3); border-radius:2px; }
`;

const Ankit = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState({ name:'', amount:'', message:'', currency:'INR' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [donationType, setDonationType] = useState<'message'|'voice'|'hypersound'|'image'>('message');
  const [selectedImage, setSelectedImage] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHypersoundEffect, setShowHypersoundEffect] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string|null>(null);

  const { pricing } = useStreamerPricing('ankit', formData.currency);

  useEffect(() => {
    const video = mobileVideoRef.current;
    if (!video || !isMobile) return;
    const onPause = () => { if (document.visibilityState==='visible') video.play().catch(()=>{}); };
    const onVis   = () => { if (document.visibilityState==='visible') video.play().catch(()=>{}); };
    const onTouch = () => { if (video.paused) video.play().catch(()=>{}); };
    video.addEventListener('pause', onPause);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('touchend', onTouch);
    return () => { video.removeEventListener('pause',onPause); document.removeEventListener('visibilitychange',onVis); document.removeEventListener('touchend',onTouch); };
  }, [isMobile]);

  const getVoiceDuration = (a:number) => a>=250?30:a>=200?20:15;
  const currentAmount    = parseFloat(formData.amount)||0;
  const charLimit        = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder    = useVoiceRecorder(maxVoiceDuration);

  useEffect(() => {
    if (voiceRecorder.isRecording) setIsAmountLocked(true);
    else if (!voiceRecorder.audioBlob) setIsAmountLocked(false);
  }, [voiceRecorder.isRecording, voiceRecorder.audioBlob]);

  useEffect(() => {
    const s = document.createElement('script');
    s.src='https://checkout.razorpay.com/v1/checkout.js'; s.async=true;
    s.onload=()=>{ setRazorpayLoaded(true); toast({title:"Payment System Ready"}); };
    s.onerror=()=>toast({title:"Payment Error",description:"Please refresh.",variant:"destructive"});
    document.body.appendChild(s);
    supabase.rpc('get_streamer_public_settings',{slug:'ankit'})
      .then(({data,error})=>{ if(!error&&data?.length) setStreamerSettings(data[0]); });
    return ()=>{ document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target;
    if (name==='amount'&&donationType==='message') {
      const lim=getMaxMessageLength(pricing.messageCharTiers,parseFloat(value)||40);
      if (formData.message.length>lim) {
        toast({title:"Message Shortened",description:`Limited to ${lim} chars.`});
        setFormData(p=>({...p,[name]:value,message:p.message.slice(0,lim)}));
        return;
      }
    }
    setFormData(p=>({...p,[name]:value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount=parseFloat(formData.amount);
    const sym=getCurrencySymbol(formData.currency);
    if (!formData.name?.trim())                             { toast({title:"Name Required",variant:"destructive"}); return; }
    if (donationType==='voice'&&!hasVoiceRecording)         { toast({title:"Voice Required",variant:"destructive"}); return; }
    if (donationType==='hypersound'&&!selectedSound)        { toast({title:"Sound Required",variant:"destructive"}); return; }
    if (donationType==='message'&&!formData.message?.trim()){ toast({title:"Message Required",variant:"destructive"}); return; }
    if (donationType==='message'&&formData.message.length>charLimit){ toast({title:"Message Too Long",variant:"destructive"}); return; }
    if (!amount||amount<1)                                  { toast({title:"Invalid Amount",variant:"destructive"}); return; }
    if (donationType==='message'&&amount<pricing.minText)   { toast({title:`Min ${sym}${pricing.minText}`,variant:"destructive"}); return; }
    if (donationType==='voice'&&amount<pricing.minVoice)    { toast({title:`Min ${sym}${pricing.minVoice}`,variant:"destructive"}); return; }
    if (donationType==='hypersound'&&amount<pricing.minHypersound){ toast({title:`Min ${sym}${pricing.minHypersound}`,variant:"destructive"}); return; }
    if (!razorpayLoaded){ toast({title:"Payment Not Ready",variant:"destructive"}); return; }
    setIsProcessing(true);
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==='voice'&&voiceRecorder.audioBlob) {
        const reader=new FileReader();
        const b64=await new Promise<string>(res=>{ reader.onload=()=>res((reader.result as string).split(',')[1]); reader.readAsDataURL(voiceRecorder.audioBlob!); });
        const {data:up,error:ue}=await supabase.functions.invoke('upload-voice-message-direct',{body:{voiceData:b64,streamerSlug:'ankit'}});
        if (ue) throw new Error('Failed to upload voice');
        voiceMessageUrl=up.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke('create-razorpay-order-unified',{
        body:{
          streamer_slug:'ankit', name:formData.name.trim(), amount, currency:formData.currency,
          message:donationType==='message'?formData.message.trim():donationType==='voice'?'Sent a Voice message':donationType==='hypersound'?'🔊 HyperSound!':'',
          voiceMessageUrl, hypersoundUrl:donationType==='hypersound'?selectedSound:null,
        }
      });
      if (error||!data?.orderId) throw new Error(data?.error||'Failed to create order');
      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:formData.currency,
        name:'HyperChat — Ankit',
        description:donationType==='hypersound'?'HyperSound':donationType==='voice'?'Voice Message':'Text Message',
        order_id:data.razorpay_order_id, prefill:{name:formData.name.trim()}, hidden:{contact:true},
        theme:{color:'#ff0099'},
        handler:()=>navigate(`/status?order_id=${data.order_id}&status=success&st=${data.status_token}`),
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.order_id}&status=pending&st=${data.status_token}`)},
      });
      rzp.on('payment.failed',()=>navigate(`/status?order_id=${data.order_id}&status=failed&st=${data.status_token}`));
      rzp.open();
    } catch(err) {
      toast({title:"Payment Failed",description:err instanceof Error?err.message:"Something went wrong.",variant:"destructive"});
    } finally { setIsProcessing(false); }
  };

  const handleImageSelect=(e: React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { toast({title:"Invalid File",variant:"destructive"}); return; }
    if (file.size>5*1024*1024) { toast({title:"File Too Large",variant:"destructive"}); return; }
    setSelectedImage(file); setImagePreview(URL.createObjectURL(file));
  };
  const handleRemoveImage=()=>{
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };
  const handleDonationTypeChange=(type:'message'|'voice'|'hypersound'|'image')=>{
    setDonationType(type);
    const mins={message:pricing.minText,voice:pricing.minVoice,hypersound:pricing.minHypersound,image:pricing.minMedia};
    setFormData(p=>({...p,amount:mins[type].toString(),message:''}));
    setSelectedSound(null);
    if (type!=='image') handleRemoveImage();
    if (type==='hypersound'){ setShowHypersoundEffect(true); setTimeout(()=>setShowHypersoundEffect(false),2500); }
  };

  const sym     = getCurrencySymbol(formData.currency);
  const charPct = charLimit>0?(formData.message.length/charLimit)*100:0;
  const charClr = charPct>90?'var(--hot-pink)':charPct>70?'var(--yellow)':'var(--cyan)';

  const TYPES=[
    {key:'message' as const,   emoji:'💬', label:'Text',  min:pricing.minText,       tc:'v-tb-cy', nc:'var(--cyan)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'v-tb-pk', nc:'var(--hot-pink)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'v-tb-or', nc:'var(--orange)'},
    {key:'image' as const,     emoji:'📷', label:'Image', min:pricing.minMedia,      tc:'v-tb-pu', nc:'var(--purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <div className="v-root v-page v-scroll">
        <div className="v-atm"/>
        {!isMobile ? (
          <><VideoBackground videoSrc="/assets/streamers/ankit-background.mp4"/>
            <div style={{position:'fixed',inset:0,background:'rgba(13,0,21,0.82)',pointerEvents:'none',zIndex:1}}/></>
        ) : (
          <><video ref={mobileVideoRef} autoPlay loop muted playsInline
              style={{position:'fixed',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4"/>
            </video>
            <div style={{position:'fixed',inset:0,background:'rgba(13,0,21,0.82)',pointerEvents:'none',zIndex:1}}/></>
        )}

        <div className="v-card v-in">
          {/* HERO */}
          <div className="v-hero">
            <div className="v-hero-blob1"/><div className="v-hero-blob2"/>
            <div className="v-name">Ankit</div>
            <div className="v-sub">Send a message live on stream ✦</div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <div className="v-live">
                <div className="v-live-dot"/>
                <span style={{fontSize:11,fontWeight:800,color:'var(--green)',letterSpacing:'0.05em',textShadow:'0 0 8px var(--green)'}}>Live Now</span>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="v-body">

              {/* Name */}
              <div>
                <label className="v-lbl">Your Name</label>
                <div className="v-iw">
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/>
                </div>
              </div>

              {/* Type — 3D buttons */}
              <div>
                <label className="v-lbl">Donation Type</label>
                <div className="v-types">
                  {TYPES.map(t=>(
                    <button key={t.key} type="button"
                      onClick={()=>handleDonationTypeChange(t.key)}
                      className={cn('v-tb',t.tc,donationType===t.key?'v-on':'')}>
                      <span className="v-tb-emoji">{t.emoji}</span>
                      <span className="v-tb-name" style={{
                        color: donationType===t.key ? t.nc : 'rgba(255,255,255,0.45)',
                        textShadow: donationType===t.key ? `0 0 10px ${t.nc}, 0 0 20px ${t.nc}` : 'none',
                      }}>{t.label}</span>
                      <span className="v-tb-min">{sym}{t.min}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="v-lbl">Amount</label>
                <div className="v-amt">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="v-cur">
                        <span>{sym} {formData.currency}</span>
                        <ChevronsUpDown style={{width:12,height:12,opacity:0.4,marginLeft:'auto',flexShrink:0}}/>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search currency..."/>
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {SUPPORTED_CURRENCIES.map(c=>(
                              <CommandItem key={c.code} value={`${c.code} ${c.name}`}
                                onSelect={()=>{ setFormData(p=>({...p,currency:c.code})); setCurrencyOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4",formData.currency===c.code?"opacity-100":"opacity-0")}/>
                                {c.symbol} {c.code} — {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="v-iw" style={{flex:1}}>
                    <Input id="amount" name="amount" type="number"
                      value={formData.amount} onChange={handleInputChange}
                      min="1" max="100000" placeholder="0"
                      disabled={isAmountLocked||donationType==='hypersound'} required/>
                  </div>
                </div>
                {isAmountLocked&&<p className="v-lock">🔒 Amount locked during recording</p>}
                {donationType==='message'&&pricing.ttsEnabled&&<p className="v-hint">⚡ TTS voice above {sym}{pricing.minTts}</p>}
                {donationType==='voice'&&currentAmount>=pricing.minVoice&&<p className="v-hint">⏱ {getVoiceDuration(currentAmount)}s{formData.currency==='INR'&&currentAmount<200?' · ₹200+ for 20s, ₹250+ for 30s':''}</p>}
              </div>

              <div className="v-div"/>

              {/* Dynamic */}
              {donationType==='message'&&(
                <div className="v-fu">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <label className="v-lbl" style={{margin:0}}>Message</label>
                    <span style={{fontSize:11,fontWeight:800,color:charClr,textShadow:`0 0 8px ${charClr}`}}>{formData.message.length}/{charLimit}</span>
                  </div>
                  <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                    placeholder="Type your message..." className="v-ta" rows={3} maxLength={charLimit} required/>
                  <div className="v-cbar"><div className="v-cbar-fill" style={{width:`${charPct}%`,background:charClr,boxShadow:`0 0 8px ${charClr}`}}/></div>
                </div>
              )}

              {donationType==='voice'&&(
                <div className="v-fu">
                  <label className="v-lbl">Voice Message</label>
                  <VoiceRecorder onRecordingComplete={(has,dur)=>{ setHasVoiceRecording(has); setVoiceDuration(dur); }}
                    maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder} requiredAmount={150} currentAmount={currentAmount}/>
                </div>
              )}

              {donationType==='hypersound'&&(
                <div className="v-fu v-sp v-sp-or">
                  <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:10}}>
                    <Volume2 style={{width:16,height:16,color:'var(--orange)',filter:'drop-shadow(0 0 6px var(--orange))'}}/>
                    <span style={{fontSize:14,fontWeight:900,color:'var(--orange)',textShadow:'0 0 10px var(--orange)'}}>HyperSounds</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.5)',marginBottom:12}}>Pick a sound to blast live on stream.</p>
                  <HyperSoundSelector selectedSound={selectedSound} onSoundSelect={setSelectedSound}/>
                </div>
              )}

              {donationType==='image'&&(
                <div className="v-fu v-sp v-sp-pu">
                  <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:10}}>
                    <Image style={{width:16,height:16,color:'var(--purple)',filter:'drop-shadow(0 0 6px var(--purple))'}}/>
                    <span style={{fontSize:14,fontWeight:900,color:'var(--purple)',textShadow:'0 0 10px var(--purple)'}}>Image Upload</span>
                    <span style={{fontSize:9,fontWeight:800,color:'var(--yellow)',border:'1.5px solid rgba(255,228,0,0.3)',borderRadius:20,padding:'1px 8px',marginLeft:4}}>DEMO</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:12}}>Share an image with the streamer. (Demo — not live yet)</p>
                  {!imagePreview?(
                    <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:86,border:'1.5px dashed rgba(170,0,255,0.4)',borderRadius:12,cursor:'pointer',background:'rgba(170,0,255,0.03)'}}>
                      <Image style={{width:22,height:22,color:'rgba(170,0,255,0.6)',marginBottom:6}}/>
                      <span style={{fontSize:12,fontWeight:800,color:'rgba(170,0,255,0.7)'}}>Click to upload</span>
                      <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.28)',marginTop:2}}>PNG, JPG · max 5MB</span>
                      <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageSelect}/>
                    </label>
                  ):(
                    <div style={{position:'relative'}}>
                      <img src={imagePreview} alt="Preview" style={{width:'100%',height:86,objectFit:'cover',borderRadius:10,display:'block'}}/>
                      <button type="button" onClick={handleRemoveImage} style={{position:'absolute',top:7,right:7,background:'rgba(255,0,153,0.9)',border:'none',borderRadius:'50%',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 0 10px rgba(255,0,153,0.6)'}}>
                        <X style={{width:13,height:13,color:'#fff'}}/>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <RewardsBanner amount={currentAmount} currency={formData.currency}/>

              {/* 3D Submit */}
              <button type="submit" className="v-btn" disabled={isProcessing||!razorpayLoaded}>
                {isProcessing||!razorpayLoaded?(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    <span className="v-spin"/>
                    {isProcessing?'Processing...':'Loading Payment...'}
                  </span>
                ):(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    <Heart style={{width:17,height:17}}/>
                    Donate {sym}{formData.amount||'0'}
                  </span>
                )}
              </button>

              <p style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.2)',textAlign:'center',lineHeight:1.6}}>
                Phone numbers collected by Razorpay as per RBI regulations
              </p>
              <DonationPageFooter brandColor="#ff0099"/>
            </div>
          </form>
        </div>
      </div>

      {showHypersoundEffect&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
          <div className="v-hs-fx" style={{fontSize:76}}>🔊</div>
        </div>
      )}
    </>
  );
};

export default Ankit;
