import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimpleAnkitAuth } from '@/hooks/useSimpleAnkitAuth';
import { formatCurrency } from '@/utils/dashboardUtils';
import { DollarSign, TrendingUp, Users, Calendar, LogOut, Settings } from 'lucide-react';
import AnkitOBSSettings from '@/components/AnkitOBSSettings';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { RealtimeDebugPanel } from '@/components/RealtimeDebugPanel';
import { AnkitRealtimeProvider, useAnkitRealtime } from '@/contexts/AnkitRealtimeContext';
import { AnkitMessagesModerationPage } from '@/pages/AnkitMessagesModerationPage';
import { obsTokenCache } from '@/utils/obsTokenCache';

const AnkitDashboardContent = () => {
  const { session, loading, logout } = useSimpleAnkitAuth();
  const { 
    streamer, 
    donations, 
    moderationDonations, 
    totalAmount, 
    monthlyAmount, 
    loading: loadingData, 
    connectionStatus 
  } = useAnkitRealtime();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [obsToken, setObsToken] = useState<string>('');

  const handleStreamerUpdate = (updatedStreamer: any) => {
    // Streamer updates are now handled by the context
    console.log('Streamer update:', updatedStreamer);
  };

  // Access control and OBS token setup
  useEffect(() => {
    if (!session || !streamer) return;

    // Check if logged in user matches this streamer
    if (session.streamerSlug !== 'ankit') {
      setHasAccess(false);
      return;
    }

    setHasAccess(true);

    // Generate/get OBS token
    const setupOBSToken = async () => {
      try {
        const token = await obsTokenCache.getOrGenerateToken(streamer.id);
        setObsToken(token);
      } catch (error) {
        console.error('Error getting OBS token:', error);
      }
    };

    setupOBSToken();
  }, [session, streamer]);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Streamer Not Found</CardTitle>
            <CardDescription>The streamer "ankit" could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6"
      style={{ 
        '--brand-color': streamer.brand_color,
        '--brand-color-rgb': `hsl(${streamer.brand_color?.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(' ') || '59 130 246'})` 
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{streamer.streamer_name} Dashboard</h1>
            <p className="text-muted-foreground">Track your streaming donations in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Messages
              <Badge variant="secondary" className="ml-1">
                {moderationDonations.filter(d => d.moderation_status === 'pending').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              OBS Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card style={{ borderColor: streamer.brand_color }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: streamer.brand_color }}>
                    {formatCurrency(totalAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground">All-time total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(monthlyAmount)}</div>
                  <p className="text-xs text-muted-foreground">Current month total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{donations.length}</div>
                  <p className="text-xs text-muted-foreground">Successful donations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {donations.length > 0 ? formatCurrency(totalAmount / donations.length) : formatCurrency(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per donation</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>Latest successful donations from your supporters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {donations.slice(0, 10).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {donation.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{donation.name}</p>
                          {donation.message && (
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {donation.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: streamer.brand_color }}>
                          {formatCurrency(donation.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                        {donation.is_hyperemote && (
                          <Badge variant="secondary" className="text-xs">
                            Hyperemote
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {donations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No donations yet. Share your donation link to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6 mt-6">
            <AnkitMessagesModerationPage />
          </TabsContent>

          <TabsContent value="obs" className="space-y-6 mt-6">
            <AnkitOBSSettings 
              streamer={streamer}
              onStreamerUpdate={handleStreamerUpdate}
              obsToken={obsToken}
              onTokenRegenerate={async () => {
                const newToken = await obsTokenCache.regenerateToken(streamer.id);
                setObsToken(newToken);
                return newToken;
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Connection Status - Top Right, below header */}
        <div className="fixed top-20 right-4 z-40">
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2
            ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-600 border border-green-200' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-200' :
              'bg-red-500/20 text-red-600 border border-red-200'}
          `}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            {connectionStatus === 'connected' ? 'Live Updates' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </div>
        </div>

        {/* Debug Panel - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-50">
          <RealtimeDebugPanel 
            streamerId={streamer?.id}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>
    </div>
  );
};

// Wrapper component with provider
const AnkitDashboard = () => {
  const { session, loading } = useSimpleAnkitAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/ankit/login" replace />;
  }

  return (
    <AnkitRealtimeProvider session={session}>
      <AnkitDashboardContent />
    </AnkitRealtimeProvider>
  );
};

export default AnkitDashboard;