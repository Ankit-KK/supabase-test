
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { getStreamerConfig } from "@/config/streamerConfigs";
import { BarChart3, MessageSquare, Monitor, Download, LogOut, Heart, Sparkles } from "lucide-react";

const StreamerDashboard = () => {
  const { streamerName } = useParams<{ streamerName: string }>();
  const navigate = useNavigate();
  
  const config = getStreamerConfig(streamerName || "");
  
  if (!config) {
    return <div>Streamer not found</div>;
  }

  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: `/${config.name}/login`,
    authKey: config.authKey
  });

  const handleLogout = () => {
    sessionStorage.removeItem(config.authKey);
    sessionStorage.removeItem(`${config.name}AdminAuth`);
    navigate(`/${config.name}`);
  };

  // Special styling for Chiaa Gaming
  if (config.name === "chiaa_gaming") {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-95"
          style={{
            background: config.theme.backgroundColor
          }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 opacity-15 animate-float">
            <Heart size={60} className="text-pink-500" />
          </div>
          <div className="absolute bottom-32 left-20 opacity-15 animate-pulse">
            <Sparkles size={45} className="text-pink-600" />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                {config.displayName} Dashboard 💕
              </h1>
              <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
            </div>
            <Button onClick={handleLogout} variant="outline" className="text-pink-700 border-pink-400 hover:bg-pink-100">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className={`backdrop-blur-lg ${config.theme.cardBackground} border-${config.theme.borderColor} shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-pink-800">
                  <MessageSquare className="h-5 w-5" />
                  <span>Donation Messages</span>
                </CardTitle>
                <CardDescription className="text-pink-700">View and manage donation messages</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(`/${config.name}/messages`)} 
                  className={`w-full bg-gradient-to-r from-${config.theme.primaryColor} to-${config.theme.secondaryColor} hover:from-pink-700 hover:to-purple-800 text-white shadow-lg`}
                >
                  View Messages
                </Button>
              </CardContent>
            </Card>

            <Card className={`backdrop-blur-lg ${config.theme.cardBackground} border-${config.theme.borderColor} shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-pink-800">
                  <Monitor className="h-5 w-5" />
                  <span>OBS Integration</span>
                </CardTitle>
                <CardDescription className="text-pink-700">Set up donation alerts for streaming</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(`/${config.name}/obs/latest`)} 
                  className={`w-full bg-gradient-to-r from-${config.theme.primaryColor} to-${config.theme.secondaryColor} hover:from-pink-700 hover:to-purple-800 text-white shadow-lg`}
                >
                  OBS Setup
                </Button>
              </CardContent>
            </Card>

            <Card className={`backdrop-blur-lg ${config.theme.cardBackground} border-${config.theme.borderColor} shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-pink-800">
                  <Download className="h-5 w-5" />
                  <span>Export Data</span>
                </CardTitle>
                <CardDescription className="text-pink-700">Download donation data as CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(`/${config.name}/export`)} 
                  className={`w-full bg-gradient-to-r from-${config.theme.primaryColor} to-${config.theme.secondaryColor} hover:from-pink-700 hover:to-purple-800 text-white shadow-lg`}
                >
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Special styling for Rakazone
  if (config.name === "rakazone") {
    return (
      <div 
        className="container mx-auto py-8 px-4"
        style={{
          background: config.theme.backgroundColor,
          minHeight: "100vh",
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {config.features.hasLogo && (
              <img 
                src={config.features.logoUrl} 
                alt={`${config.displayName} Logo`} 
                className="h-12 w-12"
              />
            )}
            <h1 className={`text-3xl font-bold text-${config.theme.primaryColor}`}>
              {config.displayName} Dashboard
            </h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className={`border-${config.theme.borderColor} hover:bg-red-900/20`}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className={`${config.theme.cardBackground} border-${config.theme.borderColor}`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 text-${config.theme.primaryColor}`}>
                <MessageSquare className="h-5 w-5" />
                <span>Donation Messages</span>
              </CardTitle>
              <CardDescription className="text-gray-300">View and manage donation messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/${config.name}/messages`)} 
                className={`w-full bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo}`}
              >
                View Messages
              </Button>
            </CardContent>
          </Card>

          <Card className={`${config.theme.cardBackground} border-${config.theme.borderColor}`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 text-${config.theme.primaryColor}`}>
                <Monitor className="h-5 w-5" />
                <span>OBS Integration</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Set up donation alerts for streaming</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/${config.name}/obs/latest`)} 
                className={`w-full bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo}`}
              >
                OBS Setup
              </Button>
            </CardContent>
          </Card>

          <Card className={`${config.theme.cardBackground} border-${config.theme.borderColor}`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 text-${config.theme.primaryColor}`}>
                <Download className="h-5 w-5" />
                <span>Export Data</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Download donation data as CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/${config.name}/export`)} 
                className={`w-full bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo}`}
              >
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default styling for other streamers
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{config.displayName} Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </CardTitle>
            <CardDescription>View donation statistics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Donation Messages</span>
            </CardTitle>
            <CardDescription>View and manage donation messages</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/${config.name}/messages`)} className="w-full">
              View Messages
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>OBS Integration</span>
            </CardTitle>
            <CardDescription>Set up donation alerts for streaming</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/${config.name}/obs/latest`)} className="w-full">
              OBS Setup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Data</span>
            </CardTitle>
            <CardDescription>Download donation data as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/${config.name}/export`)} className="w-full">
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamerDashboard;
