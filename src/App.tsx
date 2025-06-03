
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ObsConfigProvider } from "./contexts/ObsConfigContext";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefunds from "./pages/CancellationRefunds";
import Shipping from "./pages/Shipping";
import DemoPaymentFlow from "./pages/DemoPaymentFlow";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentStatus from "./pages/PaymentStatus";
import NotFound from "./pages/NotFound";
import ReckoningEsports from "./pages/ReckoningEsports";

// Streamer pages
import Ankit from "./pages/Ankit";
import AnkitLogin from "./pages/AnkitLogin";
import AnkitDashboard from "./pages/AnkitDashboard";
import AnkitObsView from "./pages/AnkitObsView";
import AnkitDonationMessages from "./pages/AnkitDonationMessages";
import AnkitDonationExport from "./pages/AnkitDonationExport";

import Harish from "./pages/Harish";
import HarishLogin from "./pages/HarishLogin";
import HarishDashboard from "./pages/HarishDashboard";
import HarishObsView from "./pages/HarishObsView";
import HarishDonationMessages from "./pages/HarishDonationMessages";
import HarishDonationExport from "./pages/HarishDonationExport";

import Mackle from "./pages/Mackle";
import MackleLogin from "./pages/MackleLogin";
import MackleDashboard from "./pages/MackleDashboard";
import MackleObsView from "./pages/MackleObsView";
import MackleDonationMessages from "./pages/MackleDonationMessages";
import MackleDonationExport from "./pages/MackleDonationExport";

import Rakazone from "./pages/Rakazone";
import RakazoneLogin from "./pages/RakazoneLogin";
import RakazoneDashboard from "./pages/RakazoneDashboard";
import RakazoneObsView from "./pages/RakazoneObsView";
import RakazoneDonationMessages from "./pages/RakazoneDonationMessages";
import RakazoneDonationExport from "./pages/RakazoneDonationExport";

import ChiaaGaming from "./pages/ChiaaGaming";
import ChiaaGamingLogin from "./pages/ChiaaGamingLogin";
import ChiaaGamingDashboard from "./pages/ChiaaGamingDashboard";
import ChiaaGamingObsView from "./pages/ChiaaGamingObsView";
import ChiaaGamingDonationMessages from "./pages/ChiaaGamingDonationMessages";
import ChiaaGamingDonationExport from "./pages/ChiaaGamingDonationExport";

