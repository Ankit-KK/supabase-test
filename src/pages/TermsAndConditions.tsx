import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const TermsAndConditions: React.FC = () => {
  return <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        
        <div className="bg-muted/30 border border-muted p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-3">Company Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Legal Entity:</strong> STREAMHEART PRIVATE LIMITED</p>
            <p><strong>Brand Name:</strong> HyperChat</p>
            <p><strong>Contact Email:</strong> ankit@hyperchat.site</p>
            <p><strong>Contact Phone:</strong> +91 9211460100</p>
          </div>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-4">Last updated on 07-05-2025 21:17:40</p>
          
          
          
          
          
          
          
          
        </div>
      </div>
      <Footer />
    </div>;
};
export default TermsAndConditions;