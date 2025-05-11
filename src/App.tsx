
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AnkitPage from "./pages/Ankit";
import HarishPage from "./pages/Harish";
import MackleTVPage from "./pages/MackleTV";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentStatus from "./pages/PaymentStatus";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import AnkitDonationMessages from "./pages/AnkitDonationMessages";
import AnkitObsView from "./pages/AnkitObsView";
import HarishObsView from "./pages/HarishObsView";
import HarishDonationMessages from "./pages/HarishDonationMessages";
import HarishDashboard from "./pages/HarishDashboard";
import HarishLogin from "./pages/HarishLogin";
import MackleTVLogin from "./pages/MackleTVLogin";
import MackleTVDashboard from "./pages/MackleTVDashboard";
import MackleTVDonationMessages from "./pages/MackleTVDonationMessages";
import MackleTVObsView from "./pages/MackleTVObsView";
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
              <Route path="/ankit" element={<AnkitPage />} />
              <Route path="/harish" element={<HarishPage />} />
              <Route path="/mackletv" element={<MackleTVPage />} />
              <Route path="/payment-checkout" element={<PaymentCheckout />} />
              <Route path="/status" element={<PaymentStatus />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/ankit/login" element={<AnkitLogin />} />
              <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
              <Route path="/ankit/messages" element={<AnkitDonationMessages />} />
              <Route path="/ankit/obs/:id" element={<AnkitObsView />} />
              <Route path="/harish/obs/:id" element={<HarishObsView />} />
              <Route path="/harish/messages" element={<HarishDonationMessages />} />
              <Route path="/harish/dashboard" element={<HarishDashboard />} />
              <Route path="/harish/login" element={<HarishLogin />} />
              <Route path="/mackletv/login" element={<MackleTVLogin />} />
              <Route path="/mackletv/dashboard" element={<MackleTVDashboard />} />
              <Route path="/mackletv/messages" element={<MackleTVDonationMessages />} />
              <Route path="/mackletv/obs/:id" element={<MackleTVObsView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
