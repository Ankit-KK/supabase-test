
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Shipping: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Shipping & Delivery Policy</h1>
        
        <div className="bg-muted/30 border border-muted p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Company Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Legal Entity:</strong> STREAMHEART PRIVATE LIMITED</p>
            <p><strong>Brand Name:</strong> HyperChat</p>
            <p><strong>Registered Office:</strong> G-478, G BLOCK, GOVINDPURAM PARK, BLOCK 1, Govindpuram, Ghaziabad, India</p>
            <p><strong>Contact Email:</strong> ankit@hyperchat.site</p>
            <p><strong>Contact Phone:</strong> +91 9211460100</p>
          </div>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-4">Last updated on 19-11-2025</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Digital Service Delivery</h2>
          
          <p>
            HyperChat is a digital service platform that specializes in enhancing live stream interactions between fans and content creators. <strong>We do not sell or ship any physical products.</strong>
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
            <li>Voice message delivery to streamers</li>
            <li>Hyperemote effects and celebrations</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Instant Delivery</h3>
          
          <p>
            Since our platform exclusively offers digital services, delivery occurs immediately upon successful payment processing:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li><strong>No shipping time:</strong> Services are delivered instantly to the live stream</li>
            <li><strong>No tracking required:</strong> Your donation/message appears immediately on the streamer's alert system</li>
            <li><strong>No shipping costs:</strong> There are no additional delivery charges for our digital services</li>
            <li><strong>Email confirmation:</strong> You will receive a confirmation email at the address provided during transaction</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Service Delivery Timeline</h3>
          
          <p>
            Upon successful payment processing:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Your donation is immediately recorded in our system</li>
            <li>Alerts and messages are queued for display on the streamer's broadcast</li>
            <li>Voice messages are processed and made available to the streamer</li>
            <li>Confirmation is sent to your registered email address</li>
          </ul>
          
          <p>
            The actual display time on stream may vary based on the streamer's moderation settings and current queue, but your transaction is processed and delivered to their dashboard immediately.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Platform Responsibility</h3>
          
          <p>
            While we ensure immediate delivery of digital services to the streamer's system, STREAMHEART PRIVATE LIMITED is not liable for:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Individual streamer's choice to display or not display specific donations</li>
            <li>Timing of when alerts appear during the live stream</li>
            <li>Streamer moderation decisions</li>
            <li>Third-party internet connectivity issues</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Contact Information</h3>
          
          <p>
            If you have any questions about our service delivery or need assistance with a transaction, please contact our customer support team:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Email: ankit@hyperchat.site</li>
            <li>Phone: +91 9211460100</li>
            <li>Business Hours: Monday - Friday (9:00 - 18:00)</li>
          </ul>
          
          <p>
            This Shipping & Delivery Policy reflects that HyperChat exclusively provides instant digital services with no physical products or traditional shipping requirements.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shipping;
