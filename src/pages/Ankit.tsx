
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

const AnkitPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);
  const navigate = useNavigate();
  
  // Min amount for PayPal in INR (equivalent to approximately $10 USD)
  const MIN_PAYPAL_AMOUNT = 800;

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

  const isPaypalAvailable = parseFloat(amount) >= MIN_PAYPAL_AMOUNT;

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
              Amount (₹)
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
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Minimum donation amount is ₹50</p>
              <div className={`flex items-center gap-1 text-xs ${isPaypalAvailable ? 'text-green-500' : 'text-muted-foreground'}`}>
                <DollarSign className="h-3 w-3" />
                <span>
                  {isPaypalAvailable 
                    ? 'PayPal payment option is available for this amount' 
                    : `PayPal payment option available for donations ₹${MIN_PAYPAL_AMOUNT} and above`}
                </span>
              </div>
            </div>
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
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue to Payment"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AnkitPage;
