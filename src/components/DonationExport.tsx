
import React, { useState } from "react";
import { Calendar as CalendarIcon, Download, FileSpreadsheet } from "lucide-react";
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
import { StreamerTableName } from "@/types/donations";

interface DonationExportProps {
  tableName: StreamerTableName;
  streamerName: string;
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const DonationExport: React.FC<DonationExportProps> = ({ tableName, streamerName }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)) // First day of current month
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const { toast } = useToast();

  const exportToCsv = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Date range required",
        description: "Please select both start and end dates",
      });
      return;
    }

    try {
      setIsExporting(true);

      // Format dates for query
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(new Date(endDate.setHours(23, 59, 59)), "yyyy-MM-dd'T'HH:mm:ss");

      // Query data from Supabase
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
        setExportCount(0);
        return;
      }

      // Process data for CSV
      const csvData = data.map((donation: Donation) => ({
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

      setExportCount(data.length);
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
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Donation Data
        </CardTitle>
        <CardDescription>Download your donation data as a CSV file for any time period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={exportToCsv} 
            disabled={isExporting || !startDate || !endDate}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              "Exporting..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>

          {exportCount !== null && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {exportCount > 0 
                  ? `Last export: ${exportCount} donation${exportCount !== 1 ? 's' : ''} from ${format(startDate!, "MMM d, yyyy")} to ${format(endDate!, "MMM d, yyyy")}`
                  : "No donations found for the selected period"
                }
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Only successful donations will be included in the export</p>
            <p>• Data includes donor name, amount, message, and timestamp</p>
            <p>• File will be saved as: {streamerName.toLowerCase()}_donations_[date_range].csv</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationExport;
