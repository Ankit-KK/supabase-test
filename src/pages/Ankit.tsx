import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { isStreamerLoggedIn } from "@/utils/streamerAuth";

const AnkitPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);
  const [streamerOnline, setStreamerOnline] = useState(false);
  const navigate = useNavigate();

  // Check if streamer is logged in
  useEffect(() => {
    const checkStreamerStatus = () => {
      const isLoggedIn = isStreamerLoggedIn('ankit');
      console.log("Checking streamer status: ", isLoggedIn ? "Online" : "Offline");
      setStreamerOnline(isLoggedIn);
    };
    
    // Initial check
    checkStreamerStatus();
    
    // Set up interval to check every 5 seconds (more frequent for better UX)
    const interval = setInterval(checkStreamerStatus, 5000);
    
    // Set up storage event listener to detect changes in other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'ankitAuth') {
        checkStreamerStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
    // Re-check streamer status on form submission
    const currentStreamerStatus = isStreamerLoggedIn('ankit');
    setStreamerOnline(currentStreamerStatus);
    
    if (!currentStreamerStatus) {
      toast({
        title: "Streamer Offline",
        description: "Ankit is currently offline and not accepting donations",
        variant: "destructive",
      });
      return false;
    }

    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than or equal to ₹50",
        variant: "destructive",
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter a message",
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
      const orderId = `ankit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: parseFloat(amount),
        message,
        orderId,
        donationType: "ankit", // Add donation type to differentiate
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      
      // Navigate to payment checkout
      navigate("/payment-checkout");
    } catch (error) {
      console.error("Error preparing payment:", error);
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

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Make a Donation to Ankit</h1>
          <p className="text-muted-foreground mt-2">
            Support Ankit's work by making a donation
          </p>
          {!streamerOnline && (
            <div className="mt-4 p-4 border border-red-500 bg-red-100/10 rounded-md text-center">
              <p className="text-red-500 font-medium">Streamer Offline</p>
              <p className="text-sm text-red-400">Donations are currently disabled</p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Your Name
            </label>
            <Input 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isLoading || !streamerOnline}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium">
              Amount (₹)
            </label>
            <Input 
              id="amount"
              type="number"
              min="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum ₹50"
              disabled={isLoading || !streamerOnline}
            />
            <p className="text-xs text-muted-foreground">Minimum donation amount is ₹50</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <Textarea 
              id="message"
              value={message}
              onChange={handleMessageChange}
              placeholder="Enter your message"
              className="h-24"
              disabled={isLoading || !streamerOnline}
              maxLength={maxMessageLength}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/{maxMessageLength} characters
              {parseFloat(amount) >= 100 ? 
                " (100 characters for donations ₹100 and above)" : 
                " (50 characters for donations below ₹100)"}
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !streamerOnline}
          >
            {isLoading ? "Processing..." : streamerOnline ? "Continue to Payment" : "Streamer Offline"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AnkitPage;
