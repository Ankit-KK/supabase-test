import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Zap } from "lucide-react";
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
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Cinzel:wght@700;900&display=swap');

  :root {
    --dg-red:    #ac1117;
    --dg-gold:   #d4af37;
    --dg-fire:   #e65c00;
    --dg-void:   #73000f;
    --dg-bg:     #24201D;
    --dg-card:   #1a1715;
    --dg-border: #3D4158;
  }

  .dg-root { font-family: 'Nunito', sans-serif; }

  .dg-page {
    width: 100vw; height: 100dvh;
    background: var(--dg-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .dg-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 15% 10%, rgba(172,17,23,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 85% 85%, rgba(212,175,55,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(61,65,88,0.2) 0%, transparent 60%);
  }

  .dg-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .dg-card {
    width: 420px; background: var(--dg-card); border-radius: 20px;
    border: 1px solid rgba(172,17,23,0.3);
    box-shadow: 0 0 0 1px rgba(61,65,88,0.3), 0 0 25px rgba(172,17,23,0.15), 0 0 60px rgba(0,0,0,0.5), 0 30px 80px rgba(0,0,0,0.8);
    overflow: hidden;
  }

  .dg-hero {
    position: relative; padding: 14px 18px 12px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(172,17,23,0.2) 0%, rgba(36,32,29,0.8) 60%, transparent 100%);
    border-bottom: 1px solid rgba(172,17,23,0.2);
  }
  .dg-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--dg-void), var(--dg-red), var(--dg-gold), var(--dg-fire), var(--dg-void));
    background-size: 200% 100%; animation: dg-shift 3s linear infinite;
    box-shadow: 0 0 8px var(--dg-red), 0 0 16px rgba(172,17,23,0.4);
  }
  @keyframes dg-shift { 0%{background-position:0%} 100%{background-position:200%} }
  .dg-hero-blob { position:absolute; top:-30px; right:-30px; width:130px; height:130px; border-radius:50%; background:radial-gradient(circle, rgba(172,17,23,0.25) 0%, transparent 65%); pointer-events:none; }

  @keyframes dg-flicker {
    0%,18%,20%,22%,52%,54%,64%,100% { text-shadow: 0 0 4px rgba(255,255,255,0.5), 0 0 10px var(--dg-red), 0 0 22px var(--dg-red), 0 0 42px var(--dg-void); }
    19%,21%,53%,63% { text-shadow:none; opacity:0.85; }
  }
  .dg-name { font-family:'Cinzel',serif; font-size:26px; font-weight:900; color:#EDE7E7; line-height:1; animation:dg-flicker 9s infinite; position:relative; z-index:1; letter-spacing:0.05em; }
  .dg-hero-sub { font-size:10px; font-weight:700; color:#7E797D; margin-top:2px; position:relative; z-index:1; }

  @keyframes dg-pulse { 0%,100%{box-shadow:0 0 5px var(--dg-red);} 50%{box-shadow:none;} }
  .dg-live { display:inline-flex; align-items:center; gap:5px; background:rgba(172,17,23,0.1); border:1.5px solid rgba(172,17,23,0.4); border-radius:20px; padding:3px 10px; flex-shrink:0; position:relative; z-index:1; }
  .dg-live-dot { width:6px; height:6px; border-radius:50%; background:var(--dg-red); animation:dg-pulse 1.5s ease-in-out infinite; }

  .dg-body { padding: 14px 18px 16px; display:flex; flex-direction:column; gap:11px; }
  .dg-lbl { font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:5px; color:#7E797D; }

  .dg-iw input {
    width:100% !important; background:rgba(36,32,29,0.6) !important;
    border:1.5px solid var(--dg-border) !important; border-radius:8px !important;
    color:#EDE7E7 !important; font-family:'Nunito',sans-serif !important;
    font-size:14px !important; font-weight:700 !important; padding:8px 12px !important;
    outline:none !important; transition:all .2s !important; caret-color:var(--dg-red);
  }
  .dg-iw input:focus { border-color:var(--dg-red) !important; background:rgba(172,17,23,0.05) !important; box-shadow:0 0 0 2px rgba(172,17,23,0.15),0 0 14px rgba(172,17,23,0.12) !important; }
  .dg-iw input::placeholder { color:#7E797D !important; }
  .dg-iw input:disabled, .dg-iw input[readonly] { opacity:.38 !important; cursor:not-allowed !important; }

  .dg-ta {
    width:100%; background:rgba(36,32,29,0.6); border:1.5px solid var(--dg-border);
    border-radius:8px; color:#EDE7E7; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700;
    padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--dg-red); transition:all .2s;
  }
  .dg-ta:focus { border-color:var(--dg-red); background:rgba(172,17,23,0.05); box-shadow:0 0 0 2px rgba(172,17,23,0.15),0 0 14px rgba(172,17,23,0.12); }
  .dg-ta::placeholder { color:#7E797D; }

  .dg-cbar { height:2px; margin-top:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .dg-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* 3D TYPE BUTTONS */
  .dg-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding-bottom:6px; }
  .dg-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; border-radius:10px; display:block; width:100%; }
  .dg-tb-face { position:relative; z-index:2; padding:10px 4px 9px; border-radius:10px; text-align:center; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-5px); }
  .dg-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 3px); border-radius:10px; z-index:1; }

  /* Red (Text) */
  .dg-tb-fu .dg-tb-face { background:linear-gradient(160deg,rgba(172,17,23,0.15),rgba(100,0,10,0.5)); border:1.5px solid rgba(172,17,23,0.4); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 0 10px rgba(172,17,23,0.1); }
  .dg-tb-fu::after { background:#5a050b; border:1.5px solid rgba(172,17,23,0.3); }
  .dg-tb-fu:hover .dg-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 18px rgba(172,17,23,0.3); }
  .dg-tb-fu.dg-on .dg-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(172,17,23,0.25),rgba(140,10,15,0.55)); border-color:var(--dg-red); box-shadow:inset 0 2px 5px rgba(0,0,0,0.4),0 0 18px rgba(172,17,23,0.5),0 0 34px rgba(172,17,23,0.2),inset 0 0 12px rgba(172,17,23,0.2); }

  /* Gold (Voice) */
  .dg-tb-cy .dg-tb-face { background:linear-gradient(160deg,rgba(212,175,55,0.1),rgba(120,95,20,0.4)); border:1.5px solid rgba(212,175,55,0.4); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 0 10px rgba(212,175,55,0.1); }
  .dg-tb-cy::after { background:#5c490e; border:1.5px solid rgba(212,175,55,0.3); }
  .dg-tb-cy:hover .dg-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 18px rgba(212,175,55,0.3); }
  .dg-tb-cy.dg-on .dg-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(212,175,55,0.2),rgba(160,125,30,0.5)); border-color:var(--dg-gold); box-shadow:inset 0 2px 5px rgba(0,0,0,0.4),0 0 18px rgba(212,175,55,0.5),0 0 32px rgba(212,175,55,0.2),inset 0 0 12px rgba(212,175,55,0.2); }

  /* Fire (Hypersound) */
  .dg-tb-or .dg-tb-face { background:linear-gradient(160deg,rgba(230,92,0,0.15),rgba(120,40,0,0.5)); border:1.5px solid rgba(230,92,0,0.4); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 0 10px rgba(230,92,0,0.1); }
  .dg-tb-or::after { background:#662500; border:1.5px solid rgba(230,92,0,0.3); }
  .dg-tb-or:hover .dg-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 18px rgba(230,92,0,0.3); }
  .dg-tb-or.dg-on .dg-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(230,92,0,0.25),rgba(160,50,0,0.55)); border-color:var(--dg-fire); box-shadow:inset 0 2px 5px rgba(0,0,0,0.4),0 0 18px rgba(230,92,0,0.5),0 0 32px rgba(230,92,0,0.2),inset 0 0 12px rgba(230,92,0,0.2); }

  /* Void (Media) */
  .dg-tb-pu .dg-tb-face { background:linear-gradient(160deg,rgba(115,0,15,0.2),rgba(50,0,5,0.6)); border:1.5px solid rgba(115,0,15,0.5); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 0 10px rgba(115,0,15,0.1); }
  .dg-tb-pu::after { background:#330005; border:1.5px solid rgba(115,0,15,0.3); }
  .dg-tb-pu:hover .dg-tb-face { box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 18px rgba(115,0,15,0.3); }
  .dg-tb-pu.dg-on .dg-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(115,0,15,0.3),rgba(80,0,10,0.6)); border-color:var(--dg-void); box-shadow:inset 0 2px 5px rgba(0,0,0,0.4),0 0 18px rgba(115,0,15,0.6),0 0 32px rgba(115,0,15,0.25),inset 0 0 12px rgba(115,0,15,0.2); }

  .dg-tb:active .dg-tb-face { transform:translateY(0px) !important; }
  .dg-tb-emoji { font-size:18px; display:block; line-height:1; }
  .dg-tb-name  { font-size:9px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s, text-shadow .15s; }
  .dg-tb-min   { font-size:7px; font-weight:700; color:rgba(212,175,55,0.8); display:block; margin-top:1px; }

  .dg-amt { display:flex; gap:7px; }
  .dg-cur {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(36,32,29,0.6) !important; border:1.5px solid var(--dg-border) !important;
    border-radius:8px !important; color:#EDE7E7 !important; font-family:'Nunito',sans-serif !important;
    font-size:12px !important; font-weight:800 !important; padding:0 10px !important;
    min-width:84px; height:38px; cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .dg-cur:hover { border-color:var(--dg-red) !important; box-shadow:0 0 10px rgba(172,17,23,0.2) !important; }

  .dg-div { height:1px; background:linear-gradient(90deg,transparent,rgba(172,17,23,0.4),rgba(61,65,88,0.5),transparent); }

  .dg-sp { border-radius:10px; padding:10px 12px; }
  .dg-sp-or { background:rgba(230,92,0,0.05); border:1.5px solid rgba(230,92,0,0.3); box-shadow:0 0 14px rgba(230,92,0,0.08); }
  .dg-sp-pu { background:rgba(115,0,15,0.05); border:1.5px solid rgba(115,0,15,0.3); box-shadow:0 0 14px rgba(115,0,15,0.08); }
  .dg-sp-cy { background:rgba(212,175,55,0.05); border:1.5px solid rgba(212,175,55,0.2); box-shadow:0 0 14px rgba(212,175,55,0.05); }

  /* 3D DONATE BUTTON */
  .dg-btn-wrap { position:relative; width:100%; border-radius:12px; padding-bottom:6px; }
  .dg-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); border-radius:12px; z-index:1; background:linear-gradient(90deg,#5a050b,#8a0e13,#5a050b); }
  .dg-btn {
    position:relative; z-index:2; width:100%; padding:13px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:15px; font-weight:900; letter-spacing:.04em; color:#EDE7E7;
    border-radius:12px; transition:transform .1s ease, box-shadow .1s ease; transform:translateY(-6px);
    background:linear-gradient(135deg,#e01a22 0%,#ac1117 45%,#7a0c10 100%);
    border-top:1.5px solid rgba(255,255,255,0.2); border-left:1.5px solid rgba(255,255,255,0.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 18px rgba(172,17,23,0.35),0 0 36px rgba(0,0,0,0.4);
    overflow:hidden;
  }
  .dg-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 0 26px rgba(172,17,23,0.5),0 0 52px rgba(0,0,0,0.5); }
  .dg-btn:active:not(:disabled) { transform:translateY(0px) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.6),0 0 14px rgba(172,17,23,0.3) !important; }
  .dg-btn:disabled { opacity:.38; cursor:not-allowed; }
  .dg-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); transform:skewX(-20deg); transition:left .5s; }
  .dg-btn:hover:not(:disabled)::before { left:160%; }

  .dg-hint { font-size:10px; font-weight:700; color:#7E797D; margin-top:3px; }

  @keyframes dg-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .dg-fu { animation:dg-fu .2s ease forwards; }

  @keyframes dg-sp-a { to{transform:rotate(360deg);} }
  .dg-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; display:inline-block; animation:dg-sp-a .65s linear infinite; }

  @keyframes dg-in { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
  .dg-in { animation:dg-in .4s cubic-bezier(0.22,1,0.36,1) both; }
`;

const Demigod = () => {
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

  const { pricing }      = useStreamerPricing('demigod', selectedCurrency);
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
    s.onerror=()=>toast.error('Failed to load payment gateway');
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
        const {data:up,error:ue}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:voiceDataBase64,streamerSlug:"demigod"}});
        if (ue) throw new Error("Failed to upload voice message");
        voiceMessageUrl=up.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:'demigod', name:formData.name, amount:parseFloat(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null, mediaType:donationType==="media"?mediaType:null,
          currency:selectedCurrency }
      });
      if (error) throw error;
      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency,
        order_id:data.razorpay_order_id, name:"Demigod",
        description:"Support Demigod",
        handler:(response:any)=>{ navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); },
        modal:{ondismiss:()=>{ navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`); }},
        theme:{color:"#ac1117"},
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
  const msgClr = msgPct>90?'var(--dg-red)':msgPct>70?'var(--dg-fire)':'var(--dg-gold)';

  const TYPES=[
    {key:'text' as const,      emoji:'💬', label:'Text',  min:pricing.minText,       tc:'dg-tb-fu', nc:'var(--dg-red)'},
    {key:'voice' as const,     emoji:'🎤', label:'Voice', min:pricing.minVoice,      tc:'dg-tb-cy', nc:'var(--dg-gold)'},
    {key:'hypersound' as const,emoji:'🔊', label:'Sound', min:pricing.minHypersound, tc:'dg-tb-or', nc:'var(--dg-fire)'},
    {key:'media' as const,     emoji:'🖼️', label:'Media', min:pricing.minMedia,      tc:'dg-tb-pu', nc:'var(--dg-void)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <div className="dg-root dg-page">
        <div className="dg-atm"/>

        <div ref={wrapRef} className="dg-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="dg-card dg-in">

            {/* HERO */}
            <div className="dg-hero">
              <div className="dg-hero-blob"/>
              <div>
                <div className="dg-name">Demigod</div>
                <div className="dg-hero-sub">Support with a donation ✦</div>
              </div>
              <div className="dg-live">
                <div className="dg-live-dot"/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--dg-red)',letterSpacing:'0.05em',textShadow:'0 0 6px var(--dg-red)'}}>Live</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="dg-body">

                {/* Name */}
                <div>
                  <label className="dg-lbl">Your Name</label>
                  <div className="dg-iw"><Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                {/* 3D Type buttons */}
                <div>
                  <label className="dg-lbl">Donation Type</label>
                  <div className="dg-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('dg-tb',t.tc,donationType===t.key?'dg-on':'')}>
                        <div className="dg-tb-face">
                          <span className="dg-tb-emoji">{t.emoji}</span>
                          <span className="dg-tb-name" style={{color:donationType===t.key?t.nc:'#7E797D',textShadow:donationType===t.key?`0 0 10px ${t.nc},0 0 20px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="dg-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="dg-lbl">Amount</label>
                  <div className="dg-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="dg-cur">
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
                    <div className="dg-iw" style={{flex:1}}>
                      <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange}
                        min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="dg-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="dg-div"/>

                {/* Text message */}
                {donationType==="text"&&(
                  <div className="dg-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="dg-lbl" style={{margin:0}}>Message</label>
                      <span style={{fontSize:10,fontWeight:800,color:msgClr,textShadow:`0 0 6px ${msgClr}`}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Type your message..." className="dg-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="dg-cbar"><div className="dg-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 6px ${msgClr}`}}/></div>
                  </div>
                )}

                {/* Voice */}
                {donationType==="voice"&&(
                  <div className="dg-fu">
                    <label className="dg-lbl">Voice Message</label>
                    <div className="dg-sp dg-sp-cy">
                      <EnhancedVoiceRecorder
                        controller={voiceRecorder}
                        onRecordingComplete={(hasRecording,duration)=>console.log("Recording complete:",hasRecording,duration)}
                        maxDurationSeconds={getVoiceDuration(currentAmount)}
                        brandColor="#d4af37"
                        requiredAmount={pricing.minVoice}
                        currentAmount={currentAmount}/>
                    </div>
                  </div>
                )}

                {/* HyperSound */}
                {donationType==="hypersound"&&(
                  <div className="dg-fu dg-sp dg-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🔊</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--dg-fire)',textShadow:'0 0 8px var(--dg-fire)'}}>HyperSounds</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {/* Media */}
                {donationType==="media"&&(
                  <div className="dg-fu dg-sp dg-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🖼️</span>
                      <span style={{fontSize:13,fontWeight:900,color:'var(--dg-void)',textShadow:'0 0 8px var(--dg-void)'}}>Media Upload</span>
                    </div>
                    <MediaUploader
                      streamerSlug="demigod"
                      onMediaUploaded={(url,type)=>{ setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={()=>{ setMediaUrl(null); setMediaType(null); }}
                      maxFileSizeMB={10}
                      maxVideoDurationSeconds={15}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                {/* 3D Donate button */}
                <div className="dg-btn-wrap">
                  <button type="submit" className="dg-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="dg-spin"/>Processing...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Zap style={{width:15,height:15, fill:"currentColor"}}/>
                        Support with {currencySymbol}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:9,fontWeight:600,color:'#7E797D',textAlign:'center',lineHeight:1.5}}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>
                <DonationPageFooter brandColor="#ac1117"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Demigod;
