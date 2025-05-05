
import React, { useState } from "react";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HowItWorksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HowItWorksDialog: React.FC<HowItWorksDialogProps> = ({ open, onOpenChange }) => {
  const [activeStep, setActiveStep] = useState("step1");

  const handleStepChange = (step: string) => {
    setActiveStep(step);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">How HyperChat Works</DialogTitle>
          <DialogDescription>
            Simple 3-step process to make your messages stand out!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === "step1" ? "bg-hyperchat-purple text-white" : "bg-gray-100"}`}>
                1
              </div>
              <span className="text-xs mt-1">Enter Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === "step2" ? "bg-hyperchat-purple text-white" : "bg-gray-100"}`}>
                2
              </div>
              <span className="text-xs mt-1">Confirm Payment</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === "step3" ? "bg-hyperchat-purple text-white" : "bg-gray-100"}`}>
                {activeStep === "step3" ? <Check className="w-4 h-4" /> : "3"}
              </div>
              <span className="text-xs mt-1">Support Streamer</span>
            </div>
          </div>

          <Tabs value={activeStep} onValueChange={handleStepChange}>
            <TabsContent value="step1" className="mt-0">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Step 1: Enter Your Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    Sign up with your name, email, and mobile number. Optionally,
                    add your YouTube channel to receive special benefits.
                  </p>
                  <div className="mt-4 bg-white border border-gray-200 rounded-md p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">1</div>
                      <div className="text-sm font-medium">Create your account</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => handleStepChange("step2")} className="bg-hero-gradient hover:opacity-90 transition-opacity">
                    Next Step
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="step2" className="mt-0">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Step 2: Confirm Payment</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    Choose how much to support your favorite streamer. Make a UPI payment
                    to highlight your message during the stream.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Basic Highlight</div>
                        <div className="text-sm font-bold">₹99</div>
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Premium Spotlight</div>
                        <div className="text-sm font-bold">₹199</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Ultimate Pinned Message</div>
                        <div className="text-sm font-bold">₹399</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => handleStepChange("step1")}>
                    Back
                  </Button>
                  <Button onClick={() => handleStepChange("step3")} className="bg-hero-gradient hover:opacity-90 transition-opacity">
                    Next Step
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="step3" className="mt-0">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Step 3: Support Your Streamer</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    Your message now stands out in the stream! Get noticed by your favorite
                    creator and make an impact during live broadcasts.
                  </p>
                  <div className="mt-4 bg-black p-4 rounded-md">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">JD</div>
                      <div className="bg-gray-900 p-2 rounded-md w-full">
                        <span className="block text-xs font-semibold text-purple-400">
                          SuperFan123 <span className="text-xs font-normal text-gray-400">· ₹399</span>
                        </span>
                        <p className="text-white text-sm">
                          That gameplay was AMAZING! You're the best streamer ever! 🎮 🔥
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-center text-xs text-purple-300">
                        <span className="font-medium">Message pinned for 30 seconds!</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => handleStepChange("step2")}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => onOpenChange(false)} 
                    className="bg-hero-gradient hover:opacity-90 transition-opacity"
                  >
                    Get Started Now
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksDialog;
