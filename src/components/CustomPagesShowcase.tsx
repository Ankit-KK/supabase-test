
import React from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Zap, Trophy, ArrowRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const CustomPagesShowcase = () => {
  return (
    <section id="custom-pages" className="py-16 md:py-24 bg-secondary/10">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Custom Donation Pages
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Get your own personalized donation page with custom theming, branding, and interactive features. 
            Perfect for streamers who want to stand out and engage their audience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
          {/* Preview Section */}
          <div className="relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold mb-2">Live Preview</h3>
              <p className="text-muted-foreground">See how a custom page looks in action</p>
            </div>
            
            {/* Mini Preview of Ankit Page */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <div 
                className="aspect-[9/16] relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                    linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #7c2d12 100%)
                  `
                }}
              >
                {/* Gaming Controller Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-4 left-4 opacity-20">
                    <Gamepad2 size={40} className="text-purple-400 animate-pulse" />
                  </div>
                  <div className="absolute bottom-8 right-8 opacity-20">
                    <Trophy size={35} className="text-yellow-400 animate-bounce" />
                  </div>
                </div>

                {/* Neon Border Effect */}
                <div className="absolute inset-2 border border-purple-500/30 rounded-lg shadow-lg shadow-purple-500/20 pointer-events-none"></div>
                
                <div className="relative z-10 p-4 h-full flex flex-col justify-center">
                  <div className="text-center space-y-3 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <Gamepad2 className="h-6 w-6 text-purple-400" />
                      <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                        Support Ankit
                      </h1>
                      <Zap className="h-6 w-6 text-pink-400" />
                    </div>
                    <p className="text-purple-200 text-sm">
                      Power up the stream!
                    </p>
                  </div>
                  
                  <div className="backdrop-blur-lg bg-black/40 p-4 rounded-lg border border-purple-500/30 space-y-3">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-purple-200">
                        Gamer Tag
                      </label>
                      <div className="bg-black/50 border border-purple-500/50 text-white placeholder:text-purple-300 rounded px-2 py-1 text-sm">
                        SuperFan123
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-purple-200">
                        Power Level (₹)
                      </label>
                      <div className="bg-black/50 border border-purple-500/50 text-white placeholder:text-purple-300 rounded px-2 py-1 text-sm">
                        ₹500
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-purple-200">
                        Epic Message
                      </label>
                      <div className="bg-black/50 border border-purple-500/50 text-white placeholder:text-purple-300 rounded px-2 py-1 text-sm h-16 flex items-start">
                        <span className="text-xs">Great stream today! 🎮</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 rounded text-center text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <Zap className="h-3 w-3" />
                        <span>Power Up Stream</span>
                        <Zap className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/ankit" target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Features & Pricing Section */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">What You Get</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">Fully customized donation page with your branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">Interactive animations and gaming-themed effects</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">UPI payment integration for Indian streamers</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">OBS integration for live stream overlays</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">Real-time dashboard and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-1 rounded-full mt-1">
                    <ArrowRight className="text-white h-3 w-3" />
                  </div>
                  <span className="text-muted-foreground">Custom message length based on donation amount</span>
                </li>
              </ul>
            </div>

            <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-3xl font-bold text-white">₹399</div>
                  <div className="text-muted-foreground">One-time setup fee</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • No monthly charges
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • You Keep More Than 90% of Your Donations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Lifetime access to your custom page
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90"
                  asChild
                >
                  <Link to="/contact">
                    Get Your Custom Page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomPagesShowcase;
