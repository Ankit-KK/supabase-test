import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Heart, Gamepad2, AlertTriangle } from "lucide-react";
import GifUpload from "@/components/GifUpload";
import VoiceRecording from "@/components/VoiceRecording";
import { uploadGif, uploadVoice } from "@/utils/mediaUpload";
import { filterMessage, sanitizeMessage } from "@/utils/linkFilter";

const ChiaaGamingPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [selectedGif, setSelectedGif] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);
  const navigate = useNavigate();

  // Update max message length based on amount (custom sound and hyperEmotes disabled)
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 30) {
      setMaxMessageLength(150); // 150 chars for ₹30+
    } else if (!isNaN(parsedAmount) && parsedAmount >= 30) {
      setMaxMessageLength(100); // 100 chars for ₹30+
    } else {
      setMaxMessageLength(50); // 50 chars for under ₹30
    }
  }, [amount]);

  // Clear premium features when amount drops below minimum thresholds
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    
    // Clear GIF if amount < 100
    if (selectedGif && (isNaN(parsedAmount) || parsedAmount < 100)) {
      setSelectedGif(null);
    }
    
    // Clear Voice if amount < 200
    if (selectedVoice && (isNaN(parsedAmount) || parsedAmount < 200)) {
      setSelectedVoice(null);
    }
  }, [amount, selectedGif, selectedVoice]);

  // Clear message when GIF or voice is selected
  useEffect(() => {
    if (selectedGif || selectedVoice) {
      setMessage("");
      setMessageError("");
    }
  }, [selectedGif, selectedVoice]);

  const handleGifSelect = (file: File | null) => {
    const parsedAmount = parseFloat(amount);
    if (file && (isNaN(parsedAmount) || parsedAmount < 100)) {
      toast({
        title: "Premium feature",
        description: "GIF uploads require a donation of ₹100 or more",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedGif(file);
    // Clear voice if GIF is selected
    if (file && selectedVoice) {
      setSelectedVoice(null);
    }
  };

  const handleVoiceSelect = (file: File | null) => {
    const parsedAmount = parseFloat(amount);
    if (file && (isNaN(parsedAmount) || parsedAmount < 200)) {
      toast({
        title: "Premium feature", 
        description: "Voice messages require a donation of ₹200 or more",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedVoice(file);
    // Clear GIF if voice is selected
    if (file && selectedGif) {
      setSelectedGif(null);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 30) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than or equal to ₹30",
        variant: "destructive",
      });
      return false;
    }

    // Check if message contains links (validate message when it's enabled and present)
    if (message.trim() && !selectedGif && !selectedVoice) {
      const messageValidation = filterMessage(message);
      if (!messageValidation.isValid) {
        setMessageError(messageValidation.reason || "Message contains invalid content");
        toast({
          title: "Invalid message",
          description: messageValidation.reason,
          variant: "destructive",
        });
        return false;
      }
    }

    // Require at least one: message, GIF, or voice (custom sound and hyperEmotes disabled)
    if (!message.trim() && !selectedGif && !selectedVoice) {
      toast({
        title: "Message, GIF, or Voice required",
        description: "Please enter a message, upload a GIF, or record a voice message",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate a random order ID with timestamp
      const orderId = `chiaa_gaming_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      console.log("DONATION: Creating Chiaa Gaming donation with order ID:", orderId);
      
      let gifUrl = null;
      let voiceUrl = null;
      
      // Upload GIF if selected
      if (selectedGif) {
        console.log("DONATION: Uploading GIF for donation:", {
          orderId,
          fileName: selectedGif.name,
          fileSize: selectedGif.size
        });
        
        gifUrl = await uploadGif(selectedGif);
        
        if (!gifUrl) {
          console.error("DONATION: GIF upload failed but proceeding");
          toast({
            title: "GIF upload failed",
            description: "Proceeding without GIF. You can still donate!",
            variant: "destructive",
          });
        } else {
          console.log("DONATION: GIF uploaded successfully with URL:", gifUrl);
        }
      }

      // Upload Voice if selected
      if (selectedVoice) {
        console.log("DONATION: Uploading voice for donation:", {
          orderId,
          fileName: selectedVoice.name,
          fileSize: selectedVoice.size
        });
        
        voiceUrl = await uploadVoice(selectedVoice);
        
        if (!voiceUrl) {
          console.error("DONATION: Voice upload failed but proceeding");
          toast({
            title: "Voice upload failed",
            description: "Proceeding without voice. You can still donate!",
            variant: "destructive",
          });
        } else {
          console.log("DONATION: Voice uploaded successfully with URL:", voiceUrl);
        }
      }
      
      // Sanitize message before storing
      const sanitizedMessage = sanitizeMessage(message.trim());
      
      // Store donation data in session storage for backward compatibility
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        message: sanitizedMessage,
        orderId,
        donationType: "chiaa_gaming",
        gifUrl,
        gifFileName: selectedGif?.name || null,
        gifFileSize: selectedGif?.size || null,
        voiceUrl,
        voiceFileName: selectedVoice?.name || null,
        voiceFileSize: selectedVoice?.size || null,
        customSoundUrl: null, // Disabled feature
        hyperEmotesEnabled: false, // Disabled feature
      };
      
      console.log("DONATION: Storing donation data in session storage for backward compatibility:", {
        ...donationData,
        hasGif: !!gifUrl,
        hasVoice: !!voiceUrl,
        gifUrlPreview: gifUrl ? gifUrl.substring(0, 50) + "..." : null,
        voiceUrlPreview: voiceUrl ? voiceUrl.substring(0, 50) + "..." : null
      });
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      console.log("DONATION: Successfully stored Chiaa Gaming donation data in session storage for backward compatibility");
      
      // Navigate to payment checkout
      navigate("/payment-checkout");
    } catch (error) {
      console.error("DONATION ERROR: Error preparing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Clear previous error
    setMessageError("");
    
    // Limit message to maxMessageLength characters
    if (value.length <= maxMessageLength) {
      setMessage(value);
      
      // Validate message for links in real-time
      if (value.trim()) {
        const messageValidation = filterMessage(value);
        if (!messageValidation.isValid) {
          setMessageError(messageValidation.reason || "Message contains invalid content");
        }
      }
    }
  };

  // Get placeholder text based on what's selected
  const getMessagePlaceholder = () => {
    if (selectedGif) return "Message disabled when GIF is uploaded";
    if (selectedVoice) return "Message disabled when voice is recorded";
    return "Send your sweet message to Chiaa! (No links allowed)";
  };

  // Get message label based on what's selected
  const getMessageLabel = () => {
    if (selectedGif) return "Sweet Message (Disabled - GIF uploaded)";
    if (selectedVoice) return "Sweet Message (Disabled - Voice recorded)";
    return "Sweet Message (No Links Allowed)";
  };

  // Check if message input should be disabled (only when GIF or voice is selected)
  const isMessageDisabled = !!selectedGif || !!selectedVoice || isLoading;

  // Check if premium features are eligible
  const isGifEligible = parseFloat(amount) >= 100;
  const isVoiceEligible = parseFloat(amount) >= 200;
  const isMessageEligible = parseFloat(amount) >= 30;

  // Get voice duration based on amount
  const getVoiceDuration = () => {
    const parsedAmount = parseFloat(amount);
    if (parsedAmount >= 1500) return "45 seconds";
    if (parsedAmount >= 500) return "25 seconds";
    if (parsedAmount >= 200) return "15 seconds";
    return "Not available";
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-2"
      style={{
        backgroundImage: `url('/lovable-uploads/7d0bcc0f-fdef-47a2-9c88-4a052346971f.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Gaming Elements Background - Responsive positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-6 opacity-20 sm:opacity-30">
          <Heart size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-pink-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-2 sm:bottom-6 sm:right-4 md:bottom-8 md:right-6 opacity-20 sm:opacity-30">
          <Gamepad2 size={24} className="sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Pink Border Effect - Responsive */}
      <div className="absolute inset-1 sm:inset-2 border border-pink-400/30 sm:border-2 sm:border-pink-400/40 rounded-lg shadow-lg shadow-pink-400/20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl px-2 sm:px-3 py-2 sm:py-3 relative z-10 w-full">
        <div className="space-y-2 sm:space-y-3">
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-400" />
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                Support Chiaa Gaming
              </h1>
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-400" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium px-2">
              Send love and support to your favorite gamer!
            </p>
          </div>
          
          <div 
            className="relative p-2 sm:p-3 md:p-4 rounded-xl border border-pink-400/30 shadow-2xl shadow-pink-400/20 overflow-hidden"
            style={{
              backgroundImage: `url('/lovable-uploads/162f24fe-3b90-4626-8223-c7e095161c73.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay for form readability */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl"></div>
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-2 sm:space-y-3">
              {/* Name and Amount fields - always visible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label htmlFor="name" className="block text-xs font-medium text-white">
                    Your Name
                  </label>
                  <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white/95 text-gray-800 placeholder:text-gray-500 border-pink-300 focus:border-pink-500 focus:ring-pink-500/50 text-xs"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="amount" className="block text-xs font-medium text-white">
                    Donation Amount (₹)
                  </label>
                  <Input 
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (min ₹30)"
                    className="bg-white/95 text-gray-800 placeholder:text-gray-500 border-pink-300 focus:border-pink-500 focus:ring-pink-500/50 text-xs"
                    disabled={isLoading}
                    min="30"
                  />
                </div>
              </div>

              {/* Message field */}
              <div className="space-y-1">
                <label htmlFor="message" className="block text-xs font-medium text-white">
                  {getMessageLabel()}
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder={getMessagePlaceholder()}
                  className={`h-10 sm:h-12 bg-white/95 text-gray-800 placeholder:text-gray-500 focus:ring-pink-500/50 resize-none text-xs ${
                    messageError 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-pink-300 focus:border-pink-500'
                  }`}
                  disabled={isMessageDisabled || !isMessageEligible}
                  maxLength={maxMessageLength}
                />
                
                {/* Message validation error */}
                {messageError && (
                  <div className="flex items-center space-x-2 text-red-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{messageError}</span>
                  </div>
                )}
                
                <p className="text-xs text-white/80">
                  {!selectedGif && !selectedVoice ? (
                    <>
                      {isMessageEligible ? (
                        <>
                          {message.length}/{maxMessageLength} chars
                          {parseFloat(amount) >= 30 ? " (150 for ₹30+)" : " (50 for <₹30)"}
                          <br />
                          <span className="text-yellow-300">⚠️ Links, URLs, and social media handles are not allowed</span>
                        </>
                      ) : (
                        <span className="text-yellow-300">Messages require ₹30+ donation</span>
                      )}
                    </>
                  ) : (
                    <>
                      Message disabled when {
                        selectedGif ? "GIF uploaded" : 
                        "voice recorded"
                      }
                    </>
                  )}
                </p>
              </div>

              {/* GIF and Voice upload - always visible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <GifUpload
                  onGifSelect={handleGifSelect}
                  selectedGif={selectedGif}
                  disabled={isLoading || !!selectedVoice || !isGifEligible}
                  minAmount={100}
                  currentAmount={parseFloat(amount) || 0}
                />

                <VoiceRecording
                  onVoiceSelect={handleVoiceSelect}
                  selectedVoice={selectedVoice}
                  disabled={isLoading || !!selectedGif || !isVoiceEligible}
                  minAmount={200}
                  currentAmount={parseFloat(amount) || 0}
                />
              </div>

              {/* Custom Sound Selector - DISABLED */}
              {/* Custom sound alerts feature disabled */}

              {/* HyperEmotes Selector - DISABLED */}
              {/* HyperEmotes feature disabled */}

              {/* Payment button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-2 rounded-lg shadow-lg shadow-pink-500/25 transition-all duration-300 transform hover:scale-105 border border-pink-400/50 text-xs sm:text-sm mt-3"
                disabled={isLoading || !!messageError}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span className="text-xs">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Heart className="h-3 w-3" />
                    <span className="text-xs sm:text-sm">Send Love & Support</span>
                    <Heart className="h-3 w-3" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiaaGamingPage;