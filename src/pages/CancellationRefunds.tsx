
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CancellationRefunds: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cancellation & Refunds Policy</h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-4">Last updated on 12-05-2025</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">No Cancellation & Refunds Policy</h2>
          
          <p>
            At HyperChat, we maintain a strict no cancellation and no refund policy for all transactions made on our platform. 
            This policy is in place due to the immediate nature of our digital services.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Why We Have This Policy</h3>
          
          <p>
            Our services are delivered instantly upon payment processing. When you make a donation or payment through 
            our platform, it is immediately processed and delivered to the intended streamer, along with any associated 
            features like highlighted messages or custom animations.
          </p>
          
          <p>
            Due to the instantaneous delivery of our digital services and the inability to "return" a service that has 
            already been rendered, we are unable to offer refunds or cancellations once a transaction has been processed.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Before You Make a Payment</h3>
          
          <p>
            We encourage all users to carefully review their donation amount, message content, and selected features 
            before confirming any transaction. Please ensure that you are comfortable with your payment before proceeding.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Technical Issues</h3>
          
          <p>
            In rare cases where a technical error on our part prevents the delivery of your donation or its associated 
            features, please contact our customer support team with your transaction details. We will investigate the issue 
            and work to resolve it appropriately.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Contact Information</h3>
          
          <p>
            If you have any questions or concerns regarding this policy, please contact us at:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Email: ankit@hyperchat.site</li>
            <li>Phone: +91 9211460100</li>
          </ul>
          
          <p>
            By using our services, you acknowledge that you have read, understood, and agree to this No Cancellation & Refunds Policy.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CancellationRefunds;
