
import React from "react";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import BlogSection from "@/components/BlogSection";
import FAQSection from "@/components/FAQSection";

import Pricing from "@/components/Pricing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
  );
};

export default Index;
