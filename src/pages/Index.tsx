
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import PartnershipSection from "@/components/PartnershipSection";
import Features from "@/components/Features";
import ModerationFeatures from "@/components/feature-showcase/ModerationFeatures";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";
import HowItWorks from "@/components/HowItWorks";
import BlogSection from "@/components/BlogSection";
import FAQSection from "@/components/FAQSection";
import AudienceValue from "@/components/AudienceValue";
import HyperstoreShowcase from "@/components/HyperstoreShowcase";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-video-url');
        if (error) throw error;
        setVideoUrl(data.videoUrl);
      } catch (error) {
        console.error('Error fetching video URL:', error);
      }
    };

    fetchVideoUrl();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      {videoUrl && <VideoBackground videoSrc={videoUrl} />}
      <div className="content-overlay">
        <Navbar />
        <HeroWithCanyonAnimation />
        <PartnershipSection />
        <Features />
        <ModerationFeatures />
        <Services />
        <AudienceValue />
        <HyperstoreShowcase />
        <HowItWorks />
        <BlogSection />
        <FAQSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
