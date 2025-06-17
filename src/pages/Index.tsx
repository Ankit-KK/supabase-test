
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

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <VideoBackground videoSrc="https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/86462-593059278.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC84NjQ2Mi01OTMwNTkyNzgubXA0IiwiaWF0IjoxNzUwMTI5NTEwLCJleHAiOjE3ODE2NjU1MTB9.HOXH3Np6JMOqQEXhGxEUEX9EArlWoIVS2jKcFOwFb-w" />
      <div className="content-overlay">
        <Navbar />
        <HeroWithCanyonAnimation />
        <Features />
        <HowItWorks />
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
