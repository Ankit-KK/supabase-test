
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { verifyPayment, createDonationRecord } from '@/services/paymentService';

interface DonationData {
  name: string;
  amount: number;
  totalAmount: number;
  message: string;
  orderId: string;
  donationType: 'ankit' | 'harish' | 'mackletv';
  includeGif?: boolean;
  selectedGif?: string | null;
}

const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        // Get status from URL
        const statusFromUrl = searchParams.get('status');
        const orderId = searchParams.get('orderId');

        if (!orderId) {
          setStatus('error');
          toast({
            variant: 'destructive',
            title: 'Missing order information',
            description: 'Unable to verify payment status',
          });
          return;
        }

        // Check if we have donation data in session storage
        const donationDataStr = sessionStorage.getItem('donationData');
        if (!donationDataStr) {
          setStatus('error');
          toast({
            variant: 'destructive',
            title: 'Missing donation information',
            description: 'Unable to complete donation process',
          });
          return;
        }

        // Parse donation data
        const donationData: DonationData = JSON.parse(donationDataStr);
        console.log("Donation data from session:", donationData);

        // If URL status is success, verify with backend
        if (statusFromUrl === 'success') {
          const verificationResult = await verifyPayment(orderId);
          console.log("Payment verification result:", verificationResult);

          if (verificationResult.success) {
            // Create donation record in database
            await createDonationRecord({
              name: donationData.name,
              amount: donationData.amount,
              message: donationData.message || '',
              order_id: donationData.orderId,
              payment_status: 'success',
              donationType: donationData.donationType,
              include_gif: donationData.includeGif || false,
            });

            setStatus('success');
            setPaymentDetails({
              amount: donationData.totalAmount,
              name: donationData.name,
              donationType: donationData.donationType
            });

            toast({
              title: 'Payment successful',
              description: `Thank you for your support!`,
            });
          } else {
            setStatus('error');
            toast({
              variant: 'destructive',
              title: 'Payment verification failed',
              description: verificationResult.message || 'Unable to verify payment',
            });
          }
        } else {
          setStatus('error');
          toast({
            variant: 'destructive',
            title: 'Payment failed',
            description: 'Your payment was not completed successfully',
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        toast({
          variant: 'destructive',
          title: 'Error processing payment',
          description: 'An unexpected error occurred',
        });
      }
    };

    verifyPaymentStatus();
  }, [searchParams, toast, navigate]);

  const handleReturnClick = () => {
    const donationDataStr = sessionStorage.getItem('donationData');
    if (donationDataStr) {
      const donationData: DonationData = JSON.parse(donationDataStr);
      
      if (donationData.donationType === 'ankit') {
        navigate('/ankit');
      } else if (donationData.donationType === 'harish') {
        navigate('/harish');
      } else if (donationData.donationType === 'mackletv') {
        navigate('/mackletv');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }

    // Clean up session storage
    sessionStorage.removeItem('donationData');
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your payment.'}
            {status === 'success' && 'Your donation has been received. Thank you for your support!'}
            {status === 'error' && 'There was an issue processing your payment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          {status === 'success' && paymentDetails && (
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium">
                You donated ₹{paymentDetails.amount}
              </p>
              <p>
                Your generous support will help {
                  paymentDetails.donationType === 'ankit' ? 'Ankit' : 
                  paymentDetails.donationType === 'harish' ? 'Harish' : 'MackleTv'
                } continue creating content.
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center space-y-2">
              <p>
                Your payment could not be processed or was canceled. No charges were made.
              </p>
              <p>
                Please try again or contact support if the issue persists.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturnClick}>
            {status === 'success' ? 'Return to Home' : 'Try Again'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentStatus;
