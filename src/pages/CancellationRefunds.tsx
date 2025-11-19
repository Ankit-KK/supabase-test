
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CancellationRefunds: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cancellation & Refunds Policy</h1>
        
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
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Refund and Cancellation Policy</h2>
          
          <p>
            This refund and cancellation policy outlines how you can cancel or seek a refund for a service that you have purchased through the Platform. Under this policy:
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cancellation Policy</h3>
          
          <ol className="list-decimal pl-6 space-y-3 my-4">
            <li>
              <strong>Cancellation Window:</strong> Cancellations will only be considered if the request is made within 7 days of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to sellers/merchants listed on the Platform and they have initiated the process of delivery. In such an event, you may choose to reject the service.
            </li>
            
            <li>
              <strong>Digital Services:</strong> STREAMHEART PRIVATE LIMITED provides exclusively digital services for live streaming. Due to the instant delivery nature of our digital services, most transactions cannot be canceled once they have been processed and delivered to the streamer.
            </li>
            
            <li>
              <strong>Technical Issues:</strong> In case of receipt of service failure or technical defects, please report to our customer service team. The request would be entertained once we have checked and determined the same at our end. This should be reported within 7 days of the transaction.
            </li>
            
            <li>
              <strong>Service Quality:</strong> In case you feel that the service received is not as described on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of the transaction. The customer service team after looking into your complaint will take an appropriate decision.
            </li>
            
            <li>
              <strong>Refund Processing:</strong> In case of any refunds approved by STREAMHEART PRIVATE LIMITED, it will take 7 days for the refund to be processed to you.
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Important Notes for Digital Services</h3>
          
          <p>
            Please understand that HyperChat provides instant digital services. When you make a donation or use our platform's features:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Your donation is immediately processed and sent to the streamer</li>
            <li>Your message or interaction is delivered in real-time</li>
            <li>Once delivered, these digital services cannot be "returned" or reversed</li>
          </ul>
          
          <p>
            Due to the instantaneous nature of our digital services, we carefully review refund requests on a case-by-case basis, primarily for technical failures or service delivery issues.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Return Policy</h2>
          
          <p>
            We offer refund/resolution within the first 7 days from the date of your transaction. If 7 days have passed since your transaction, you will not be offered a return or refund of any kind.
          </p>
          
          <p>
            In order to become eligible for a refund consideration, you must demonstrate that:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>The digital service was not delivered as described</li>
            <li>Technical issues on our platform prevented proper service delivery</li>
            <li>The transaction was processed in error</li>
          </ul>
          
          <p>
            You agree that there may be certain categories of services that are exempted from returns or refunds. Such categories would be clearly identified to you at the time of transaction.
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
            By using our services, you acknowledge that you have read, understood, and agree to this Cancellation & Refunds Policy.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CancellationRefunds;
