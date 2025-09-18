import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, LogOut, Eye, Settings, BarChart3, Copy, ExternalLink } from 'lucide-react';

const TechGamerDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [obsToken, setObsToken] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem('techgamer_session');
    if (!session) {
      navigate('/techgamer/login');
      return;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get streamer info
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('id, obs_token')
        .eq('streamer_slug', 'techgamer')
        .single();

      if (streamerError) throw streamerError;

      setObsToken(streamerData.obs_token || '');

      // Get donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('techgamer_donations')
        .select('*')
        .eq('streamer_id', streamerData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (donationsError) throw donationsError;

      setDonations(donationsData || []);

      // Calculate stats
      const total = donationsData?.length || 0;
      const pending = donationsData?.filter(d => d.moderation_status === 'pending').length || 0;
      const approved = donationsData?.filter(d => d.moderation_status === 'approved' || d.moderation_status === 'auto_approved').length || 0;

      setStats({ total, pending, approved });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('techgamer_session');
    supabase.auth.signOut();
    navigate('/techgamer');
  };

  const copyObsUrl = () => {
    if (obsToken) {
      const obsUrl = `${window.location.origin}/techgamer-alerts/${obsToken}`;
      navigator.clipboard.writeText(obsUrl);
      toast({
        title: "Copied!",
        description: "OBS alert URL copied to clipboard"
      });
    }
  };

  const openObsUrl = () => {
    if (obsToken) {
      const obsUrl = `${window.location.origin}/techgamer-alerts/${obsToken}`;
      window.open(obsUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">TechGamer Dashboard</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-500/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-300 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.approved}</div>
            </CardContent>
          </Card>
        </div>

        {/* OBS Integration */}
        <Card className="bg-slate-800/50 border-blue-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">OBS Integration</CardTitle>
            <CardDescription className="text-blue-200">
              Add this URL as a Browser Source in OBS for live donation alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {obsToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button onClick={copyObsUrl} variant="outline" size="sm" className="border-blue-500 text-blue-300">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button onClick={openObsUrl} variant="outline" size="sm" className="border-blue-500 text-blue-300">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Alert
                  </Button>
                </div>
                <div className="text-sm text-slate-400 bg-slate-700/30 p-3 rounded font-mono break-all">
                  {window.location.origin}/techgamer-alerts/{obsToken}
                </div>
              </div>
            ) : (
              <div className="text-slate-400">OBS token not configured</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Donations</CardTitle>
            <CardDescription className="text-blue-200">
              Latest donations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="font-medium text-white">{donation.name}</div>
                      <div className="text-sm text-slate-400">₹{donation.amount}</div>
                      {donation.message && (
                        <div className="text-sm text-blue-300 mt-1">{donation.message}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved' 
                            ? 'default' 
                            : donation.moderation_status === 'pending' 
                            ? 'secondary' 
                            : 'destructive'
                        }
                      >
                        {donation.moderation_status}
                      </Badge>
                      {donation.is_hyperemote && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-300">
                          ⚡ Hyperemote
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-8">
                  No donations yet. Share your donation link to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechGamerDashboard;