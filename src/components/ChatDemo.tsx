
import React from "react";
import { Button } from "@/components/ui/button";
import { BadgeIndianRupee } from "lucide-react";
import { Link } from "react-router-dom";

const ChatDemo: React.FC = () => {
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
              <Link to="/demo">
                <Button className="bg-hero-gradient hover:opacity-90 transition-opacity flex items-center">
                  <BadgeIndianRupee className="mr-2" /> View Demo Flow
                </Button>
              </Link>
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
