
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How to earn money as a streamer in India?",
      answer: "Use HyperChat's UPI payment platform to receive direct fan support via UPI payments, virtual gifts, and live chat tipping. Our platform enables content monetization through multiple revenue streams including tips, virtual gifting, and fan engagement tools. Get paid instantly by fans in India with zero delays."
    },
    {
      question: "What is the best UPI-based tipping platform for creators?",
      answer: "HyperChat is the leading UPI payment platform for creators in India, offering comprehensive features like virtual gifts for live streamers, live stream payment gateway, and advanced fan engagement tools. Our UPI-based tipping solution is specifically designed for Indian streaming monetization."
    },
    {
      question: "How do virtual gifts for live streamers work?",
      answer: "Fans can tip your favorite content creators with virtual gifts that appear as animated effects during live streams. These virtual gifts provide both monetary support and visual engagement, creating an interactive experience that enhances fan engagement and increases creator earnings."
    },
    {
      question: "Is UPI payment safe for content creators?",
      answer: "Yes, our UPI payment platform for creators uses secure, RBI-approved payment gateways. All transactions are encrypted and processed through official UPI channels, ensuring that creators can monetize content in India safely and receive payments instantly."
    },
    {
      question: "How much does it cost to use HyperChat?",
      answer: "HyperChat's creator monetization platform starts at just ₹299 per month. This includes access to all features like live chat tipping, virtual gifting, UPI payments, analytics dashboard, and customer support to help you maximize your earnings."
    },
    {
      question: "Can fans support streamers with UPI from any bank?",
      answer: "Yes! Our UPI-based tipping solution supports all major Indian banks and UPI apps including PhonePe, Google Pay, Paytm, and BHIM. Fans can easily support streamers with UPI using their preferred payment method for seamless direct fan support via UPI."
    },
    {
      question: "What makes HyperChat different from other streaming platforms?",
      answer: "HyperChat is specifically built for Indian streaming monetization with native UPI integration, local language support, and cultural understanding. Our live stream payment gateway is optimized for Indian internet speeds and payment preferences, making it the ideal streamer donation app for Indian creators."
    },
    {
      question: "How quickly do creators get paid by fans?",
      answer: "Creators get paid by fans instantly through our real-time UPI payment system. There are no holding periods or delays - money from tips, virtual gifts, and fan support is transferred immediately to your registered UPI ID or bank account."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Everything you need to know about monetizing content in India with our UPI payment platform for creators.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="bg-secondary/50 rounded-lg border border-white/10 px-6"
              >
                <AccordionTrigger className="text-left hover:text-hyperchat-purple transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-secondary/50 p-8 rounded-xl border border-white/10 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you succeed with content monetization and UPI payments for creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@hyperchat.space" 
                className="inline-flex items-center justify-center px-6 py-3 bg-hyperchat-purple hover:bg-hyperchat-purple/90 text-white rounded-lg transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
              >
                Get In Touch
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
