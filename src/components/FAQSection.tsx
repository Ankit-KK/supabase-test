import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is HyperChat?",
      answer: "HyperChat is a digital engagement platform that enhances communication between creators and their audiences during live content. We help foster meaningful connections and elevated presence in real-time."
    },
    {
      question: "How does it work?",
      answer: "When you're watching live content from a creator who uses HyperChat, you can engage through our platform to make your presence more noticeable and meaningful. The creator experiences enhanced interaction from their community."
    },
    {
      question: "Who can use HyperChat?",
      answer: "HyperChat is for both creators who want to deepen audience engagement, and for audiences who want to feel more connected and recognized during live experiences."
    },
    {
      question: "What makes HyperChat different?",
      answer: "We focus on creating genuine moments of connection. Your participation isn't just noise — it becomes a meaningful part of the live experience."
    },
    {
      question: "Is HyperChat available worldwide?",
      answer: "While built in India, HyperChat serves creators and audiences globally who value authentic engagement."
    },
    {
      question: "How do I get started?",
      answer: "Creators can sign up to integrate HyperChat into their live content. Audiences can start participating when their favorite creators enable HyperChat."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our services and solutions.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 py-2 bg-card/50 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-8 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Still Have Questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <a href="/contact">
                  <Mail className="h-4 w-4" />
                  Learn More
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;