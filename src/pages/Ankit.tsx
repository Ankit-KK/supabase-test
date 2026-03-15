import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, X, Heart, Volume2, Image, Mic, MessageSquare, Zap } from "lucide-react";
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
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Pacifico&display=swap');

  :root {
    --pink:   #ff2d9b;
    --cyan:   #00e5ff;
    --purple: #c026d3;
    --yellow: #ffd600;
    --orange: #ff6d00;
    --green:  #00e676;
    --bg:     #110d1a;
    --card:   #16111f;
    --surface: rgba(255,255,255,0.04);
  }

  .nr { font-family: 'Nunito', sans-serif; }

  /* Page */
  .nr-page {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 16px 44px;
    position: relative;
    overflow-x: hidden;
  }

  /* Warm dark ambient blobs */
  .nr-ambient {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 60% 50% at 15% 25%, rgba(192,38,211,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 75%, rgba(255,45,155,0.1) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 75% 15%, rgba(0,229,255,0.06) 0%, transparent 50%);
  }

  /* Card */
  .nr-card {
    width: 100%; max-width: 420px;
    position: relative; z-index: 10;
    background: var(--card);
    border-radius: 16px;
    border: 1px solid rgba(255,45,155,0.15);
    box-shadow:
      0 0 0 1px rgba(255,45,155,0.08),
      0 0 30px rgba(255,45,155,0.08),
      0 0 80px rgba(192,38,211,0.06),
      0 24px 64px rgba(0,0,0,0.5);
    overflow: hidden;
  }

  /* ── HERO: neon sign energy ── */
  .nr-hero {
    position: relative;
    padding: 28px 24px 24px;
    background: linear-gradient(175deg, rgba(192,38,211,0.12) 0%, rgba(255,45,155,0.06) 50%, transparent 100%);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    text-align: center;
    overflow: hidden;
  }

  /* Glowing halo behind the name */
  .nr-hero::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -55%);
    width: 260px; height: 100px;
    background: radial-gradient(ellipse, rgba(255,45,155,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Neon sign name */
  @keyframes nr-flicker {
    0%,19%,21%,23%,25%,54%,56%,100% {
      text-shadow:
        0 0 4px #fff,
        0 0 11px #fff,
        0 0 19px #fff,
        0 0 40px var(--pink),
        0 0 80px var(--pink),
        0 0 90px var(--pink),
        0 0 100px var(--pink),
        0 0 150px var(--pink);
      opacity: 1;
    }
    20%,24%,55% {
      text-shadow: none;
      opacity: 0.7;
    }
  }
  .nr-name {
    font-family: 'Pacifico', cursive;
    font-size: 52px;
    color: #fff;
    line-height: 1;
    position: relative; z-index: 1;
    animation: nr-flicker 8s infinite;
    letter-spacing: 0.02em;
  }

  .nr-tagline {
    font-family: 'Nunito', sans-serif;
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.45);
    margin-top: 6px;
    letter-spacing: 0.04em;
  }

  /* Live pill */
  @keyframes nr-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .nr-live {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(0,230,118,0.1);
    border: 1px solid rgba(0,230,118,0.35);
    border-radius: 20px; padding: 3px 12px;
    margin-top: 10px;
    box-shadow: 0 0 10px rgba(0,230,118,0.12);
  }
  .nr-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green), 0 0 12px rgba(0,230,118,0.4);
    animation: nr-pulse 1.5s ease-in-out infinite;
  }

  /* ── Form body ── */
  .nr-body { padding: 20px 22px 24px; display: flex; flex-direction: column; gap: 16px; }

  /* Label */
  .nr-label {
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    display: block; margin-bottom: 8px;
  }

  /* Input — neon outline on focus */
  .nr-iw input {
    width: 100% !important;
    background: rgba(0,0,0,0.35) !important;
    border: 1.5px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    color: #fff !important;
    font-family: 'Nunito', sans-serif !important;
    font-size: 15px !important; font-weight: 600 !important;
    padding: 10px 14px !important;
    outline: none !important;
    transition: border-color .2s, box-shadow .2s !important;
    caret-color: var(--cyan);
  }
  .nr-iw input:focus {
    border-color: var(--cyan) !important;
    box-shadow: 0 0 0 3px rgba(0,229,255,0.12), 0 0 16px rgba(0,229,255,0.15) !important;
  }
  .nr-iw input::placeholder { color: rgba(255,255,255,0.2) !important; }
  .nr-iw input:disabled { opacity: .4 !important; }

  /* Textarea */
  .nr-ta {
    width: 100%;
    background: rgba(0,0,0,0.35);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-size: 14px; font-weight: 600;
    padding: 10px 14px; resize: none; outline: none; line-height: 1.6;
    caret-color: var(--cyan);
    transition: border-color .2s, box-shadow .2s;
  }
  .nr-ta:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.12), 0 0 16px rgba(0,229,255,0.15);
  }
  .nr-ta::placeholder { color: rgba(255,255,255,0.2); }

  /* Char bar */
  .nr-cbar { height: 3px; margin-top: 5px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
  .nr-cbar-fill { height: 100%; border-radius: 2px; transition: width .12s, background .2s; }

  /* ── Type buttons — neon pill style ── */
  .nr-types { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; }
  .nr-tb {
    padding: 10px 4px 9px; text-align: center;
    background: rgba(0,0,0,0.3);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    cursor: pointer; transition: all .18s;
    position: relative; overflow: hidden;
  }
  .nr-tb:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
    transform: translateY(-1px);
  }

  /* Active neon glow per type */
  .nr-tb-cyan.nr-on  { border-color: var(--cyan);   background: rgba(0,229,255,0.08);  box-shadow: 0 0 12px rgba(0,229,255,0.3),  0 0 28px rgba(0,229,255,0.1),  inset 0 0 12px rgba(0,229,255,0.05); }
  .nr-tb-pink.nr-on  { border-color: var(--pink);   background: rgba(255,45,155,0.08); box-shadow: 0 0 12px rgba(255,45,155,0.3), 0 0 28px rgba(255,45,155,0.1), inset 0 0 12px rgba(255,45,155,0.05); }
  .nr-tb-or.nr-on    { border-color: var(--orange); background: rgba(255,109,0,0.08);  box-shadow: 0 0 12px rgba(255,109,0,0.3),  0 0 28px rgba(255,109,0,0.1),  inset 0 0 12px rgba(255,109,0,0.05); }
  .nr-tb-pur.nr-on   { border-color: var(--purple); background: rgba(192,38,211,0.08); box-shadow: 0 0 12px rgba(192,38,211,0.3), 0 0 28px rgba(192,38,211,0.1), inset 0 0 12px rgba(192,38,211,0.05); }

  .nr-tb-emoji { font-size: 19px; display: block; line-height: 1; }
  .nr-tb-name {
    font-family: 'Nunito', sans-serif;
    font-size: 9px; font-weight: 800;
    letter-spacing: .06em; text-transform: uppercase;
    display: block; margin-top: 5px; transition: color .18s;
  }
  .nr-tb-min {
    font-size: 8px; font-weight: 700;
    color: rgba(255,214,0,0.65); display: block; margin-top: 2px;
  }

  /* Amount row */
  .nr-amt-row { display: flex; gap: 7px; }
  .nr-cur-btn {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(0,0,0,0.35) !important;
    border: 1.5px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    color: #fff !important;
    font-family: 'Nunito', sans-serif !important;
    font-size: 13px !important; font-weight: 700 !important;
    padding: 0 12px !important;
    min-width: 90px; height: 42px;
    cursor: pointer; transition: border-color .2s, box-shadow .2s;
    flex-shrink: 0;
  }
  .nr-cur-btn:hover {
    border-color: var(--cyan) !important;
    box-shadow: 0 0 10px rgba(0,229,255,0.2) !important;
  }

  /* Divider */
  .nr-div {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,45,155,0.25), rgba(0,229,255,0.2), transparent);
  }

  /* Sub panels */
  .nr-sp { border-radius: 12px; padding: 14px 16px; }
  .nr-sp-or  { background: rgba(255,109,0,0.06);  border: 1.5px solid rgba(255,109,0,0.3);  box-shadow: 0 0 16px rgba(255,109,0,0.08),  inset 0 0 16px rgba(255,109,0,0.03); }
  .nr-sp-pur { background: rgba(192,38,211,0.06); border: 1.5px solid rgba(192,38,211,0.3); box-shadow: 0 0 16px rgba(192,38,211,0.08), inset 0 0 16px rgba(192,38,211,0.03); }

  /* ── Submit ── */
  .nr-btn {
    width: 100%; padding: 14px; border: none; cursor: pointer;
    font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 800;
    letter-spacing: .04em; color: #fff;
    position: relative; overflow: hidden; border-radius: 12px;
    transition: transform .15s, box-shadow .2s;
    background: linear-gradient(90deg, #c026d3 0%, #ff2d9b 50%, #ff6d00 100%);
    box-shadow:
      0 0 14px rgba(255,45,155,0.5),
      0 0 30px rgba(192,38,211,0.2),
      0 4px 20px rgba(0,0,0,0.4);
  }
  .nr-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 0 22px rgba(255,45,155,0.7),
      0 0 50px rgba(192,38,211,0.3),
      0 8px 30px rgba(0,0,0,0.5);
  }
  .nr-btn:active:not(:disabled) { transform: translateY(0); }
  .nr-btn:disabled { opacity: .35; cursor: not-allowed; }
  .nr-btn::before {
    content: ''; position: absolute; top: 0; left: -110%; width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: skewX(-20deg); transition: left .55s;
  }
  .nr-btn:hover:not(:disabled)::before { left: 160%; }

  /* Hints */
  .nr-hint { font-size: 11px; font-weight: 600; color: rgba(0,229,255,0.5); margin-top: 5px; }
  .nr-lock { font-size: 11px; font-weight: 700; color: rgba(255,214,0,0.7); display: flex; align-items: center; gap: 4px; margin-top: 5px; }

  /* Fade up */
  @keyframes nr-fu { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
  .nr-fu { animation: nr-fu .22s ease forwards; }

  /* Spinner */
  @keyframes nr-sp { to{transform:rotate(360deg);} }
  .nr-spin {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; display: inline-block;
    animation: nr-sp .65s linear infinite;
  }

  /* HyperSound FX */
  @keyframes nr-hs { 0%{opacity:1;transform:scale(1) translateY(0);} 50%{transform:scale(1.6) translateY(-28px);} 100%{opacity:0;transform:scale(1.2) translateY(-60px);} }
  .nr-hs-fx { animation: nr-hs .9s ease forwards; }

  /* Load in */
  @keyframes nr-in { from{opacity:0;transform:translateY(16px) scale(0.98);} to{opacity:1;transform:translateY(0) scale(1);} }
  .nr-in { animation: nr-in .4s cubic-bezier(0.22,1,0.36,1) both; }

  .nr-scroll::-webkit-scrollbar { width: 3px; }
  .nr-scroll::-webkit-scrollbar-thumb { background: rgba(255,45,155,0.25); border-radius: 2px; }
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
        theme:{color:'#ff2d9b'},
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
  const charClr = charPct>90?'var(--pink)':charPct>70?'var(--yellow)':'var(--cyan)';

  const TYPES=[
    {key:'message' as const,   emoji:'💬', label:'Text',  min:pricing.minText,       tc:'nr-tb-cyan', nc:'var(--cyan)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'nr-tb-cyan', nc:'var(--cyan)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'nr-tb-or',   nc:'var(--orange)'},
    {key:'image' as const,     emoji:'📷', label:'Image', min:pricing.minMedia,      tc:'nr-tb-pur',  nc:'var(--purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      <div className="nr nr-page nr-scroll">
        <div className="nr-ambient"/>

        {!isMobile ? (
          <><VideoBackground videoSrc="/assets/streamers/ankit-background.mp4"/>
            <div style={{position:'fixed',inset:0,background:'rgba(17,13,26,0.8)',pointerEvents:'none',zIndex:1}}/></>
        ) : (
          <><video ref={mobileVideoRef} autoPlay loop muted playsInline
              style={{position:'fixed',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4"/>
            </video>
            <div style={{position:'fixed',inset:0,background:'rgba(17,13,26,0.8)',pointerEvents:'none',zIndex:1}}/></>
        )}

        <div className="nr-card nr-in">

          {/* ── HERO ── */}
          <div className="nr-hero">
            <div className="nr-name">Ankit</div>
            <div className="nr-tagline">Send a message live on stream</div>
            <div style={{display:'flex',justifyContent:'center',marginTop:10}}>
              <div className="nr-live">
                <div className="nr-live-dot"/>
                <span style={{fontSize:11,fontWeight:700,color:'var(--green)',letterSpacing:'0.06em'}}>Live Now</span>
              </div>
            </div>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit}>
            <div className="nr-body">

              {/* Name */}
              <div>
                <label className="nr-label">Your Name</label>
                <div className="nr-iw">
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="nr-label">Donation Type</label>
                <div className="nr-types">
                  {TYPES.map(t=>(
                    <button key={t.key} type="button"
                      onClick={()=>handleDonationTypeChange(t.key)}
                      className={cn('nr-tb',t.tc,donationType===t.key?'nr-on':'')}>
                      <span className="nr-tb-emoji">{t.emoji}</span>
                      <span className="nr-tb-name" style={{
                        color: donationType===t.key ? t.nc : 'rgba(255,255,255,0.35)',
                        textShadow: donationType===t.key ? `0 0 8px ${t.nc}` : 'none',
                      }}>{t.label}</span>
                      <span className="nr-tb-min">{sym}{t.min}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="nr-label">Amount</label>
                <div className="nr-amt-row">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="nr-cur-btn">
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
                  <div className="nr-iw" style={{flex:1}}>
                    <Input id="amount" name="amount" type="number"
                      value={formData.amount} onChange={handleInputChange}
                      min="1" max="100000" placeholder="0"
                      disabled={isAmountLocked||donationType==='hypersound'} required/>
                  </div>
                </div>
                {isAmountLocked&&<p className="nr-lock">🔒 Amount locked during recording</p>}
                {donationType==='message'&&pricing.ttsEnabled&&(
                  <p className="nr-hint">⚡ TTS voice above {sym}{pricing.minTts}</p>
                )}
                {donationType==='voice'&&currentAmount>=pricing.minVoice&&(
                  <p className="nr-hint">⏱ {getVoiceDuration(currentAmount)}s{formData.currency==='INR'&&currentAmount<200?' · ₹200+ for 20s, ₹250+ for 30s':''}</p>
                )}
              </div>

              <div className="nr-div"/>

              {/* Dynamic content */}
              {donationType==='message'&&(
                <div className="nr-fu">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <label className="nr-label" style={{margin:0}}>Message</label>
                    <span style={{fontSize:11,fontWeight:700,color:charClr,textShadow:`0 0 8px ${charClr}`}}>
                      {formData.message.length}/{charLimit}
                    </span>
                  </div>
                  <textarea id="message" name="message"
                    value={formData.message} onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="nr-ta" rows={3} maxLength={charLimit} required/>
                  <div className="nr-cbar">
                    <div className="nr-cbar-fill" style={{width:`${charPct}%`,background:charClr,boxShadow:`0 0 6px ${charClr}`}}/>
                  </div>
                </div>
              )}

              {donationType==='voice'&&(
                <div className="nr-fu">
                  <label className="nr-label">Voice Message</label>
                  <VoiceRecorder
                    onRecordingComplete={(has,dur)=>{ setHasVoiceRecording(has); setVoiceDuration(dur); }}
                    maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder}
                    requiredAmount={150} currentAmount={currentAmount}/>
                </div>
              )}

              {donationType==='hypersound'&&(
                <div className="nr-fu nr-sp nr-sp-or">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <Volume2 style={{width:15,height:15,color:'var(--orange)',filter:'drop-shadow(0 0 5px var(--orange))'}}/>
                    <span style={{fontSize:13,fontWeight:800,color:'var(--orange)',textShadow:'0 0 8px var(--orange)',letterSpacing:'0.03em'}}>HyperSounds</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:12}}>
                    Pick a sound to blast on stream.
                  </p>
                  <HyperSoundSelector selectedSound={selectedSound} onSoundSelect={setSelectedSound}/>
                </div>
              )}

              {donationType==='image'&&(
                <div className="nr-fu nr-sp nr-sp-pur">
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <Image style={{width:15,height:15,color:'var(--purple)',filter:'drop-shadow(0 0 5px var(--purple))'}}/>
                    <span style={{fontSize:13,fontWeight:800,color:'var(--purple)',textShadow:'0 0 8px var(--purple)',letterSpacing:'0.03em'}}>Image Upload</span>
                    <span style={{fontSize:9,fontWeight:800,color:'rgba(255,214,0,0.8)',border:'1px solid rgba(255,214,0,0.25)',padding:'1px 7px',borderRadius:20,marginLeft:4}}>DEMO</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.4)',marginBottom:12}}>
                    Share an image with the streamer. (Demo — not live yet)
                  </p>
                  {!imagePreview?(
                    <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:84,border:'1.5px dashed rgba(192,38,211,0.3)',borderRadius:10,cursor:'pointer',background:'rgba(192,38,211,0.03)'}}>
                      <Image style={{width:22,height:22,color:'rgba(192,38,211,0.5)',marginBottom:6}}/>
                      <span style={{fontSize:12,fontWeight:700,color:'rgba(192,38,211,0.6)'}}>Click to upload</span>
                      <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.25)',marginTop:2}}>PNG, JPG · max 5MB</span>
                      <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageSelect}/>
                    </label>
                  ):(
                    <div style={{position:'relative'}}>
                      <img src={imagePreview} alt="Preview" style={{width:'100%',height:84,objectFit:'cover',borderRadius:8,display:'block'}}/>
                      <button type="button" onClick={handleRemoveImage} style={{position:'absolute',top:6,right:6,background:'rgba(255,45,155,0.9)',border:'none',borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 0 8px rgba(255,45,155,0.5)'}}>
                        <X style={{width:13,height:13,color:'#fff'}}/>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards */}
              <RewardsBanner amount={currentAmount} currency={formData.currency}/>

              {/* Submit */}
              <button type="submit" className="nr-btn" disabled={isProcessing||!razorpayLoaded}>
                {isProcessing||!razorpayLoaded?(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    <span className="nr-spin"/>
                    {isProcessing?'Processing...':'Loading Payment...'}
                  </span>
                ):(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    <Heart style={{width:16,height:16}}/>
                    Donate {sym}{formData.amount||'0'}
                  </span>
                )}
              </button>

              <p style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.6}}>
                Phone numbers collected by Razorpay as per RBI regulations
              </p>

              <DonationPageFooter brandColor="#ff2d9b"/>
            </div>
          </form>
        </div>
      </div>

      {showHypersoundEffect&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
          <div className="nr-hs-fx" style={{fontSize:72}}>🔊</div>
        </div>
      )}
    </>
  );
};

export default Ankit;
