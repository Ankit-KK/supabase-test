import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Shield, Zap, CheckCircle, Clock, TrendingUp } from "lucide-react";

const PaymentFeatures = () => {
  const [activeDemo, setActiveDemo] = useState("upi");

  const paymentStats = [
    { label: "Processing Time", value: "<2 seconds", icon: Clock },
    { label: "Success Rate", value: "99.9%", icon: CheckCircle },
    { label: "Security Level", value: "Bank Grade", icon: Shield },
    { label: "Daily Volume", value: "₹10L+", icon: TrendingUp }
  ];

  const codeExample = `// Create UPI Payment
const payment = await supabase.functions.invoke('create-payment-order', {
  body: {
    amount: 100,
    name: "Supporter Name",
    message: "Great stream!",
    streamerId: "creator_id"
  }
});

// Real-time payment verification
const { data } = await supabase
  .from('donations')
  .select('*')
  .eq('order_id', payment.order_id)
  .single();`;

  return (
    <section id="payment-features" className="py-16 px-4 bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-blue/10 text-hyperchat-blue border-hyperchat-blue/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Payment Processing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Advanced UPI Payment System
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lightning-fast, secure, and seamless payment processing with real-time verification 
            and instant notifications.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {paymentStats.map((stat, index) => {
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

        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upi">UPI Flow</TabsTrigger>
            <TabsTrigger value="verification">Real-time Verification</TabsTrigger>
            <TabsTrigger value="integration">API Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-hyperchat-blue" />
                    Live Payment Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Payment Request</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-mono">₹100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>To:</span>
                        <span className="font-mono">Creator</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          Processing
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-hyperchat-blue hover:bg-hyperchat-blue/90">
                    Simulate Payment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Flow Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "User initiates payment",
                      "UPI gateway processing",
                      "Real-time verification",
                      "Instant notification",
                      "Database update"
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-hyperchat-blue/20 flex items-center justify-center text-xs font-bold text-hyperchat-blue">
                          {index + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Payment Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Verification Steps</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Payment Gateway Response</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Amount Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Fraud Detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Database Update</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Security Measures</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded">CSRF Protection</div>
                      <div className="p-2 bg-muted/50 rounded">Rate Limiting</div>
                      <div className="p-2 bg-muted/50 rounded">Input Validation</div>
                      <div className="p-2 bg-muted/50 rounded">Audit Logging</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre>{codeExample}</pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">View Full API Docs</Button>
                  <Button variant="outline" size="sm">Download SDK</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default PaymentFeatures;