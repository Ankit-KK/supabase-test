import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Sparkles, Zap, CheckCircle, Users, TrendingUp } from "lucide-react";

const EngagementFeatures = () => {
  const [activeDemo, setActiveDemo] = useState("presence");

  const engagementStats = [
    { label: "Response Time", value: "Instant", icon: Zap },
    { label: "Connection Rate", value: "99.9%", icon: CheckCircle },
    { label: "Engagement Level", value: "High", icon: Sparkles },
    { label: "Active Communities", value: "1000+", icon: TrendingUp }
  ];

  const connectionFlow = [
    "Audience joins live session",
    "Real-time presence notification",
    "Interactive engagement begins",
    "Creator acknowledges participation",
    "Community connection strengthened"
  ];

  return (
    <section id="engagement-features" className="py-16 px-4 bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-blue/10 text-hyperchat-blue border-hyperchat-blue/20">
            <Heart className="w-3 h-3 mr-1" />
            Engagement System
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real-Time Connection Experience
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lightning-fast, seamless connection processing with real-time acknowledgment 
            and instant community notifications.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {engagementStats.map((stat, index) => {
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
            <TabsTrigger value="presence">Presence Flow</TabsTrigger>
            <TabsTrigger value="verification">Real-time Updates</TabsTrigger>
            <TabsTrigger value="integration">Platform Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="presence" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-hyperchat-blue" />
                    Live Presence Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Engagement Request</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-mono">Live Presence</span>
                      </div>
                      <div className="flex justify-between">
                        <span>To:</span>
                        <span className="font-mono">Creator</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-hyperchat-blue hover:bg-hyperchat-blue/90">
                    Simulate Engagement
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connectionFlow.map((step, index) => (
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
                <CardTitle>Real-time Presence Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Update Steps</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Platform Connection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Presence Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Community Notification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Live Display Update</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Platform Safeguards</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded">Identity Verification</div>
                      <div className="p-2 bg-muted/50 rounded">Rate Protection</div>
                      <div className="p-2 bg-muted/50 rounded">Content Validation</div>
                      <div className="p-2 bg-muted/50 rounded">Activity Logging</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                  Seamless integration with streaming platforms, real-time dashboards, and community tools
                  enables instant presence acknowledgment and live audience engagement.
                </div>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button variant="outline" size="sm">Platform Docs</Button>
                  <Button variant="outline" size="sm">Integration Guide</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default EngagementFeatures;