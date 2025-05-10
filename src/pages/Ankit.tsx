
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AnkitPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeGif, setIncludeGif] = useState(false);
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
      // Calculate total amount based on whether GIF option is selected
      const baseAmount = parseFloat(amount);
      const gifAmount = includeGif ? 500 : 0;
      const totalAmount = baseAmount + gifAmount;
      
      // Generate a random order ID with timestamp
      const orderId = `ankit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: baseAmount,
        totalAmount,
        message,
        orderId,
        donationType: "ankit",
        includeGif,
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
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium">
              Donation Amount (₹)
            </label>
            <Input 
              id="amount"
              type="number"
              min="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum ₹50"
              disabled={isLoading}
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
              disabled={isLoading}
              maxLength={maxMessageLength}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/{maxMessageLength} characters
              {parseFloat(amount) >= 100 ? 
                " (100 characters for donations ₹100 and above)" : 
                " (50 characters for donations below ₹100)"}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2 pb-2">
            <Switch
              id="include-gif"
              checked={includeGif}
              onCheckedChange={setIncludeGif}
            />
            <Label htmlFor="include-gif">Show celebratory GIF on stream (+ ₹500)</Label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : `Continue to Payment ${includeGif ? `(₹${(parseFloat(amount) || 0) + 500})` : ''}`}
          </Button>
          
          {includeGif && (
            <p className="text-xs text-center text-muted-foreground">
              A fun celebratory GIF will play on stream for a few seconds
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AnkitPage;
