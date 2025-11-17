
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: formData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Message sent!",
        description: "We'll get back to you soon.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-28 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Got questions? We'd love to hear from you. Send us a message and we'll
              respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Email</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Our friendly team is here to help.
              </p>
              <a
                href="mailto:ankit@hyperchat.site"
                className="text-sm font-medium text-primary hover:underline"
              >
                ankit@hyperchat.site
              </a>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Phone</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Mon-Fri from 8am to 5pm.
              </p>
              <a
                href="tel:+919205013630"
                className="text-sm font-medium text-primary hover:underline"
              >
                +91 9211460100
              </a>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Live Chat</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Our friendly team is online 24/7.
              </p>
              <button className="text-sm font-medium text-primary hover:underline">
                Start chat
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Name
                  </label>
                  <Input 
                    id="name" 
                    name="name"
                    placeholder="Your name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email
                  </label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="Your email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Phone
                </label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel" 
                  placeholder="Your phone number" 
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Message
                </label>
                <Textarea 
                  id="message" 
                  name="message"
                  placeholder="Your message" 
                  className="min-h-32" 
                  value={formData.message}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Company Details */}
          <div className="mt-12 p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Company Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Legal Entity</p>
                <p className="font-medium text-lg">STREAMHEART PRIVATE LIMITED</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Brand Name</p>
                <p className="font-medium">HyperChat</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">ankit@hyperchat.site</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">+91 9211460100</p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6 text-center">Contact Person</h2>
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm max-w-md mx-auto">
              <h3 className="font-medium text-xl mb-2">Ankit Kumar</h3>
              <p className="text-muted-foreground mb-4">Lead Developer</p>
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4" />
                <span>+91 9211460100</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>ankit@hyperchat.site</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
