import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Gift, Heart, Zap, IndianRupee, Users, Sparkles } from "lucide-react";

const VoiceAndGifShowcase = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            World's First Voice + GIF + HyperEmotes Platform
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Not available on any global platform. This is pure Indian innovation bringing real emotions to streaming.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
          {/* Voice Messages Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-3 rounded-full">
                <Mic className="text-white h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Voice Message Donations</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Heart className="text-hyperchat-pink h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Real Emotional Connection</h4>
                  <p className="text-muted-foreground">Hear your fans' actual voices. Feel their excitement, gratitude, and support in their own words.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Zap className="text-hyperchat-purple h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Instant Audio Alerts</h4>
                  <p className="text-muted-foreground">Voice messages play live on your stream with beautiful audio visualizations.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="text-hyperchat-pink h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Community Building</h4>
                  <p className="text-muted-foreground">Create deeper connections with your audience through personal voice interactions.</p>
                </div>
              </div>
            </div>

            <div className="bg-black/10 p-4 rounded-lg border border-hyperchat-purple/20">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-hyperchat-purple" />
                <span className="font-semibold">Sample Voice Donation:</span>
              </div>
              <p className="text-sm italic">"Bhai, your clutch was incredible! You're the best streamer in India! 🔥"</p>
              <p className="text-xs text-muted-foreground mt-1">15 seconds • ₹150 donation</p>
            </div>
          </div>

          {/* Custom GIFs Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-hyperchat-pink to-hyperchat-orange p-3 rounded-full">
                <Gift className="text-white h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Custom GIF Uploads</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="text-hyperchat-orange h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Full Personalization</h4>
                  <p className="text-muted-foreground">Fans upload their own GIFs that appear live during donations. Complete creative freedom.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Heart className="text-hyperchat-pink h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Interactive Experience</h4>
                  <p className="text-muted-foreground">Transform donations into entertaining moments with custom animations and memes.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <IndianRupee className="text-hyperchat-purple h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Premium Add-On</h4>
                  <p className="text-muted-foreground">Optional feature that adds extra value to higher donations (₹500+ recommended).</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-hyperchat-pink/10 to-hyperchat-orange/10 p-4 rounded-lg border border-hyperchat-pink/20">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-hyperchat-pink" />
                <span className="font-semibold">Custom GIF Alert:</span>
              </div>
              <p className="text-sm">[Dancing celebration GIF] + "Thanks for the epic stream!"</p>
              <p className="text-xs text-muted-foreground mt-1">12 seconds display • ₹500 donation</p>
            </div>
          </div>

          {/* HyperEmotes Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue p-3 rounded-full">
                <Sparkles className="text-white h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">HyperEmotes Emoji Rain</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="text-hyperchat-purple h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Epic Visual Effects</h4>
                  <p className="text-muted-foreground">Transform donations into spectacular emoji rain with up to 50 animated emojis cascading across the screen.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <IndianRupee className="text-hyperchat-pink h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Premium Tier Feature</h4>
                  <p className="text-muted-foreground">Available for donations ₹50 and above. Higher amounts trigger more emojis for maximum impact.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Heart className="text-hyperchat-orange h-5 w-5 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg">Viewer Engagement</h4>
                  <p className="text-muted-foreground">Create memorable moments that keep your audience engaged and encourage higher donations.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-hyperchat-purple/10 to-hyperchat-blue/10 p-4 rounded-lg border border-hyperchat-purple/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-hyperchat-purple" />
                <span className="font-semibold">HyperEmotes Alert:</span>
              </div>
              <p className="text-sm">50 emoji rain effect + "Thanks for the amazing stream!" 🎉✨🔥</p>
              <p className="text-xs text-muted-foreground mt-1">5 seconds cascade • ₹200 donation</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-hero-gradient text-white px-6 py-3 rounded-full font-bold text-lg mb-6">
            🚀 World's First Voice + GIF + HyperEmotes Platform
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            These features don't exist anywhere else in the world. This is Indian innovation at its finest.
          </p>
          <Button size="lg" className="bg-hero-gradient hover:opacity-90 transition-opacity">
            Experience All Premium Features Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VoiceAndGifShowcase;
