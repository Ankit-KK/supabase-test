
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Edit, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";

interface PayoutMethod {
  streamer_name: string;
  method_type: "UPI" | "Bank Transfer" | "Wallet";
  details: string;
  status: "valid" | "invalid" | "missing";
  last_updated: string;
}

const PayoutMethodManagement = () => {
  const [methods, setMethods] = useState<PayoutMethod[]>([
    {
      streamer_name: "Ankit",
      method_type: "UPI",
      details: "ankit@paytm",
      status: "valid",
      last_updated: "2024-01-15"
    },
    {
      streamer_name: "Harish",
      method_type: "Bank Transfer",
      details: "****1234 - HDFC Bank",
      status: "valid",
      last_updated: "2024-01-10"
    },
    {
      streamer_name: "Mackle",
      method_type: "UPI",
      details: "mackle@gpay",
      status: "invalid",
      last_updated: "2023-12-20"
    },
    {
      streamer_name: "Rakazone",
      method_type: "UPI",
      details: "rakazone@phonepe",
      status: "valid",
      last_updated: "2024-01-12"
    },
    {
      streamer_name: "Chiaa Gaming",
      method_type: "Bank Transfer",
      details: "",
      status: "missing",
      last_updated: "Never"
    }
  ]);

  const [editingStreamer, setEditingStreamer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const getStatusBadge = (status: PayoutMethod['status']) => {
    switch (status) {
      case "valid":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Valid</span>
          </Badge>
        );
      case "invalid":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Invalid</span>
          </Badge>
        );
      case "missing":
        return (
          <Badge className="bg-orange-100 text-orange-800 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Missing</span>
          </Badge>
        );
    }
  };

  const startEditing = (streamer: string, currentValue: string) => {
    setEditingStreamer(streamer);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingStreamer) return;

    setMethods(prev => prev.map(method => 
      method.streamer_name === editingStreamer 
        ? { 
            ...method, 
            details: editValue, 
            status: editValue.trim() ? "valid" : "missing",
            last_updated: new Date().toISOString().split('T')[0]
          }
        : method
    ));

    toast({
      title: "Updated Successfully",
      description: `Payout method updated for ${editingStreamer}`,
    });

    setEditingStreamer(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingStreamer(null);
    setEditValue("");
  };

  const validateMethod = (streamer: string) => {
    setMethods(prev => prev.map(method => 
      method.streamer_name === streamer 
        ? { ...method, status: "valid", last_updated: new Date().toISOString().split('T')[0] }
        : method
    ));

    toast({
      title: "Validation Complete",
      description: `Payout method validated for ${streamer}`,
    });
  };

  const invalidMethods = methods.filter(m => m.status === "invalid" || m.status === "missing");

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {invalidMethods.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Action Required</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              {invalidMethods.length} streamer(s) have missing or invalid payout information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invalidMethods.map(method => (
                <div key={method.streamer_name} className="flex items-center justify-between bg-white p-3 rounded-md">
                  <div>
                    <span className="font-medium">{method.streamer_name}</span>
                    <span className="text-sm text-slate-600 ml-2">
                      {method.status === "missing" ? "No payout method" : "Invalid details"}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => startEditing(method.streamer_name, method.details)}
                  >
                    Fix Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payout Method Management</span>
          </CardTitle>
          <CardDescription>
            View and edit streamer payout information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Streamer</TableHead>
                  <TableHead>Method Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.streamer_name} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{method.streamer_name}</TableCell>
                    <TableCell>{method.method_type}</TableCell>
                    <TableCell>
                      {editingStreamer === method.streamer_name ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Enter payout details"
                            className="max-w-xs"
                          />
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      ) : (
                        <span className={method.details ? "" : "text-slate-400"}>
                          {method.details || "Not provided"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(method.status)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{method.last_updated}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(method.streamer_name, method.details)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {method.status !== "valid" && (
                          <Button
                            size="sm"
                            onClick={() => validateMethod(method.streamer_name)}
                          >
                            Validate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutMethodManagement;
