import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BadgeIndianRupee, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

enum DemoFlowStep {
  DonationForm,
  PaymentPage,
  SuccessPage,
}

const ChatDemo: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoFlowStep>(DemoFlowStep.DonationForm);
  const [name, setName] = useState("Demo User");
  const [amount, setAmount] = useState("50");
  const [message, setMessage] = useState("Great stream! Keep up the good work!");
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);

  // Handle form submission and simulate loading
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(DemoFlowStep.PaymentPage);
    }, 1000);
  };

  // Handle payment processing and simulate loading
  const handlePayment = () => {
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(DemoFlowStep.SuccessPage);
    }, 1500);
  };

  // Handle restart of the demo flow
  const restartDemo = () => {
    setCurrentStep(DemoFlowStep.DonationForm);
    setIsLoading(false);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // Reset to initial step when dialog closes
    setTimeout(() => {
      setCurrentStep(DemoFlowStep.DonationForm);
      setIsLoading(false);
    }, 300);
  };

  // Render the appropriate step of the demo flow
  const renderDemoContent = () => {
    switch (currentStep) {
      case DemoFlowStep.DonationForm:
        return (
          <div className="bg-black/90 border border-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Support Your Streamer</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Your Name
                </label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-white">
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
                  className="bg-gray-900 border-gray-700"
                />
                <p className="text-xs text-gray-400">Minimum donation amount is ₹50</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-white">
                  Message
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.substring(0, maxMessageLength))}
                  placeholder="Enter your message"
                  className="h-24 bg-gray-900 border-gray-700"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400">
                  {message.length}/{maxMessageLength} characters 
                  (50 characters for donations below ₹100)
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Continue to Payment"}
              </Button>
            </form>
          </div>
        );

      case DemoFlowStep.PaymentPage:
        return (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="bg-blue-400 p-4 text-center">
              <img 
                src="/lovable-uploads/6baaf08e-b2c6-40bd-86d9-0329286b56dc.png" 
                alt="HyperChat" 
                className="h-10 mx-auto mb-2"
              />
              <p className="text-2xl font-bold text-white">₹{amount}.00</p>
            </div>
            
            <div className="p-4">
              <div className="bg-gray-100 rounded-lg p-3 text-center mb-4">
                <p className="text-gray-600 text-sm mb-2">Scan and pay with</p>
                <div className="flex justify-center gap-2 mb-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Google_Pay_%28GPay%29_Logo.svg/512px-Google_Pay_%28GPay%29_Logo.svg.png" alt="Google Pay" className="h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%282020%29.svg/512px-Paytm_Logo_%282020%29.svg.png" alt="Paytm" className="h-5" />
                </div>
                <div className="border-2 border-gray-300 rounded h-28 flex items-center justify-center text-center mx-auto w-28 mb-2">
                  <p className="text-gray-700 text-xs">Tap to generate QR</p>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-700 mb-3">Payment Options</h3>
              
              <div className="space-y-2">
                <button 
                  className="w-full p-2 border rounded flex items-center justify-between text-left text-sm"
                  onClick={handlePayment} 
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-green-50 p-1.5 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm5.544 7.242l-6.876 6.875a.999.999 0 01-1.414 0l-3.797-3.797a1 1 0 111.414-1.414l3.09 3.09 6.169-6.168a1 1 0 111.414 1.414z"/>
                      </svg>
                    </div>
                    <span>Pay by UPI ID</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button 
                  className="w-full p-2 border rounded flex items-center justify-between text-left text-sm"
                  onClick={handlePayment}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-full">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
                      </svg>
                    </div>
                    <span>Net Banking</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {isLoading && (
                <div className="mt-3 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-xs text-gray-600 mt-1">Processing payment...</p>
                </div>
              )}
            </div>
          </div>
        );

      case DemoFlowStep.SuccessPage:
        return (
          <div className="bg-black/90 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-green-500 mb-3">Payment Successful</h2>
            <p className="text-gray-300 mb-4">
              Thank you for your donation! Your payment has been successfully processed.
            </p>
            <div className="bg-black/30 rounded p-3 text-left mb-4">
              <p className="mb-1"><span className="font-medium text-gray-400">Name:</span> <span className="text-white">{name}</span></p>
              <p className="mb-1"><span className="font-medium text-gray-400">Amount:</span> <span className="text-white">₹{amount}</span></p>
              <p><span className="font-medium text-gray-400">Message:</span> <span className="text-white">{message}</span></p>
            </div>
            <Button 
              onClick={restartDemo}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              size="sm"
            >
              Try Another Donation
            </Button>
          </div>
        );
    }
  };

  // Progress bar step indicator
  const renderProgressBar = () => (
    <div className="flex items-center max-w-xs w-full mb-6">
      <div className="flex-1 relative">
        <div 
          className={`h-1 ${currentStep >= DemoFlowStep.DonationForm ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-700"} rounded-l`}
        />
        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.DonationForm ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-700"} absolute -top-2 left-0`}>
          <span className="text-white text-xs">1</span>
        </div>
      </div>
      <div className="flex-1 relative">
        <div 
          className={`h-1 ${currentStep >= DemoFlowStep.PaymentPage ? "bg-gradient-to-r from-pink-600 to-blue-600" : "bg-gray-700"}`}
        />
        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.PaymentPage ? "bg-gradient-to-r from-pink-600 to-blue-600" : "bg-gray-700"} absolute -top-2 left-1/2 -translate-x-1/2`}>
          <span className="text-white text-xs">2</span>
        </div>
      </div>
      <div className="flex-1 relative">
        <div 
          className={`h-1 ${currentStep >= DemoFlowStep.SuccessPage ? "bg-gradient-to-r from-blue-600 to-green-500" : "bg-gray-700"} rounded-r`}
        />
        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.SuccessPage ? "bg-gradient-to-r from-blue-600 to-green-500" : "bg-gray-700"} absolute -top-2 right-0`}>
          <span className="text-white text-xs">3</span>
        </div>
      </div>
    </div>
  );

  return (
    <section id="demo" className="py-16 md:py-24 bg-mesh-gradient">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              See HyperChat in Action
            </h2>
            <p className="text-muted-foreground md:text-xl">
              HyperChat integrates seamlessly with popular streaming platforms and UPI payments, giving your messages
              the spotlight they deserve. Here's how it works:
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-hyperchat-purple text-white flex items-center justify-center text-sm">
                  1
                </div>
                <p>Choose your message style and customization options</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-hyperchat-pink text-white flex items-center justify-center text-sm">
                  2
                </div>
                <p>Select your support amount via UPI and preview your HyperChat</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-hyperchat-blue text-white flex items-center justify-center text-sm">
                  3
                </div>
                <p>Send your message and watch it appear prominently on stream</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-hyperchat-orange text-white flex items-center justify-center text-sm">
                  4
                </div>
                <p>Receive creator reactions and community recognition</p>
              </li>
            </ul>
            <div className="pt-4 space-x-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-hero-gradient hover:opacity-90 transition-opacity flex items-center">
                    <BadgeIndianRupee className="mr-2" /> View Demo Flow
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-b from-gray-900 to-black border-gray-800">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-center text-white mb-2">HyperChat Demo</h2>
                    <p className="text-center text-gray-400 text-sm mb-4">Experience the donation flow</p>
                    {renderProgressBar()}
                    {renderDemoContent()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative bg-black/90">
                <div className="absolute right-4 top-4 bg-red-600 px-2 py-1 rounded text-xs text-white font-medium animate-pulse-glow">
                  LIVE
                </div>
                <div className="h-full p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {/* Regular chat messages */}
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-purple-400">GamerX:</span>
                        <span className="text-sm text-gray-300">gg wp!</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-green-400">StreamFan42:</span>
                        <span className="text-sm text-gray-300">that was close</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-blue-400">CasualViewer:</span>
                        <span className="text-sm text-gray-300">hey everyone!</span>
                      </div>
                      
                      {/* HyperChat message */}
                      <div className="chat-gradient-border bg-black p-3 my-4 animate-float">
                        <div className="flex justify-between items-start">
                          <span className="block text-sm font-semibold text-hyperchat-pink mb-1">
                            MegaFan2000 <span className="text-xs font-normal text-gray-400">· ₹799</span>
                          </span>
                          <span className="bg-hyperchat-purple/30 text-hyperchat-light-purple text-xs px-2 py-0.5 rounded-full">
                            PINNED - 2:00
                          </span>
                        </div>
                        <p className="text-white text-base">
                          That clutch play was UNBELIEVABLE! 🔥🔥🔥 You just made my day with that win!
                        </p>
                        <div className="mt-2 flex gap-2">
                          <div className="bg-hyperchat-purple/20 text-hyperchat-light-purple text-xs px-2 py-0.5 rounded-full">
                            #1 Today
                          </div>
                          <div className="bg-hyperchat-pink/20 text-pink-300 text-xs px-2 py-0.5 rounded-full">
                            Top Supporter
                          </div>
                        </div>
                      </div>
                      
                      {/* More regular chat messages */}
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-yellow-400">JumpingBean:</span>
                        <span className="text-sm text-gray-300">woah nice message</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-red-400">QuietLurker:</span>
                        <span className="text-sm text-gray-300">i wish i could do that too</span>
                      </div>
                    </div>
                    
                    {/* Chat input */}
                    <div className="pt-4 mt-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Send a message..."
                            className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                            disabled
                          />
                          <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-2">
                            Regular Chat
                          </Button>
                        </div>
                        <Button size="sm" className="bg-hero-gradient hover:opacity-90 transition-opacity flex items-center">
                          <BadgeIndianRupee className="mr-1" size={16} /> HyperChat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-hyperchat-pink/30 rounded-full blur-[60px] z-0" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-hyperchat-purple/30 rounded-full blur-[60px] z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemo;
