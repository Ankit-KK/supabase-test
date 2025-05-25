
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, User, Edit, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address: string;
  status: "success" | "failed";
}

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const auditEntries: AuditEntry[] = [
    {
      id: "1",
      user_id: "admin-001",
      user_name: "Admin User",
      action: "payout_processed",
      details: "Processed payout for Ankit - ₹12,500 (UTR: UTR2024011501)",
      timestamp: "2024-01-15T10:30:00Z",
      ip_address: "192.168.1.100",
      status: "success"
    },
    {
      id: "2",
      user_id: "admin-001",
      user_name: "Admin User",
      action: "payout_method_updated",
      details: "Updated payout method for Chiaa Gaming - Bank Transfer",
      timestamp: "2024-01-15T09:15:00Z",
      ip_address: "192.168.1.100",
      status: "success"
    },
    {
      id: "3",
      user_id: "admin-002",
      user_name: "Manager User",
      action: "data_exported",
      details: "Exported donation data (CSV) - Date range: 2024-01-01 to 2024-01-15",
      timestamp: "2024-01-14T16:45:00Z",
      ip_address: "192.168.1.101",
      status: "success"
    },
    {
      id: "4",
      user_id: "admin-001",
      user_name: "Admin User",
      action: "payout_failed",
      details: "Failed to process payout for Mackle - ₹15,200 (Invalid UPI ID)",
      timestamp: "2024-01-14T14:20:00Z",
      ip_address: "192.168.1.100",
      status: "failed"
    },
    {
      id: "5",
      user_id: "admin-002",
      user_name: "Manager User",
      action: "login",
      details: "User logged into admin dashboard",
      timestamp: "2024-01-14T08:30:00Z",
      ip_address: "192.168.1.101",
      status: "success"
    }
  ];

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    if (action.includes("payout")) return <User className="h-4 w-4" />;
    if (action.includes("updated") || action.includes("edit")) return <Edit className="h-4 w-4" />;
    if (action.includes("export")) return <Download className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getStatusBadge = (status: AuditEntry['status']) => {
    return status === "success" ? (
      <Badge className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
    );
  };

  const getActionColor = (action: string) => {
    if (action.includes("failed")) return "text-red-600";
    if (action.includes("payout")) return "text-blue-600";
    if (action.includes("updated")) return "text-orange-600";
    return "text-slate-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Audit Log</span>
        </CardTitle>
        <CardDescription>
          Track all administrative actions and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="payout_processed">Payout Processed</option>
            <option value="payout_failed">Payout Failed</option>
            <option value="payout_method_updated">Method Updated</option>
            <option value="data_exported">Data Exported</option>
            <option value="login">Login</option>
          </select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Log</span>
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium">{entry.user_name}</div>
                        <div className="text-xs text-slate-500">{entry.user_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={getActionColor(entry.action)}>
                        {getActionIcon(entry.action)}
                      </div>
                      <span className="font-medium capitalize">
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm text-slate-600 truncate" title={entry.details}>
                      {entry.details}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div>{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{entry.ip_address}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No audit entries found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLog;
