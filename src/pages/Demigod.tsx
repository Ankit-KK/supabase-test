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
    --sa-pink:#ac1117;
    --sa-fuchsia:#ac1117;
    --sa-cyan:#ac1117;
    --sa-purple:#ac1117;
    --sa-yellow:#ffe500;
    --sa-orange:#ac1117;
    --sa-green:#00ff88;
    --sa-bg:#24201D;
    --sa-card:#24201D;
  }

  .sa-root{font-family:'Nunito',sans-serif;}
  .sa-page{width:100vw;height:100dvh;background:var(--sa-bg);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
  .sa-scale-wrap{width:420px;transform-origin:top center;position:relative;z-index:10;}

  .sa-card{
    width:420px;background:var(--sa-card);border-radius:20px;
    border:1px solid rgba(172,17,23,0.3);
    box-shadow:0 0 0 1px rgba(172,17,23,0.12),0 0 25px rgba(172,17,23,0.2),0 30px 80px rgba(0,0,0,0.7);
    overflow:hidden;
  }

  .sa-hero{
    position:relative;padding:14px 18px 12px;
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    overflow:hidden;
    background:linear-gradient(135deg,rgba(172,17,23,0.2) 0%,rgba(172,17,23,0.1) 60%,transparent 100%);
    border-bottom:1px solid rgba(172,17,23,0.18);
  }

  .sa-name{
    font-family:'Pacifico',cursive;
    font-size:26px;
    color:#fff;
  }

  .sa-body{padding:14px 18px 16px;display:flex;flex-direction:column;gap:11px;}

  .sa-lbl{
    font-size:10px;
    font-weight:900;
    letter-spacing:0.1em;
    text-transform:uppercase;
    display:block;
    margin-bottom:5px;
    color:rgba(255,255,255,0.45);
  }

  .sa-iw input{
    width:100%!important;
    background:rgba(255,255,255,0.05)!important;
    border:1.5px solid rgba(172,17,23,0.3)!important;
    border-radius:8px!important;
    color:#fff!important;
    font-size:14px!important;
    font-weight:700!important;
    padding:8px 12px!important;
  }

  .sa-ta{
    width:100%;
    background:rgba(255,255,255,0.05);
    border:1.5px solid rgba(172,17,23,0.3);
    border-radius:8px;
    color:#fff;
    font-size:13px;
    padding:8px 12px;
  }

  .sa-btn-wrap{position:relative;width:100%;border-radius:12px;padding-bottom:6px;}
  .sa-btn{
    position:relative;
    width:100%;
    padding:13px;
    border:none;
    cursor:pointer;
    font-size:15px;
    font-weight:900;
    color:#fff;
    border-radius:12px;
    background:#ac1117;
  }
`;

const Demigod = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [formData,setFormData]=useState({name:"",amount:"",message:""});
  const [selectedCurrency,setSelectedCurrency]=useState("INR");
  const [currencyOpen,setCurrencyOpen]=useState(false);
  const [donationType,setDonationType]=useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound,setSelectedHypersound]=useState<string|null>(null);
  const [mediaUrl,setMediaUrl]=useState<string|null>(null);
  const [mediaType,setMediaType]=useState<string|null>(null);
  const [isProcessingPayment,setIsProcessingPayment]=useState(false);
  const [razorpayLoaded,setRazorpayLoaded]=useState(false);

  const { pricing } = useStreamerPricing("demigod",selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const currentAmount=parseFloat(formData.amount)||0;
  const maxMessageLength=getMaxMessageLength(pricing.messageCharTiers,currentAmount);

  const getVoiceDuration=(amount:number)=>{
    if(selectedCurrency==="INR"){
      if(amount>=500)return 15;
      if(amount>=300)return 12;
      return 8;
    }
    if(amount>=6)return 15;
    if(amount>=4)return 12;
    return 8;
  };

  const voiceRecorder=useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(()=>{
    const s=document.createElement("script");
    s.src="https://checkout.razorpay.com/v1/checkout.js";
    s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    document.body.appendChild(s);
  },[]);

  const handleInputChange=(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
    const {name,value}=e.target;
    setFormData(prev=>({...prev,[name]:value}));
  };

  const processPayment=async()=>{
    setIsProcessingPayment(true);

    try{
      let voiceMessageUrl:string|null=null;

      if(donationType==="voice"&&voiceRecorder.audioBlob){
        const base64=await new Promise<string>((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>resolve((reader.result as string).split(",")[1]);
          reader.onerror=reject;
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const {data}=await supabase.functions.invoke("upload-voice-message-direct",{
          body:{voiceData:base64,streamerSlug:"demigod"}
        });

        voiceMessageUrl=data.voice_message_url;
      }

      const {data}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{
          streamer_slug:"demigod",
          name:formData.name,
          amount:Number(formData.amount),
          message:donationType==="text"?formData.message:null,
          voiceMessageUrl,
          hypersoundUrl:donationType==="hypersound"?selectedHypersound:null,
          mediaUrl:donationType==="media"?mediaUrl:null,
          mediaType,
          currency:selectedCurrency
        }
      });

      const rzp=new (window as any).Razorpay({
        key:data.razorpay_key_id,
        amount:data.amount,
        currency:data.currency,
        order_id:data.razorpay_order_id,
        name:"Demigod",
        description:"Support Demigod",
        handler:()=>navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#ac1117"}
      });

      rzp.open();
    }catch{
      toast.error("Payment failed");
    }finally{
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    processPayment();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      <div className="sa-root sa-page">
        <div ref={wrapRef} className="sa-scale-wrap">

          <div ref={cardRef} className="sa-card">

            <div className="sa-hero">
              <div>
                <div className="sa-name">Demigod</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="sa-body">

                <div>
                  <label className="sa-lbl">Your Name</label>
                  <div className="sa-iw">
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="sa-lbl">Amount</label>
                  <div className="sa-iw">
                    <Input
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {donationType==="text"&&(
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    maxLength={maxMessageLength}
                    className="sa-ta"
                  />
                )}

                {donationType==="voice"&&(
                  <EnhancedVoiceRecorder
                    controller={voiceRecorder}
                    onRecordingComplete={()=>{}}
                    maxDurationSeconds={getVoiceDuration(currentAmount)}
                    requiredAmount={pricing.minVoice}
                    currentAmount={currentAmount}
                    brandColor="#ac1117"
                  />
                )}

                {donationType==="hypersound"&&(
                  <HyperSoundSelector
                    selectedSound={selectedHypersound}
                    onSoundSelect={setSelectedHypersound}
                  />
                )}

                {donationType==="media"&&(
                  <MediaUploader
                    streamerSlug="demigod"
                    onMediaUploaded={(url,type)=>{
                      setMediaUrl(url);
                      setMediaType(type);
                    }}
                    onMediaRemoved={()=>{
                      setMediaUrl(null);
                      setMediaType(null);
                    }}
                  />
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                <div className="sa-btn-wrap">
                  <button type="submit" className="sa-btn">
                    {isProcessingPayment
                      ? "Processing..."
                      : `Support ${currencySymbol}${formData.amount||0}`}
                  </button>
                </div>

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
