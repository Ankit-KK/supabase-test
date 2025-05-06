
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  PaymentDetails,
  SuccessStatusDisplay,
  PendingStatusDisplay,
  FailedStatusDisplay,
  UnknownStatusDisplay,
  LoadingDisplay
} from "@/components/payment/PaymentStatusDisplay";
import { verifyPaymentStatus, createDonationRecord, getDonationDataFromStorage } from "@/services/paymentService";

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [databaseEntryCreated, setDatabaseEntryCreated] = useState(false);

  useEffect(() => {
    // Parse URL query parameters
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    
    console.log("Success page loaded with order_id:", orderId);
    
    if (!orderId) {
      // No order ID in URL, check if we have stored data
      const storedData = sessionStorage.getItem('donation_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.orderId) {
          console.log("No order_id in URL, but found in session storage:", parsedData.orderId);
          checkPaymentStatus(parsedData.orderId);
          return;
        }
      }
      
      console.log("No order_id found in URL or session storage");
      setLoading(false);
      setPaymentStatus('unknown');
      return;
    }

    checkPaymentStatus(orderId);
  }, [location]);

  const checkPaymentStatus = async (orderId: string) => {
    setLoading(true);
    
    const result = await verifyPaymentStatus(orderId);
    setPaymentStatus(result.status);
    setPaymentDetails(result.data);
    
    if (result.status !== 'error') {
      try {
        // Get donation details from session storage
        const donationData = getDonationDataFromStorage();
        if (!donationData) {
          toast.error("Missing donation information");
          setLoading(false);
          return;
        }
        
        // Check if this donation has already been processed
        if (donationData.isProcessed) {
          console.log("This donation has already been recorded in the database");
          setDatabaseEntryCreated(true);
          setLoading(false);
          return;
        }
        
        // Create a new record with the final status
        const success = await createDonationRecord(donationData, orderId, result.status);
        setDatabaseEntryCreated(success);
      } catch (err) {
        console.error("Error during database operations:", err);
      }
    }
    
    setLoading(false);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingDisplay />;
    }

    switch (paymentStatus) {
      case 'success':
        return (
          <>
            <SuccessStatusDisplay databaseEntryCreated={databaseEntryCreated} status={paymentStatus} />
            <PaymentDetails paymentDetails={paymentDetails} />
          </>
        );
      
      case 'pending':
        return <PendingStatusDisplay databaseEntryCreated={databaseEntryCreated} status={paymentStatus} />;
      
      case 'failed':
        return <FailedStatusDisplay databaseEntryCreated={databaseEntryCreated} status={paymentStatus} />;
      
      default:
        return <UnknownStatusDisplay />;
    }
  };

  return (
    <div className="container max-w-md py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Payment Status</CardTitle>
          <CardDescription>Your donation to support the streamer</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-hero-gradient hover:opacity-90 transition-opacity"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuccessPage;
