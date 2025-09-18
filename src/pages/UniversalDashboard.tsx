import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUniversalAuth } from '@/hooks/useUniversalAuth';
import { useUniversalDashboard } from '@/hooks/useUniversalDashboard';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, LogOut, RefreshCw } from 'lucide-react';

const UniversalDashboard = () => {
  const { streamerSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: authLoading, logout } = useUniversalAuth(streamerSlug || '');
  
  const {
    donations,
    stats,
    obsToken,
    loading,
    approveDonation,
    rejectDonation,
    regenerateObsToken
  } = useUniversalDashboard(
    session?.id || '',
    streamerSlug || ''
  );

  useEffect(() => {
    if (!authLoading && !session?.isAuthenticated) {
      navigate(`/${streamerSlug}/login`);
    }
  }, [session, authLoading, navigate, streamerSlug]);

  const handleLogout = async () => {
    await logout();
    navigate(`/${streamerSlug}/login`);
  };

  const copyObsUrl = () => {
    if (!obsToken) return;
    const obsUrl = `https://hyperchat.space/alerts/${obsToken}?streamer=${streamerSlug}`;
    navigator.clipboard.writeText(obsUrl);
    toast({
      title: "Copied!",
      description: "OBS browser source URL copied to clipboard"
    });
  };

  const openObsUrl = () => {
    if (!obsToken) return;
    const obsUrl = `https://hyperchat.space/alerts/${obsToken}?streamer=${streamerSlug}`;
    window.open(obsUrl, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.isAuthenticated) {
    return null;
  }

  const streamerName = session.streamer_name || streamerSlug?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Streamer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8 pt-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {streamerName} Dashboard
            </h1>
            <p className="text-slate-300">
              Manage your donations and settings
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalDonations}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.pendingDonations}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.approvedDonations}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                ₹{stats.totalAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OBS Integration */}
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">OBS Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {obsToken ? (
                <>
                  <div className="flex gap-2">
                    <Button onClick={copyObsUrl} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy OBS URL
                    </Button>
                    <Button onClick={openObsUrl} variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </div>
                  <Button 
                    onClick={regenerateObsToken} 
                    variant="outline" 
                    className="w-full border-slate-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Token
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={regenerateObsToken}
                  className="w-full"
                >
                  Generate OBS Token
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {donations.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    No donations yet
                  </p>
                ) : (
                  donations.slice(0, 10).map((donation) => (
                    <div key={donation.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-white">
                            {donation.name}
                          </span>
                          <span className="text-green-400 font-bold ml-2">
                            ₹{donation.amount}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved'
                              ? 'default'
                              : donation.moderation_status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }>
                            {donation.moderation_status}
                          </Badge>
                          {donation.is_hyperemote && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                              Hyperemote
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {donation.message && (
                        <p className="text-slate-300 text-sm mb-2">
                          {donation.message}
                        </p>
                      )}

                      <div className="flex justify-between items-center">
                        <p className="text-slate-500 text-xs">
                          {new Date(donation.created_at).toLocaleString()}
                        </p>
                        
                        {donation.moderation_status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveDonation(donation.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectDonation(donation.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UniversalDashboard;