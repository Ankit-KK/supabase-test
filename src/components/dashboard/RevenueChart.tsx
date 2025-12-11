import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertToINR } from '@/constants/currencies';

interface RevenueChartProps {
  streamerId: string;
  tableName: string;
  brandColor?: string;
}

interface ChartData {
  date: string;
  revenue: number;
  donations: number;
  displayDate: string;
}

interface DonationRecord {
  amount: number;
  currency?: string;
  created_at: string;
  payment_status: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  streamerId,
  tableName,
  brandColor = '#3b82f6'
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('7days');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!streamerId) return;

      setLoading(true);
      try {
        const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
        const startDate = subDays(new Date(), days);

        const { data: donations, error } = await supabase
          .from(tableName as any)
          .select('amount, currency, created_at, payment_status')
          .eq('streamer_id', streamerId)
          .eq('payment_status', 'success')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;

        // Group donations by day
        const revenueByDay = new Map<string, { revenue: number; donations: number }>();
        
        // Initialize all days in range with 0
        for (let i = days - 1; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateKey = format(date, 'yyyy-MM-dd');
          revenueByDay.set(dateKey, { revenue: 0, donations: 0 });
        }

        // Populate with actual data (convert to INR)
        donations?.forEach(donation => {
          const dateKey = format(new Date(donation.created_at), 'yyyy-MM-dd');
          const existing = revenueByDay.get(dateKey) || { revenue: 0, donations: 0 };
          const amount = parseFloat(donation.amount.toString()) || 0;
          const amountInINR = convertToINR(amount, donation.currency || 'INR');
          
          revenueByDay.set(dateKey, {
            revenue: existing.revenue + amountInINR,
            donations: existing.donations + 1
          });
        });

        // Convert to chart data
        const chartData: ChartData[] = Array.from(revenueByDay.entries()).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          donations: data.donations,
          displayDate: format(new Date(date), days <= 7 ? 'EEE' : 'MMM dd')
        }));

        setChartData(chartData);
        
        // Calculate totals
        const totals = chartData.reduce(
          (acc, day) => ({
            revenue: acc.revenue + day.revenue,
            donations: acc.donations + day.donations
          }),
          { revenue: 0, donations: 0 }
        );
        
        setTotalRevenue(totals.revenue);
        setTotalDonations(totals.donations);

      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [streamerId, tableName, timeRange]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'revenue') {
      return [`₹${value.toFixed(2)}`, 'Revenue'];
    }
    return [value, 'Donations'];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Revenue Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Revenue Analytics</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={timeRange === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7days')}
            >
              7D
            </Button>
            <Button
              variant={timeRange === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30days')}
            >
              30D
            </Button>
            <Button
              variant={timeRange === '90days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90days')}
            >
              90D
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Last {timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : '90'} days</span>
          </div>
          <div>
            <span className="font-medium">₹{totalRevenue.toFixed(2)}</span> from {totalDonations} donations
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={brandColor}
                strokeWidth={2}
                dot={{ fill: brandColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: brandColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Average Daily</p>
              <p className="font-medium">
                ₹{chartData.length ? (totalRevenue / chartData.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Day</p>
              <p className="font-medium">
                ₹{chartData.length ? Math.max(...chartData.map(d => d.revenue)).toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className="font-medium text-green-600">
                {chartData.length >= 2 ? (
                  chartData[chartData.length - 1].revenue > chartData[0].revenue ? '↗ Up' : '↘ Down'
                ) : '-'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;