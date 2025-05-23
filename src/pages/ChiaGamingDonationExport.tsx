
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DonationExport from "@/components/DonationExport";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Heart, ArrowLeft, Sparkles } from "lucide-react";

const ChiaGamingDonationExport = () => {
  useAuthProtection("chia_gaming");
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fdf2f8 100%)
        `
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate("/chia_gaming/dashboard")}
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Heart className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Export Love Data
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>

        {/* Export Component */}
        <DonationExport 
          tableName="chia_gaming_donations"
          streamerName="Chia Gaming"
          themeColor="pink"
        />
      </div>
    </div>
  );
};

export default ChiaGamingDonationExport;
