
import React from "react";
import Navbar from "@/components/Navbar";
import HeroWithCanyonAnimation from "@/components/HeroWithCanyonAnimation";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroWithCanyonAnimation />
      <Features />
      <Services />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
