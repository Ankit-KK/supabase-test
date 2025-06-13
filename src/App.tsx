
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import AnkitPage from "./pages/Ankit";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentStatus from "./pages/PaymentStatus";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
// Blog post imports
import CompleteGuideMonetizeContentIndia from "./pages/blog/CompleteGuideMonetizeContentIndia";
import EarnMoneyStreamingIndia from "./pages/blog/EarnMoneyStreamingIndia";
import BestUpiTippingPlatforms from "./pages/blog/BestUpiTippingPlatforms";
import FanEngagementTools2025 from "./pages/blog/FanEngagementTools2025";
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import VirtualGiftsMaximizeRevenue from "./pages/blog/VirtualGiftsMaximizeRevenue";
import StreamerDonationAppStrategy from "./pages/blog/StreamerDonationAppStrategy";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  // Apply dark mode class to html element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<Blog />} />
              {/* Blog post routes */}
              <Route path="/blog/complete-guide-monetize-content-india" element={<CompleteGuideMonetizeContentIndia />} />
              <Route path="/blog/earn-money-streaming-india" element={<EarnMoneyStreamingIndia />} />
              <Route path="/blog/best-upi-tipping-platforms" element={<BestUpiTippingPlatforms />} />
              <Route path="/blog/fan-engagement-tools-2025" element={<FanEngagementTools2025 />} />
              <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
              <Route path="/blog/virtual-gifts-maximize-revenue" element={<VirtualGiftsMaximizeRevenue />} />
              <Route path="/blog/streamer-donation-app-strategy" element={<StreamerDonationAppStrategy />} />
              
              {/* Individual streamer donation pages */}
              <Route path="/ankit" element={<AnkitPage />} />
              <Route path="/ankit/login" element={<AnkitLogin />} />
              <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
              
              {/* Static pages */}
              <Route path="/payment-checkout" element={<PaymentCheckout />} />
              <Route path="/status" element={<PaymentStatus />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
              <Route path="/shipping" element={<Shipping />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
