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
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

  :root {
    --n-cyan:    #00ffff;
    --n-pink:    #ff00aa;
    --n-purple:  #bf00ff;
    --n-yellow:  #ffe600;
    --n-orange:  #ff6600;
    --n-green:   #00ff88;
    --n-bg:      #07070f;
    --n-card:    #0a0a18;
  }

  .n-root { font-family: 'Rajdhani', sans-serif; }

  /* ── Page ── */
  .n-page {
    min-height: 100vh;
    background: var(--n-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px 40px;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Background ── */
  .n-bg-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 50% at 20% 20%, rgba(0,255,255,0.055) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,0,170,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 60% 10%, rgba(191,0,255,0.04) 0%, transparent 55%);
  }
  /* Subtle grid */
  .n-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  /* ── Card ── */
  .n-card {
    width: 100%; max-width: 460px;
    position: relative; z-index: 10;
    background: var(--n-card);
    border-radius: 2px;
    /* The main neon glow effect on the card */
    box-shadow:
      0 0 0 1px rgba(0,255,255,0.35),
      0 0 12px rgba(0,255,255,0.2),
      0 0 40px rgba(0,255,255,0.07),
      0 0 80px rgba(255,0,170,0.05),
      inset 0 0 60px rgba(0,255,255,0.02);
  }

  /* ── HERO ── */
  .n-hero {
    position: relative;
    padding: 20px 22px 18px;
    overflow: hidden;
    background: linear-gradient(160deg, rgba(0,255,255,0.07) 0%, rgba(191,0,255,0.05) 50%, rgba(255,0,170,0.04) 100%);
    border-bottom: 1px solid rgba(0,255,255,0.2);
  }
  /* Top cyan glow line */
  .n-hero::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--n-cyan) 30%, var(--n-purple) 70%, transparent 100%);
    box-shadow: 0 0 12px var(--n-cyan), 0 0 24px rgba(0,255,255,0.4);
  }
  /* Bottom edge glow */
  .n-hero::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent);
  }

  /* Scanline sweep */
  @keyframes n-scan { 0%{top:-2px;opacity:1;} 100%{top:102%;opacity:0;} }
  .n-scanline {
    position: absolute; left:0; right:0; height:1px; pointer-events:none; z-index:1;
    background: linear-gradient(90deg, transparent, rgba(0,255,255,0.6), transparent);
    animation: n-scan 4s linear infinite;
  }

  /* Live badge */
  @keyframes n-blink { 0%,100%{opacity:1;box-shadow:0 0 6px var(--n-green);} 50%{opacity:0.3;box-shadow:none;} }
  .n-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(0,255,136,0.08);
    border: 1px solid rgba(0,255,136,0.4);
    border-radius: 2px; padding: 2px 9px;
    box-shadow: 0 0 8px rgba(0,255,136,0.15);
  }
  .n-live-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--n-green);
    animation: n-blink 1.4s ease-in-out infinite;
  }

  /* Glitch name */
  @keyframes n-g1 {
    0%,90%,100%{clip-path:none;transform:none;}
    91%{clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%);transform:translateX(-4px);}
    92%{clip-path:polygon(0 55%,100% 55%,100% 75%,0 75%);transform:translateX(4px);}
    93%{clip-path:none;transform:none;}
  }
  @keyframes n-g2 {
    0%,90%,100%{opacity:0;}
    91%{opacity:0.7;transform:translateX(6px);clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%);}
    92%{opacity:0.7;transform:translateX(-6px);clip-path:polygon(0 55%,100% 55%,100% 75%,0 75%);}
    93%{opacity:0;}
  }
  .n-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 32px; font-weight: 900;
    letter-spacing: 0.08em; color: #fff; line-height: 1;
    position: relative;
    animation: n-g1 10s ease-in-out infinite;
    /* Neon text glow */
    text-shadow:
      0 0 7px #fff,
      0 0 15px var(--n-cyan),
      0 0 30px var(--n-cyan),
      0 0 60px rgba(0,255,255,0.4);
  }
  .n-name::after {
    content: attr(data-text); position: absolute; inset: 0;
    color: var(--n-cyan);
    animation: n-g2 10s ease-in-out infinite;
    pointer-events: none;
    text-shadow: 0 0 10px var(--n-cyan);
  }

  /* Ticker */
  @keyframes n-tick { from{transform:translateX(0);} to{transform:translateX(-50%);} }
  .n-ticker {
    overflow: hidden; height: 22px; display: flex; align-items: center;
    background: rgba(0,0,0,0.4);
    border-bottom: 1px solid rgba(0,255,255,0.12);
  }
  .n-ticker-inner { display:inline-flex; gap:32px; white-space:nowrap; animation:n-tick 20s linear infinite; }
  .n-tick-i { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(0,255,255,0.5); letter-spacing:.1em; }
  .n-tick-s { color:rgba(255,0,170,0.5); font-size:9px; }

  /* ── Body ── */
  .n-body { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 16px; }

  /* Section header */
  .n-sec { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .n-sec-dot {
    width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  }
  .n-sec-lbl {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
    white-space: nowrap;
  }
  .n-sec-line { flex:1; height:1px; }

  /* ── Neon input ── */
  .n-iw input {
    width: 100% !important;
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(0,255,255,0.25) !important;
    border-radius: 2px !important;
    color: #e0ffff !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 15px !important; font-weight: 500 !important;
    padding: 10px 14px !important;
    outline: none !important;
    transition: border-color .2s, box-shadow .2s !important;
    caret-color: var(--n-cyan);
    box-shadow: 0 0 0 0 transparent, inset 0 0 0 0 transparent !important;
  }
  .n-iw input:focus {
    border-color: var(--n-cyan) !important;
    box-shadow: 0 0 8px rgba(0,255,255,0.3), 0 0 20px rgba(0,255,255,0.1), inset 0 0 8px rgba(0,255,255,0.04) !important;
  }
  .n-iw input::placeholder { color: rgba(0,255,255,0.22) !important; }
  .n-iw input:disabled { opacity: .38 !important; }

  /* Textarea */
  .n-ta {
    width: 100%;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(0,255,255,0.25);
    border-radius: 2px;
    color: #e0ffff;
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px; font-weight: 500;
    padding: 10px 14px; resize: none; outline: none; line-height: 1.55;
    caret-color: var(--n-cyan);
    transition: border-color .2s, box-shadow .2s;
  }
  .n-ta:focus {
    border-color: var(--n-cyan);
    box-shadow: 0 0 8px rgba(0,255,255,0.3), 0 0 20px rgba(0,255,255,0.1), inset 0 0 8px rgba(0,255,255,0.04);
  }
  .n-ta::placeholder { color: rgba(0,255,255,0.22); }

  /* Char bar */
  .n-cbar { height: 2px; margin-top: 5px; background: rgba(0,255,255,0.08); overflow: hidden; border-radius: 1px; }
  .n-cbar-fill { height: 100%; transition: width .12s, background .2s; border-radius: 1px; }

  /* ── Type buttons ── */
  .n-types { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; }
  .n-tb {
    padding: 10px 4px 9px; text-align: center;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 2px;
    cursor: pointer; transition: all .18s;
  }
  .n-tb:hover {
    border-color: rgba(0,255,255,0.35);
    box-shadow: 0 0 10px rgba(0,255,255,0.12);
    background: rgba(0,255,255,0.04);
  }
  /* Active states with full neon glow per color */
  .n-tb-c.n-on {
    border-color: var(--n-cyan);
    background: rgba(0,255,255,0.07);
    box-shadow: 0 0 10px rgba(0,255,255,0.4), 0 0 24px rgba(0,255,255,0.15), inset 0 0 10px rgba(0,255,255,0.06);
  }
  .n-tb-p.n-on {
    border-color: var(--n-pink);
    background: rgba(255,0,170,0.07);
    box-shadow: 0 0 10px rgba(255,0,170,0.4), 0 0 24px rgba(255,0,170,0.15), inset 0 0 10px rgba(255,0,170,0.06);
  }
  .n-tb-o.n-on {
    border-color: var(--n-orange);
    background: rgba(255,102,0,0.07);
    box-shadow: 0 0 10px rgba(255,102,0,0.4), 0 0 24px rgba(255,102,0,0.15), inset 0 0 10px rgba(255,102,0,0.06);
  }
  .n-tb-v.n-on {
    border-color: var(--n-purple);
    background: rgba(191,0,255,0.07);
    box-shadow: 0 0 10px rgba(191,0,255,0.4), 0 0 24px rgba(191,0,255,0.15), inset 0 0 10px rgba(191,0,255,0.06);
  }
  .n-tb-emoji { font-size: 18px; display: block; line-height: 1; }
  .n-tb-name {
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px; letter-spacing: .1em; text-transform: uppercase;
    display: block; margin-top: 5px; transition: color .18s;
  }
  .n-tb-min { font-family: 'Share Tech Mono', monospace; font-size: 8px; color: rgba(255,230,0,0.6); display: block; margin-top: 2px; }

  /* ── Amount ── */
  .n-amt-row { display: flex; gap: 7px; }
  .n-cur-btn {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(0,255,255,0.25) !important;
    border-radius: 2px !important;
    color: #e0ffff !important;
    font-family: 'Share Tech Mono', monospace !important;
    font-size: 11px !important; padding: 0 11px !important;
    min-width: 90px; height: 42px;
    cursor: pointer; transition: border-color .2s, box-shadow .2s;
    flex-shrink: 0;
  }
  .n-cur-btn:hover {
    border-color: var(--n-cyan) !important;
    box-shadow: 0 0 8px rgba(0,255,255,0.25) !important;
  }

  /* Divider */
  .n-div {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,255,255,0.2), rgba(255,0,170,0.15), transparent);
    box-shadow: 0 0 4px rgba(0,255,255,0.1);
  }

  /* Sub-panels */
  .n-sp {
    border-radius: 2px; padding: 12px 14px; position: relative;
  }
  .n-sp-o {
    border: 1px solid rgba(255,102,0,0.4);
    background: rgba(255,102,0,0.04);
    box-shadow: 0 0 14px rgba(255,102,0,0.1), inset 0 0 14px rgba(255,102,0,0.03);
  }
  .n-sp-p {
    border: 1px solid rgba(191,0,255,0.35);
    background: rgba(191,0,255,0.04);
    box-shadow: 0 0 14px rgba(191,0,255,0.1), inset 0 0 14px rgba(191,0,255,0.03);
  }

  /* ── Submit ── */
  .n-btn {
    width: 100%; padding: 13px; border: none; cursor: pointer;
    font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    color: #07070f;
    position: relative; overflow: hidden; border-radius: 2px;
    transition: transform .15s, box-shadow .2s;
    background: linear-gradient(90deg, var(--n-cyan) 0%, #44eeff 35%, var(--n-purple) 65%, var(--n-pink) 100%);
    box-shadow:
      0 0 12px rgba(0,255,255,0.5),
      0 0 30px rgba(0,255,255,0.2),
      0 0 60px rgba(255,0,170,0.15);
  }
  .n-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 0 18px rgba(0,255,255,0.7),
      0 0 40px rgba(0,255,255,0.3),
      0 0 80px rgba(255,0,170,0.2);
  }
  .n-btn:active:not(:disabled) { transform: translateY(0); }
  .n-btn:disabled { opacity: .35; cursor: not-allowed; filter: grayscale(0.4); }
  .n-btn::before {
    content: ''; position: absolute; top: 0; left: -110%; width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
    transform: skewX(-22deg); transition: left .55s;
  }
  .n-btn:hover:not(:disabled)::before { left: 160%; }

  /* Hints */
  .n-hint { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(0,255,255,0.38); margin-top: 5px; }
  .n-lock { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(255,230,0,0.7); display: flex; align-items: center; gap: 3px; margin-top: 5px; }

  /* Fade-up */
  @keyframes n-fu { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
  .n-fu { animation: n-fu .22s ease forwards; }

  /* Spinner */
  @keyframes n-sp-a { to{transform:rotate(360deg);} }
  .n-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(7,7,15,0.5); border-top-color: #07070f;
    border-radius: 50%; display: inline-block;
    animation: n-sp-a .6s linear infinite;
  }

  /* HyperSound FX */
  @keyframes n-hs { 0%{opacity:1;transform:scale(1) translateY(0);} 50%{opacity:1;transform:scale(1.6) translateY(-28px);} 100%{opacity:0;transform:scale(1.2) translateY(-60px);} }
  .n-hs-fx { animation: n-hs .9s ease forwards; }

  /* Load flicker */
  @keyframes n-fl { 0%,100%{opacity:1;} 3%{opacity:.5;} 5%{opacity:1;} 7.5%{opacity:.4;} 9%{opacity:1;} }
  .n-fl { animation: n-fl .6s ease .1s both; }

  .n-scroll::-webkit-scrollbar { width: 3px; }
  .n-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); }
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
    video.addEventListener('pause',onPause);
    document.addEventListener('visibilitychange',onVis);
    document.addEventListener('touchend',onTouch);
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
        theme:{color:'#00ffff'},
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
  const charClr = charPct>90?'#ff00aa':charPct>70?'#ffe600':'rgba(0,255,255,0.55)';

  const TYPES=[
    {key:'message' as const,   emoji:'💬',label:'TEXT', min:pricing.minText,       tc:'n-tb-c', nc:'var(--n-cyan)'},
    {key:'voice' as const,     emoji:'🎤',label:'VOICE',min:pricing.minVoice,      tc:'n-tb-c', nc:'var(--n-cyan)'},
    {key:'hypersound' as const,emoji:'🔊',label:'SOUND',min:pricing.minHypersound, tc:'n-tb-o', nc:'var(--n-orange)'},
    {key:'image' as const,     emoji:'📷',label:'IMAGE',min:pricing.minMedia,      tc:'n-tb-v', nc:'var(--n-purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      <div className="n-root n-page n-scroll">
        <div className="n-bg-layer"/><div className="n-grid"/>

        {!isMobile ? (
          <><VideoBackground videoSrc="/assets/streamers/ankit-background.mp4"/>
            <div style={{position:'fixed',inset:0,background:'rgba(7,7,15,0.82)',pointerEvents:'none',zIndex:1}}/></>
        ) : (
          <><video ref={mobileVideoRef} autoPlay loop muted playsInline
              style={{position:'fixed',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4"/>
            </video>
            <div style={{position:'fixed',inset:0,background:'rgba(7,7,15,0.82)',pointerEvents:'none',zIndex:1}}/></>
        )}

        <div className="n-card n-fl">

          {/* ── HERO ── */}
          <div className="n-hero">
            <div className="n-scanline"/>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:2}}>
              {/* Left */}
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                {/* Avatar with neon border */}
                <div style={{
                  width:48,height:48,flexShrink:0,borderRadius:2,
                  background:'rgba(0,0,0,0.5)',
                  border:'1px solid rgba(0,255,255,0.45)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
                  boxShadow:'0 0 10px rgba(0,255,255,0.3), inset 0 0 10px rgba(0,255,255,0.05)',
                }}>🎮</div>
                <div>
                  <div className="n-name" data-text="ANKIT">ANKIT</div>
                  <div style={{
                    fontFamily:"'Share Tech Mono',monospace",fontSize:9,
                    color:'rgba(0,255,255,0.5)',letterSpacing:'0.16em',marginTop:2,
                    textShadow:'0 0 6px rgba(0,255,255,0.3)',
                  }}>// DONATION INTERFACE</div>
                </div>
              </div>
              {/* Right */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                <div className="n-live">
                  <div className="n-live-dot"/>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'var(--n-green)',letterSpacing:'0.12em',textShadow:'0 0 6px var(--n-green)'}}>ON AIR</span>
                </div>
                <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(0,255,255,0.3)',letterSpacing:'0.1em'}}>HYPERCHAT</span>
              </div>
            </div>
          </div>

          {/* ── TICKER ── */}
          <div className="n-ticker">
            <div className="n-ticker-inner">
              {[...Array(2)].map((_,i)=>(
                <React.Fragment key={i}>
                  <span className="n-tick-i">💬 TEXT · MIN {sym}{pricing.minText}</span>
                  <span className="n-tick-s"> ◆ </span>
                  <span className="n-tick-i">🎤 VOICE · MIN {sym}{pricing.minVoice}</span>
                  <span className="n-tick-s"> ◆ </span>
                  <span className="n-tick-i">🔊 SOUND · MIN {sym}{pricing.minHypersound}</span>
                  <span className="n-tick-s"> ◆ </span>
                  <span className="n-tick-i">⚡ TTS AT {sym}{pricing.minTts}+</span>
                  <span className="n-tick-s"> ◆ </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit}>
            <div className="n-body">

              {/* Name */}
              <div>
                <div className="n-sec">
                  <div className="n-sec-dot" style={{background:'var(--n-cyan)',boxShadow:'0 0 6px var(--n-cyan)'}}/>
                  <span className="n-sec-lbl" style={{color:'rgba(0,255,255,0.5)',textShadow:'0 0 6px rgba(0,255,255,0.3)'}}>Your Name</span>
                  <div className="n-sec-line" style={{background:'linear-gradient(90deg,rgba(0,255,255,0.2),transparent)'}}/>
                </div>
                <div className="n-iw">
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/>
                </div>
              </div>

              {/* Type */}
              <div>
                <div className="n-sec">
                  <div className="n-sec-dot" style={{background:'var(--n-pink)',boxShadow:'0 0 6px var(--n-pink)'}}/>
                  <span className="n-sec-lbl" style={{color:'rgba(255,0,170,0.6)',textShadow:'0 0 6px rgba(255,0,170,0.3)'}}>Donation Type</span>
                  <div className="n-sec-line" style={{background:'linear-gradient(90deg,rgba(255,0,170,0.2),transparent)'}}/>
                </div>
                <div className="n-types">
                  {TYPES.map(t=>(
                    <button key={t.key} type="button"
                      onClick={()=>handleDonationTypeChange(t.key)}
                      className={cn('n-tb',t.tc,donationType===t.key?'n-on':'')}>
                      <span className="n-tb-emoji">{t.emoji}</span>
                      <span className="n-tb-name" style={{
                        color: donationType===t.key ? t.nc : 'rgba(255,255,255,0.3)',
                        textShadow: donationType===t.key ? `0 0 8px ${t.nc}` : 'none',
                      }}>{t.label}</span>
                      <span className="n-tb-min">{sym}{t.min}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="n-sec">
                  <div className="n-sec-dot" style={{background:'var(--n-yellow)',boxShadow:'0 0 6px var(--n-yellow)'}}/>
                  <span className="n-sec-lbl" style={{color:'rgba(255,230,0,0.55)',textShadow:'0 0 6px rgba(255,230,0,0.25)'}}>Amount</span>
                  <div className="n-sec-line" style={{background:'linear-gradient(90deg,rgba(255,230,0,0.18),transparent)'}}/>
                </div>
                <div className="n-amt-row">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="n-cur-btn">
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
                  <div className="n-iw" style={{flex:1}}>
                    <Input id="amount" name="amount" type="number"
                      value={formData.amount} onChange={handleInputChange}
                      min="1" max="100000" placeholder="0"
                      disabled={isAmountLocked||donationType==='hypersound'} required/>
                  </div>
                </div>
                {isAmountLocked&&<p className="n-lock">🔒 Locked during recording</p>}
                {donationType==='message'&&pricing.ttsEnabled&&(
                  <p className="n-hint">⚡ TTS voice above {sym}{pricing.minTts}</p>
                )}
                {donationType==='voice'&&currentAmount>=pricing.minVoice&&(
                  <p className="n-hint">⏱ {getVoiceDuration(currentAmount)}s{formData.currency==='INR'&&currentAmount<200?' · ₹200+ for 20s, ₹250+ for 30s':''}</p>
                )}
              </div>

              <div className="n-div"/>

              {/* Dynamic */}
              {donationType==='message'&&(
                <div className="n-fu">
                  <div className="n-sec" style={{marginBottom:7}}>
                    <div className="n-sec-dot" style={{background:'var(--n-cyan)',boxShadow:'0 0 6px var(--n-cyan)'}}/>
                    <span className="n-sec-lbl" style={{color:'rgba(0,255,255,0.5)',textShadow:'0 0 6px rgba(0,255,255,0.3)'}}>Message</span>
                    <div className="n-sec-line" style={{background:'linear-gradient(90deg,rgba(0,255,255,0.2),transparent)'}}/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:charClr,marginLeft:8,flexShrink:0,textShadow:`0 0 6px ${charClr}`}}>
                      {formData.message.length}/{charLimit}
                    </span>
                  </div>
                  <textarea id="message" name="message"
                    value={formData.message} onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="n-ta" rows={3} maxLength={charLimit} required/>
                  <div className="n-cbar">
                    <div className="n-cbar-fill" style={{width:`${charPct}%`,background:charClr,boxShadow:`0 0 6px ${charClr}`}}/>
                  </div>
                </div>
              )}

              {donationType==='voice'&&(
                <div className="n-fu">
                  <div className="n-sec" style={{marginBottom:7}}>
                    <div className="n-sec-dot" style={{background:'var(--n-cyan)',boxShadow:'0 0 6px var(--n-cyan)'}}/>
                    <span className="n-sec-lbl" style={{color:'rgba(0,255,255,0.5)',textShadow:'0 0 6px rgba(0,255,255,0.3)'}}>Voice Message</span>
                    <div className="n-sec-line" style={{background:'linear-gradient(90deg,rgba(0,255,255,0.2),transparent)'}}/>
                  </div>
                  <VoiceRecorder
                    onRecordingComplete={(has,dur)=>{ setHasVoiceRecording(has); setVoiceDuration(dur); }}
                    maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder}
                    requiredAmount={150} currentAmount={currentAmount}/>
                </div>
              )}

              {donationType==='hypersound'&&(
                <div className="n-fu n-sp n-sp-o">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <Volume2 style={{width:14,height:14,color:'var(--n-orange)',filter:'drop-shadow(0 0 4px var(--n-orange))'}}/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'var(--n-orange)',letterSpacing:'0.12em',textShadow:'0 0 8px var(--n-orange)'}}>HYPERSOUNDS</span>
                  </div>
                  <HyperSoundSelector selectedSound={selectedSound} onSoundSelect={setSelectedSound}/>
                </div>
              )}

              {donationType==='image'&&(
                <div className="n-fu n-sp n-sp-p">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <Image style={{width:14,height:14,color:'var(--n-purple)',filter:'drop-shadow(0 0 4px var(--n-purple))'}}/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'var(--n-purple)',letterSpacing:'0.12em',textShadow:'0 0 8px var(--n-purple)'}}>IMAGE UPLOAD</span>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,230,0,.8)',border:'1px solid rgba(255,230,0,.25)',padding:'1px 6px',marginLeft:4}}>DEMO</span>
                  </div>
                  {!imagePreview?(
                    <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:80,border:'1px dashed rgba(191,0,255,0.3)',cursor:'pointer',background:'rgba(191,0,255,0.02)'}}>
                      <Image style={{width:20,height:20,color:'rgba(191,0,255,0.5)',marginBottom:5}}/>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'rgba(191,0,255,0.55)'}}>Click to upload</span>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.2)',marginTop:2}}>PNG, JPG · MAX 5MB</span>
                      <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageSelect}/>
                    </label>
                  ):(
                    <div style={{position:'relative'}}>
                      <img src={imagePreview} alt="Preview" style={{width:'100%',height:80,objectFit:'cover',display:'block',borderRadius:1}}/>
                      <button type="button" onClick={handleRemoveImage} style={{position:'absolute',top:5,right:5,background:'rgba(255,0,170,0.85)',border:'none',width:22,height:22,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        <X style={{width:12,height:12,color:'#fff'}}/>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards */}
              <RewardsBanner amount={currentAmount} currency={formData.currency}/>

              {/* Submit */}
              <button type="submit" className="n-btn" disabled={isProcessing||!razorpayLoaded}>
                {isProcessing||!razorpayLoaded?(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                    <span className="n-spin"/>
                    {isProcessing?'Processing...':'Loading Payment...'}
                  </span>
                ):(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                    <Heart style={{width:15,height:15}}/>
                    Donate {sym}{formData.amount||'0'}
                  </span>
                )}
              </button>

              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.15)',textAlign:'center',letterSpacing:'0.06em',lineHeight:1.6}}>
                Phone numbers collected by Razorpay as per RBI regulations
              </p>

              <DonationPageFooter brandColor="#00ffff"/>
            </div>
          </form>
        </div>
      </div>

      {showHypersoundEffect&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
          <div className="n-hs-fx" style={{fontSize:72}}>🔊</div>
        </div>
      )}
    </>
  );
};

export default Ankit;
