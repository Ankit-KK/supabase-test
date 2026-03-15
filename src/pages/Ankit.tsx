import React, { useState, useEffect, useRef, useCallback } from "react";
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
    --hot-pink: #ff0099;
    --cyan:     #00eeff;
    --purple:   #aa00ff;
    --yellow:   #ffe500;
    --orange:   #ff6600;
    --green:    #00ff88;
    --bg:       #0d0015;
    --card:     #120020;
  }

  .v-root { font-family: 'Nunito', sans-serif; }

  /* Page: full viewport, centers the card */
  .v-page {
    width: 100vw;
    height: 100dvh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  .v-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 10% 10%, rgba(170,0,255,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 90% 90%, rgba(255,0,153,0.2) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,238,255,0.07) 0%, transparent 60%);
  }

  /*
    The scale wrapper:
    - Natural width = 420px, natural height determined by content (~680px)
    - We set a JS-computed --scale CSS variable on it
    - transform-origin: top center so it scales from the top
  */
  .v-scale-wrap {
    width: 420px;
    transform-origin: top center;
    /* transform: scale(var(--scale, 1)) applied inline */
    position: relative;
    z-index: 10;
  }

  /* Card: fixed design, no dynamic sizing */
  .v-card {
    width: 420px;
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
    position: relative;
    padding: 14px 18px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(170,0,255,0.18) 0%, rgba(255,0,153,0.1) 60%, transparent 100%);
    border-bottom: 1px solid rgba(255,0,153,0.2);
  }
  .v-hero::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--purple), var(--hot-pink), var(--cyan), var(--purple));
    background-size: 200% 100%;
    animation: v-shift 3s linear infinite;
    box-shadow: 0 0 8px var(--hot-pink), 0 0 16px rgba(255,0,153,0.4);
  }
  @keyframes v-shift { 0%{background-position:0%} 100%{background-position:200%} }
  .v-hero-blob { position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle, rgba(255,0,153,0.25) 0%, transparent 65%); pointer-events:none; }

  @keyframes v-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% { text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px var(--hot-pink), 0 0 40px var(--hot-pink), 0 0 70px var(--hot-pink); }
    19%,21%,53%,63% { text-shadow:none; opacity:0.75; }
  }
  .v-name { font-family:'Pacifico',cursive; font-size:34px; color:#fff; line-height:1; animation:v-flicker 9s infinite; position:relative; z-index:1; }
  .v-hero-sub { font-size:10px; font-weight:700; color:rgba(255,255,255,0.4); margin-top:2px; position:relative; z-index:1; }

  @keyframes v-pulse { 0%,100%{box-shadow:0 0 5px var(--green);} 50%{box-shadow:none;} }
  .v-live { display:inline-flex; align-items:center; gap:5px; background:rgba(0,255,136,0.1); border:1.5px solid rgba(0,255,136,0.4); border-radius:20px; padding:3px 10px; flex-shrink:0; position:relative; z-index:1; }
  .v-live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:v-pulse 1.5s ease-in-out infinite; }

  /* ── Form body ── */
  .v-body { padding: 14px 18px 16px; display:flex; flex-direction:column; gap:11px; }

  .v-lbl { font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:5px; color:rgba(255,255,255,0.45); }

  /* Inputs */
  .v-iw input {
    width:100% !important; background:rgba(255,255,255,0.05) !important;
    border:1.5px solid rgba(255,255,255,0.12) !important; border-radius:8px !important;
    color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:14px !important; font-weight:700 !important; padding:8px 12px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--cyan);
  }
  .v-iw input:focus { border-color:var(--cyan) !important; background:rgba(0,238,255,0.06) !important; box-shadow:0 0 0 2px rgba(0,238,255,0.15),0 0 14px rgba(0,238,255,0.12) !important; }
  .v-iw input::placeholder { color:rgba(255,255,255,0.22) !important; }
  .v-iw input:disabled { opacity:.38 !important; }

  .v-ta {
    width:100%; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.12);
    border-radius:8px; color:#fff; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700;
    padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--cyan); transition:all .2s;
  }
  .v-ta:focus { border-color:var(--cyan); background:rgba(0,238,255,0.06); box-shadow:0 0 0 2px rgba(0,238,255,0.15),0 0 14px rgba(0,238,255,0.12); }
  .v-ta::placeholder { color:rgba(255,255,255,0.22); }

  .v-cbar { height:2px; margin-top:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .v-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* ══════════════════════
     3D TYPE BUTTONS
  ══════════════════════ */
  .v-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding-bottom:6px; }

  .v-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:10px; display:block; width:100%; }

  .v-tb-face { position:relative; z-index:2; padding:10px 4px 9px; border-radius:10px; text-align:center; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-5px); }

  .v-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 3px); border-radius:10px; z-index:1; }

  .v-tb-cy .v-tb-face { background:linear-gradient(160deg,rgba(0,238,255,0.2),rgba(0,100,140,0.5)); border:1.5px solid rgba(0,238,255,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(0,238,255,0.2); }
  .v-tb-cy::after { background:#005566; border:1.5px solid rgba(0,238,255,0.35); }
  .v-tb-cy:hover .v-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(0,238,255,0.5); }

  .v-tb-pk .v-tb-face { background:linear-gradient(160deg,rgba(255,0,153,0.22),rgba(140,0,80,0.5)); border:1.5px solid rgba(255,0,153,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(255,0,153,0.2); }
  .v-tb-pk::after { background:#700038; border:1.5px solid rgba(255,0,153,0.35); }
  .v-tb-pk:hover .v-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,0,153,0.5); }

  .v-tb-or .v-tb-face { background:linear-gradient(160deg,rgba(255,102,0,0.22),rgba(140,50,0,0.5)); border:1.5px solid rgba(255,102,0,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(255,102,0,0.2); }
  .v-tb-or::after { background:#6a2800; border:1.5px solid rgba(255,102,0,0.35); }
  .v-tb-or:hover .v-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,102,0,0.5); }

  .v-tb-pu .v-tb-face { background:linear-gradient(160deg,rgba(170,0,255,0.22),rgba(90,0,140,0.5)); border:1.5px solid rgba(170,0,255,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(170,0,255,0.2); }
  .v-tb-pu::after { background:#460070; border:1.5px solid rgba(170,0,255,0.35); }
  .v-tb-pu:hover .v-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(170,0,255,0.5); }

  .v-tb:active .v-tb-face { transform:translateY(0px) !important; }

  .v-tb-cy.v-on .v-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(0,238,255,0.32),rgba(0,150,180,0.55)); border-color:var(--cyan); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(0,238,255,0.7),0 0 32px rgba(0,238,255,0.25),inset 0 0 12px rgba(0,238,255,0.12); }
  .v-tb-pk.v-on .v-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,0,153,0.32),rgba(180,0,100,0.55)); border-color:var(--hot-pink); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,0,153,0.7),0 0 32px rgba(255,0,153,0.25),inset 0 0 12px rgba(255,0,153,0.12); }
  .v-tb-or.v-on .v-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,102,0,0.32),rgba(180,70,0,0.55)); border-color:var(--orange); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,102,0,0.7),0 0 32px rgba(255,102,0,0.25),inset 0 0 12px rgba(255,102,0,0.12); }
  .v-tb-pu.v-on .v-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(170,0,255,0.32),rgba(120,0,180,0.55)); border-color:var(--purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(170,0,255,0.7),0 0 32px rgba(170,0,255,0.25),inset 0 0 12px rgba(170,0,255,0.12); }

  .v-tb-emoji { font-size:18px; display:block; line-height:1; }
  .v-tb-name  { font-size:9px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s, text-shadow .15s; }
  .v-tb-min   { font-size:7px; font-weight:700; color:rgba(255,228,0,0.7); display:block; margin-top:1px; }

  /* Amount */
  .v-amt { display:flex; gap:7px; }
  .v-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(255,255,255,0.05) !important; border:1.5px solid rgba(255,255,255,0.12) !important;
    border-radius:8px !important; color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:12px !important; font-weight:800 !important; padding:0 10px !important;
    min-width:84px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .v-cur:hover { border-color:var(--cyan) !important; box-shadow:0 0 10px rgba(0,238,255,0.2) !important; }

  .v-div { height:1px; background:linear-gradient(90deg,transparent,rgba(255,0,153,0.3),rgba(0,238,255,0.25),transparent); }

  .v-sp { border-radius:10px; padding:10px 12px; }
  .v-sp-or { background:rgba(255,102,0,0.07); border:1.5px solid rgba(255,102,0,0.4); box-shadow:0 0 14px rgba(255,102,0,0.1); }
  .v-sp-pu { background:rgba(170,0,255,0.07); border:1.5px solid rgba(170,0,255,0.4); box-shadow:0 0 14px rgba(170,0,255,0.1); }

  /* ══════════════════════
     3D DONATE BUTTON
  ══════════════════════ */
  .v-btn-wrap { position:relative; width:100%; border-radius:12px; padding-bottom:6px; }
  .v-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:12px; z-index:1; background:linear-gradient(90deg,#7700aa,#aa0055,#aa3300); }
  .v-btn {
    position:relative; z-index:2; width:100%; padding:13px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:15px; font-weight:900; letter-spacing:.04em; color:#fff;
    border-radius:12px; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,#cc00ff 0%,#ff0099 50%,#ff6600 100%);
    border-top:1.5px solid rgba(255,255,255,0.3); border-left:1.5px solid rgba(255,255,255,0.15);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(255,0,153,0.4),0 0 36px rgba(170,0,255,0.15);
    overflow:hidden;
  }
  .v-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 26px rgba(255,0,153,0.65),0 0 50px rgba(170,0,255,0.25); }
  .v-btn:active:not(:disabled) { transform:translateY(0px) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.4),0 0 14px rgba(255,0,153,0.3) !important; }
  .v-btn:disabled { opacity:.38; cursor:not-allowed; }
  .v-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:skewX(-20deg); transition:left .5s; }
  .v-btn:hover:not(:disabled)::before { left:160%; }

  .v-hint { font-size:10px; font-weight:700; color:rgba(0,238,255,0.55); margin-top:3px; }
  .v-lock { font-size:10px; font-weight:700; color:rgba(255,228,0,0.8); display:flex; align-items:center; gap:3px; margin-top:3px; }

  @keyframes v-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .v-fu { animation:v-fu .2s ease forwards; }

  @keyframes v-sp-a { to{transform:rotate(360deg);} }
  .v-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:v-sp-a .65s linear infinite; }

  @keyframes v-hs { 0%{opacity:1;transform:scale(1) translateY(0);} 50%{transform:scale(1.7) translateY(-30px);} 100%{opacity:0;transform:scale(1.3) translateY(-65px);} }
  .v-hs-fx { animation:v-hs .9s ease forwards; }

  @keyframes v-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .v-in { animation:v-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const Ankit = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const cardRef   = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

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

  // ── Auto-scale: fit card to viewport ──
  const applyScale = useCallback(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Card natural size: 420px wide
    const cardNaturalW = 420;
    const cardNaturalH = card.scrollHeight;

    // Scale to fit width (with 16px padding each side) AND height (with 24px padding each side)
    const scaleW = Math.min(1, (vw - 32) / cardNaturalW);
    const scaleH = cardNaturalH > 0 ? Math.min(1, (vh - 48) / cardNaturalH) : 1;
    const scale  = Math.min(scaleW, scaleH);

    wrap.style.transform = `scale(${scale})`;
    // Compensate the wrapper height so the page doesn't overflow
    wrap.style.height = `${cardNaturalH * scale}px`;
  }, []);

  useEffect(() => {
    // Small delay to let fonts & layout settle
    const t = setTimeout(applyScale, 80);
    window.addEventListener('resize', applyScale);
    return () => { clearTimeout(t); window.removeEventListener('resize', applyScale); };
  }, [applyScale]);

  // Re-scale when donation type changes (content height changes)
  useEffect(() => {
    const t = setTimeout(applyScale, 60);
    return () => clearTimeout(t);
  }, [donationType, applyScale]);

  useEffect(() => {
    const video = mobileVideoRef.current;
    if (!video || !isMobile) return;
    const onPause = () => { if (document.visibilityState==='visible') video.play().catch(()=>{}); };
    const onVis   = () => { if (document.visibilityState==='visible') video.play().catch(()=>{}); };
    const onTouch = () => { if (video.paused) video.play().catch(()=>{}); };
    video.addEventListener('pause',onPause); document.addEventListener('visibilitychange',onVis); document.addEventListener('touchend',onTouch);
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
    supabase.rpc('get_streamer_public_settings',{slug:'ankit'}).then(({data,error})=>{ if(!error&&data?.length) setStreamerSettings(data[0]); });
    return ()=>{ document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target;
    if (name==='amount'&&donationType==='message') {
      const lim=getMaxMessageLength(pricing.messageCharTiers,parseFloat(value)||40);
      if (formData.message.length>lim) { toast({title:"Message Shortened",description:`Limited to ${lim} chars.`}); setFormData(p=>({...p,[name]:value,message:p.message.slice(0,lim)})); return; }
    }
    setFormData(p=>({...p,[name]:value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount=parseFloat(formData.amount);
    const sym=getCurrencySymbol(formData.currency);
    if (!formData.name?.trim())                              { toast({title:"Name Required",variant:"destructive"}); return; }
    if (donationType==='voice'&&!hasVoiceRecording)          { toast({title:"Voice Required",variant:"destructive"}); return; }
    if (donationType==='hypersound'&&!selectedSound)         { toast({title:"Sound Required",variant:"destructive"}); return; }
    if (donationType==='message'&&!formData.message?.trim()) { toast({title:"Message Required",variant:"destructive"}); return; }
    if (donationType==='message'&&formData.message.length>charLimit){ toast({title:"Message Too Long",variant:"destructive"}); return; }
    if (!amount||amount<1)                                   { toast({title:"Invalid Amount",variant:"destructive"}); return; }
    if (donationType==='message'&&amount<pricing.minText)    { toast({title:`Min ${sym}${pricing.minText}`,variant:"destructive"}); return; }
    if (donationType==='voice'&&amount<pricing.minVoice)     { toast({title:`Min ${sym}${pricing.minVoice}`,variant:"destructive"}); return; }
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
        body:{ streamer_slug:'ankit', name:formData.name.trim(), amount, currency:formData.currency,
          message:donationType==='message'?formData.message.trim():donationType==='voice'?'Sent a Voice message':donationType==='hypersound'?'🔊 HyperSound!':'',
          voiceMessageUrl, hypersoundUrl:donationType==='hypersound'?selectedSound:null }
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
  const handleRemoveImage=()=>{ setSelectedImage(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); };

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
      <div className="v-root v-page">
        <div className="v-atm"/>

        {!isMobile ? (
          <><VideoBackground videoSrc="/assets/streamers/ankit-background.mp4"/>
            <div style={{position:'fixed',inset:0,background:'rgba(13,0,21,0.82)',pointerEvents:'none',zIndex:1}}/></>
        ) : (
          <><video ref={mobileVideoRef} autoPlay loop muted playsInline style={{position:'fixed',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4"/>
            </video>
            <div style={{position:'fixed',inset:0,background:'rgba(13,0,21,0.82)',pointerEvents:'none',zIndex:1}}/></>
        )}

        {/* Scale wrapper — JS sets transform: scale() on this */}
        <div ref={wrapRef} className="v-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="v-card v-in">

            {/* HERO */}
            <div className="v-hero">
              <div className="v-hero-blob"/>
              <div>
                <div className="v-name">Ankit</div>
                <div className="v-hero-sub">Send a message live on stream ✦</div>
              </div>
              <div className="v-live">
                <div className="v-live-dot"/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--green)',letterSpacing:'0.05em',textShadow:'0 0 6px var(--green)'}}>Live</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="v-body">

                {/* Name */}
                <div>
                  <label className="v-lbl">Your Name</label>
                  <div className="v-iw"><Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                {/* 3D Type buttons */}
                <div>
                  <label className="v-lbl">Donation Type</label>
                  <div className="v-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('v-tb',t.tc,donationType===t.key?'v-on':'')}>
                        <div className="v-tb-face">
                          <span className="v-tb-emoji">{t.emoji}</span>
                          <span className="v-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.5)',textShadow:donationType===t.key?`0 0 10px ${t.nc},0 0 20px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="v-tb-min">{sym}{t.min}+</span>
                        </div>
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
                                <CommandItem key={c.code} value={`${c.code} ${c.name}`} onSelect={()=>{ setFormData(p=>({...p,currency:c.code})); setCurrencyOpen(false); }}>
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
                      <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange}
                        min="1" max="100000" placeholder="0" disabled={isAmountLocked||donationType==='hypersound'} required/>
                    </div>
                  </div>
                  {isAmountLocked&&<p className="v-lock">🔒 Locked during recording</p>}
                  {donationType==='message'&&pricing.ttsEnabled&&<p className="v-hint">⚡ TTS above {sym}{pricing.minTts}</p>}
                  {donationType==='voice'&&currentAmount>=pricing.minVoice&&<p className="v-hint">⏱ {getVoiceDuration(currentAmount)}s{formData.currency==='INR'&&currentAmount<200?' · ₹200+ for 20s':''}</p>}
                </div>

                <div className="v-div"/>

                {donationType==='message'&&(
                  <div className="v-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="v-lbl" style={{margin:0}}>Message</label>
                      <span style={{fontSize:10,fontWeight:800,color:charClr,textShadow:`0 0 6px ${charClr}`}}>{formData.message.length}/{charLimit}</span>
                    </div>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Type your message..." className="v-ta" rows={2} maxLength={charLimit} required/>
                    <div className="v-cbar"><div className="v-cbar-fill" style={{width:`${charPct}%`,background:charClr,boxShadow:`0 0 6px ${charClr}`}}/></div>
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
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <Volume2 style={{width:14,height:14,color:'var(--orange)',filter:'drop-shadow(0 0 5px var(--orange))'}}/>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--orange)',textShadow:'0 0 8px var(--orange)'}}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedSound} onSoundSelect={setSelectedSound}/>
                  </div>
                )}

                {donationType==='image'&&(
                  <div className="v-fu v-sp v-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <Image style={{width:14,height:14,color:'var(--purple)',filter:'drop-shadow(0 0 5px var(--purple))'}}/>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--purple)',textShadow:'0 0 8px var(--purple)'}}>Image Upload</span>
                      <span style={{fontSize:8,fontWeight:800,color:'var(--yellow)',border:'1.5px solid rgba(255,228,0,0.3)',borderRadius:20,padding:'1px 6px',marginLeft:4}}>DEMO</span>
                    </div>
                    {!imagePreview?(
                      <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:70,border:'1.5px dashed rgba(170,0,255,0.4)',borderRadius:10,cursor:'pointer',background:'rgba(170,0,255,0.03)'}}>
                        <Image style={{width:18,height:18,color:'rgba(170,0,255,0.6)',marginBottom:4}}/>
                        <span style={{fontSize:11,fontWeight:800,color:'rgba(170,0,255,0.7)'}}>Click to upload</span>
                        <span style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.28)',marginTop:1}}>PNG, JPG · max 5MB</span>
                        <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageSelect}/>
                      </label>
                    ):(
                      <div style={{position:'relative'}}>
                        <img src={imagePreview} alt="Preview" style={{width:'100%',height:70,objectFit:'cover',borderRadius:8,display:'block'}}/>
                        <button type="button" onClick={handleRemoveImage} style={{position:'absolute',top:5,right:5,background:'rgba(255,0,153,0.9)',border:'none',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                          <X style={{width:12,height:12,color:'#fff'}}/>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <RewardsBanner amount={currentAmount} currency={formData.currency}/>

                {/* 3D Donate */}
                <div className="v-btn-wrap">
                  <button type="submit" className="v-btn" disabled={isProcessing||!razorpayLoaded}>
                    {isProcessing||!razorpayLoaded?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="v-spin"/>
                        {isProcessing?'Processing...':'Loading...'}
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Heart style={{width:15,height:15}}/>
                        Donate {sym}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.5}}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>

                <DonationPageFooter brandColor="#ff0099"/>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showHypersoundEffect&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
          <div className="v-hs-fx" style={{fontSize:72}}>🔊</div>
        </div>
      )}
    </>
  );
};

export default Ankit;
