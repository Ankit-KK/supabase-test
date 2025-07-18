import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureShowcaseHero from "@/components/feature-showcase/FeatureShowcaseHero";
import PaymentFeatures from "@/components/feature-showcase/PaymentFeatures";
import StreamingFeatures from "@/components/feature-showcase/StreamingFeatures";
import InteractiveFeatures from "@/components/feature-showcase/InteractiveFeatures";
import TechnicalFeatures from "@/components/feature-showcase/TechnicalFeatures";
import SecurityFeatures from "@/components/feature-showcase/SecurityFeatures";
import AdminFeatures from "@/components/feature-showcase/AdminFeatures";
import APIDocumentation from "@/components/feature-showcase/APIDocumentation";

const FeatureShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        <FeatureShowcaseHero />
        <PaymentFeatures />
        <StreamingFeatures />
        <InteractiveFeatures />
        <TechnicalFeatures />
        <SecurityFeatures />
        <AdminFeatures />
        <APIDocumentation />
      </main>
      
      <Footer />
    </div>
  );
};

export default FeatureShowcase;