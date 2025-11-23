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
          
          <p className="mb-6">
            These Terms and Conditions ("Terms") constitute a legally binding agreement between STREAMHEART PRIVATE LIMITED ("we", "us", "our") and the user ("you", "your"), governing your access to and use of the HyperChat website and platform (collectively, the "Services").
          </p>

          <p className="mb-6">
            By accessing or using HyperChat, you acknowledge that you have read, understood, and agreed to these Terms, including our Privacy Policy. We may update these Terms at any time without prior notice and recommend reviewing them periodically.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Use of Services</h2>
          <p className="mb-4">You agree to provide accurate and complete information when interacting with or accessing the Services.</p>
          <p className="mb-4">Your usage of HyperChat is solely at your discretion and responsibility. You must independently ensure that the Services meet your intended purpose.</p>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>misuse, copy, or alter the platform</li>
            <li>attempt unauthorized access, scraping, reverse engineering, or disruption</li>
            <li>use HyperChat for any unlawful or prohibited purpose</li>
          </ul>
          <p className="mb-6">All communication, interaction, and engagement facilitated through HyperChat remain the responsibility of the users engaging in such communication.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Intellectual Property</h2>
          <p className="mb-6">All content, branding, design elements, platform features, proprietary systems, and associated materials are owned by STREAMHEART PRIVATE LIMITED. No part of the Service grants you ownership or rights to use our IP beyond permitted normal platform usage.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. No Warranty</h2>
          <p className="mb-4">We do not warrant that the Services will be uninterrupted, error-free, or free from vulnerabilities.</p>
          <p className="mb-4">We make no guarantees regarding outcomes from usage, engagement levels, visibility, audience growth, or interaction success.</p>
          <p className="mb-6">The Service is provided on an "as-is" and "as-available" basis.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Content</h2>
          <p className="mb-6">HyperChat may contain links or references to third-party platforms. We do not endorse or assume responsibility for any third-party resources, content, or policies.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-2">To the fullest extent permitted under applicable law:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>We shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising from your use or inability to use the Services.</li>
            <li>We are not responsible for user-generated content, audience behavior, communication between creators and audiences, or any form of interactive exchange between users.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Platform Access and Security</h2>
          <p className="mb-4">You are responsible for maintaining confidentiality of any access credentials.</p>
          <p className="mb-4">Any action performed under your access point is considered initiated by you.</p>
          <p className="mb-6">You agree to promptly notify us in case of suspected unauthorized access or account misuse.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Service Availability and Modifications</h2>
          <p className="mb-6">We reserve the right to modify, limit, suspend, or discontinue any part of the Service at our discretion and without notice. We are not liable for any disruption or impact arising from such changes.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Force Majeure</h2>
          <p className="mb-6">Neither party shall be liable for failure or delay in performance due to circumstances beyond reasonable control, including but not limited to natural disasters, system failures, network outages, or technical incidents.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law</h2>
          <p className="mb-6">These Terms shall be governed by the laws of India.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Dispute Resolution</h2>
          <p className="mb-6">Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Vasundhara, Uttar Pradesh.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact</h2>
          <p className="mb-6">For any concerns or communication regarding these Terms, please reach out using the contact details provided above.</p>

          <div className="mt-12 p-6 bg-muted/30 border border-muted rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">🎉 HyperChat</p>
            <p className="text-sm text-muted-foreground">A digital engagement platform that enhances presence and communication between creators and their audiences.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>;
};
export default TermsAndConditions;