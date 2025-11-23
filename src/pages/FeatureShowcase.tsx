import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureShowcaseHero from "@/components/feature-showcase/FeatureShowcaseHero";
import EngagementFeatures from "@/components/feature-showcase/EngagementFeatures";
import StreamingFeatures from "@/components/feature-showcase/StreamingFeatures";
import InteractiveFeatures from "@/components/feature-showcase/InteractiveFeatures";
import TechnicalFeatures from "@/components/feature-showcase/TechnicalFeatures";
import SecurityFeatures from "@/components/feature-showcase/SecurityFeatures";
import AdminFeatures from "@/components/feature-showcase/AdminFeatures";

const FeatureShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        <FeatureShowcaseHero />
        <EngagementFeatures />
        <StreamingFeatures />
        <InteractiveFeatures />
        <TechnicalFeatures />
        <SecurityFeatures />
        <AdminFeatures />
      </main>
      
      <Footer />
    </div>
  );
};

export default FeatureShowcase;