
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

const EarnMoneyStreamingIndia = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-20 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6" asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm">
                  Getting Started
                </span>
                <span className="bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm">
                  Streaming Tips
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                How to Earn Money as a Streamer in India
              </h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>Creator Success Team</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>8 min read</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              
              <img 
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop" 
                alt="Streamer earning money in India"
                className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
              />
            </div>
            
            <article className="prose prose-lg prose-invert max-w-none">
              <p className="text-xl leading-relaxed text-muted-foreground mb-8">
                Streaming is booming in India, and savvy streamers combine several income sources to make a living. Whether you game, teach, or entertain, here are proven ways to earn:
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Platform Revenue Share</h2>
              <p>
                Most streamers start with the built-in monetization on their platform. On YouTube, enable the Partner Program to earn from ads on your videos and live streams. You can also activate features like Super Chat and Super Stickers, where fans pay to highlight messages during a live stream.
              </p>
              <p>
                Twitch similarly offers "Bits" and subscriptions, and Facebook has Stars in live videos. Any viewership you build can translate into ad revenue and micro-payments from fans.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Brand Sponsorships and Partnerships</h2>
              <p>
                With only about 8–10% of Indian creators monetizing effectively today, brand deals are a huge opportunity. Influencers partner with companies to promote products or services; in India's creator economy 70% of revenue now comes from brand spending.
              </p>
              <p>
                For streamers, this could mean showcasing a gaming chair, reviewing tech gear, or collaborating on sponsored content. To attract sponsors, build up your audience and have a clear media kit.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Fan Donations and Tipping</h2>
              <p>
                Direct fan support is a growing stream of income. Live-stream platforms often have tipping features (like YouTube's "Donate" buttons or Twitter's Tip Jar). In India, many fans prefer UPI tips. Share your UPI ID or a donation link in the chat or stream overlay.
              </p>
              <p>
                According to industry research, virtual tipping in India could reach $700–800 million by FY2029, driven by engaging live interactions.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Subscriptions and Memberships</h2>
              <p>
                Offer exclusive content to paying subscribers. YouTube has Channel Memberships, Instagram has subscriber-only "Close Friends" content, and many use Patreon to unlock perks for fans. In these models, you deliver bonus videos, behind-the-scenes content, or special emojis/emblems to members.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Merchandise and Products</h2>
              <p>
                Design and sell custom merchandise – t-shirts, mugs, digital art, or game mods. Set up an online store (Print-on-Demand services can handle inventory) and promote it during streams. You can accept payments via UPI, Paytm, or card through a seamless checkout.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Remember: Diversify your income</h2>
              <p>
                Don't rely on one method alone. As one industry report notes, currently about 90% of creator income comes from brands, so adding tips, memberships, and merchandise can boost your earnings. And always keep engaging your community – after all, an active, loyal fanbase is what really drives each of these revenue streams.
              </p>
              
              <div className="bg-secondary/50 p-6 rounded-xl mt-8 mb-8">
                <h3 className="text-xl font-semibold mb-4">Ready to keep your community chatting and engaged while you earn?</h3>
                <p className="mb-4">Try HyperChat's customizable chat for your YouTube streams – it's free and super light on resources.</p>
                <Button className="bg-hero-gradient hover:opacity-90">
                  Install HyperChat
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default EarnMoneyStreamingIndia;
