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
      question: "What services do you offer?",
      answer: "We provide comprehensive technology solutions including web development, software consulting, and digital transformation services tailored to your business needs."
    },
    {
      question: "How do I get started?",
      answer: "Simply contact us through our contact form or email. We'll schedule a consultation to understand your requirements and propose the best solution for your project."
    },
    {
      question: "What is your pricing structure?",
      answer: "Our pricing varies based on project scope and requirements. We offer competitive rates and flexible payment options. Contact us for a personalized quote."
    },
    {
      question: "Do you provide ongoing support?",
      answer: "Yes, we offer comprehensive support and maintenance services to ensure your solutions continue to perform optimally after deployment."
    },
    {
      question: "How long does a typical project take?",
      answer: "Project timelines vary depending on complexity and scope. Simple projects may take 2-4 weeks, while larger enterprise solutions can take several months. We'll provide a detailed timeline during consultation."
    },
    {
      question: "Do you work with international clients?",
      answer: "Yes, we work with clients globally and are experienced in managing remote projects across different time zones."
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
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Get In Touch
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;