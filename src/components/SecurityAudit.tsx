
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { SecurityMonitor, SecurityEvent, SECURITY_EVENTS, EnhancedSecurityMonitor } from "@/utils/securityMonitoring";

const SecurityAudit: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const loadSecurityEvents = () => {
    const recentEvents = SecurityMonitor.getRecentEvents();
    setEvents(recentEvents);
    
    // Load security alerts
    const securityAlerts = EnhancedSecurityMonitor.getAlerts();
    setAlerts(securityAlerts);
    
    // Load admin action logs
    setAdminLogs([]); // No admin logs without access control
    
    const eventStats = recentEvents.reduce(
      (acc, event) => {
        acc.total++;
        acc[event.severity]++;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );
    
    setStats(eventStats);
    
    // Check thresholds for real-time alerting
    EnhancedSecurityMonitor.checkThresholds();
  };

  useEffect(() => {
    loadSecurityEvents();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSecurityEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const clearEvents = () => {
    SecurityMonitor.clearEvents();
    loadSecurityEvents();
  };

  const getSecurityStatus = () => {
    if (stats.critical > 0) {
      return { status: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    }
    if (stats.high > 0) {
      return { status: 'High Risk', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    }
    if (stats.medium > 0) {
      return { status: 'Medium Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    }
    if (stats.low > 0) {
      return { status: 'Low Risk', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
    }
    return { status: 'Secure', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-pink-100 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor
          </CardTitle>
          <CardDescription className="text-pink-300">
            Real-time security event monitoring and threat detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${securityStatus.bgColor}`}>
              <div className={`text-lg font-semibold ${securityStatus.color}`}>
                {securityStatus.status}
              </div>
              <div className="text-sm text-gray-400">Overall Status</div>
            </div>
            
            <div className="p-4 rounded-lg bg-red-500/10">
              <div className="text-lg font-semibold text-red-400">{stats.critical}</div>
              <div className="text-sm text-gray-400">Critical</div>
            </div>
            
            <div className="p-4 rounded-lg bg-orange-500/10">
              <div className="text-lg font-semibold text-orange-400">{stats.high}</div>
              <div className="text-sm text-gray-400">High</div>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-500/10">
              <div className="text-lg font-semibold text-yellow-400">{stats.medium}</div>
              <div className="text-sm text-gray-400">Medium</div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-500/10">
              <div className="text-lg font-semibold text-blue-400">{stats.low}</div>
              <div className="text-sm text-gray-400">Low</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-pink-200">Recent Security Events</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadSecurityEvents}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearEvents}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                Clear Events
              </Button>
            </div>
          </div>

          {/* Security Alerts Section */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-red-200 mb-3">Active Security Alerts</h4>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <Alert key={index} className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      <strong>{alert.level}:</strong> {alert.message}
                      <div className="text-xs text-red-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions Section */}
          {adminLogs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-blue-200 mb-3">Recent Admin Actions</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {adminLogs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-900/20 border border-blue-700/50"
                  >
                    <div>
                      <div className="text-blue-100 font-medium">{log.action}</div>
                      <div className="text-xs text-blue-300">
                        {log.adminType} • {log.details}
                      </div>
                    </div>
                    <div className="text-xs text-blue-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <Shield className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                No security events detected. System is secure.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.slice(0, 20).map((event, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(event.severity)}>
                      {getSeverityIcon(event.severity)}
                      <span className="ml-1">{event.severity.toUpperCase()}</span>
                    </Badge>
                    <div>
                      <div className="text-pink-100 font-medium">
                        {formatEventType(event.type)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {event.details}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAudit;
