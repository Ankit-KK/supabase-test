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
import HarishPage from "./pages/Harish";
import MacklePage from "./pages/Mackle";
import RakazonePage from "./pages/Rakazone";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentStatus from "./pages/PaymentStatus";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import AnkitDonationMessages from "./pages/AnkitDonationMessages";
import AnkitObsView from "./pages/AnkitObsView";
import HarishObsView from "./pages/HarishObsView";
import HarishDonationMessages from "./pages/HarishDonationMessages";
import HarishDashboard from "./pages/HarishDashboard";
import HarishLogin from "./pages/HarishLogin";
import MackleLogin from "./pages/MackleLogin";
import MackleDashboard from "./pages/MackleDashboard";
import MackleDonationMessages from "./pages/MackleDonationMessages";
import MackleObsView from "./pages/MackleObsView";
import AnkitDonationExport from "./pages/AnkitDonationExport";
import HarishDonationExport from "./pages/HarishDonationExport";
import MackleDonationExport from "./pages/MackleDonationExport";
import RakazoneLogin from "./pages/RakazoneLogin";
import RakazoneDashboard from "./pages/RakazoneDashboard";
import RakazoneDonationMessages from "./pages/RakazoneDonationMessages";
import RakazoneDonationExport from "./pages/RakazoneDonationExport";
import RakazoneObsView from "./pages/RakazoneObsView";
import ReckoningEsports from "./pages/ReckoningEsports";
import ChiaaGaming from "./pages/ChiaaGaming";
import ChiaaGamingLogin from "./pages/ChiaaGamingLogin";
import ChiaaGamingDashboard from "./pages/ChiaaGamingDashboard";
import ChiaaGamingDonationMessages from "./pages/ChiaaGamingDonationMessages";
import ChiaaGamingObsView from "./pages/ChiaaGamingObsView";
import ChiaaGamingDonationExport from "./pages/ChiaaGamingDonationExport";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
// Gaming showcase pages
import CyberStriker from "./pages/CyberStriker";
import MysticRealm from "./pages/MysticRealm";
import RetroArcade from "./pages/RetroArcade";
import SpaceCommand from "./pages/SpaceCommand";
import BattleArena from "./pages/BattleArena";
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
              
              {/* Gaming showcase pages */}
              <Route path="/cyber-striker" element={<CyberStriker />} />
              <Route path="/mystic-realm" element={<MysticRealm />} />
              <Route path="/retro-arcade" element={<RetroArcade />} />
              <Route path="/space-command" element={<SpaceCommand />} />
              <Route path="/battle-arena" element={<BattleArena />} />
              
              {/* Existing streamer pages */}
              <Route path="/ankit" element={<AnkitPage />} />
              <Route path="/harish" element={<HarishPage />} />
              <Route path="/mackle" element={<MacklePage />} />
              <Route path="/rakazone" element={<RakazonePage />} />
              <Route path="/payment-checkout" element={<PaymentCheckout />} />
              <Route path="/status" element={<PaymentStatus />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/ankit/login" element={<AnkitLogin />} />
              <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
              <Route path="/ankit/messages" element={<AnkitDonationMessages />} />
              <Route path="/ankit/export" element={<AnkitDonationExport />} />
              <Route path="/ankit/obs/:id" element={<AnkitObsView />} />
              <Route path="/harish/obs/:id" element={<HarishObsView />} />
              <Route path="/harish/messages" element={<HarishDonationMessages />} />
              <Route path="/harish/export" element={<HarishDonationExport />} />
              <Route path="/harish/dashboard" element={<HarishDashboard />} />
              <Route path="/harish/login" element={<HarishLogin />} />
              <Route path="/mackle/login" element={<MackleLogin />} />
              <Route path="/mackle/dashboard" element={<MackleDashboard />} />
              <Route path="/mackle/messages" element={<MackleDonationMessages />} />
              <Route path="/mackle/export" element={<MackleDonationExport />} />
              <Route path="/mackle/obs/:id" element={<MackleObsView />} />
              <Route path="/rakazone/login" element={<RakazoneLogin />} />
              <Route path="/rakazone/dashboard" element={<RakazoneDashboard />} />
              <Route path="/rakazone/messages" element={<RakazoneDonationMessages />} />
              <Route path="/rakazone/export" element={<RakazoneDonationExport />} />
              <Route path="/rakazone/obs/:id" element={<RakazoneObsView />} />
              <Route path="/reckoningesports" element={<ReckoningEsports />} />
              {/* Chiaa Gaming Routes */}
              <Route path="/chiaa-gaming" element={<ChiaaGaming />} />
              <Route path="/chiaa-gaming/login" element={<ChiaaGamingLogin />} />
              <Route path="/chiaa-gaming/dashboard" element={<ChiaaGamingDashboard />} />
              <Route path="/chiaa-gaming/messages" element={<ChiaaGamingDonationMessages />} />
              <Route path="/chiaa-gaming/obs/:id" element={<ChiaaGamingObsView />} />
              <Route path="/chiaa-gaming/export" element={<ChiaaGamingDonationExport />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
