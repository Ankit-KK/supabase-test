
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

const DISCORD_INVITE_LINK = "https://discord.gg/your-invite";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  mobile_number: z.string().min(10, { message: "Please enter a valid mobile number." }),
  youtube_channel: z.string().min(1, { message: "YouTube channel link is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  instagram_handle: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

const SignupDialog: React.FC<SignupDialogProps> = ({ open, onOpenChange }) => {
  const [view, setView] = useState<'options' | 'form'>('options');

  if (!open) {
    return null;
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setView('options');
    onOpenChange(isOpen);
  };

  const handleDiscordClick = () => {
    window.open(DISCORD_INVITE_LINK, '_blank', 'noopener,noreferrer');
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {view === 'options' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Get Connected with HyperChat</DialogTitle>
              <DialogDescription>
                Choose how you'd like to reach us
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Discord Card */}
              <button
                onClick={handleDiscordClick}
                className="group relative flex flex-col items-center gap-3 rounded-lg border border-border p-6 text-center transition-all hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <Badge className="absolute -top-2.5 right-2 bg-emerald-500 text-white hover:bg-emerald-500 text-[10px] px-2 py-0.5">
                  Faster Response
                </Badge>
                <DiscordIcon className="h-10 w-10 text-[#5865F2]" />
                <span className="font-semibold text-foreground">Discord</span>
                <span className="text-xs text-muted-foreground">
                  Join our server for instant support
                </span>
              </button>

              {/* Signup Form Card */}
              <button
                onClick={() => setView('form')}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <MessageSquare className="h-10 w-10 text-primary" />
                <span className="font-semibold text-foreground">Signup Form</span>
                <span className="text-xs text-muted-foreground">
                  Fill in your details and we'll reach out
                </span>
              </button>
            </div>
          </>
        ) : (
          <SignupFormView onBack={() => setView('options')} onClose={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
};

/* Extracted form into its own component so hooks are always called */
const SignupFormView: React.FC<{ onBack: () => void; onClose: () => void }> = ({ onBack, onClose }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mobile_number: "",
      youtube_channel: "",
      email: "",
      instagram_handle: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase.from("user_signups").insert({
        name: data.name,
        mobile_number: data.mobile_number,
        youtube_channel: data.youtube_channel,
        email: data.email,
        instagram_handle: data.instagram_handle || null
      });
      
      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already registered");
        } else {
          toast.error("Something went wrong. Please try again.");
          console.error("Error saving data:", error);
        }
        return;
      }
      
      toast.success("Thanks for signing up! We'll contact you soon.");
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="rounded-sm p-1 hover:bg-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <DialogTitle className="text-xl">Get Started with HyperChat</DialogTitle>
        </div>
        <DialogDescription>
          Fill in your details to start boosting your streaming presence
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="Your mobile number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="youtube_channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube Channel</FormLabel>
                <FormControl>
                  <Input placeholder="YouTube channel link" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Your email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instagram_handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Handle (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="@your_instagram" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-4 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-hero-gradient hover:opacity-90 transition-opacity"
            >
              Submit
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default SignupDialog;
