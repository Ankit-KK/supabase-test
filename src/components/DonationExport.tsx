
import React, { useState } from "react";
import { Calendar as CalendarIcon, FileText, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { objectsToCSV, downloadCSV, formatDateForFilename } from "@/utils/csvExport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DonationExportProps {
  tableName: "ankit_donations" | "harish_donations" | "mackle_donations" | "rakazone_donations" | "chiaa_gaming_donations" | "cyber_striker_donations" | "mystic_realm_donations" | "retro_arcade_donations" | "space_command_donations" | "battle_arena_donations";
  streamerName: string;
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  order_id: string;
  include_gif?: boolean;
}

const DonationExport: React.FC<DonationExportProps> = ({ tableName, streamerName }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)) // First day of current month
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [donationData, setDonationData] = useState<Donation[]>([]);
  const { toast } = useToast();

  const fetchDonationData = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Date range required",
        description: "Please select both start and end dates",
      });
      return null;
    }

    try {
      setIsLoading(true);

      // Format dates for query
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(new Date(endDate.setHours(23, 59, 59)), "yyyy-MM-dd'T'HH:mm:ss");

      // Query data from Supabase with proper typing
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("payment_status", "success")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "No data found",
          description: "No donation data available for the selected period",
        });
        setDonationData([]);
        return null;
      }

      // Set the donation data
      setDonationData(data as Donation[]);
      return data as Donation[];
    } catch (error) {
      console.error("Data fetch error:", error);
      toast({
        variant: "destructive",
        title: "Data fetch failed",
        description: "An error occurred while fetching the data",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = async () => {
    try {
      setIsExporting(true);
      
      // Use the already fetched data or fetch it if not available
      const data = donationData.length > 0 ? donationData : await fetchDonationData();
      
      if (!data) {
        setIsExporting(false);
        return;
      }

      // Process data for CSV with proper typing
      const csvData = data.map((donation) => ({
        Date: format(new Date(donation.created_at), "yyyy-MM-dd HH:mm:ss"),
        Name: donation.name,
        Amount: donation.amount,
        Message: donation.message,
        Status: donation.payment_status
      }));

      // Create and download CSV
      const csvString = objectsToCSV(csvData, {
        Date: "Date",
        Name: "Donor Name",
        Amount: "Amount (₹)",
        Message: "Message",
        Status: "Payment Status"
      });

      const fileName = `${streamerName.toLowerCase()}_donations_${formatDateForFilename(startDate.toISOString())}_to_${formatDateForFilename(endDate.toISOString())}.csv`;
      downloadCSV(csvString, fileName);

      toast({
        title: "Export successful",
        description: `${data.length} donations exported to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "An error occurred while exporting the data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Donation Data</CardTitle>
        <CardDescription>Download donation data as CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < (startDate || new Date(0))}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1" 
              onClick={fetchDonationData} 
              disabled={isLoading || !startDate || !endDate}
              variant="outline"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  View Data
                </>
              )}
            </Button>
            <Button 
              className="flex-1" 
              onClick={exportToCsv} 
              disabled={isExporting || !startDate || !endDate}
            >
              {isExporting ? (
                "Exporting..."
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to CSV
                </>
              )}
            </Button>
          </div>

          {donationData.length > 0 && (
            <div className="mt-6 border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donationData.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{format(new Date(donation.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                      <TableCell>{donation.name}</TableCell>
                      <TableCell>{donation.amount}</TableCell>
                      <TableCell className="max-w-md truncate" title={donation.message}>
                        {donation.message.length > 50 ? `${donation.message.substring(0, 50)}...` : donation.message}
                      </TableCell>
                      <TableCell>{donation.payment_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 bg-muted">
                <p className="text-sm text-muted-foreground">
                  Showing {donationData.length} donation{donationData.length !== 1 ? 's' : ''} from {format(startDate!, "MMM d, yyyy")} to {format(endDate!, "MMM d, yyyy")}
                </p>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>This will export all successful donation data for the selected period.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationExport;
