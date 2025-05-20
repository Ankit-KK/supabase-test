
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import DonationExport from "@/components/DonationExport";

const RakazoneDonationExport = () => {
  const navigate = useNavigate();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/rakazone/login",
    authKey: "rakazoneAuth"
  });

  return (
    <div className="container mx-auto py-8 px-4"
      style={{
        background: "linear-gradient(rgba(30, 0, 0, 0.95), rgba(30, 0, 0, 0.95))",
        minHeight: "100vh",
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/495326f5-a1c6-47a4-9e68-39f8372910a9.png" 
            alt="Rakazone Gaming" 
            className="h-12 w-12"
          />
          <h1 className="text-3xl font-bold text-red-500">Export Donation Data</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/rakazone/dashboard")} className="border-red-500/30 hover:bg-red-900/20">
            Back to Dashboard
          </Button>
        </div>
      </div>

      <DonationExport tableName="rakazone_donations" streamerName="Rakazone" />
    </div>
  );
};

export default RakazoneDonationExport;
