import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StreamerTestCard } from '@/components/admin/StreamerTestCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Streamer {
  id: string;
  streamer_name: string;
  streamer_slug: string;
  brand_color: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const { data, error } = await supabase
          .from('streamers')
          .select('id, streamer_name, streamer_slug, brand_color')
          .order('streamer_name');

        if (error) throw error;
        setStreamers(data || []);
      } catch (error) {
        console.error('Error fetching streamers:', error);
        toast.error('Failed to load streamers');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamers();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredStreamers = streamers.filter((streamer) =>
    streamer.streamer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    streamer.streamer_slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">🔒 Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium">{user?.email}</span>
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Test Alert System</h2>
            <p className="text-sm text-muted-foreground">
              Total Streamers: {streamers.length}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search streamers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStreamers.map((streamer) => (
            <StreamerTestCard
              key={streamer.id}
              streamerId={streamer.id}
              streamerName={streamer.streamer_name}
              streamerSlug={streamer.streamer_slug}
              brandColor={streamer.brand_color}
            />
          ))}
        </div>

        {filteredStreamers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No streamers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