// Gaming showcase pages
import CyberStriker from "./pages/CyberStriker";
import CyberStrikerDashboard from "./pages/CyberStrikerDashboard";
import MysticRealm from "./pages/MysticRealm";
import MysticRealmDashboard from "./pages/MysticRealmDashboard";
import RetroArcade from "./pages/RetroArcade";
import RetroArcadeDashboard from "./pages/RetroArcadeDashboard";
import SpaceCommand from "./pages/SpaceCommand";
import SpaceCommandDashboard from "./pages/SpaceCommandDashboard";
import BattleArena from "./pages/BattleArena";
import BattleArenaDashboard from "./pages/BattleArenaDashboard";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Blog pages
import UpiSecurityBestPractices from "./pages/blog/UpiSecurityBestPractices";
import BestUpiTippingPlatforms from "./pages/blog/BestUpiTippingPlatforms";
import CompleteGuideMonetizeContentIndia from "./pages/blog/CompleteGuideMonetizeContentIndia";
import EarnMoneyStreamingIndia from "./pages/blog/EarnMoneyStreamingIndia";
import FanEngagementTools2025 from "./pages/blog/FanEngagementTools2025";
import StreamerDonationAppStrategy from "./pages/blog/StreamerDonationAppStrategy";
import VirtualGiftsMaximizeRevenue from "./pages/blog/VirtualGiftsMaximizeRevenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ObsConfigProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
            <Route path="/shipping-delivery" element={<Shipping />} />
            <Route path="/demo-payment-flow" element={<DemoPaymentFlow />} />
            <Route path="/payment-checkout" element={<PaymentCheckout />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/reckoning-esports" element={<ReckoningEsports />} />

            {/* Ankit routes */}
            <Route path="/ankit" element={<Ankit />} />
            <Route path="/ankit/login" element={<AnkitLogin />} />
            <Route path="/ankit/dashboard" element={<AnkitDashboard />} />
            <Route path="/ankit/obs" element={<AnkitObsView />} />
            <Route path="/ankit/messages" element={<AnkitDonationMessages />} />
            <Route path="/ankit/export" element={<AnkitDonationExport />} />

            {/* Harish routes */}
            <Route path="/harish" element={<Harish />} />
            <Route path="/harish/login" element={<HarishLogin />} />
            <Route path="/harish/dashboard" element={<HarishDashboard />} />
            <Route path="/harish/obs" element={<HarishObsView />} />
            <Route path="/harish/messages" element={<HarishDonationMessages />} />
            <Route path="/harish/export" element={<HarishDonationExport />} />

            {/* Mackle routes */}
            <Route path="/mackle" element={<Mackle />} />
            <Route path="/mackle/login" element={<MackleLogin />} />
            <Route path="/mackle/dashboard" element={<MackleDashboard />} />
            <Route path="/mackle/obs" element={<MackleObsView />} />
            <Route path="/mackle/messages" element={<MackleDonationMessages />} />
            <Route path="/mackle/export" element={<MackleDonationExport />} />

            {/* Rakazone routes */}
            <Route path="/rakazone" element={<Rakazone />} />
            <Route path="/rakazone/login" element={<RakazoneLogin />} />
            <Route path="/rakazone/dashboard" element={<RakazoneDashboard />} />
            <Route path="/rakazone/obs" element={<RakazoneObsView />} />
            <Route path="/rakazone/messages" element={<RakazoneDonationMessages />} />
            <Route path="/rakazone/export" element={<RakazoneDonationExport />} />

            {/* ChiaaGaming routes */}
            <Route path="/chiaa-gaming" element={<ChiaaGaming />} />
            <Route path="/chiaa-gaming/login" element={<ChiaaGamingLogin />} />
            <Route path="/chiaa-gaming/dashboard" element={<ChiaaGamingDashboard />} />
            <Route path="/chiaa-gaming/obs" element={<ChiaaGamingObsView />} />
            <Route path="/chiaa-gaming/messages" element={<ChiaaGamingDonationMessages />} />
            <Route path="/chiaa-gaming/export" element={<ChiaaGamingDonationExport />} />

            {/* Gaming showcase routes */}
            <Route path="/cyber-striker" element={<CyberStriker />} />
            <Route path="/cyber-striker/dashboard" element={<CyberStrikerDashboard />} />
            <Route path="/mystic-realm" element={<MysticRealm />} />
            <Route path="/mystic-realm/dashboard" element={<MysticRealmDashboard />} />
            <Route path="/retro-arcade" element={<RetroArcade />} />
            <Route path="/retro-arcade/dashboard" element={<RetroArcadeDashboard />} />
            <Route path="/space-command" element={<SpaceCommand />} />
            <Route path="/space-command/dashboard" element={<SpaceCommandDashboard />} />
            <Route path="/battle-arena" element={<BattleArena />} />
            <Route path="/battle-arena/dashboard" element={<BattleArenaDashboard />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Blog routes */}
            <Route path="/blog/upi-security-best-practices" element={<UpiSecurityBestPractices />} />
            <Route path="/blog/best-upi-tipping-platforms" element={<BestUpiTippingPlatforms />} />
            <Route path="/blog/complete-guide-monetize-content-india" element={<CompleteGuideMonetizeContentIndia />} />
            <Route path="/blog/earn-money-streaming-india" element={<EarnMoneyStreamingIndia />} />
            <Route path="/blog/fan-engagement-tools-2025" element={<FanEngagementTools2025 />} />
            <Route path="/blog/streamer-donation-app-strategy" element={<StreamerDonationAppStrategy />} />
            <Route path="/blog/virtual-gifts-maximize-revenue" element={<VirtualGiftsMaximizeRevenue />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ObsConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
