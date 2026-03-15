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
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Pacifico&display=swap');

  :root {
    --ex-orange: #ff7300;
    --ex-amber:  #ffaa00;
    --ex-yellow: #ffe500;
    --ex-red:    #ff3300;
    --ex-cyan:   #00eeff;
    --ex-purple: #aa00ff;
    --ex-green:  #00ff88;
    --ex-bg:     #0f0800;
    --ex-card:   #180c00;
  }

  .ex-root { font-family: 'Nunito', sans-serif; }

  .ex-page {
    width: 100vw; height: 100dvh;
    background: var(--ex-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .ex-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 10% 10%, rgba(255,115,0,0.2)  0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 88% 88%, rgba(255,50,0,0.15)  0%, transparent 55%),
      radial-gradient(ellipse 45% 35% at 55% 50%, rgba(255,170,0,0.06) 0%, transparent 60%);
  }

  .ex-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .ex-card {
    width: 420px; background: var(--ex-card); border-radius: 20px;
    border: 1px solid rgba(255,115,0,0.35);
    box-shadow:
      0 0 0 1px rgba(255,115,0,0.08),
      0 0 28px rgba(255,115,0,0.22),
      0 0 65px rgba(255,50,0,0.1),
      0 30px 80px rgba(0,0,0,0.75);
    overflow: hidden;
  }

  /* ── HERO ── */
  .ex-hero {
    position: relative; padding: 14px 18px 12px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255,115,0,0.18) 0%, rgba(255,50,0,0.1) 60%, transparent 100%);
    border-bottom: 1px solid rgba(255,115,0,0.2);
  }
  .ex-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--ex-red), var(--ex-orange), var(--ex-amber), var(--ex-yellow), var(--ex-orange), var(--ex-red));
    background-size: 200% 100%; animation: ex-shift 3s linear infinite;
    box-shadow: 0 0 8px var(--ex-orange), 0 0 18px rgba(255,115,0,0.45);
  }
  @keyframes ex-shift { 0%{background-position:0%} 100%{background-position:200%} }
  .ex-hero-blob { position:absolute; top:-30px; right:-30px; width:130px; height:130px; border-radius:50%; background:radial-gradient(circle, rgba(255,115,0,0.3) 0%, transparent 65%); pointer-events:none; }

  @keyframes ex-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% { text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 22px var(--ex-orange), 0 0 42px var(--ex-orange), 0 0 75px var(--ex-amber); }
    19%,21%,53%,63% { text-shadow: none; opacity: 0.75; }
  }
  .ex-name { font-family:'Pacifico',cursive; font-size:36px; color:#fff; line-height:1; animation:ex-flicker 9s infinite; position:relative; z-index:1; }
  .ex-hero-sub { font-size:10px; font-weight:700; color:rgba(255,255,255,0.38); margin-top:2px; position:relative; z-index:1; }

  @keyframes ex-pulse { 0%,100%{box-shadow:0 0 5px var(--ex-green);} 50%{box-shadow:none;} }
  .ex-live { display:inline-flex; align-items:center; gap:5px; background:rgba(0,255,136,0.1); border:1.5px solid rgba(0,255,136,0.4); border-radius:20px; padding:3px 10px; flex-shrink:0; position:relative; z-index:1; }
  .ex-live-dot { width:6px; height:6px; border-radius:50%; background:var(--ex-green); animation:ex-pulse 1.5s ease-in-out infinite; }

  /* ── Body ── */
  .ex-body { padding: 14px 18px 16px; display:flex; flex-direction:column; gap:11px; }
  .ex-lbl { font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:5px; color:rgba(255,255,255,0.45); }

  /* Inputs */
  .ex-iw input {
    width:100% !important; background:rgba(255,255,255,0.04) !important;
    border:1.5px solid rgba(255,115,0,0.25) !important; border-radius:8px !important;
    color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:14px !important; font-weight:700 !important; padding:8px 12px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--ex-orange);
  }
  .ex-iw input:focus { border-color:var(--ex-orange) !important; background:rgba(255,115,0,0.06) !important; box-shadow:0 0 0 2px rgba(255,115,0,0.15),0 0 14px rgba(255,115,0,0.12) !important; }
  .ex-iw input::placeholder { color:rgba(255,255,255,0.2) !important; }
  .ex-iw input:disabled, .ex-iw input[readonly] { opacity:.38 !important; cursor:not-allowed !important; }

  .ex-ta {
    width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,115,0,0.25);
    border-radius:8px; color:#fff; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700;
    padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--ex-orange); transition:all .2s;
  }
  .ex-ta:focus { border-color:var(--ex-orange); background:rgba(255,115,0,0.06); box-shadow:0 0 0 2px rgba(255,115,0,0.15),0 0 14px rgba(255,115,0,0.12); }
  .ex-ta::placeholder { color:rgba(255,255,255,0.2); }

  .ex-cbar { height:2px; margin-top:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .ex-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* ══════════════════════
     3D TYPE BUTTONS
  ══════════════════════ */
  .ex-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding-bottom:6px; }
  .ex-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:10px; display:block; width:100%; }
  .ex-tb-face { position:relative; z-index:2; padding:10px 4px 9px; border-radius:10px; text-align:center; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-5px); }
  .ex-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 3px); border-radius:10px; z-index:1; }

  /* Orange */
  .ex-tb-or .ex-tb-face { background:linear-gradient(160deg,rgba(255,115,0,0.2),rgba(130,50,0,0.55)); border:1.5px solid rgba(255,115,0,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 0 10px rgba(255,115,0,0.2); }
  .ex-tb-or::after { background:#6a2a00; border:1.5px solid rgba(255,115,0,0.35); }
  .ex-tb-or:hover .ex-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,115,0,0.55); }
  .ex-tb-or.ex-on .ex-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,115,0,0.32),rgba(170,65,0,0.6)); border-color:var(--ex-orange); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,115,0,0.75),0 0 34px rgba(255,115,0,0.28),inset 0 0 12px rgba(255,115,0,0.14); }

  /* Amber */
  .ex-tb-am .ex-tb-face { background:linear-gradient(160deg,rgba(255,170,0,0.2),rgba(130,80,0,0.55)); border:1.5px solid rgba(255,170,0,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 0 10px rgba(255,170,0,0.2); }
  .ex-tb-am::after { background:#6b4000; border:1.5px solid rgba(255,170,0,0.35); }
  .ex-tb-am:hover .ex-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,170,0,0.5); }
  .ex-tb-am.ex-on .ex-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,170,0,0.32),rgba(180,100,0,0.6)); border-color:var(--ex-amber); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,170,0,0.7),0 0 32px rgba(255,170,0,0.25),inset 0 0 12px rgba(255,170,0,0.12); }

  /* Red */
  .ex-tb-rd .ex-tb-face { background:linear-gradient(160deg,rgba(255,51,0,0.2),rgba(120,0,0,0.55)); border:1.5px solid rgba(255,51,0,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 0 10px rgba(255,51,0,0.2); }
  .ex-tb-rd::after { background:#660000; border:1.5px solid rgba(255,51,0,0.35); }
  .ex-tb-rd:hover .ex-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,51,0,0.5); }
  .ex-tb-rd.ex-on .ex-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,51,0,0.32),rgba(160,0,0,0.6)); border-color:var(--ex-red); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,51,0,0.7),0 0 32px rgba(255,51,0,0.25),inset 0 0 12px rgba(255,51,0,0.12); }

  /* Purple */
  .ex-tb-pu .ex-tb-face { background:linear-gradient(160deg,rgba(170,0,255,0.2),rgba(90,0,140,0.5)); border:1.5px solid rgba(170,0,255,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 0 10px rgba(170,0,255,0.2); }
  .ex-tb-pu::after { background:#460070; border:1.5px solid rgba(170,0,255,0.35); }
  .ex-tb-pu:hover .ex-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(170,0,255,0.5); }
  .ex-tb-pu.ex-on .ex-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(170,0,255,0.32),rgba(120,0,180,0.55)); border-color:var(--ex-purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(170,0,255,0.7),0 0 32px rgba(170,0,255,0.25),inset 0 0 12px rgba(170,0,255,0.12); }

  .ex-tb:active .ex-tb-face { transform:translateY(0px) !important; }
  .ex-tb-emoji { font-size:18px; display:block; line-height:1; }
  .ex-tb-name  { font-size:9px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s, text-shadow .15s; }
  .ex-tb-min   { font-size:7px; font-weight:700; color:rgba(255,228,0,0.7); display:block; margin-top:1px; }

  /* Amount */
  .ex-amt { display:flex; gap:7px; }
  .ex-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(255,255,255,0.04) !important; border:1.5px solid rgba(255,115,0,0.25) !important;
    border-radius:8px !important; color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:12px !important; font-weight:800 !important; padding:0 10px !important;
    min-width:84px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .ex-cur:hover { border-color:var(--ex-orange) !important; box-shadow:0 0 10px rgba(255,115,0,0.2) !important; }

  .ex-div { height:1px; background:linear-gradient(90deg,transparent,rgba(255,115,0,0.3),rgba(255,170,0,0.2),transparent); }

  /* Sub panels */
  .ex-sp { border-radius:10px; padding:10px 12px; }
  .ex-sp-am { background:rgba(255,170,0,0.06); border:1.5px solid rgba(255,170,0,0.35); box-shadow:0 0 14px rgba(255,170,0,0.08); }
  .ex-sp-rd { background:rgba(255,51,0,0.06);  border:1.5px solid rgba(255,51,0,0.35);  box-shadow:0 0 14px rgba(255,51,0,0.08); }
  .ex-sp-pu { background:rgba(170,0,255,0.06); border:1.5px solid rgba(170,0,255,0.35); box-shadow:0 0 14px rgba(170,0,255,0.08); }
  .ex-sp-or { background:rgba(255,115,0,0.06); border:1.5px solid rgba(255,115,0,0.3);  box-shadow:0 0 14px rgba(255,115,0,0.08); }

  /* ══════════════════════
     3D DONATE BUTTON
  ══════════════════════ */
  .ex-btn-wrap { position:relative; width:100%; border-radius:12px; padding-bottom:6px; }
  .ex-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:12px; z-index:1; background:linear-gradient(90deg,#7a2800,#993500,#7a1a00); }
  .ex-btn {
    position:relative; z-index:2; width:100%; padding:13px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:15px; font-weight:900; letter-spacing:.04em; color:#fff;
    border-radius:12px; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,#ff3300 0%,#ff7300 45%,#ffaa00 100%);
    border-top:1.5px solid rgba(255,220,150,0.3); border-left:1.5px solid rgba(255,200,100,0.15);
    box-shadow:inset 0 1px 0 rgba(255,220,150,0.2),0 0 18px rgba(255,115,0,0.5),0 0 36px rgba(255,50,0,0.2);
    overflow:hidden;
  }
  .ex-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,220,150,0.25),0 0 28px rgba(255,115,0,0.72),0 0 55px rgba(255,50,0,0.3); }
  .ex-btn:active:not(:disabled) { transform:translateY(0px) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.4),0 0 14px rgba(255,115,0,0.3) !important; }
  .ex-btn:disabled { opacity:.38; cursor:not-allowed; }
  .ex-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:skewX(-20deg); transition:left .5s; }
  .ex-btn:hover:not(:disabled)::before { left:160%; }

  .ex-hint { font-size:10px; font-weight:700; color:rgba(255,170,0,0.55); margin-top:3px; }

  @keyframes ex-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .ex-fu { animation:ex-fu .2s ease forwards; }

  @keyframes ex-sp-a { to{transform:rotate(360deg);} }
  .ex-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:ex-sp-a .65s linear infinite; }

  @keyframes ex-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .ex-in { animation:ex-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const Eryx = () => {
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

  const { pricing }      = useStreamerPricing('eryx', selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency==="INR") { if (amount>=500) return 15; if (amount>=300) return 12; return 8; }
    if (amount>=6) return 15; if (amount>=4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  /* ── Auto-scale ── */
  const applyScale = useCallback(() => {
    const wrap=wrapRef.current; const card=cardRef.current;
    if (!wrap||!card) return;
    const scaleW = Math.min(1,(window.innerWidth-32)/420);
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
    if (!razorpayLoaded||!(window as any).Razorpay) { toast.error("Payment system is still loading. Please wait."); return; }
    if (!formData.name||!formData.amount) { toast.error("Please fill in all required fields"); return; }
    const amount=parseFloat(formData.amount);
    if (isNaN(amount)||amount<=0) { toast.error("Please enter a valid amount"); return; }
    const minAmount = donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<minAmount) { toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`); return; }
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
          reader.onload=()=>{ const r=reader.result as string; if (!r||!r.includes(",")) { reject(new Error("Failed to read voice data")); return; } resolve(r.split(",")[1]); };
          reader.onerror=()=>reject(new Error("Failed to read voice recording"));
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const {data:up,error:ue}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:voiceDataBase64,streamerSlug:"eryx"}});
        if (ue) throw new Error("Failed to upload voice message");
        voiceMessageUrl=up.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:'eryx', name:formData.name, amount:parseFloat(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null, mediaType:donationType==="media"?mediaType:null,
          currency:selectedCurrency }
      });
      if (error) throw error;
      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency,
        order_id:data.razorpay_order_id, name:"Eryx", description:"Support Eryx",
        handler:(response:any)=>navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#f97316"},
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
    else if (value==="media") { setFormData(p=>({...p,amount:String(pricing.minMedia),message:""})); setMediaUrl(null); setMediaType(null); }
    else setFormData(p=>({...p,amount:String(pricing.minText),message:""}));
  };

  const msgPct = maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr = msgPct>90?'var(--ex-red)':msgPct>70?'var(--ex-yellow)':'var(--ex-amber)';

  const TYPES=[
    {key:'text' as const,      emoji:'💬', label:'Text',  min:pricing.minText,       tc:'ex-tb-or', nc:'var(--ex-orange)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'ex-tb-am', nc:'var(--ex-amber)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'ex-tb-rd', nc:'var(--ex-red)'},
    {key:'media' as const,     emoji:'🖼️', label:'Media', min:pricing.minMedia,      tc:'ex-tb-pu', nc:'var(--ex-purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <div className="ex-root ex-page">
        <div className="ex-atm"/>

        <div ref={wrapRef} className="ex-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="ex-card ex-in">

            {/* HERO */}
            <div className="ex-hero">
              <div className="ex-hero-blob"/>
              <div>
                <div className="ex-name">Eryx</div>
                <div className="ex-hero-sub">Support with a donation ✦</div>
              </div>
              <div className="ex-live">
                <div className="ex-live-dot"/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--ex-green)',letterSpacing:'0.05em',textShadow:'0 0 6px var(--ex-green)'}}>Live</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="ex-body">

                {/* Name */}
                <div>
                  <label className="ex-lbl">Your Name</label>
                  <div className="ex-iw"><Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                {/* 3D Type buttons */}
                <div>
                  <label className="ex-lbl">Donation Type</label>
                  <div className="ex-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('ex-tb',t.tc,donationType===t.key?'ex-on':'')}>
                        <div className="ex-tb-face">
                          <span className="ex-tb-emoji">{t.emoji}</span>
                          <span className="ex-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.45)',textShadow:donationType===t.key?`0 0 10px ${t.nc},0 0 20px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="ex-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="ex-lbl">Amount</label>
                  <div className="ex-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="ex-cur">
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
                                <CommandItem key={currency.code} value={currency.code} onSelect={v=>{ setSelectedCurrency(v.toUpperCase()); setCurrencyOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4",selectedCurrency===currency.code?"opacity-100":"opacity-0")}/>
                                  {currency.symbol} {currency.code} - {currency.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="ex-iw" style={{flex:1}}>
                      <Input id="amount" name="amount" type="number" placeholder="Enter amount" value={formData.amount}
                        onChange={handleInputChange} readOnly={donationType==="hypersound"} required min="1"/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="ex-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="ex-div"/>

                {/* Text */}
                {donationType==="text"&&(
                  <div className="ex-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="ex-lbl" style={{margin:0}}>Message</label>
                      <span style={{fontSize:10,fontWeight:800,color:msgClr,textShadow:`0 0 6px ${msgClr}`}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Enter your message..." className="ex-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="ex-cbar"><div className="ex-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 6px ${msgClr}`}}/></div>
                  </div>
                )}

                {/* Voice */}
                {donationType==="voice"&&(
                  <div className="ex-fu">
                    <label className="ex-lbl">Voice Message</label>
                    <div className="ex-sp ex-sp-am">
                      <EnhancedVoiceRecorder
                        controller={voiceRecorder}
                        onRecordingComplete={()=>{}}
                        maxDurationSeconds={getVoiceDuration(currentAmount)}
                        brandColor="#f97316"
                        requiredAmount={pricing.minVoice}
                        currentAmount={currentAmount}/>
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType==="hypersound"&&(
                  <div className="ex-fu ex-sp ex-sp-rd">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🔊</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--ex-red)',textShadow:'0 0 8px var(--ex-red)'}}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="ex-fu ex-sp ex-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🖼️</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--ex-purple)',textShadow:'0 0 8px var(--ex-purple)'}}>Media Upload</span>
                    </div>
                    <MediaUploader
                      streamerSlug="eryx"
                      onMediaUploaded={(url,type)=>{ setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={()=>{ setMediaUrl(null); setMediaType(null); }}
                      maxFileSizeMB={10} maxVideoDurationSeconds={15}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* 3D Donate */}
                <div className="ex-btn-wrap">
                  <button type="submit" className="ex-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="ex-spin"/>Processing...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Heart style={{width:15,height:15}}/>
                        Support with {currencySymbol}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.5}}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>
                <DonationPageFooter brandColor="#f97316"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Eryx;
