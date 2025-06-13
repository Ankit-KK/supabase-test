
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { objectsToCSV, downloadCSV, formatDateForFilename } from "@/utils/csvExport";

interface CSVExportDialogProps {
  tableName: string;
  title?: string;
}

const CSVExportDialog = ({ tableName, title = "Export Data" }: CSVExportDialogProps) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let query = supabase
        .from(tableName)
        .select("*")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });

      // Apply date filters if provided
      if (dateFrom) {
        const fromString = format(dateFrom, 'yyyy-MM-dd') + 'T00:00:00';
        query = query.gte("created_at", fromString);
      }
      
      if (dateTo) {
        const toString = format(dateTo, 'yyyy-MM-dd') + 'T23:59:59';
        query = query.lte("created_at", toString);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "No data found",
          description: "No donations found for the selected time period",
        });
        return;
      }

      // Format the data for CSV
      const formattedData = data.map(donation => ({
        Name: donation.name,
        Amount: `₹${Number(donation.amount).toLocaleString()}`,
        Message: donation.message || '',
        Date: format(new Date(donation.created_at), 'dd/MM/yyyy'),
        Time: format(new Date(donation.created_at), 'HH:mm:ss'),
      }));

      // Generate CSV
      const csvData = objectsToCSV(formattedData);
      
      // Generate filename
      const dateRange = dateFrom && dateTo 
        ? `${formatDateForFilename(dateFrom.toISOString())}_to_${formatDateForFilename(dateTo.toISOString())}`
        : dateFrom 
          ? `from_${formatDateForFilename(dateFrom.toISOString())}`
          : dateTo 
            ? `until_${formatDateForFilename(dateTo.toISOString())}`
            : formatDateForFilename();
      
      const filename = `${tableName}_donations_${dateRange}.csv`;
      
      // Download CSV
      downloadCSV(csvData, filename);
      
      toast({
        title: "Export successful",
        description: `Downloaded ${data.length} donations to ${filename}`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select a date range to export donation data to CSV format
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Leave dates empty to export all data</p>
            <p>• Only successful donations will be exported</p>
            <p>• Data includes: Name, Amount, Message, Date, and Time</p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVExportDialog;
