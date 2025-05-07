
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Download, LogOut } from "lucide-react";
import { format } from "date-fns";

interface DonationData {
  id: string;
  name: string;
  amount: number;
  message: string;
  order_id: string;
  created_at: string;
  payment_status: string;
}

const AdminDashboard: React.FC = () => {
  const { user, adminType, signOut, isLoading } = useAuth();
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If auth check is complete and user is not authenticated, redirect to login
    if (!isLoading && !user) {
      navigate("/admin/login");
      return;
    }

    // If authenticated but not an admin, also redirect
    if (!isLoading && user && !adminType) {
      navigate("/");
      return;
    }

    // If authenticated and admin, fetch data
    if (user && adminType) {
      fetchDonations();
    }
  }, [user, adminType, isLoading, navigate]);

  const fetchDonations = async () => {
    setIsTableLoading(true);
    try {
      const tableName = adminType === 'ankit' ? 'ankit_donations' : 'harish_donations';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDonations(data);
        // Calculate total amount
        const total = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        setTotalAmount(total);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const downloadCSV = () => {
    // Convert data to CSV
    const headers = ['Name', 'Amount', 'Message', 'Order ID', 'Date', 'Status'];
    const csvRows = [headers];

    donations.forEach(donation => {
      const row = [
        `"${donation.name}"`,
        donation.amount,
        `"${donation.message.replace(/"/g, '""')}"`,
        donation.order_id,
        format(new Date(donation.created_at), 'yyyy-MM-dd HH:mm:ss'),
        donation.payment_status
      ];
      csvRows.push(row);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${adminType}-donations-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {adminType === 'ankit' ? 'Ankit' : 'Harish'}'s Admin Dashboard
          </h1>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isTableLoading ? '...' : donations.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isTableLoading ? '...' : `₹${totalAmount.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Export Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={downloadCSV} 
                disabled={isTableLoading || donations.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>
              A list of all donations with their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTableLoading ? (
              <div className="text-center py-8">Loading donations...</div>
            ) : donations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="font-medium">{donation.name}</TableCell>
                        <TableCell>₹{parseFloat(donation.amount.toString()).toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{donation.message}</TableCell>
                        <TableCell>{donation.order_id}</TableCell>
                        <TableCell>{format(new Date(donation.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            donation.payment_status === 'successful' ? 'bg-green-100 text-green-800' : 
                            donation.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {donation.payment_status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">No donations found.</div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
