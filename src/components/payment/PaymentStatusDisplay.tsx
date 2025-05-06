
import React from "react";
import { Check } from "lucide-react";

interface PaymentDetailsProps {
  paymentDetails: any;
}

export const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentDetails }) => {
  if (!paymentDetails) return null;
  
  return (
    <div className="border rounded-md p-4 mt-4">
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div className="text-muted-foreground">Amount</div>
        <div className="font-medium">₹{paymentDetails.order_amount}</div>
        
        <div className="text-muted-foreground">Order ID</div>
        <div className="font-medium text-xs">{paymentDetails.order_id}</div>
        
        <div className="text-muted-foreground">Transaction Time</div>
        <div className="font-medium">{new Date(paymentDetails.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
};

interface PaymentStatusIndicatorProps {
  status: string | null;
  databaseEntryCreated: boolean;
}

export const SuccessStatusDisplay: React.FC<PaymentStatusIndicatorProps> = ({ databaseEntryCreated }) => {
  return (
    <div className="flex flex-col items-center my-6">
      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <Check className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-green-600">Payment Successful!</h3>
      <p className="text-muted-foreground mt-2">Thank you for supporting your favorite streamer</p>
      {databaseEntryCreated && (
        <p className="text-sm text-green-600 mt-2">Your donation has been recorded</p>
      )}
    </div>
  );
};

export const PendingStatusDisplay: React.FC<PaymentStatusIndicatorProps> = ({ databaseEntryCreated }) => {
  return (
    <div className="text-center py-6">
      <h3 className="text-xl font-semibold text-amber-600">Payment Pending</h3>
      <p className="text-muted-foreground mt-2">Your payment is being processed. Please check back later.</p>
      {databaseEntryCreated && (
        <p className="text-sm text-amber-600 mt-2">Your pending donation has been recorded</p>
      )}
    </div>
  );
};

export const FailedStatusDisplay: React.FC<PaymentStatusIndicatorProps> = ({ databaseEntryCreated }) => {
  return (
    <div className="text-center py-6">
      <h3 className="text-xl font-semibold text-red-600">Payment Failed</h3>
      <p className="text-muted-foreground mt-2">There was an issue with your payment. Please try again.</p>
      {databaseEntryCreated && (
        <p className="text-sm text-red-600 mt-2">The failed payment has been recorded</p>
      )}
    </div>
  );
};

export const UnknownStatusDisplay: React.FC = () => {
  return (
    <div className="text-center py-6">
      <h3 className="text-xl font-semibold">Payment Information Unavailable</h3>
      <p className="text-muted-foreground mt-2">We couldn't find any payment information. Please return to the donation page.</p>
    </div>
  );
};

export const LoadingDisplay: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
      <p className="text-muted-foreground">Verifying your payment...</p>
    </div>
  );
};
