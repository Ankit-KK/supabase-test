
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, DollarSign, User } from "lucide-react";

interface Alert {
  id: string;
  type: "high_donation" | "missing_payout" | "overdue_payout";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

const AlertsPanel = () => {
  const alerts: Alert[] = [
    {
      id: "1",
      type: "high_donation",
      title: "High Value Donation",
      description: "₹5,000 donation received from Anonymous - Verify authenticity",
      severity: "high",
      timestamp: "2 minutes ago"
    },
    {
      id: "2",
      type: "missing_payout",
      title: "Missing Payout Info",
      description: "Chiaa Gaming has no payout method configured",
      severity: "medium",
      timestamp: "1 hour ago"
    },
    {
      id: "3",
      type: "overdue_payout",
      title: "Overdue Payout",
      description: "Mackle's payout is 8 days overdue",
      severity: "high",
      timestamp: "3 hours ago"
    }
  ];

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case "high_donation":
        return <DollarSign className="h-4 w-4" />;
      case "missing_payout":
        return <User className="h-4 w-4" />;
      case "overdue_payout":
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: Alert['severity']) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-orange-500 bg-orange-50";
      case "low":
        return "border-l-yellow-500 bg-yellow-50";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span>Alerts & Flags</span>
        </CardTitle>
        <CardDescription>
          System notifications and warnings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-l-4 rounded-r-md ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        {alert.title}
                      </p>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-xs text-slate-600">
                      {alert.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {alert.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-6 text-slate-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            View All Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
