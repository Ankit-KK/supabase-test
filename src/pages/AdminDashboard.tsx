import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, LogOut, ExternalLink, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamers, setStreamers] = useState([]);
  const [stats, setStats] = useState<Record<string, { total_donations: number }>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple admin authentication - you can set your admin credentials
      const ADMIN_EMAIL = 'admin@streamers.com';
      const ADMIN_PASSWORD = 'admin123';

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_session', JSON.stringify({
          email,
          logged_in_at: new Date().toISOString()
        }));
        
        setIsAuthenticated(true);
        fetchAdminData();
        
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the admin dashboard!",
        });
      } else {
        throw new Error('Invalid admin credentials');
      }

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Get all streamers
      const { data: streamersData, error: streamersError } = await supabase
        .from('streamers')
        .select('*')
        .order('created_at', { ascending: false });

      if (streamersError) throw streamersError;
      setStreamers(streamersData || []);

      // Get stats for each streamer - simplified approach
      const streamerStats: Record<string, any> = {};
      
      for (const streamer of streamersData || []) {
        // For demo purposes, set basic stats
        streamerStats[streamer.id] = {
          total_donations: Math.floor(Math.random() * 50) // Demo data
        };
      }
      
      setStats(streamerStats);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  const openStreamerDashboard = (streamerSlug: string) => {
    // Open streamer's public page
    window.open(`/${streamerSlug}`, '_blank');
  };

  const openStreamerLogin = (streamerSlug: string) => {
    // Open streamer's login page
    window.open(`/${streamerSlug}/login`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-purple-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-purple-500/20 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="h-8 w-8 text-purple-400" />
              <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
            </div>
            <CardDescription className="text-purple-200">
              Access all streamer dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-purple-200">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-purple-500/30 text-white"
                  placeholder="admin@streamers.com"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-purple-200">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-purple-500/30 text-white"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
              >
                {loading ? 'Signing In...' : 'Admin Sign In'}
              </Button>
            </form>
            
            <div className="mt-4 text-xs text-slate-400 text-center">
              Demo credentials: admin@streamers.com / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-500/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Total Streamers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{streamers.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-300">Active Streamers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {streamers.filter(s => s.obs_token).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-300">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Object.values(stats).reduce((sum: number, stat: any) => sum + (stat?.total_donations || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Streamers List */}
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">All Streamers</CardTitle>
            <CardDescription className="text-purple-200">
              Manage and access all streamer dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamers.map((streamer) => (
                <Card key={streamer.id} className="bg-slate-700/30 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{streamer.streamer_name}</CardTitle>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: streamer.brand_color }}
                      />
                    </div>
                    <CardDescription className="text-slate-400">
                      /{streamer.streamer_slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Donations:</span>
                        <span className="text-white">{stats[streamer.id]?.total_donations || 0}</span>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStreamerDashboard(streamer.streamer_slug)}
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Public Page
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStreamerLogin(streamer.streamer_slug)}
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                        >
                          Dashboard
                        </Button>
                      </div>

                      <div className="flex gap-1 flex-wrap">
                        {streamer.hyperemotes_enabled && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-300">
                            Hyperemotes
                          </Badge>
                        )}
                        {streamer.obs_token && (
                          <Badge variant="outline" className="text-xs border-green-400 text-green-300">
                            OBS Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;