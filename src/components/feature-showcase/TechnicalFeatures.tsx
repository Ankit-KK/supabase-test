import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Server, Zap, Code, Cloud, GitBranch } from "lucide-react";

const TechnicalFeatures = () => {
  const [activeTab, setActiveTab] = useState("database");

  const techStats = [
    { label: "Uptime", value: "99.9%", icon: Server },
    { label: "Response Time", value: "<100ms", icon: Zap },
    { label: "Databases", value: "Multi-region", icon: Database },
    { label: "API Endpoints", value: "20+", icon: Code }
  ];

  const databaseSchema = `-- Donations Table
CREATE TABLE chiaa_gaming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  voice_url TEXT,
  gif_url TEXT,
  hyperemotes_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Real-time subscription
ALTER TABLE chiaa_gaming_donations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chiaa_gaming_donations;`;

  const edgeFunctionCode = `// Payment Processing Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { amount, name, message } = await req.json();
  
  // Validate input
  if (!amount || amount < 1) {
    return new Response('Invalid amount', { status: 400 });
  }
  
  // Create payment order
  const order = await createPaymentOrder({
    amount,
    name,
    message
  });
  
  return new Response(JSON.stringify(order), {
    headers: { 'Content-Type': 'application/json' }
  });
});`;

  const apiEndpoints = [
    { method: "POST", endpoint: "/create-payment-order", description: "Create new payment" },
    { method: "POST", endpoint: "/verify-payment", description: "Verify payment status" },
    { method: "POST", endpoint: "/telegram-bot", description: "Telegram integration" },
    { method: "GET", endpoint: "/donation-notification", description: "Real-time notifications" }
  ];

  return (
    <section id="technical-features" className="py-16 px-4 bg-gradient-to-br from-secondary/5 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-blue/10 text-hyperchat-blue border-hyperchat-blue/20">
            <Server className="w-3 h-3 mr-1" />
            Technical Infrastructure
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Enterprise-Grade Backend
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on modern cloud infrastructure with real-time databases, 
            edge functions, and scalable architecture.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {techStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4 text-center hover:scale-105 transition-transform">
                <CardContent className="p-0">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-hyperchat-blue" />
                  <div className="font-bold text-lg">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="functions">Edge Functions</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-hyperchat-blue" />
                    Database Schema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{databaseSchema}</pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">View Full Schema</Button>
                    <Button size="sm" variant="outline">Export DDL</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Row Level Security</div>
                        <div className="text-xs text-muted-foreground">Advanced access control</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Real-time Subscriptions</div>
                        <div className="text-xs text-muted-foreground">Live data updates</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Automated Backups</div>
                        <div className="text-xs text-muted-foreground">Point-in-time recovery</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Multi-region</div>
                        <div className="text-xs text-muted-foreground">Global distribution</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="functions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-hyperchat-purple" />
                    Edge Function Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{edgeFunctionCode}</pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">View All Functions</Button>
                    <Button size="sm" variant="outline">Function Logs</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Function Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Cloud className="w-4 h-4 text-hyperchat-purple" />
                      <div>
                        <div className="font-medium text-sm">Edge Computing</div>
                        <div className="text-xs text-muted-foreground">Global edge deployment</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Zap className="w-4 h-4 text-hyperchat-purple" />
                      <div>
                        <div className="font-medium text-sm">Auto Scaling</div>
                        <div className="text-xs text-muted-foreground">Handles any load</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <GitBranch className="w-4 h-4 text-hyperchat-purple" />
                      <div>
                        <div className="font-medium text-sm">CI/CD Pipeline</div>
                        <div className="text-xs text-muted-foreground">Automated deployments</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voice Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bucket:</span>
                      <span className="font-mono">voice-messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-mono">WEBM, MP3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span className="font-mono">10MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CDN:</span>
                      <Badge variant="secondary">Global</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GIF Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bucket:</span>
                      <span className="font-mono">donation-gifs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-mono">GIF, MP4, WEBM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span className="font-mono">50MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compression:</span>
                      <Badge variant="secondary">Auto</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emoji Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bucket:</span>
                      <span className="font-mono">chiaa-emotes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-mono">SVG, PNG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Count:</span>
                      <span className="font-mono">50+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache:</span>
                      <Badge variant="secondary">Forever</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apis" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-hyperchat-blue" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiEndpoints.map((api, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <Badge variant={api.method === 'GET' ? 'secondary' : 'default'} className="min-w-[60px]">
                        {api.method}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-mono text-sm">{api.endpoint}</div>
                        <div className="text-xs text-muted-foreground">{api.description}</div>
                      </div>
                      <Button size="sm" variant="outline">Test</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline">API Documentation</Button>
                  <Button variant="outline">Postman Collection</Button>
                  <Button variant="outline">SDK Download</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default TechnicalFeatures;