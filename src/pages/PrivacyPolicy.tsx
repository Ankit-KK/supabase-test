
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
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Introduction</h2>
          <p>
            This Privacy Policy explains how STREAMHEART PRIVATE LIMITED ("HyperChat", "we", "us", or "our") 
            collects, uses, shares, and protects information about you when you use our website and services.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Name and contact information</li>
            <li>Payment information and transaction details</li>
            <li>Account credentials</li>
            <li>Communications with us</li>
            <li>Usage data and analytics</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who assist in our operations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent where applicable</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to collect information about your browsing activities 
            and to improve your experience on our website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-none pl-0 space-y-2 my-4">
            <li>Email: ankit@hyperchat.site</li>
            <li>Phone: +91 9211460100</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
