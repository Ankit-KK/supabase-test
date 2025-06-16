
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Heart, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GifUpload from "@/components/GifUpload";
import VoiceRecording from "@/components/VoiceRecording";

const ChiaaGamingPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGif, setSelectedGif] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);
  const navigate = useNavigate();

  // Update max message length based on amount
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 100) {
      setMaxMessageLength(100);
    } else {
      setMaxMessageLength(50);
    }
  }, [amount]);

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
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than or equal to ₹1",
        variant: "destructive",
      });
      return false;
    }

    // Only require message if no GIF or voice is uploaded
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

  const uploadGif = async (file: File): Promise<string | null> => {
    try {
      const fileExt = 'gif';
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
      const filePath = fileName;

      console.log("UPLOAD: Starting GIF upload to storage:", { fileName, fileSize: file.size });

      const { data, error } = await supabase.storage
        .from('donation-gifs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("UPLOAD ERROR: Error uploading GIF:", error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('donation-gifs')
        .getPublicUrl(filePath);

      console.log("UPLOAD SUCCESS: GIF uploaded successfully:", { 
        publicUrl,
        filePath,
        fileName 
      });
      
      return publicUrl;
    } catch (error) {
      console.error("UPLOAD ERROR: Error in uploadGif:", error);
      return null;
    }
  };

  const uploadVoice = async (file: File): Promise<string | null> => {
    try {
      const fileExt = 'webm';
      const fileName = `voice-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
      const filePath = fileName;

      console.log("UPLOAD: Starting voice upload to storage:", { fileName, fileSize: file.size });

      const { data, error } = await supabase.storage
        .from('donation-gifs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("UPLOAD ERROR: Error uploading voice:", error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('donation-gifs')
        .getPublicUrl(filePath);

      console.log("UPLOAD SUCCESS: Voice uploaded successfully:", { 
        publicUrl,
        filePath,
        fileName 
      });
      
      return publicUrl;
    } catch (error) {
      console.error("UPLOAD ERROR: Error in uploadVoice:", error);
      return null;
    }
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
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        message: message.trim(),
        orderId,
        donationType: "chiaa_gaming",
        gifUrl,
        gifFileName: selectedGif?.name || null,
        gifFileSize: selectedGif?.size || null,
        voiceUrl,
        voiceFileName: selectedVoice?.name || null,
        voiceFileSize: selectedVoice?.size || null,
      };
      
      console.log("DONATION: Storing donation data in session storage:", {
        ...donationData,
        hasGif: !!gifUrl,
        hasVoice: !!voiceUrl,
        gifUrlPreview: gifUrl ? gifUrl.substring(0, 50) + "..." : null,
        voiceUrlPreview: voiceUrl ? voiceUrl.substring(0, 50) + "..." : null
      });
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      console.log("DONATION: Successfully stored Chiaa Gaming donation data in session storage");
      
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
    // Limit message to maxMessageLength characters
    const value = e.target.value;
    if (value.length <= maxMessageLength) {
      setMessage(value);
    }
  };

  // Check if message input should be disabled (when GIF is uploaded)
  const isMessageDisabled = !!selectedGif || isLoading;

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
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
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-8 md:left-8 opacity-20 sm:opacity-30">
          <Heart size={24} className="sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 text-pink-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-2 sm:bottom-8 sm:right-4 md:bottom-12 md:right-8 opacity-20 sm:opacity-30">
          <Gamepad2 size={32} className="sm:w-10 sm:h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 text-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Pink Border Effect - Responsive */}
      <div className="absolute inset-1 sm:inset-2 md:inset-4 border border-pink-400/30 sm:border-2 sm:border-pink-400/40 rounded-lg shadow-lg shadow-pink-400/20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-sm sm:max-w-md px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-10 relative z-10">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="text-center space-y-1 sm:space-y-2 md:space-y-4">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-pink-400" />
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                Support Chiaa Gaming
              </h1>
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-pink-400" />
            </div>
            <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium px-2">
              Send love and support to your favorite gamer!
            </p>
          </div>
          
          <div 
            className="relative p-3 sm:p-4 md:p-6 rounded-xl border border-pink-400/30 shadow-2xl shadow-pink-400/20 overflow-hidden"
            style={{
              backgroundImage: `url('/lovable-uploads/162f24fe-3b90-4626-8223-c7e095161c73.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay for form readability */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl"></div>
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-2 sm:space-y-3 md:space-y-4">
              <div className="space-y-1 md:space-y-2">
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-white">
                  Your Name
                </label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className="bg-white/95 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50 h-8 sm:h-9 md:h-10 text-sm"
                />
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-white">
                  Donation Amount (₹)
                </label>
                <Input 
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum ₹1"
                  disabled={isLoading}
                  className="bg-white/95 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50 h-8 sm:h-9 md:h-10 text-sm"
                />
                <p className="text-xs text-white/80">Minimum donation is ₹1</p>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-white">
                  Sweet Message {selectedGif ? "(Disabled - GIF uploaded)" : ""}
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder={selectedGif ? "Message disabled when GIF is uploaded" : "Send your sweet message to Chiaa!"}
                  className="h-16 sm:h-18 md:h-20 lg:h-24 bg-white/95 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50 resize-none text-xs sm:text-sm"
                  disabled={isMessageDisabled}
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-white/80">
                  {message.length}/{maxMessageLength} characters
                  {parseFloat(amount) >= 100 ? 
                    " (100 chars for ₹100+ donations)" : 
                    " (50 chars for donations below ₹100)"}
                  {selectedGif && " - Message disabled when GIF is uploaded"}
                </p>
              </div>

              <GifUpload
                onGifSelect={setSelectedGif}
                selectedGif={selectedGif}
                disabled={isLoading}
              />

              <VoiceRecording
                onVoiceSelect={setSelectedVoice}
                selectedVoice={selectedVoice}
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-2 sm:py-2.5 md:py-3 rounded-lg shadow-lg shadow-pink-500/25 transition-all duration-300 transform hover:scale-105 border border-pink-400/50 text-xs sm:text-sm md:text-base mt-3 sm:mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    <span className="text-xs sm:text-sm">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm md:text-base">Send Love & Support</span>
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
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
