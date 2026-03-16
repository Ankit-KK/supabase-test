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
    --sa-pink:   #ff00cc;
    --sa-fuchsia:#e879f9;
    --sa-cyan:   #00eeff;
    --sa-purple: #aa00ff;
    --sa-yellow: #ffe500;
    --sa-orange: #ff6600;
    --sa-green:  #00ff88;
    --sa-bg:     #0d0015;
    --sa-card:   #140018;
  }

  .sa-root { font-family: 'Nunito', sans-serif; }

  .sa-page {
    width: 100vw; height: 100dvh;
    background: var(--sa-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .sa-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 15% 10%, rgba(232,121,249,0.2) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 85% 85%, rgba(255,0,204,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(170,0,255,0.08) 0%, transparent 60%);
  }

  .sa-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .sa-card {
    width: 420px; background: var(--sa-card); border-radius: 20px;
    border: 1px solid rgba(232,121,249,0.3);
    box-shadow: 0 0 0 1px rgba(170,0,255,0.12), 0 0 25px rgba(232,121,249,0.2), 0 0 60px rgba(170,0,255,0.1), 0 30px 80px rgba(0,0,0,0.7);
    overflow: hidden;
  }

  .sa-hero {
    position: relative; padding: 14px 18px 12px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(232,121,249,0.16) 0%, rgba(255,0,204,0.1) 60%, transparent 100%);
    border-bottom: 1px solid rgba(232,121,249,0.18);
  }
  .sa-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--sa-purple), var(--sa-pink), var(--sa-fuchsia), var(--sa-cyan), var(--sa-purple));
    background-size: 200% 100%; animation: sa-shift 3s linear infinite;
    box-shadow: 0 0 8px var(--sa-pink), 0 0 16px rgba(255,0,204,0.4);
  }
  @keyframes sa-shift { 0%{background-position:0%} 100%{background-position:200%} }
  .sa-hero-blob { position:absolute; top:-30px; right:-30px; width:130px; height:130px; border-radius:50%; background:radial-gradient(circle, rgba(232,121,249,0.28) 0%, transparent 65%); pointer-events:none; }

  @keyframes sa-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% { text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 22px var(--sa-fuchsia), 0 0 42px var(--sa-fuchsia), 0 0 75px var(--sa-fuchsia); }
    19%,21%,53%,63% { text-shadow:none; opacity:0.75; }
  }
  .sa-name { font-family:'Pacifico',cursive; font-size:26px; color:#fff; line-height:1; animation:sa-flicker 9s infinite; position:relative; z-index:1; }
  .sa-hero-sub { font-size:10px; font-weight:700; color:rgba(255,255,255,0.38); margin-top:2px; position:relative; z-index:1; }

  @keyframes sa-pulse { 0%,100%{box-shadow:0 0 5px var(--sa-green);} 50%{box-shadow:none;} }
  .sa-live { display:inline-flex; align-items:center; gap:5px; background:rgba(0,255,136,0.1); border:1.5px solid rgba(0,255,136,0.4); border-radius:20px; padding:3px 10px; flex-shrink:0; position:relative; z-index:1; }
  .sa-live-dot { width:6px; height:6px; border-radius:50%; background:var(--sa-green); animation:sa-pulse 1.5s ease-in-out infinite; }

  .sa-body { padding: 14px 18px 16px; display:flex; flex-direction:column; gap:11px; }
  .sa-lbl { font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:5px; color:rgba(255,255,255,0.45); }

  .sa-iw input {
    width:100% !important; background:rgba(255,255,255,0.05) !important;
    border:1.5px solid rgba(232,121,249,0.18) !important; border-radius:8px !important;
    color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:14px !important; font-weight:700 !important; padding:8px 12px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--sa-fuchsia);
  }
  .sa-iw input:focus { border-color:var(--sa-fuchsia) !important; background:rgba(232,121,249,0.07) !important; box-shadow:0 0 0 2px rgba(232,121,249,0.15),0 0 14px rgba(232,121,249,0.12) !important; }
  .sa-iw input::placeholder { color:rgba(255,255,255,0.22) !important; }
  .sa-iw input:disabled, .sa-iw input[readonly] { opacity:.38 !important; cursor:not-allowed !important; }

  .sa-ta {
    width:100%; background:rgba(255,255,255,0.05); border:1.5px solid rgba(232,121,249,0.18);
    border-radius:8px; color:#fff; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700;
    padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--sa-fuchsia); transition:all .2s;
  }
  .sa-ta:focus { border-color:var(--sa-fuchsia); background:rgba(232,121,249,0.07); box-shadow:0 0 0 2px rgba(232,121,249,0.15),0 0 14px rgba(232,121,249,0.12); }
  .sa-ta::placeholder { color:rgba(255,255,255,0.22); }

  .sa-cbar { height:2px; margin-top:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .sa-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* 3D TYPE BUTTONS */
  .sa-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding-bottom:6px; }
  .sa-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:10px; display:block; width:100%; }
  .sa-tb-face { position:relative; z-index:2; padding:10px 4px 9px; border-radius:10px; text-align:center; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-5px); }
  .sa-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 3px); border-radius:10px; z-index:1; }

  .sa-tb-fu .sa-tb-face { background:linear-gradient(160deg,rgba(232,121,249,0.2),rgba(140,0,160,0.5)); border:1.5px solid rgba(232,121,249,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(232,121,249,0.2); }
  .sa-tb-fu::after { background:#660077; border:1.5px solid rgba(232,121,249,0.35); }
  .sa-tb-fu:hover .sa-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(232,121,249,0.55); }
  .sa-tb-fu.sa-on .sa-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(232,121,249,0.32),rgba(180,0,200,0.55)); border-color:var(--sa-fuchsia); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(232,121,249,0.75),0 0 34px rgba(232,121,249,0.28),inset 0 0 12px rgba(232,121,249,0.14); }

  .sa-tb-cy .sa-tb-face { background:linear-gradient(160deg,rgba(0,238,255,0.2),rgba(0,100,140,0.5)); border:1.5px solid rgba(0,238,255,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(0,238,255,0.2); }
  .sa-tb-cy::after { background:#005566; border:1.5px solid rgba(0,238,255,0.35); }
  .sa-tb-cy:hover .sa-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(0,238,255,0.5); }
  .sa-tb-cy.sa-on .sa-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(0,238,255,0.32),rgba(0,150,180,0.55)); border-color:var(--sa-cyan); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(0,238,255,0.7),0 0 32px rgba(0,238,255,0.25),inset 0 0 12px rgba(0,238,255,0.12); }

  .sa-tb-or .sa-tb-face { background:linear-gradient(160deg,rgba(255,102,0,0.22),rgba(140,50,0,0.5)); border:1.5px solid rgba(255,102,0,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(255,102,0,0.2); }
  .sa-tb-or::after { background:#6a2800; border:1.5px solid rgba(255,102,0,0.35); }
  .sa-tb-or:hover .sa-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(255,102,0,0.5); }
  .sa-tb-or.sa-on .sa-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(255,102,0,0.32),rgba(180,70,0,0.55)); border-color:var(--sa-orange); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(255,102,0,0.7),0 0 32px rgba(255,102,0,0.25),inset 0 0 12px rgba(255,102,0,0.12); }

  .sa-tb-pu .sa-tb-face { background:linear-gradient(160deg,rgba(170,0,255,0.22),rgba(90,0,140,0.5)); border:1.5px solid rgba(170,0,255,0.65); box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 10px rgba(170,0,255,0.2); }
  .sa-tb-pu::after { background:#460070; border:1.5px solid rgba(170,0,255,0.35); }
  .sa-tb-pu:hover .sa-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 18px rgba(170,0,255,0.5); }
  .sa-tb-pu.sa-on .sa-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(170,0,255,0.32),rgba(120,0,180,0.55)); border-color:var(--sa-purple); box-shadow:inset 0 2px 5px rgba(0,0,0,0.3),0 0 18px rgba(170,0,255,0.7),0 0 32px rgba(170,0,255,0.25),inset 0 0 12px rgba(170,0,255,0.12); }

  .sa-tb:active .sa-tb-face { transform:translateY(0px) !important; }
  .sa-tb-emoji { font-size:18px; display:block; line-height:1; }
  .sa-tb-name  { font-size:9px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s, text-shadow .15s; }
  .sa-tb-min   { font-size:7px; font-weight:700; color:rgba(255,228,0,0.7); display:block; margin-top:1px; }

  .sa-amt { display:flex; gap:7px; }
  .sa-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(255,255,255,0.05) !important; border:1.5px solid rgba(232,121,249,0.18) !important;
    border-radius:8px !important; color:#fff !important; font-family:'Nunito',sans-serif !important;
    font-size:12px !important; font-weight:800 !important; padding:0 10px !important;
    min-width:84px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .sa-cur:hover { border-color:var(--sa-fuchsia) !important; box-shadow:0 0 10px rgba(232,121,249,0.2) !important; }

  .sa-div { height:1px; background:linear-gradient(90deg,transparent,rgba(232,121,249,0.3),rgba(0,238,255,0.2),transparent); }

  .sa-sp { border-radius:10px; padding:10px 12px; }
  .sa-sp-or { background:rgba(255,102,0,0.07); border:1.5px solid rgba(255,102,0,0.4); box-shadow:0 0 14px rgba(255,102,0,0.1); }
  .sa-sp-pu { background:rgba(170,0,255,0.07); border:1.5px solid rgba(170,0,255,0.4); box-shadow:0 0 14px rgba(170,0,255,0.1); }
  .sa-sp-cy { background:rgba(0,238,255,0.05); border:1.5px solid rgba(0,238,255,0.28); box-shadow:0 0 14px rgba(0,238,255,0.08); }

  /* 3D DONATE BUTTON */
  .sa-btn-wrap { position:relative; width:100%; border-radius:12px; padding-bottom:6px; }
  .sa-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:12px; z-index:1; background:linear-gradient(90deg,#7700aa,#bb0088,#880055); }
  .sa-btn {
    position:relative; z-index:2; width:100%; padding:13px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:15px; font-weight:900; letter-spacing:.04em; color:#fff;
    border-radius:12px; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,#cc00ff 0%,#ff00cc 45%,#ff6600 100%);
    border-top:1.5px solid rgba(255,255,255,0.3); border-left:1.5px solid rgba(255,255,255,0.15);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 18px rgba(232,121,249,0.45),0 0 36px rgba(170,0,255,0.18);
    overflow:hidden;
  }
  .sa-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),0 0 26px rgba(232,121,249,0.7),0 0 52px rgba(170,0,255,0.28); }
  .sa-btn:active:not(:disabled) { transform:translateY(0px) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.4),0 0 14px rgba(232,121,249,0.3) !important; }
  .sa-btn:disabled { opacity:.38; cursor:not-allowed; }
  .sa-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:skewX(-20deg); transition:left .5s; }
  .sa-btn:hover:not(:disabled)::before { left:160%; }

  .sa-hint { font-size:10px; font-weight:700; color:rgba(232,121,249,0.55); margin-top:3px; }

  @keyframes sa-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .sa-fu { animation:sa-fu .2s ease forwards; }

  @keyframes sa-sp-a { to{transform:rotate(360deg);} }
  .sa-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:sa-sp-a .65s linear infinite; }

  @keyframes sa-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .sa-in { animation:sa-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const StarlightAnya = () => {
  const navigate  = useNavigate();
  const cardRef   = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const [formData, setFormData]                   = useState({ name:"", amount:"", message:"" });
  const [selectedCurrency, setSelectedCurrency]   = useState("INR");
  const [currencyOpen, setCurrencyOpen]           = useState(false);
  const [donationType, setDonationType]           = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string|null>(null);
  const [mediaUrl, setMediaUrl]                   = useState<string|null>(null);
  const [mediaType, setMediaType]                 = useState<string|null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded]       = useState(false);

  const { pricing }      = useStreamerPricing('starlight_anya', selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency==="INR") { if (amount>=500) return 15; if (amount>=300) return 12; return 8; }
    if (amount>=6) return 15; if (amount>=4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  /* Auto-scale to fit any viewport */
  const applyScale = useCallback(() => {
    const wrap = wrapRef.current; const card = cardRef.current;
    if (!wrap || !card) return;
    const scaleW = Math.min(1, (window.innerWidth  - 32) / 420);
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

  useEffect(() => { const t = setTimeout(applyScale, 60); return ()=>clearTimeout(t); }, [donationType, applyScale]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>console.error('Failed to load Razorpay SDK');
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target; setFormData(prev=>({...prev,[name]:value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded || !(window as any).Razorpay) { toast.error("Payment system loading. Please wait."); return; }
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
        if (voiceRecorder.audioBlob.size===0) throw new Error("No voice recording found.");
        const voiceDataBase64 = await new Promise<string>((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>{ const r=reader.result as string; if(!r||!r.includes(",")) { reject(new Error("Failed to read voice data")); return; } resolve(r.split(",")[1]); };
          reader.onerror=()=>reject(new Error("Failed to read voice recording"));
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const {data:up,error:ue}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:voiceDataBase64,streamerSlug:"starlight_anya"}});
        if (ue) throw new Error("Failed to upload voice message");
        voiceMessageUrl=up.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:'starlight_anya', name:formData.name, amount:parseFloat(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null, mediaType:donationType==="media"?mediaType:null,
          currency:selectedCurrency }
      });
      if (error) throw error;
      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency,
        order_id:data.razorpay_order_id, name:"Starlight Anya",
        description:"Support Starlight Anya",
        handler:(response:any)=>{ navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); },
        modal:{ondismiss:()=>{ navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`); }},
        theme:{color:"#e879f9"},
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
  const msgClr = msgPct>90?'var(--sa-pink)':msgPct>70?'var(--sa-yellow)':'var(--sa-fuchsia)';

  const TYPES=[
    {key:'text' as const,      emoji:'💬', label:'Text',  min:pricing.minText,       tc:'sa-tb-fu', nc:'var(--sa-fuchsia)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'sa-tb-cy', nc:'var(--sa-cyan)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'sa-tb-or', nc:'var(--sa-orange)'},
    {key:'media' as const,     emoji:'🖼️', label:'Media', min:pricing.minMedia,      tc:'sa-tb-pu', nc:'var(--sa-purple)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <div className="sa-root sa-page">
        <div className="sa-atm"/>

        <div ref={wrapRef} className="sa-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="sa-card sa-in">

            {/* HERO */}
            <div className="sa-hero">
              <div className="sa-hero-blob"/>
              <div>
                <div className="sa-name">Starlight Anya</div>
                <div className="sa-hero-sub">Support with a donation ✦</div>
              </div>
              <div className="sa-live">
                <div className="sa-live-dot"/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--sa-green)',letterSpacing:'0.05em',textShadow:'0 0 6px var(--sa-green)'}}>Live</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="sa-body">

                {/* Name */}
                <div>
                  <label className="sa-lbl">Your Name</label>
                  <div className="sa-iw"><Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                {/* 3D Type buttons */}
                <div>
                  <label className="sa-lbl">Donation Type</label>
                  <div className="sa-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('sa-tb',t.tc,donationType===t.key?'sa-on':'')}>
                        <div className="sa-tb-face">
                          <span className="sa-tb-emoji">{t.emoji}</span>
                          <span className="sa-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.5)',textShadow:donationType===t.key?`0 0 10px ${t.nc},0 0 20px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="sa-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="sa-lbl">Amount</label>
                  <div className="sa-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="sa-cur">
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
                              {SUPPORTED_CURRENCIES.map(c=>(
                                <CommandItem key={c.code} value={c.code} onSelect={v=>{ setSelectedCurrency(v.toUpperCase()); setCurrencyOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4",selectedCurrency===c.code?"opacity-100":"opacity-0")}/>
                                  {c.symbol} {c.code} — {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="sa-iw" style={{flex:1}}>
                      <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange}
                        min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="sa-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="sa-div"/>

                {/* Text message */}
                {donationType==="text"&&(
                  <div className="sa-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="sa-lbl" style={{margin:0}}>Message</label>
                      <span style={{fontSize:10,fontWeight:800,color:msgClr,textShadow:`0 0 6px ${msgClr}`}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Type your message..." className="sa-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="sa-cbar"><div className="sa-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 6px ${msgClr}`}}/></div>
                  </div>
                )}

                {/* Voice */}
                {donationType==="voice"&&(
                  <div className="sa-fu">
                    <label className="sa-lbl">Voice Message</label>
                    <div className="sa-sp sa-sp-cy">
                      <EnhancedVoiceRecorder
                        controller={voiceRecorder}
                        onRecordingComplete={(hasRecording,duration)=>console.log("Recording complete:",hasRecording,duration)}
                        maxDurationSeconds={getVoiceDuration(currentAmount)}
                        brandColor="#e879f9"
                        requiredAmount={pricing.minVoice}
                        currentAmount={currentAmount}/>
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType==="hypersound"&&(
                  <div className="sa-fu sa-sp sa-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🔊</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--sa-orange)',textShadow:'0 0 8px var(--sa-orange)'}}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="sa-fu sa-sp sa-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🖼️</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--sa-purple)',textShadow:'0 0 8px var(--sa-purple)'}}>Media Upload</span>
                    </div>
                    <MediaUploader
                      streamerSlug="starlight_anya"
                      onMediaUploaded={(url,type)=>{ setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={()=>{ setMediaUrl(null); setMediaType(null); }}
                      maxFileSizeMB={10}
                      maxVideoDurationSeconds={15}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* 3D Donate button */}
                <div className="sa-btn-wrap">
                  <button type="submit" className="sa-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="sa-spin"/>Processing...
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
                <DonationPageFooter brandColor="#e879f9"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default StarlightAnya;
