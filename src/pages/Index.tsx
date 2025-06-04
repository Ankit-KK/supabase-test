import React from "react";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import Features from "@/components/Features";
import Services from "@/components/Services";
import CustomPagesShowcase from "@/components/CustomPagesShowcase";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";
import ChatDemo from "@/components/ChatDemo";
import HowItWorks from "@/components/HowItWorks";
import BlogSection from "@/components/BlogSection";
import FAQSection from "@/components/FAQSection";
import InteractiveGiftsSection from "@/components/InteractiveGiftsSection";
import VirtualGiftsShowcase from "@/components/VirtualGiftsShowcase";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <VideoBackground videoSrc="https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/website%20background.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC93ZWJzaXRlIGJhY2tncm91bmQubXA0IiwiaWF0IjoxNzQ3NDExNjAwLCJleHAiOjE4NzM1NTU2MDB9.D5dXg6_fRzUh8B5veK0_ZSo8IvP4wb2k6Y_IAn7W-VY" />
      <div className="content-overlay">
        <Navbar />
        <HeroWithCanyonAnimation />
        <Features />
        <HowItWorks />
        <InteractiveGiftsSection />
        <ChatDemo />
        <CustomPagesShowcase />
        <Services />
        <BlogSection />
        <FAQSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
