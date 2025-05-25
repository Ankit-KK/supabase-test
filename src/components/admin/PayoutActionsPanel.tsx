
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Download, FileText, Send } from "lucide-react";

const PayoutActionsPanel = () => {
  const [utrNumber, setUtrNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const markPayoutCompleted = async () => {
    if (!utrNumber.trim()) {
      toast({
        title: "UTR Required",
        description: "Please enter a UTR/Transaction ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Payout Completed",
        description: `Payout marked as completed with UTR: ${utrNumber}`,
      });
      setUtrNumber("");
      setIsProcessing(false);
    }, 1500);
  };

  const generateReport = (format: 'csv' | 'excel') => {
    toast({
      title: "Generating Report",
      description: `Preparing ${format.toUpperCase()} report for download...`,
    });
    
    // Simulate report generation
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: `${format.toUpperCase()} report has been downloaded`,
      });
    }, 2000);
  };

  const triggerBulkPayout = () => {
    toast({
      title: "Bulk Payout Initiated",
      description: "Processing payouts for all selected streamers...",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Payout Actions</span>
        </CardTitle>
        <CardDescription>
          Process payouts and generate reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mark Payout Completed */}
        <div className="space-y-3">
          <Label htmlFor="utr" className="text-sm font-medium">
            Mark Payout Completed
          </Label>
          <div className="space-y-2">
            <Input
              id="utr"
              placeholder="Enter UTR/Transaction ID"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
            />
            <Button 
              onClick={markPayoutCompleted}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Completed
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Generate Reports */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Generate Reports</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => generateReport('csv')}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>CSV</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => generateReport('excel')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bulk Actions</Label>
          <Button 
            onClick={triggerBulkPayout}
            variant="outline"
            className="w-full"
          >
            Trigger Bulk Payout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Pending Actions:</span>
            <Badge variant="outline">7</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">This Week:</span>
            <Badge className="bg-blue-100 text-blue-800">₹45,230</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutActionsPanel;
