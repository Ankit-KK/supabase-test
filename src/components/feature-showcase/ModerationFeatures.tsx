import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Monitor,
  MessageCircle,
  Check,
  X,
  Layers,
  Smartphone,
  Image,
  Ban,
  Zap,
  Users,
  ArrowDown,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

const ModerationFeatures = () => {
  const protectionStats = [
    { label: "Moderation Layers", value: "2", icon: Layers },
    { label: "Response Channels", value: "Dashboard + Telegram", icon: Smartphone },
    { label: "Media Types", value: "Text, Voice, Image, GIF, Video", icon: Image },
    { label: "Action Options", value: "Approve, Reject, Hide, Ban", icon: Ban },
  ];

  const comparisonFeatures = [
    { feature: "Two-layer protection", hyperchat: true, traditional: false },
    { feature: "Mobile moderation (Telegram)", hyperchat: true, traditional: false },
    { feature: "Media preview before approval", hyperchat: true, traditional: false },
    { feature: "One-tap moderation", hyperchat: true, traditional: false },
    { feature: "Real-time Pusher sync", hyperchat: true, traditional: false },
    { feature: "Donor ban list", hyperchat: true, traditional: "partial" },
  ];

  const featureCards = [
    {
      icon: Monitor,
      title: "Dashboard Control",
      description: "Full web-based moderation panel with visual previews and bulk actions",
      color: "text-hyperchat-blue",
      bgColor: "bg-hyperchat-blue/10",
    },
    {
      icon: MessageCircle,
      title: "Telegram Integration",
      description: "Mobile notifications with inline Approve/Reject/Ban buttons",
      color: "text-hyperchat-purple",
      bgColor: "bg-hyperchat-purple/10",
    },
    {
      icon: Image,
      title: "Media Safety",
      description: "Preview images, GIFs, and videos before they appear on stream",
      color: "text-hyperchat-pink",
      bgColor: "bg-hyperchat-pink/10",
    },
    {
      icon: Zap,
      title: "Instant Sync",
      description: "Pusher-powered real-time updates across all devices",
      color: "text-hyperchat-orange",
      bgColor: "bg-hyperchat-orange/10",
    },
    {
      icon: Ban,
      title: "Ban Management",
      description: "One-click donor banning with persistent blocklist",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: Users,
      title: "Smart Queue",
      description: "Auto-queue based on moderation mode settings",
      color: "text-hyperchat-blue",
      bgColor: "bg-hyperchat-blue/10",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-hero-gradient text-white border-0 px-4 py-1.5 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            World's First
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-hyperchat-purple via-hyperchat-pink to-hyperchat-blue bg-clip-text text-transparent">
            Two-Layered Moderation System
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Easy, Fast, and Perfect for Friendly Streams
          </p>
          <p className="text-muted-foreground mt-4 max-w-3xl mx-auto">
            Complete content control before anything reaches your live stream - from any device, anywhere
          </p>
        </div>

        {/* Protection Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {protectionStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center p-4 bg-card/50 backdrop-blur border-hyperchat-purple/20">
                <CardContent className="p-0">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-hyperchat-purple" />
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two-Layer Flow Diagram */}
        <Card className="mb-16 overflow-hidden border-hyperchat-purple/20">
          <CardHeader className="bg-gradient-to-r from-hyperchat-purple/10 to-hyperchat-blue/10">
            <CardTitle className="flex items-center gap-2 text-center justify-center">
              <Layers className="w-5 h-5 text-hyperchat-purple" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              {/* Donation Arrives */}
              <div className="px-6 py-3 bg-secondary rounded-full font-semibold text-foreground">
                💰 Donation Arrives
              </div>
              
              <ArrowDown className="w-6 h-6 text-muted-foreground animate-bounce" />
              
              {/* Layer 1: Dashboard */}
              <div className="w-full max-w-md p-6 rounded-xl bg-gradient-to-br from-hyperchat-blue/20 to-hyperchat-blue/5 border border-hyperchat-blue/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-hyperchat-blue/20">
                    <Monitor className="w-6 h-6 text-hyperchat-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Layer 1: Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Web-based moderation</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-12">
                  <li>• Real-time web panel</li>
                  <li>• Visual media previews</li>
                  <li>• Bulk moderation actions</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDown className="w-4 h-4" />
                <span className="italic">(if Telegram enabled)</span>
                <ArrowDown className="w-4 h-4" />
              </div>
              
              {/* Layer 2: Telegram */}
              <div className="w-full max-w-md p-6 rounded-xl bg-gradient-to-br from-hyperchat-purple/20 to-hyperchat-purple/5 border border-hyperchat-purple/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-hyperchat-purple/20">
                    <MessageCircle className="w-6 h-6 text-hyperchat-purple" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Layer 2: Telegram</h3>
                    <p className="text-sm text-muted-foreground">Mobile moderation</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-12">
                  <li>• Push notifications</li>
                  <li>• One-tap Approve/Ban buttons</li>
                  <li>• Media previews inline</li>
                </ul>
              </div>
              
              <ArrowDown className="w-6 h-6 text-green-500" />
              
              {/* Approved Content */}
              <div className="px-6 py-3 bg-green-500/20 rounded-full font-semibold text-green-600 dark:text-green-400 border border-green-500/30">
                ✅ Approved Content → Safe for Stream
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anti-Hate Speech Shield */}
        <Card className="mb-16 overflow-hidden border-hyperchat-purple/20">
          <CardHeader className="bg-gradient-to-r from-destructive/10 to-green-500/10">
            <CardTitle className="flex items-center gap-2 text-center justify-center">
              <Shield className="w-5 h-5 text-hyperchat-purple" />
              Protection Against Harmful Content
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Blocked Content */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                    <ShieldX className="w-10 h-10 text-destructive" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-destructive">Blocked</p>
                  <p className="text-xs text-muted-foreground">Hate Speech & Toxic Content</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-[200px]">
                  {["Hate", "Spam", "Toxic", "NSFW"].map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-destructive/20 text-destructive rounded-full">
                      ❌ {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shield Animation */}
              <div className="relative">
                <div className="w-32 h-40 relative">
                  {/* Shield shape */}
                  <div className="absolute inset-0 bg-gradient-to-b from-hyperchat-purple via-hyperchat-pink to-hyperchat-blue rounded-t-full rounded-b-[40%] opacity-80 animate-pulse-glow" />
                  <div className="absolute inset-2 bg-gradient-to-b from-hyperchat-purple/50 via-hyperchat-pink/50 to-hyperchat-blue/50 rounded-t-full rounded-b-[40%] backdrop-blur flex items-center justify-center">
                    <Shield className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-center mt-4 font-bold text-hyperchat-purple">Two-Layer Shield</p>
              </div>

              {/* Approved Content */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-green-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600 dark:text-green-400">Approved</p>
                  <p className="text-xs text-muted-foreground">Friendly & Safe Content</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-[200px]">
                  {["Support", "Love", "Hype", "Fun"].map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
                      ✅ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card className="mb-16 overflow-hidden border-hyperchat-purple/20">
          <CardHeader className="bg-gradient-to-r from-hyperchat-purple/10 to-hyperchat-pink/10">
            <CardTitle className="text-center">HyperChat vs Traditional Platforms</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="font-semibold">Feature</TableHead>
                  <TableHead className="text-center font-semibold text-hyperchat-purple">HyperChat</TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground">Traditional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonFeatures.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      {row.hyperchat ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-destructive mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.traditional === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : row.traditional === "partial" ? (
                        <span className="text-xs text-muted-foreground">Sometimes</span>
                      ) : (
                        <X className="w-5 h-5 text-destructive mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="hover:scale-105 transition-transform border-hyperchat-purple/20">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ModerationFeatures;
