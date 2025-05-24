import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isStreamerAuthenticated } from "@/services/streamerAuth";
import { objectsToCSV, downloadCSV } from "@/utils/csvExport";
import { Heart, Download, Calendar, ArrowLeft, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  include_sound: boolean;
  created_at: string;
  payment_status: string;
}

const ChiaaGamingDonationExport = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isStreamerAuthenticated("chiaa_gaming")) {
      navigate("/chiaa-gaming/login");
      return;
    }

    fetchDonations();
  }, [navigate]);

  useEffect(() => {
    filterDonations();
  }, [donations, dateRange]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("*")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = [...donations];

    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(donation => 
        new Date(donation.created_at) >= startDate
      );
    }

    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(donation => 
        new Date(donation.created_at) <= endDate
      );
    }

    setFilteredDonations(filtered);
  };

  const handleExport = async () => {
    if (filteredDonations.length === 0) {
      toast({
        title: "No Data",
        description: "No donations found for the selected date range",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const csvData = filteredDonations.map(donation => ({
        Name: donation.name,
        Amount: donation.amount,
        Message: donation.message,
        "Include Sound": donation.include_sound ? "Yes" : "No",
        "Date": format(new Date(donation.created_at), "yyyy-MM-dd HH:mm:ss"),
        "Payment Status": donation.payment_status,
      }));

      const dateRangeStr = dateRange.startDate && dateRange.endDate 
        ? `_${dateRange.startDate}_to_${dateRange.endDate}`
        : dateRange.startDate 
        ? `_from_${dateRange.startDate}`
        : dateRange.endDate 
        ? `_until_${dateRange.endDate}`
        : "";

      const filename = `chiaa_gaming_donations${dateRangeStr}.csv`;
      
      const csvString = objectsToCSV(csvData);
      downloadCSV(csvString, filename);
      
      toast({
        title: "Export Successful! 💖",
        description: `Exported ${filteredDonations.length} donations to ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setDateRange({ startDate: "", endDate: "" });
  };

  const calculateStats = () => {
    const totalAmount = filteredDonations.reduce((sum, donation) => sum + Number(donation.amount), 0);
    const avgAmount = filteredDonations.length > 0 ? totalAmount / filteredDonations.length : 0;
    const soundDonations = filteredDonations.filter(d => d.include_sound).length;
    
    return {
      totalAmount,
      avgAmount,
      totalCount: filteredDonations.length,
      soundDonations,
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Export Donations
              </h1>
              <p className="text-pink-700">Download your donation data for analysis 💖</p>
            </div>
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          </div>
          
          <Button
            onClick={() => navigate("/chiaa-gaming/dashboard")}
            variant="outline"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <Calendar className="h-5 w-5" />
              <span>Filter by Date Range</span>
            </CardTitle>
            <CardDescription className="text-pink-600">
              Select a date range to filter donations for export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-pink-800">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border-pink-300 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-pink-800">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="border-pink-300 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
            </div>
            <Button 
              onClick={resetFilters} 
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-pink-700">Total Amount</p>
                <p className="text-xl font-bold text-pink-900">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-purple-700">Total Count</p>
                <p className="text-xl font-bold text-purple-900">{stats.totalCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-pink-700">Average Amount</p>
                <p className="text-xl font-bold text-pink-900">₹{stats.avgAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-purple-700">With Sound</p>
                <p className="text-xl font-bold text-purple-900">{stats.soundDonations}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <FileText className="h-5 w-5" />
              <span>Export Data</span>
            </CardTitle>
            <CardDescription className="text-pink-600">
              {filteredDonations.length} donations ready for export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-pink-800 mb-2">Export includes:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Donor names and amounts</li>
                  <li>• Complete donation messages</li>
                  <li>• Sound notification preferences</li>
                  <li>• Timestamps and payment status</li>
                  <li>• CSV format for easy analysis</li>
                </ul>
              </div>

              <Button 
                onClick={handleExport}
                disabled={isExporting || filteredDonations.length === 0}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 text-lg shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105"
              >
                {isExporting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Export to CSV</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChiaaGamingDonationExport;
