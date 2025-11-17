
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Shipping: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
        
        <div className="bg-muted/30 border border-muted p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Company Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Legal Entity:</strong> STREAMHEART PRIVATE LIMITED</p>
            <p><strong>Brand Name:</strong> HyperChat</p>
            <p><strong>Contact Email:</strong> ankit@hyperchat.site</p>
            <p><strong>Contact Phone:</strong> +91 9211460100</p>
          </div>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-4">Last updated on 12-05-2025</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">No Shipping Policy</h2>
          
          <p>
            HyperChat is a digital service provider that specializes in enhancing live stream interactions between 
            fans and content creators. We do not sell or ship any physical products.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Our Digital Services</h3>
          
          <p>
            All services provided by HyperChat are delivered digitally and instantly. These services include:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Fan donations to streamers</li>
            <li>Enhanced message visibility during live streams</li>
            <li>Custom animations and alerts</li>
            <li>Interactive stream elements</li>
          </ul>
          
          <p>
            Since our platform exclusively offers digital services that are delivered immediately upon 
            transaction processing, no shipping is involved in any of our operations.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Delivery of Digital Services</h3>
          
          <p>
            Upon successful payment processing, our digital services are delivered immediately to the 
            relevant live stream. There is no waiting period or shipping time involved.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Contact Information</h3>
          
          <p>
            If you have any questions about our services or need assistance with a transaction, 
            please contact our customer support team:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Email: ankit@hyperchat.site</li>
            <li>Phone: +91 9211460100</li>
          </ul>
          
          <p>
            This No Shipping Policy is in place because HyperChat exclusively provides digital services 
            with no physical products or shipping requirements.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shipping;
