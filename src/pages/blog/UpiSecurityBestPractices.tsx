
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

const UpiSecurityBestPractices = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-20 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6" asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm">
                  Security
                </span>
                <span className="bg-hyperchat-purple/20 text-hyperchat-purple px-3 py-1 rounded-full text-sm">
                  Best Practices
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                UPI for Content Creators: Security & Best Practices
              </h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>Security Team</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>8 min read</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              
              <img 
                src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop" 
                alt="UPI security for content creators"
                className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
              />
            </div>
            
            <article className="prose prose-lg prose-invert max-w-none">
              <p className="text-xl leading-relaxed text-muted-foreground mb-8">
                UPI is fast and convenient for creators, but it also requires caution. Here's how to use UPI safely and earn your fans' trust:
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Use Official UPI Apps</h2>
              <p>
                Only download UPI apps (Google Pay, PhonePe, Paytm, or the BHIM app) from official app stores. Fake apps can look real but steal data. As security experts warn, fraudsters create clones of popular UPI apps – always check developer details and read reviews.
              </p>
              <p>
                Stick to trusted names. Similarly, only click bank or UPI links you know; avoid typing your UPI PIN on any site or pop-up. NPCI emphasizes: "UPI PIN is to be entered only for payments and not for receipts". That means you should never enter your PIN when someone else tries to send you money – a common trick used by scammers.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Never Share Your PIN or Credentials</h2>
              <p>
                This cannot be stressed enough. Your UPI PIN is like the key to your bank. NPCI's fraud guidelines explicitly say: "Never share… UPI Pin with a third party". No legitimate service or supporter will ever ask for your PIN or OTP.
              </p>
              <p>
                If someone pressures you to enter your PIN for a "transaction" you didn't initiate, it's a scam. Always decline such requests. Use NPCI's safety features: enable biometric locks on your UPI app and set transaction limits to reduce risk.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Verify Every Request</h2>
              <p>
                Scammers sometimes pose as fans or companies and ask for small test transfers, then larger ones. Always double-check any payment prompt. Monitor your app for confirmation. The NPCI also advises checking in-app notifications to ensure transactions are going to the right recipient.
              </p>
              <p>
                If anything looks off, cancel the transaction. It's also wise to register your current mobile number with your bank, so OTPs land in your hands.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Beware of Phishing and Social Engineering</h2>
              <p>
                Don't click suspicious links or install unknown software. Fake messages claiming you've won a contest or that someone will send you money can install malware. Always type the official app's web address into your browser.
              </p>
              <p>
                If someone reaches out claiming to be a bank official, hang up and verify by calling the bank's official number. Remember, UPI transaction links can be faked. As one security report notes, "Phishing scams increasingly… steal account credentials", so stay vigilant.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Set Strong PINs and Update</h2>
              <p>
                Make your UPI PIN strong and change it periodically. Avoid obvious numbers like birthdays or repeating digits. One industry guideline highlights this: choose a random 6-digit PIN and change it regularly.
              </p>
              <p>
                Also secure your phone with a strong lock screen so nobody can access your UPI app if they pick up your device.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Educate Your Supporters</h2>
              <p>
                Let your fans know how you securely accept payments. If you use UPI, display only your UPI ID or QR code publicly, never personal details. Consider setting up a separate bank account or virtual payment address for donations so you can track them easily and avoid confusion with personal payments.
              </p>
              
              <p>
                By following these best practices, you minimize risk while accepting UPI payments. Remember that UPI's two-factor authentication (your device plus your PIN) is inherently safe, but human caution must complete the loop.
              </p>
              
              <div className="bg-secondary/50 p-6 rounded-xl mt-8 mb-8">
                <h3 className="text-xl font-semibold mb-4">Secure Your Live Chat Too</h3>
                <p className="mb-4">Keep your streaming experience safe with HyperChat's moderation features and spam filtering.</p>
                <Button className="bg-hero-gradient hover:opacity-90">
                  Install HyperChat
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default UpiSecurityBestPractices;
