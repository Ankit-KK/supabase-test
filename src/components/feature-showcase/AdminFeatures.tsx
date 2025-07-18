import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3, Users, MessageSquare, Download, Shield } from "lucide-react";

const AdminFeatures = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const adminStats = [
    { label: "Total Revenue", value: "₹2,45,670", change: "+12.5%", icon: BarChart3 },
    { label: "Active Users", value: "1,247", change: "+8.2%", icon: Users },
    { label: "Pending Reviews", value: "23", change: "-5.1%", icon: MessageSquare },
    { label: "System Health", value: "99.9%", change: "+0.1%", icon: Shield }
  ];

  const recentDonations = [
    { id: "1", name: "Supporter123", amount: "₹100", status: "pending", time: "2 min ago" },
    { id: "2", name: "GamerPro", amount: "₹250", status: "approved", time: "5 min ago" },
    { id: "3", name: "StreamFan", amount: "₹50", status: "pending", time: "8 min ago" },
    { id: "4", name: "Anonymous", amount: "₹500", status: "approved", time: "12 min ago" }
  ];

  const moderationQueue = [
    { id: "1", type: "voice", content: "Voice message", reporter: "User123", status: "pending" },
    { id: "2", type: "gif", content: "Custom GIF", reporter: "User456", status: "reviewing" },
    { id: "3", type: "message", content: "Text message", reporter: "User789", status: "pending" }
  ];

  return (
    <section id="admin-features" className="py-16 px-4 bg-gradient-to-br from-secondary/10 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-purple/10 text-hyperchat-purple border-hyperchat-purple/20">
            <Settings className="w-3 h-3 mr-1" />
            Admin & Creator Tools
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Admin Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Full-featured admin interface with analytics, moderation tools, 
            and complete control over your streaming platform.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {adminStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4 hover:scale-105 transition-transform">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-hyperchat-purple" />
                    <Badge variant={stat.change.startsWith('+') ? 'secondary' : 'destructive'} className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-hyperchat-blue" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentDonations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{donation.name}</div>
                          <div className="text-xs text-muted-foreground">{donation.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{donation.amount}</div>
                          <Badge 
                            variant={donation.status === 'approved' ? 'secondary' : 'default'}
                            className={donation.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}
                          >
                            {donation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View All Donations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-hyperchat-pink" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure OBS Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Review Security Logs
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Moderators
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-hyperchat-orange" />
                    Moderation Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {moderationQueue.map((item) => (
                      <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge 
                            variant={item.status === 'pending' ? 'default' : 'secondary'}
                            className={item.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : ''}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{item.content}</div>
                        <div className="text-xs text-muted-foreground">Reported by: {item.reporter}</div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">Approve</Button>
                          <Button size="sm" variant="destructive">Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Telegram Bot Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Bot Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500">Connected</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Available Commands</div>
                    <div className="space-y-1 text-sm font-mono">
                      <div>/approve - Approve donation</div>
                      <div>/reject - Reject donation</div>
                      <div>/status - Check system status</div>
                      <div>/stats - View statistics</div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    Configure Bot Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-hyperchat-blue" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-hyperchat-blue mb-2">₹2,45,670</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-xs text-green-500">+12.5% from last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-hyperchat-purple mb-2">1,247</div>
                      <div className="text-sm text-muted-foreground">Total Donations</div>
                      <div className="text-xs text-green-500">+8.2% from last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-hyperchat-pink mb-2">₹197</div>
                      <div className="text-sm text-muted-foreground">Average Donation</div>
                      <div className="text-xs text-green-500">+3.8% from last month</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 h-40 bg-gradient-to-r from-hyperchat-blue/10 to-hyperchat-purple/10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-hyperchat-blue" />
                      <div className="text-sm text-muted-foreground">Revenue Chart Placeholder</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Voice Messages</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-hyperchat-pink h-2 rounded-full w-3/4"></div>
                        </div>
                        <span className="text-sm">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Custom GIFs</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-hyperchat-blue h-2 rounded-full w-1/2"></div>
                        </div>
                        <span className="text-sm">50%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HyperEmotes</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-hyperchat-orange h-2 rounded-full w-4/5"></div>
                        </div>
                        <span className="text-sm">80%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Donation Report
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Analytics Data
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Tax Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Auto-approve donations</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Voice message limit</span>
                      <Badge variant="secondary">60 seconds</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">GIF file size limit</span>
                      <Badge variant="secondary">50MB</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Minimum donation</span>
                      <Badge variant="secondary">₹10</Badge>
                    </div>
                  </div>
                  <Button className="w-full">Update Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Two-factor authentication</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Rate limiting</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Audit logging</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Session timeout</span>
                      <Badge variant="secondary">24 hours</Badge>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">Security Dashboard</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default AdminFeatures;