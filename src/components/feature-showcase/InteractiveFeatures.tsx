import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Image, Smile, Play, Upload, Zap } from "lucide-react";

const InteractiveFeatures = () => {
  const [activeFeature, setActiveFeature] = useState("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const interactiveStats = [
    { label: "Voice Messages", value: "World's First", icon: Mic },
    { label: "Custom GIFs", value: "Unlimited", icon: Image },
    { label: "Emoji Types", value: "50+", icon: Smile },
    { label: "Real-time", value: "Instant", icon: Zap }
  ];

  const emojis = ["🎮", "🔥", "💖", "⭐", "🎉", "🚀", "💎", "🌟", "🎊", "✨"];

  const voiceDemo = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => setIsRecording(false), 3000);
    }
  };

  const triggerEmojiRain = () => {
    setShowEmojis(true);
    setTimeout(() => setShowEmojis(false), 3000);
  };

  return (
    <section id="interactive-features" className="py-16 px-4 bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-pink/10 text-hyperchat-pink border-hyperchat-pink/20">
            <Smile className="w-3 h-3 mr-1" />
            Interactive Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            World's First Interactive Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Revolutionary features that transform viewer engagement - voice messages, 
            custom GIFs, and animated emoji effects never seen before.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {interactiveStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4 text-center hover:scale-105 transition-transform">
                <CardContent className="p-0">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-hyperchat-pink" />
                  <div className="font-bold text-lg">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeFeature} onValueChange={setActiveFeature} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice">Voice Messages</TabsTrigger>
            <TabsTrigger value="gifs">Custom GIFs</TabsTrigger>
            <TabsTrigger value="hyperemotes">HyperEmotes</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-hyperchat-pink" />
                    Voice Message Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="p-6 bg-gradient-to-br from-hyperchat-pink/10 to-hyperchat-purple/10 rounded-lg text-center">
                      <Mic className={`w-12 h-12 mx-auto mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-hyperchat-pink'}`} />
                      <div className="text-lg font-semibold mb-2">
                        {isRecording ? "Recording..." : "Ready to Record"}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {isRecording ? "Speak your message now" : "Click to start voice message"}
                      </div>
                      {isRecording && (
                        <div className="flex justify-center space-x-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-red-500 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 20 + 10}px`,
                                animationDelay: `${i * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={voiceDemo}
                      className={`w-full mt-4 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-hyperchat-pink hover:bg-hyperchat-pink/90'}`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">High Quality Audio</div>
                        <div className="text-xs text-muted-foreground">Crystal clear recording</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Auto Moderation</div>
                        <div className="text-xs text-muted-foreground">Smart content filtering</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Real-time Playback</div>
                        <div className="text-xs text-muted-foreground">Instant streaming integration</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-hyperchat-pink/10 rounded-lg">
                    <div className="text-sm font-semibold text-hyperchat-pink mb-1">
                      🎯 World's First Feature
                    </div>
                    <div className="text-xs text-muted-foreground">
                      No other platform offers voice messages in donations
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gifs" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-hyperchat-blue" />
                    GIF Upload Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-hyperchat-blue/30 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-hyperchat-blue" />
                    <div className="text-lg font-semibold mb-2">Upload Your GIF</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to select
                    </div>
                    <Button variant="outline" className="border-hyperchat-blue text-hyperchat-blue">
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-hyperchat-blue/20 to-hyperchat-purple/20 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6 text-hyperchat-blue" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GIF Processing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">File Size Limit</span>
                      <Badge>50MB</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">Supported Formats</span>
                      <Badge>GIF, MP4, WEBM</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">Auto Optimization</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">Content Moderation</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hyperemotes" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="w-5 h-5 text-hyperchat-orange" />
                    HyperEmotes Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="p-8 bg-gradient-to-br from-hyperchat-orange/10 to-hyperchat-pink/10 rounded-lg text-center min-h-[200px] overflow-hidden">
                      {showEmojis && (
                        <div className="absolute inset-0">
                          {emojis.map((emoji, index) => (
                            <div
                              key={index}
                              className="absolute text-2xl animate-fall"
                              style={{
                                left: `${Math.random() * 80 + 10}%`,
                                top: `${Math.random() * 20}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                              }}
                            >
                              {emoji}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative z-10">
                        <Smile className="w-12 h-12 mx-auto mb-4 text-hyperchat-orange" />
                        <div className="text-lg font-semibold mb-2">Emoji Rain Effect</div>
                        <div className="text-sm text-muted-foreground mb-4">
                          50+ animated emojis falling from sky
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={triggerEmojiRain}
                      className="w-full mt-4 bg-hyperchat-orange hover:bg-hyperchat-orange/90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Trigger Emoji Rain
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Emojis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {["🎮", "🔥", "💖", "⭐", "🎉", "🚀", "💎", "🌟", "🎊", "✨", "💰", "🎯", "🏆", "🎁", "💜"].map((emoji, index) => (
                      <div key={index} className="text-2xl text-center p-2 hover:scale-125 transition-transform cursor-pointer">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    And 35+ more animated effects!
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default InteractiveFeatures;