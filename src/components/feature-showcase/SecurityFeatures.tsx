import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, AlertTriangle, Key, FileCheck } from "lucide-react";

const SecurityFeatures = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Row Level Security",
      description: "Database-level access control ensuring users only see their own data",
      status: "Active",
      level: "Critical"
    },
    {
      icon: Lock,
      title: "CSRF Protection",
      description: "Cross-site request forgery protection on all forms and endpoints",
      status: "Active",
      level: "High"
    },
    {
      icon: Eye,
      title: "XSS Prevention",
      description: "Input sanitization and output encoding to prevent script injection",
      status: "Active",
      level: "High"
    },
    {
      icon: AlertTriangle,
      title: "Rate Limiting",
      description: "Intelligent rate limiting to prevent abuse and DDoS attacks",
      status: "Active",
      level: "Medium"
    },
    {
      icon: Key,
      title: "Token Security",
      description: "Secure token generation and validation for OBS and API access",
      status: "Active",
      level: "Critical"
    },
    {
      icon: FileCheck,
      title: "Audit Logging",
      description: "Comprehensive logging of all security events and access attempts",
      status: "Active",
      level: "Medium"
    }
  ];

  const complianceItems = [
    { standard: "GDPR", status: "Compliant", description: "European data protection regulation" },
    { standard: "PCI DSS", status: "Level 1", description: "Payment card industry security" },
    { standard: "SOC 2", status: "Type II", description: "Service organization controls" },
    { standard: "ISO 27001", status: "Certified", description: "Information security management" }
  ];

  const securityMetrics = [
    { metric: "Security Incidents", value: "0", period: "Last 12 months" },
    { metric: "Uptime", value: "99.99%", period: "This year" },
    { metric: "Vulnerability Score", value: "A+", period: "Current rating" },
    { metric: "Response Time", value: "<24h", period: "Security issues" }
  ];

  return (
    <section id="security-features" className="py-16 px-4 bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
            <Shield className="w-3 h-3 mr-1" />
            Security & Compliance
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Enterprise-Grade Security
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bank-level security measures protecting your data and transactions 
            with comprehensive compliance and monitoring.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {securityMetrics.map((metric, index) => (
            <Card key={index} className="p-4 text-center hover:scale-105 transition-transform">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-green-500 mb-1">{metric.value}</div>
                <div className="text-sm font-medium">{metric.metric}</div>
                <div className="text-xs text-muted-foreground">{metric.period}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:scale-105 transition-transform">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6 text-green-500" />
                    <Badge 
                      variant={feature.level === 'Critical' ? 'destructive' : feature.level === 'High' ? 'default' : 'secondary'}
                      className={feature.level === 'Critical' ? 'bg-red-500/10 text-red-500' : feature.level === 'High' ? 'bg-orange-500/10 text-orange-500' : ''}
                    >
                      {feature.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-500">{feature.status}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-hyperchat-blue" />
                Compliance Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{item.standard}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-hyperchat-purple" />
                Security Implementation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-500 mb-2">// Row Level Security Policy</div>
                <div>CREATE POLICY "users_own_data"</div>
                <div>ON donations FOR ALL</div>
                <div>USING (auth.uid() = user_id);</div>
                <div className="mt-3 text-green-500">// Rate Limiting</div>
                <div>check_rate_limit(ip, endpoint, 10, 1)</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-green-500/10 text-green-500 rounded text-center">
                  ✓ Encrypted Transit
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded text-center">
                  ✓ Encrypted Storage
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded text-center">
                  ✓ Input Validation
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded text-center">
                  ✓ Access Logging
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SecurityFeatures;