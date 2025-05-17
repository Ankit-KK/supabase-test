
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const GamerDemo = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [maxMessageLength, setMaxMessageLength] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    toast.success("Message sent successfully! This is just a demo, no actual data was saved.");
    setName("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/lovable-uploads/acfd3d8a-e619-4a8b-9bc9-905f36a8d629.png')" }}
      />
      
      {/* Content */}
      <div className="flex-1 container mx-auto max-w-md py-10 px-4">
        <div className="backdrop-blur-sm bg-black/30 rounded-lg p-6 shadow-xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Gamer Chat</h1>
              <p className="text-gray-200 mt-2">
                Send a message to your favorite gaming streamer
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                  Your Name
                </label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-200">
                  Message
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.substring(0, maxMessageLength))}
                  placeholder="Enter your message"
                  className="h-24 bg-white/10 border-white/20 text-white"
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-gray-300">
                  {message.length}/{maxMessageLength} characters
                </p>
              </div>
              
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  className="relative w-full h-20 flex items-center justify-center group"
                >
                  <img 
                    src="/lovable-uploads/2cd9125a-48fa-410c-bfda-ad40f9eba890.png" 
                    alt="Send Message" 
                    className="h-16 transition-transform group-hover:scale-105"
                  />
                  <span className="absolute text-white font-bold text-lg drop-shadow-lg">
                    Send Message
                  </span>
                </button>
              </div>
            </form>

            <div className="text-center mt-4">
              <p className="text-gray-300 text-sm">
                This is a demo page. No actual messages will be sent.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GamerDemo;
