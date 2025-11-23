import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-32 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
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
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p>
            This Privacy Policy explains how STREAMHEART PRIVATE LIMITED ("HyperChat", "we", "us", or "our") collects, uses, and protects information when you access or interact with our website and Services.
          </p>
          <p>
            By using HyperChat, you consent to the practices described in this Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <p>We may collect the following types of information that you voluntarily provide:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Name</li>
            <li>Contact details (email, phone if provided)</li>
            <li>Account access information (username or user ID)</li>
            <li>User feedback or communications sent to us</li>
            <li>Platform interaction data (engagement metrics, preference selections, usage statistics)</li>
          </ul>
          <p className="font-semibold mt-4">We do not collect or store:</p>
          <ul className="list-none pl-6 space-y-2 my-4">
            <li>❌ financial information</li>
            <li>❌ transactional details</li>
            <li>❌ payment instrument data</li>
            <li>❌ bank/card numbers</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Operate and maintain the HyperChat platform</li>
            <li>Improve communication and engagement features</li>
            <li>Provide support and respond to inquiries</li>
            <li>Personalize user experience</li>
            <li>Analyze platform use to improve performance</li>
            <li>Enhance security and prevent misuse</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Information Sharing</h2>
          <p>
            We do not sell personal information to third parties.
          </p>
          <p>We may share user data only in the following limited circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>With your consent</li>
            <li>With service providers strictly for platform-related functionality (e.g., hosting, analytics, communication infrastructure)</li>
            <li>To comply with lawful government or legal requirements</li>
            <li>To protect the safety and integrity of the Service</li>
          </ul>
          <p>All third-party service providers are bound by confidentiality and security obligations.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Security</h2>
          <p>
            We employ industry-standard security measures to protect your information, including safeguards against:
          </p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Unauthorized access</li>
            <li>Alteration</li>
            <li>Disclosure</li>
            <li>Misuse or accidental loss</li>
          </ul>
          <p>
            However, no online transmission or digital storage system is completely secure, and we cannot guarantee absolute protection.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Rights</h2>
          <p>Depending on applicable laws, you may:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Request access to your personal data</li>
            <li>Request corrections of inaccurate information</li>
            <li>Request deletion of your stored data</li>
            <li>Request limitation of data processing</li>
            <li>Withdraw previously granted consent</li>
          </ul>
          <p>To exercise your rights, contact us using the details provided below.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Cookies and Usage Information</h2>
          <p>We may use browser cookies and passive usage tracking to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Understand user interaction patterns</li>
            <li>Improve website performance</li>
            <li>Enhance user experience</li>
          </ul>
          <p>
            You may disable cookies in your browser settings, though certain platform functionality may be affected.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Children's Privacy</h2>
          <p>
            HyperChat is not intended for children under the age of 13 (or applicable local age of digital consent). We do not knowingly collect personal data from children without valid consent where required.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to This Policy</h2>
          <p>
            We may revise or update this Privacy Policy periodically to reflect service updates, legal requirements, or technology improvements.
          </p>
          <p>
            The updated Policy will be posted on this page with a revised "Last Updated" timestamp.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact Us</h2>
          <p>
            For questions, requests, or concerns regarding this Privacy Policy, please contact us:
          </p>
          <ul className="list-none pl-0 space-y-2 my-4">
            <li><strong>Email:</strong> ankit@hyperchat.site</li>
            <li><strong>Phone:</strong> +91 9211460100</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
