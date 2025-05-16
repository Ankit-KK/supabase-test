
import React from "react";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <VideoBackground videoSrc="https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/website%20background.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC93ZWJzaXRlIGJhY2tncm91bmQubXA0IiwiaWF0IjoxNzQ3NDExNjAwLCJleHAiOjE4NzM1NTU2MDB9.D5dXg6_fRzUh8B5veK0_ZSo8IvP4wb2k6Y_IAn7W-VY" />
      <div className="content-overlay">
        <Navbar />
        <HeroWithCanyonAnimation />
        <Features />
        <Services />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
