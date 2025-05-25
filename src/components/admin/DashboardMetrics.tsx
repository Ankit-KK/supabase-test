
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Clock, TrendingUp } from "lucide-react";

interface DashboardData {
  totalDonationsThisWeek: number;
  totalAmountToBePaid: number;
  pendingPayouts: number;
  lastPayoutProcessed: string;
}

interface DashboardMetricsProps {
  data: DashboardData;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ data }) => {
  const metrics = [
    {
      title: "Total Donations This Week",
      value: data.totalDonationsThisWeek.toString(),
      description: "Saturday to Friday",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Amount to Be Paid",
      value: `₹${data.totalAmountToBePaid.toLocaleString()}`,
      description: "Pending payouts",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Payouts",
      value: data.pendingPayouts.toString(),
      description: "Streamers awaiting payment",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Last Payout Batch",
      value: data.lastPayoutProcessed,
      description: "Most recent processing",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {metric.title}
              </CardTitle>
              <div className={`${metric.bgColor} p-2 rounded-md`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
              <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardMetrics;
