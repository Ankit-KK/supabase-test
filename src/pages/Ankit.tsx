
import React from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define our donation form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  amount: z.coerce.number().min(50, { message: "Amount must be at least ₹50" }),
  message: z.string().min(5, { message: "Message must be at least 5 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

const AnkitPage: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 50,
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Generate a random order id
      const orderId = `hyperchat_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      // Store form data in session storage for the checkout page
      sessionStorage.setItem('donation_data', JSON.stringify({
        ...data,
        orderId
      }));

      // Navigate to checkout processing
      navigate('/payment-checkout');
      
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container max-w-md py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Support Your Favorite Streamer</CardTitle>
          <CardDescription>Fill in your details to make a donation</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donation Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="50"
                        placeholder="Minimum ₹50" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message for Streamer</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Your message will be displayed during the stream"
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                className="w-full bg-hero-gradient hover:opacity-90 transition-opacity"
              >
                Continue to Payment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnkitPage;
