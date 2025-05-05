
import React from "react";
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-hero-gradient animate-shimmer">
              Hype Your Favourite Streamer!
            </h1>
            <p className="max-w-[700px] text-md md:text-xl text-muted-foreground mx-auto">
              The ultimate fan-to-streamer engagement tool that lets you stand out during live streams.
              Make your messages shine and support your favorite creators!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-hero-gradient hover:opacity-90 transition-opacity text-white">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </div>
          <div className="relative w-full max-w-5xl mx-auto mt-8 md:mt-16">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-hyperchat-purple/20 rounded-full blur-[100px] z-0" />
            <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-[16/9] bg-black/80">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="px-8 py-6 bg-black/50 rounded-xl max-w-xl mx-auto backdrop-blur-sm">
                    <div className="flex gap-4 items-start pb-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">JD</div>
                      <div className="chat-gradient-border bg-black p-3 w-full">
                        <span className="block text-sm font-semibold text-hyperchat-pink">
                          SuperFan123 <span className="text-xs font-normal text-gray-400">· $5.00</span>
                        </span>
                        <p className="text-white">
                          That gameplay was AMAZING! You're the best streamer ever! 🎮 🔥
                        </p>
                      </div>
                    </div>
                    <div className="animate-pulse-glow">
                      <p className="text-center text-sm text-white/80">
                        <span className="font-medium">SuperFan123's message</span> is now pinned for 30 seconds!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs">
                💪
              </div>
              <p className="ml-2 text-sm text-muted-foreground">
                <span className="font-medium text-white">10,000+</span> Active Users
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-pink-700 flex items-center justify-center text-white text-xs">
                🎮
              </div>
              <p className="ml-2 text-sm text-muted-foreground">
                <span className="font-medium text-white">2,500+</span> Streamers
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs">
                💬
              </div>
              <p className="ml-2 text-sm text-muted-foreground">
                <span className="font-medium text-white">1M+</span> HyperChats Sent
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
