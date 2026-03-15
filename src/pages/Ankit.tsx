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
    --cp-cyan:    #00f5ff;
    --cp-magenta: #ff2d78;
    --cp-yellow:  #f5e642;
    --cp-orange:  #ff6b2b;
    --cp-bg:      #05050d;
  }

  .cp-root { font-family: 'Rajdhani', sans-serif; }

  /* ── Full-screen layout: card fills viewport height ── */
  .cp-page {
    height: 100vh;
    background: var(--cp-bg);
    display: flex;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  /* Background grid */
  .cp-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,245,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,255,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .cp-grid::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, var(--cp-bg) 100%);
  }
  .cp-glow-a {
    position: fixed; top: -180px; left: -80px;
    width: 560px; height: 560px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }
  .cp-glow-b {
    position: fixed; bottom: -120px; right: -60px;
    width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,45,120,0.08) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }

  /* ── Main card: full height, scrollable inside ── */
  .cp-card {
    width: 100%;
    max-width: 500px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
    background: rgba(0,245,255,0.025);
    border-left: 1px solid rgba(0,245,255,0.12);
    border-right: 1px solid rgba(0,245,255,0.12);
    overflow: hidden;
  }

  /* ── HERO: compact horizontal layout ── */
  .cp-hero {
    flex-shrink: 0;
    position: relative;
    padding: 12px 18px 10px;
    background: linear-gradient(135deg, rgba(0,245,255,0.1) 0%, rgba(255,45,120,0.07) 60%, transparent 100%);
    border-bottom: 1px solid rgba(0,245,255,0.15);
    overflow: hidden;
  }
  /* Diagonal cut top-right */
  .cp-hero::after {
    content: '';
    position: absolute; top: 0; right: 0;
    border-top: 32px solid var(--cp-bg);
    border-left: 32px solid transparent;
    z-index: 2;
  }
  /* Scanline */
  @keyframes cp-scan { 0% { top:-2px; opacity:.6; } 100% { top:100%; opacity:0; } }
  .cp-scanline {
    position: absolute; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent);
    animation: cp-scan 3.5s linear infinite;
    pointer-events: none; z-index: 1;
  }
  /* Corner brackets */
  .cp-tl { position:absolute; top:8px; left:8px; width:14px; height:14px; border-top:2px solid var(--cp-cyan); border-left:2px solid var(--cp-cyan); z-index:3; }
  .cp-br { position:absolute; bottom:8px; right:8px; width:14px; height:14px; border-bottom:2px solid var(--cp-magenta); border-right:2px solid var(--cp-magenta); z-index:3; }

  /* Live badge */
  @keyframes cp-blink { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
  .cp-live {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(0,255,80,0.08); border:1px solid rgba(0,255,80,0.28);
    padding:2px 8px;
  }
  .cp-live-dot { width:5px; height:5px; border-radius:50%; background:#00ff50; animation:cp-blink 1.4s ease-in-out infinite; box-shadow:0 0 5px #00ff50; }

  /* Hero name — glitch */
  @keyframes cp-g1 {
    0%,91%,100%{clip-path:none;transform:none;}
    92%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-3px);}
    93%{clip-path:polygon(0 60%,100% 60%,100% 78%,0 78%);transform:translateX(3px);}
    94%{clip-path:none;transform:none;}
  }
  @keyframes cp-g2 {
    0%,91%,100%{opacity:0;}
    92%{opacity:.5;transform:translateX(5px);clip-path:polygon(0 25%,100% 25%,100% 45%,0 45%);}
    93%{opacity:.5;transform:translateX(-5px);clip-path:polygon(0 62%,100% 62%,100% 75%,0 75%);}
    94%{opacity:0;}
  }
  .cp-name {
    font-family:'Orbitron',sans-serif; font-size:30px; font-weight:900;
    letter-spacing:0.08em; color:#fff; line-height:1;
    text-shadow:0 0 20px rgba(0,245,255,0.45), 0 0 40px rgba(0,245,255,0.15);
    animation:cp-g1 9s ease-in-out infinite;
    position:relative;
  }
  .cp-name::after {
    content:attr(data-text); position:absolute; inset:0; color:var(--cp-cyan);
    animation:cp-g2 9s ease-in-out infinite; pointer-events:none;
  }

  /* Ticker */
  @keyframes cp-tick { from{transform:translateX(0);} to{transform:translateX(-50%);} }
  .cp-ticker { overflow:hidden; height:22px; display:flex; align-items:center; background:rgba(0,245,255,0.025); border-bottom:1px solid rgba(0,245,255,0.09); flex-shrink:0; }
  .cp-ticker-inner { display:inline-flex; gap:32px; white-space:nowrap; animation:cp-tick 22s linear infinite; }
  .cp-tick-item { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(0,245,255,0.38); letter-spacing:.1em; }
  .cp-tick-sep  { color:rgba(255,45,120,0.38); font-size:9px; }

  /* ── Scrollable form body ── */
  .cp-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 14px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cp-body::-webkit-scrollbar { width:3px; }
  .cp-body::-webkit-scrollbar-track { background:transparent; }
  .cp-body::-webkit-scrollbar-thumb { background:rgba(0,245,255,0.2); }

  /* ── Section header ── */
  .cp-sec {
    display:flex; align-items:center; gap:8px; margin-bottom:6px;
  }
  .cp-sec-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
  .cp-sec-label { font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:rgba(0,245,255,0.4); white-space:nowrap; }
  .cp-sec-line { flex:1; height:1px; background:linear-gradient(90deg,rgba(0,245,255,0.15),transparent); }

  /* ── Input ── */
  .cp-iw input {
    width:100% !important;
    background:rgba(0,0,0,0.5) !important;
    border:1px solid rgba(0,245,255,0.16) !important;
    border-left:2px solid rgba(0,245,255,0.32) !important;
    border-radius:0 !important;
    color:#e8fffe !important;
    font-family:'Rajdhani',sans-serif !important;
    font-size:15px !important; font-weight:500 !important;
    padding:8px 12px !important;
    outline:none !important;
    transition:border-color .2s, box-shadow .2s, background .2s !important;
    caret-color:var(--cp-cyan);
  }
  .cp-iw input:focus {
    border-color:rgba(0,245,255,0.5) !important;
    border-left-color:var(--cp-cyan) !important;
    box-shadow:0 0 0 1px rgba(0,245,255,0.08), 0 0 16px rgba(0,245,255,0.06) !important;
    background:rgba(0,245,255,0.035) !important;
  }
  .cp-iw input::placeholder { color:rgba(0,245,255,0.18) !important; }
  .cp-iw input:disabled { opacity:.45 !important; }

  .cp-ta {
    width:100%; background:rgba(0,0,0,0.5);
    border:1px solid rgba(0,245,255,0.16); border-left:2px solid rgba(0,245,255,0.32);
    border-radius:0; color:#e8fffe;
    font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:500;
    padding:8px 12px; resize:none; outline:none;
    caret-color:var(--cp-cyan); line-height:1.5;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .cp-ta:focus {
    border-color:rgba(0,245,255,0.5); border-left-color:var(--cp-cyan);
    box-shadow:0 0 0 1px rgba(0,245,255,0.08), 0 0 16px rgba(0,245,255,0.06);
    background:rgba(0,245,255,0.035);
  }
  .cp-ta::placeholder { color:rgba(0,245,255,0.18); }

  /* Char bar */
  .cp-cbar { height:2px; margin-top:4px; background:rgba(0,245,255,0.07); overflow:hidden; }
  .cp-cbar-fill { height:100%; transition:width .12s, background .2s; }

  /* ── Type buttons ── */
  .cp-types { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
  .cp-tb {
    padding:8px 3px 7px; text-align:center;
    background:rgba(0,0,0,0.4); border:1px solid rgba(0,245,255,0.1);
    cursor:pointer; transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%);
  }
  .cp-tb:hover { border-color:rgba(0,245,255,0.28); background:rgba(0,245,255,0.04); }
  .cp-tb-c.cp-on { border-color:rgba(0,245,255,0.55); background:rgba(0,245,255,0.08); box-shadow:0 0 14px rgba(0,245,255,0.1); }
  .cp-tb-o.cp-on { border-color:rgba(255,107,43,0.55); background:rgba(255,107,43,0.08); box-shadow:0 0 14px rgba(255,107,43,0.1); }
  .cp-tb-m.cp-on { border-color:rgba(255,45,120,0.55); background:rgba(255,45,120,0.08); box-shadow:0 0 14px rgba(255,45,120,0.1); }
  .cp-tb-emoji { font-size:16px; display:block; line-height:1; }
  .cp-tb-name  { font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:.1em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s; }
  .cp-tb-min   { font-family:'Share Tech Mono',monospace; font-size:7px; color:rgba(245,230,66,.6); display:block; margin-top:2px; }

  /* ── Amount row ── */
  .cp-amt-row { display:flex; gap:6px; }
  .cp-cur-btn {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(0,0,0,0.5) !important; border:1px solid rgba(0,245,255,0.16) !important;
    border-left:2px solid rgba(0,245,255,0.32) !important; border-radius:0 !important;
    color:#e8fffe !important; font-family:'Share Tech Mono',monospace !important;
    font-size:11px !important; padding:0 10px !important;
    min-width:90px; height:38px; cursor:pointer;
    transition:border-color .2s, background .2s; flex-shrink:0;
  }
  .cp-cur-btn:hover { background:rgba(0,245,255,0.04) !important; border-color:rgba(0,245,255,0.35) !important; }

  /* ── Divider ── */
  .cp-div { height:1px; background:linear-gradient(90deg,transparent,rgba(0,245,255,0.12),rgba(255,45,120,0.08),transparent); }

  /* ── Sub-panels ── */
  .cp-sp { border:1px solid; padding:10px 12px; position:relative; }
  .cp-sp::before { content:''; position:absolute; top:-1px; right:-1px; border-top:10px solid var(--cp-bg); border-left:10px solid transparent; }
  .cp-sp-o { border-color:rgba(255,107,43,0.2); background:rgba(255,107,43,0.03); }
  .cp-sp-m { border-color:rgba(255,45,120,0.2);  background:rgba(255,45,120,0.03); }

  /* ── Submit ── */
  .cp-btn {
    width:100%; padding:12px; border:none; cursor:pointer;
    font-family:'Orbitron',sans-serif; font-size:13px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#05050d;
    position:relative; overflow:hidden;
    transition:transform .15s, box-shadow .2s;
    background:linear-gradient(90deg, var(--cp-cyan) 0%, #00ccff 40%, var(--cp-magenta) 100%);
    box-shadow:0 0 20px rgba(0,245,255,0.2), 0 0 40px rgba(255,45,120,0.08);
    clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
    flex-shrink:0;
  }
  .cp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 0 28px rgba(0,245,255,0.35), 0 0 56px rgba(255,45,120,0.12); }
  .cp-btn:active:not(:disabled) { transform:translateY(0); }
  .cp-btn:disabled { opacity:.35; cursor:not-allowed; }
  .cp-btn::before {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    transform:skewX(-20deg); transition:left .55s;
  }
  .cp-btn:hover:not(:disabled)::before { left:150%; }

  /* Hints */
  .cp-hint { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(0,245,255,0.32); margin-top:4px; }
  .cp-lock { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(245,230,66,.7); display:flex; align-items:center; gap:3px; margin-top:4px; }

  /* Fade-up */
  @keyframes cp-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .cp-fu { animation:cp-fu .2s ease forwards; }

  /* Spinner */
  @keyframes cp-sp { to{transform:rotate(360deg);} }
  .cp-spin { width:13px; height:13px; border:2px solid rgba(5,5,13,.4); border-top-color:#05050d; border-radius:50%; display:inline-block; animation:cp-sp .6s linear infinite; }

  /* HyperSound FX */
  @keyframes cp-hs { 0%{opacity:1;transform:scale(1) translateY(0);} 40%{opacity:1;transform:scale(1.5) translateY(-26px);} 100%{opacity:0;transform:scale(1.2) translateY(-55px);} }
  .cp-hs-fx { animation:cp-hs .9s ease forwards; }

  /* Flicker on load */
  @keyframes cp-fl { 0%,100%{opacity:1;} 3%{opacity:.6;} 5%{opacity:1;} 7%{opacity:.5;} 8%{opacity:1;} }
  .cp-fl { animation:cp-fl .5s ease .1s both; }
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
    s.onload=()=>{ setRazorpayLoaded(true); toast({ title:"Payment System Ready" }); };
    s.onerror=()=>toast({ title:"Payment Error", description:"Please refresh.", variant:"destructive" });
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
        toast({ title:"Message Shortened", description:`Limited to ${lim} chars.` });
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
    if (!formData.name?.trim())                            { toast({title:"Name Required",variant:"destructive"}); return; }
    if (donationType==='voice'&&!hasVoiceRecording)        { toast({title:"Voice Required",variant:"destructive"}); return; }
    if (donationType==='hypersound'&&!selectedSound)       { toast({title:"Sound Required",variant:"destructive"}); return; }
    if (donationType==='message'&&!formData.message?.trim()){ toast({title:"Message Required",variant:"destructive"}); return; }
    if (donationType==='message'&&formData.message.length>charLimit){ toast({title:"Message Too Long",variant:"destructive"}); return; }
    if (!amount||amount<1)                                 { toast({title:"Invalid Amount",variant:"destructive"}); return; }
    if (donationType==='message'&&amount<pricing.minText)  { toast({title:`Min ${sym}${pricing.minText}`,variant:"destructive"}); return; }
    if (donationType==='voice'&&amount<pricing.minVoice)   { toast({title:`Min ${sym}${pricing.minVoice}`,variant:"destructive"}); return; }
    if (donationType==='hypersound'&&amount<pricing.minHypersound){ toast({title:`Min ${sym}${pricing.minHypersound}`,variant:"destructive"}); return; }
    if (!razorpayLoaded){ toast({title:"Payment Not Ready",variant:"destructive"}); return; }
    setIsProcessing(true);
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==='voice'&&voiceRecorder.audioBlob) {
        const reader=new FileReader();
        const b64=await new Promise<string>(res=>{ reader.onload=()=>res((reader.result as string).split(',')[1]); reader.readAsDataURL(voiceRecorder.audioBlob!); });
        const {data:up,error:ue}=await supabase.functions.invoke('upload-voice-message-direct',{body:{voiceData:b64,streamerSlug:'ankit'}});
        if (ue) throw new Error('Failed to upload voice message');
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
        theme:{color:'#00f5ff'},
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
  const charClr = charPct>90?'#ff2d78':charPct>70?'#f5e642':'rgba(0,245,255,0.5)';

  const TYPES=[
    {key:'message' as const,   emoji:'💬',label:'TEXT', min:pricing.minText,       tc:'cp-tb-c',nameClr:'#00f5ff'},
    {key:'voice' as const,     emoji:'🎤',label:'VOICE',min:pricing.minVoice,      tc:'cp-tb-c',nameClr:'#00f5ff'},
    {key:'hypersound' as const,emoji:'🔊',label:'SOUND',min:pricing.minHypersound, tc:'cp-tb-o',nameClr:'#ff6b2b'},
    {key:'image' as const,     emoji:'📷',label:'IMAGE',min:pricing.minMedia,       tc:'cp-tb-m',nameClr:'#ff2d78'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}} />

      <div className="cp-root cp-page">
        <div className="cp-grid"/>
        <div className="cp-glow-a"/><div className="cp-glow-b"/>

        {/* Video bg */}
        {!isMobile ? (
          <><VideoBackground videoSrc="/assets/streamers/ankit-background.mp4"/>
            <div style={{position:'fixed',inset:0,background:'rgba(5,5,13,0.8)',pointerEvents:'none',zIndex:1}}/></>
        ) : (
          <><video ref={mobileVideoRef} autoPlay loop muted playsInline
              style={{position:'fixed',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4"/>
            </video>
            <div style={{position:'fixed',inset:0,background:'rgba(5,5,13,0.8)',pointerEvents:'none',zIndex:1}}/></>
        )}

        <div className="cp-card cp-fl">

          {/* ── COMPACT HERO ── */}
          <div className="cp-hero">
            <div className="cp-scanline"/>
            <div className="cp-tl"/><div className="cp-br"/>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:2}}>
              {/* Left: identity */}
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{
                  width:42,height:42,flexShrink:0,
                  background:'linear-gradient(135deg,rgba(0,245,255,0.15),rgba(255,45,120,0.12))',
                  border:'1px solid rgba(0,245,255,0.25)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
                }}>🎮</div>
                <div>
                  <div className="cp-name" data-text="ANKIT">ANKIT</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,245,255,0.45)',letterSpacing:'0.14em',marginTop:2}}>
                    // STREAM ACTIVE
                  </div>
                </div>
              </div>
              {/* Right: status */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <div className="cp-live">
                  <div className="cp-live-dot"/>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'#00ff50',letterSpacing:'0.14em'}}>ON AIR</span>
                </div>
                <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,245,255,0.28)',letterSpacing:'0.1em'}}>HYPERCHAT</span>
              </div>
            </div>
          </div>

          {/* ── TICKER ── */}
          <div className="cp-ticker">
            <div className="cp-ticker-inner">
              {[...Array(2)].map((_,i)=>(
                <React.Fragment key={i}>
                  <span className="cp-tick-item">💬 TEXT · MIN {sym}{pricing.minText}</span>
                  <span className="cp-tick-sep"> ◆ </span>
                  <span className="cp-tick-item">🎤 VOICE · MIN {sym}{pricing.minVoice}</span>
                  <span className="cp-tick-sep"> ◆ </span>
                  <span className="cp-tick-item">🔊 SOUND · MIN {sym}{pricing.minHypersound}</span>
                  <span className="cp-tick-sep"> ◆ </span>
                  <span className="cp-tick-item">⚡ TTS AT {sym}{pricing.minTts}+</span>
                  <span className="cp-tick-sep"> ◆ </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── FORM BODY (scrollable) ── */}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
            <div className="cp-body">

              {/* Name */}
              <div>
                <div className="cp-sec">
                  <div className="cp-sec-dot" style={{background:'var(--cp-cyan)',boxShadow:'0 0 5px var(--cp-cyan)'}}/>
                  <span className="cp-sec-label">Identification</span>
                  <div className="cp-sec-line"/>
                </div>
                <div className="cp-iw">
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your callsign" required/>
                </div>
              </div>

              {/* Type */}
              <div>
                <div className="cp-sec">
                  <div className="cp-sec-dot" style={{background:'var(--cp-magenta)',boxShadow:'0 0 5px var(--cp-magenta)'}}/>
                  <span className="cp-sec-label" style={{color:'rgba(255,45,120,0.5)'}}>Payload Type</span>
                  <div className="cp-sec-line" style={{background:'linear-gradient(90deg,rgba(255,45,120,0.18),transparent)'}}/>
                </div>
                <div className="cp-types">
                  {TYPES.map(t=>(
                    <button key={t.key} type="button"
                      onClick={()=>handleDonationTypeChange(t.key)}
                      className={cn('cp-tb',t.tc,donationType===t.key?'cp-on':'')}>
                      <span className="cp-tb-emoji">{t.emoji}</span>
                      <span className="cp-tb-name" style={{color:donationType===t.key?t.nameClr:'rgba(255,255,255,0.35)'}}>{t.label}</span>
                      <span className="cp-tb-min">{sym}{t.min}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="cp-sec">
                  <div className="cp-sec-dot" style={{background:'var(--cp-yellow)',boxShadow:'0 0 5px var(--cp-yellow)'}}/>
                  <span className="cp-sec-label" style={{color:'rgba(245,230,66,0.45)'}}>Transfer Amount</span>
                  <div className="cp-sec-line" style={{background:'linear-gradient(90deg,rgba(245,230,66,0.15),transparent)'}}/>
                </div>
                <div className="cp-amt-row">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="cp-cur-btn">
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
                  <div className="cp-iw" style={{flex:1}}>
                    <Input id="amount" name="amount" type="number"
                      value={formData.amount} onChange={handleInputChange}
                      min="1" max="100000" placeholder="0"
                      disabled={isAmountLocked||donationType==='hypersound'} required/>
                  </div>
                </div>
                {isAmountLocked && <p className="cp-lock">🔒 Locked during recording</p>}
                {donationType==='message'&&pricing.ttsEnabled&&(
                  <p className="cp-hint">⚡ TTS voice above {sym}{pricing.minTts}</p>
                )}
                {donationType==='voice'&&currentAmount>=pricing.minVoice&&(
                  <p className="cp-hint">⏱ {getVoiceDuration(currentAmount)}s
                    {formData.currency==='INR'&&currentAmount<200?' · ₹200+ for 20s, ₹250+ for 30s':''}
                  </p>
                )}
              </div>

              <div className="cp-div"/>

              {/* Dynamic section */}
              {donationType==='message'&&(
                <div className="cp-fu">
                  <div className="cp-sec" style={{marginBottom:5}}>
                    <div className="cp-sec-dot" style={{background:'var(--cp-cyan)',boxShadow:'0 0 5px var(--cp-cyan)'}}/>
                    <span className="cp-sec-label">Message Payload</span>
                    <div className="cp-sec-line"/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:charClr,marginLeft:8,flexShrink:0}}>
                      {formData.message.length}/{charLimit}
                    </span>
                  </div>
                  <textarea id="message" name="message"
                    value={formData.message} onChange={handleInputChange}
                    placeholder="Transmit your message..."
                    className="cp-ta" rows={2} maxLength={charLimit} required/>
                  <div className="cp-cbar">
                    <div className="cp-cbar-fill" style={{width:`${charPct}%`,background:charClr}}/>
                  </div>
                </div>
              )}

              {donationType==='voice'&&(
                <div className="cp-fu">
                  <div className="cp-sec" style={{marginBottom:6}}>
                    <div className="cp-sec-dot" style={{background:'var(--cp-cyan)',boxShadow:'0 0 5px var(--cp-cyan)'}}/>
                    <span className="cp-sec-label">Voice Transmission</span>
                    <div className="cp-sec-line"/>
                  </div>
                  <VoiceRecorder
                    onRecordingComplete={(has,dur)=>{ setHasVoiceRecording(has); setVoiceDuration(dur); }}
                    maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder}
                    requiredAmount={150} currentAmount={currentAmount}/>
                </div>
              )}

              {donationType==='hypersound'&&(
                <div className="cp-fu cp-sp cp-sp-o">
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                    <Volume2 style={{width:13,height:13,color:'#ff6b2b'}}/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#ff6b2b',letterSpacing:'0.12em'}}>SOUND MODULE</span>
                  </div>
                  <HyperSoundSelector selectedSound={selectedSound} onSoundSelect={setSelectedSound}/>
                </div>
              )}

              {donationType==='image'&&(
                <div className="cp-fu cp-sp cp-sp-m">
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                    <Image style={{width:13,height:13,color:'#ff2d78'}}/>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#ff2d78',letterSpacing:'0.12em'}}>IMAGE UPLINK</span>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(245,230,66,.75)',border:'1px solid rgba(245,230,66,.2)',padding:'1px 6px',marginLeft:4}}>DEMO</span>
                  </div>
                  {!imagePreview?(
                    <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:72,border:'1px dashed rgba(255,45,120,0.22)',cursor:'pointer',background:'rgba(255,45,120,0.02)'}}>
                      <Image style={{width:18,height:18,color:'rgba(255,45,120,0.45)',marginBottom:4}}/>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'rgba(255,45,120,0.5)'}}>UPLINK FILE</span>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.22)',marginTop:2}}>PNG, JPG · MAX 5MB</span>
                      <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageSelect}/>
                    </label>
                  ):(
                    <div style={{position:'relative'}}>
                      <img src={imagePreview} alt="Preview" style={{width:'100%',height:72,objectFit:'cover',display:'block'}}/>
                      <button type="button" onClick={handleRemoveImage} style={{position:'absolute',top:5,right:5,background:'rgba(255,45,120,0.85)',border:'none',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        <X style={{width:12,height:12,color:'#fff'}}/>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards */}
              <RewardsBanner amount={currentAmount} currency={formData.currency}/>

              {/* Submit */}
              <button type="submit" className="cp-btn" disabled={isProcessing||!razorpayLoaded}>
                {isProcessing||!razorpayLoaded?(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                    <span className="cp-spin"/>
                    {isProcessing?'TRANSMITTING...':'INITIALIZING...'}
                  </span>
                ):(
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                    <Heart style={{width:14,height:14}}/>
                    DONATE {sym}{formData.amount||'0'}
                  </span>
                )}
              </button>

              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.13)',textAlign:'center',letterSpacing:'0.06em',lineHeight:1.6}}>
                PHONE NUMBERS COLLECTED BY RAZORPAY · RBI COMPLIANCE
              </p>

              <DonationPageFooter brandColor="#00f5ff"/>
            </div>
          </form>
        </div>
      </div>

      {showHypersoundEffect&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
          <div className="cp-hs-fx" style={{fontSize:72}}>🔊</div>
        </div>
      )}
    </>
  );
};

export default Ankit;
