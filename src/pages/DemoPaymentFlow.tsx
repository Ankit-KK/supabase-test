
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

enum DemoFlowStep {
  DonationForm,
  PaymentPage,
  SuccessPage,
}

const DemoPaymentFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<DemoFlowStep>(DemoFlowStep.DonationForm);
  const [name, setName] = useState("Demo User");
  const [amount, setAmount] = useState("1");
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

  // Render the appropriate step of the demo flow
  const renderCurrentStep = () => {
    switch (currentStep) {
      case DemoFlowStep.DonationForm:
        return (
          <div className="rounded-xl bg-black/90 border border-gray-800 p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Support Your Streamer</h2>
            
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
                <p className="text-xs text-gray-400">Minimum donation amount is ₹1</p>
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
          <div className="bg-white rounded-xl overflow-hidden max-w-md mx-auto">
            <div className="bg-blue-400 p-6 text-center">
              <img 
                src="/lovable-uploads/6baaf08e-b2c6-40bd-86d9-0329286b56dc.png" 
                alt="HyperChat" 
                className="h-12 mx-auto mb-3"
              />
              <p className="text-2xl font-bold text-white">₹{amount}.00</p>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center mb-6">
                <p className="text-gray-600 text-sm mb-2">Scan and pay with</p>
                <div className="flex justify-center gap-2 mb-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Google_Pay_%28GPay%29_Logo.svg/512px-Google_Pay_%28GPay%29_Logo.svg.png" alt="Google Pay" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%282020%29.svg/512px-Paytm_Logo_%282020%29.svg.png" alt="Paytm" className="h-6" />
                </div>
                <div className="border-2 border-gray-300 rounded h-36 flex items-center justify-center text-center mx-auto w-36 mb-2">
                  <p className="text-gray-700 text-sm">Tap to generate QR</p>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-700 mb-4">Payment Options</h3>
              
              <div className="space-y-3">
                <button 
                  className="w-full p-3 border rounded flex items-center justify-between text-left"
                  onClick={handlePayment} 
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-full">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm5.544 7.242l-6.876 6.875a.999.999 0 01-1.414 0l-3.797-3.797a1 1 0 111.414-1.414l3.09 3.09 6.169-6.168a1 1 0 111.414 1.414z"/>
                      </svg>
                    </div>
                    <span>Pay by UPI ID</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button 
                  className="w-full p-3 border rounded flex items-center justify-between text-left"
                  onClick={handlePayment}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
                      </svg>
                    </div>
                    <span>Net Banking</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {isLoading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Processing payment...</p>
                </div>
              )}
            </div>
          </div>
        );

      case DemoFlowStep.SuccessPage:
        return (
          <div className="bg-black/90 rounded-xl p-10 text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-green-500 mb-4">Payment Successful</h2>
            <p className="text-gray-300 mb-6">
              Thank you for your donation! Your payment has been successfully processed.
            </p>
            <div className="bg-black/30 rounded p-4 text-left mb-6">
              <p className="mb-1"><span className="font-medium text-gray-400">Name:</span> <span className="text-white">{name}</span></p>
              <p className="mb-1"><span className="font-medium text-gray-400">Amount:</span> <span className="text-white">₹{amount}</span></p>
              <p><span className="font-medium text-gray-400">Message:</span> <span className="text-white">{message}</span></p>
            </div>
            <Button 
              onClick={restartDemo}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Try Another Donation
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto">
        <div className="max-w-md mx-auto mb-8">
          <h1 className="text-3xl font-bold text-center text-white mb-2">HyperChat Demo</h1>
          <p className="text-center text-gray-400">Experience the donation flow</p>
        </div>
        
        <div className="flex justify-center mb-10">
          <div className="flex items-center max-w-lg w-full">
            <div className="flex-1 relative">
              <div 
                className={`h-1 ${currentStep >= DemoFlowStep.DonationForm ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-700"} rounded-l`}
              />
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.DonationForm ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-700"} absolute -top-2.5 left-0`}>
                <span className="text-white text-xs">1</span>
              </div>
            </div>
            <div className="flex-1 relative">
              <div 
                className={`h-1 ${currentStep >= DemoFlowStep.PaymentPage ? "bg-gradient-to-r from-pink-600 to-blue-600" : "bg-gray-700"}`}
              />
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.PaymentPage ? "bg-gradient-to-r from-pink-600 to-blue-600" : "bg-gray-700"} absolute -top-2.5 left-1/2 -translate-x-1/2`}>
                <span className="text-white text-xs">2</span>
              </div>
            </div>
            <div className="flex-1 relative">
              <div 
                className={`h-1 ${currentStep >= DemoFlowStep.SuccessPage ? "bg-gradient-to-r from-blue-600 to-green-500" : "bg-gray-700"} rounded-r`}
              />
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${currentStep >= DemoFlowStep.SuccessPage ? "bg-gradient-to-r from-blue-600 to-green-500" : "bg-gray-700"} absolute -top-2.5 right-0`}>
                <span className="text-white text-xs">3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-full">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentFlow;
