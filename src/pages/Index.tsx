
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
        <div className="fixed top-4 right-4 z-50">
          <Button asChild variant="outline">
            <Link to="/auth">Streamer Login</Link>
          </Button>
        </div>
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
