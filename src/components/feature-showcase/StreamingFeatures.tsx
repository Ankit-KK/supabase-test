import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Settings, Volume2, Eye, Users, Tv } from "lucide-react";

const StreamingFeatures = () => {
  const [obsPreview, setObsPreview] = useState("overlay");

  const streamingStats = [
    { label: "OBS Integration", value: "Real-time", icon: Monitor },
    { label: "Alert Types", value: "20+", icon: Settings },
    { label: "Audio Formats", value: "All", icon: Volume2 },
    { label: "Viewers", value: "Unlimited", icon: Eye }
  ];

  const overlayCode = `<!-- OBS Browser Source URL -->
https://yourapp.com/chiaa_gaming/obs/YOUR_OBS_TOKEN

<!-- CSS Customization -->
.donation-alert {
  position: absolute;
  top: 50px;
  right: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 20px;
  border-radius: 15px;
  animation: slideIn 0.5s ease-out;
}

.voice-message {
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 15px;
  border-radius: 10px;
}`;

  return (
    <section id="streaming-features" className="py-16 px-4 bg-gradient-to-br from-secondary/5 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-purple/10 text-hyperchat-purple border-hyperchat-purple/20">
            <Tv className="w-3 h-3 mr-1" />
            Streaming Integration
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Live Streaming Integration
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seamless streaming integration with customizable overlays, real-time presence alerts, 
            and professional-grade broadcasting tools for enhanced audience connection.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {streamingStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4 text-center hover:scale-105 transition-transform">
                <CardContent className="p-0">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-hyperchat-purple" />
                  <div className="font-bold text-lg">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={obsPreview} onValueChange={setObsPreview} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overlay">Live Overlay</TabsTrigger>
            <TabsTrigger value="settings">OBS Settings</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
          </TabsList>

          <TabsContent value="overlay" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-hyperchat-purple" />
                    Live Overlay Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gradient-to-br from-hyperchat-purple/20 to-hyperchat-pink/20 rounded-lg p-6 min-h-[300px] border-2 border-dashed border-hyperchat-purple/30">
                    <div className="absolute top-4 right-4 bg-card rounded-lg p-3 shadow-lg animate-float">
                      <div className="text-sm font-bold text-hyperchat-purple">Audience Joined!</div>
                      <div className="text-xs">Supporter is now present</div>
                      <div className="text-xs text-muted-foreground">"Excited to be here!"</div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 bg-card rounded-lg p-3 shadow-lg">
                      <div className="text-sm font-bold">Community Size</div>
                      <div className="w-32 bg-muted rounded-full h-2 mt-1">
                        <div className="bg-hero-gradient h-2 rounded-full w-3/4"></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">750 / 1000 viewers</div>
                    </div>
                    
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-hyperchat-purple" />
                      <div className="text-sm text-muted-foreground">Your Stream Content</div>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-hyperchat-purple hover:bg-hyperchat-purple/90">
                    Open in OBS
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Volume2 className="w-4 h-4 text-hyperchat-blue" />
                      <div>
                        <div className="font-medium text-sm">Audio Message Alert</div>
                        <div className="text-xs text-muted-foreground">Plays audio + visual notification</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Eye className="w-4 h-4 text-hyperchat-pink" />
                      <div>
                        <div className="font-medium text-sm">Visual Effect Alert</div>
                        <div className="text-xs text-muted-foreground">Custom visual display with animation</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Settings className="w-4 h-4 text-hyperchat-orange" />
                      <div>
                        <div className="font-medium text-sm">Animated Effects</div>
                        <div className="text-xs text-muted-foreground">50+ animated celebration effects</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OBS Browser Source Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Browser Source URL</label>
                    <div className="p-2 bg-muted/50 rounded font-mono text-sm">
                      https://app.com/obs/YOUR_TOKEN
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Width</label>
                      <div className="p-2 bg-muted/50 rounded font-mono text-sm">1920</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Height</label>
                      <div className="p-2 bg-muted/50 rounded font-mono text-sm">1080</div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    Copy OBS Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audio Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Audio Messages</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Notification Sounds</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ambient Audio</span>
                      <Badge variant="outline">Optional</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium">Audio Quality</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button size="sm" variant="outline">Low</Button>
                      <Button size="sm" className="bg-hyperchat-purple">High</Button>
                      <Button size="sm" variant="outline">Max</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customization" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS & Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
                  <pre>{overlayCode}</pre>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button size="sm" variant="outline">Default Theme</Button>
                  <Button size="sm" variant="outline">Gaming Theme</Button>
                  <Button size="sm" variant="outline">Minimal Theme</Button>
                  <Button size="sm" variant="outline">Custom CSS</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default StreamingFeatures;