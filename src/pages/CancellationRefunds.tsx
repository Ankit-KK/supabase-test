
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CancellationRefunds: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Refund & Cancellation Policy</h1>
        
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
          <p className="text-sm text-muted-foreground mb-6">Last Updated: 07-05-2025</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. General Policy</h2>
          <p>
            HyperChat provides audience engagement software tools for interactive communication between creators and their viewers. Since our platform services are primarily digital and access-based, refunds are handled only under specific and valid circumstances as outlined below.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Service Access Issues</h2>
          <p>Users may request a refund only in cases where:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>The user was unable to access the platform due to a verified technical issue caused by HyperChat.</li>
            <li>There was a proven malfunction or disruption of service on our systems that prevented usage.</li>
          </ul>
          
          <p className="font-semibold mt-4">Refunds will NOT be granted for:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Issues arising due to user-side internet, device, browser, or third-party service failures.</li>
            <li>Cases where the user has already used or accessed the service features.</li>
            <li>Personal dissatisfaction or subjective preference-based reasons.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">3. No Refund for Completed Usage</h2>
          <p>
            Once a service session, feature access, or usage interaction has taken place, the refund request becomes ineligible, as digital services consumed cannot be reversed.
          </p>
          
          <p className="font-semibold mt-4">HyperChat does not provide refunds for:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Completed audience engagement interactions</li>
            <li>Access to features already utilized</li>
            <li>Time-based platform usage</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Processing of Approved Refunds</h2>
          <p>If a refund is approved:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Refund will be processed through the same channel from which the transaction was initiated.</li>
            <li>Processing times may vary depending on intermediary services such as service providers and banks.</li>
            <li>Refund processing time may take 7–14 business days.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">5. No Guarantees or Warranties of Suitability</h2>
          <p>Users acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>HyperChat does not guarantee outcomes, engagement levels, audience responses, or creator visibility.</li>
            <li>The platform provides functionality — actual audience behavior or engagement is not controlled by us.</li>
            <li>Refunds cannot be requested on the basis of community interaction levels, audience attention, or subjective participation metrics.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">6. Eligibility Verification</h2>
          <p>HyperChat may require:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>service logs,</li>
            <li>account activity records,</li>
            <li>technical support history,</li>
            <li>timestamp data</li>
          </ul>
          <p>to verify the legitimacy of a refund request.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">7. Abuse of Refund Policy</h2>
          <p>In case of:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>repeated refund claims,</li>
            <li>fraudulent requests,</li>
            <li>misuse or manipulation of the platform, or</li>
            <li>violation of Terms & Conditions</li>
          </ul>
          <p>HyperChat reserves the right to deny refunds and may restrict platform access.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">8. No Financial Responsibilities</h2>
          <p>HyperChat:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>does not handle or store financial data,</li>
            <li>does not process monetary interactions between creators and audiences,</li>
            <li>does not function as a financial intermediary, payment handler, or settlement facilitator.</li>
          </ul>
          <p>Users understand that HyperChat is strictly an engagement software service.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">9. How to Request a Refund</h2>
          <p>Refund requests must be submitted via:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>📩 Email: ankit@hyperchat.site</li>
            <li>📞 Phone: +91 9211460100</li>
          </ul>
          
          <p className="font-semibold mt-4">You must include:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Registered name</li>
            <li>Contact details</li>
            <li>Account ID</li>
            <li>Explanation of the issue</li>
            <li>Screenshots or log references (if applicable)</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">10. Final Decision Authority</h2>
          <p>STREAMHEART PRIVATE LIMITED reserves the right to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>evaluate each request individually,</li>
            <li>determine eligibility at its sole discretion,</li>
            <li>approve or deny refund requests.</li>
          </ul>
          <p>All decisions made by HyperChat regarding refunds are final.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CancellationRefunds;
