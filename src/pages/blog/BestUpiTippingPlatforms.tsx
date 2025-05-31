
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import SignupDialog from "@/components/SignupDialog";

const BestUpiTippingPlatforms = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

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
                  Platform Guides
                </span>
                <span className="bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm">
                  UPI Payments
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Best UPI-Based Tipping Platforms for Creators
              </h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>Platform Analysis Team</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>7 min read</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              
              <img 
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=400&fit=crop" 
                alt="UPI tipping platforms for creators"
                className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
              />
            </div>
            
            <article className="prose prose-lg prose-invert max-w-none">
              <p className="text-xl leading-relaxed text-muted-foreground mb-8">
                For Indian creators, UPI-based tipping platforms are a game-changer. They let your fans support you instantly with the digital payments they already use. Here are some of the best options:
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Buy Me A Chai</h2>
              <p>
                An Indian-built platform tailored for UPI. You register your name, set a "chai price" (e.g. ₹10 per chai), and enter your UPI ID. You get a personalized link to share with fans. Supporters click it and pay you via any UPI app through a dynamic QR or link.
              </p>
              <p>
                The setup is super fast – you can create your page in under a minute and immediately start receiving payments. Best of all, there are no extra fees or currency conversions, so you keep almost all the money your fans send.
              </p>
              <p>
                <strong>Why it stands out:</strong> It's built for Indian creators by an Indian founder, respecting local habits (even the name "chai" resonates culturally). As its creator put it, "UPI is ubiquitous in India, with over 300 million active users", so Buy Me A Chai fits right in.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">OnlyChai</h2>
              <p>
                A minimal alternative also focused on UPI. It works without any payment gateway – you simply build a link and fans pay via UPI. While smaller than Buy Me A Chai, it shows the demand: when Buy Me A Coffee (the global platform) did not support UPI, OnlyChai's creator saw Indians needed a UPI solution.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Payment Gateway Links (Razorpay/Cashfree)</h2>
              <p>
                Even if a specialized app isn't used, you can create UPI payment links via popular Indian payment gateways. For example, Razorpay lets you generate a UPI payment link in seconds, which you can share anywhere (stream chat, social media, website).
              </p>
              <p>
                Interestingly, Twitter's Tip Jar in India integrated Razorpay so that fans could tip creators via UPI. You can do something similar on your own: open a Razorpay or Cashfree dashboard, create a payment link for donations, and copy the link into your stream.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Social Platforms with UPI</h2>
              <p>
                Some social and streaming services support UPI tipping. Twitter's Tip Jar (if available) uses Razorpay behind the scenes. TikTok and Instagram also have in-app gifting (coins or stars) – while the payment handling isn't explicitly UPI, Indian users fund these via UPI in their wallets.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Google Pay/PhonePe Pay Directly</h2>
              <p>
                Don't overlook the basic approach: display your UPI QR code or ID prominently. Fans can scan your Google Pay QR or send money to your UPI address directly. Since UPI apps charge no fee for peer-to-peer transfers, this is a 100% free way to get tips.
              </p>
              
              <p>
                When choosing a tipping platform, consider ease of use and trust. Platforms built for creators (like Buy Me A Chai) optimize for quick setup and low fees, while payment gateways give more flexibility. The key is to make giving as frictionless as possible for your fans.
              </p>
              
              <div className="bg-secondary/50 p-6 rounded-xl mt-8 mb-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Install HyperChat, Get Your Custom Page</h3>
                <p className="mb-4">Ready to take your streaming to the next level? Get started with HyperChat and create your personalized donation page with enhanced chat features.</p>
                <Button 
                  className="bg-hero-gradient hover:opacity-90"
                  onClick={() => setShowSignupDialog(true)}
                >
                  Get Started with HyperChat
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>
      
      <SignupDialog 
        open={showSignupDialog} 
        onOpenChange={setShowSignupDialog} 
      />
      
      <Footer />
    </div>
  );
};

export default BestUpiTippingPlatforms;
