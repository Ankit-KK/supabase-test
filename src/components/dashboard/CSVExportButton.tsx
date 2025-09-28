import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { objectsToCSV, downloadCSV, formatDateForFilename } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';

interface CSVExportButtonProps {
  streamerId: string;
  tableName: string;
  streamerName: string;
}

interface DonationExportData {
  name: string;
  amount: number;
  payment_status: string;
  created_at: string;
  order_id: string | null;
}

const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  streamerId,
  tableName,
  streamerName
}) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    // Limit to maximum 1 year range
    const maxDate = subDays(startDate, -365);
    if (endDate > maxDate) {
      toast({
        title: "Date Range Too Large",
        description: "Maximum date range is 1 year. Please select a smaller range.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fetch donations data within date range with only successful payments
      const { data: donations, error } = await supabase
        .from(tableName as any)
        .select('name, amount, payment_status, created_at, order_id')
        .eq('streamer_id', streamerId)
        .eq('payment_status', 'success')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false }) as { data: DonationExportData[] | null, error: any };

      if (error) throw error;

      if (!donations || donations.length === 0) {
        toast({
          title: "No Data Found",
          description: "No successful donations found in the selected date range.",
          variant: "destructive",
        });
        return;
      }

      // Format data for CSV with proper headers
      const csvData = donations.map(donation => ({
        'Donor Name': donation.name,
        'Amount (₹)': donation.amount,
        'Payment Status': donation.payment_status,
        'Date/Time of Donation': format(new Date(donation.created_at), 'dd/MM/yyyy HH:mm:ss'),
        'Order/Transaction ID': donation.order_id || 'N/A'
      }));

      // Generate CSV content
      const headers = {
        'Donor Name': 'Donor Name',
        'Amount (₹)': 'Amount (₹)',
        'Payment Status': 'Payment Status',
        'Date/Time of Donation': 'Date/Time of Donation',
        'Order/Transaction ID': 'Order/Transaction ID'
      };

      const csvContent = objectsToCSV(csvData, headers);

      // Generate filename with date range
      const startDateStr = formatDateForFilename(startDate.toISOString());
      const endDateStr = formatDateForFilename(endDate.toISOString());
      const filename = `${streamerName.toLowerCase().replace(/\s+/g, '_')}_donations_${startDateStr}_to_${endDateStr}.csv`;

      // Download the file
      downloadCSV(csvContent, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${donations.length} donation records.`,
      });

      setOpen(false);

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Donations to CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date || new Date());
                            setStartDateOpen(false);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date || new Date());
                            setEndDateOpen(false);
                          }}
                          disabled={(date) => date > new Date() || date < startDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• Only successful payments will be exported</p>
                  <p>• Maximum date range: 1 year</p>
                  <p>• Default range: Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVExportButton;