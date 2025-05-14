
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import DonationExport from "@/components/DonationExport";

const AnkitDonationExport = () => {
  const navigate = useNavigate();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Export Donation Data</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/ankit/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <DonationExport tableName="ankit_donations" streamerName="Ankit" />
    </div>
  );
};

export default AnkitDonationExport;
