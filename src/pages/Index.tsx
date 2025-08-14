
import React from "react";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";
import HowItWorks from "@/components/HowItWorks";
import BlogSection from "@/components/BlogSection";
import FAQSection from "@/components/FAQSection";

import Pricing from "@/components/Pricing";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <VideoBackground videoSrc="YOUR_VIDEO_URL_HERE" />
      <div className="content-overlay">
        <Navbar />
        <HeroWithCanyonAnimation />
        <Features />
        <HowItWorks />
        <Pricing />
        <Services />
        <BlogSection />
        <FAQSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
