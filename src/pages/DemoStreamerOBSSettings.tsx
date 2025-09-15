import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoStreamerAuth } from "@/hooks/useDemoStreamerAuth";
import { generateObsToken } from "@/utils/secureIdGenerator";
import { 
  Copy, 
  RefreshCcw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Monitor,
  Settings,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export default function DemoStreamerOBSSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading } = useDemoStreamerAuth();
  const [obsToken, setObsToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [alertsUrl, setAlertsUrl] = useState('');

  useEffect(() => {
    if (!loading && !session) {
      navigate('/demostreamer/login');
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (session) {
      loadObsToken();
    }
  }, [session]);

  const loadObsToken = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_active_obs_token', { streamer_id: session?.streamerId });

      if (error) {
        console.error('Error loading OBS token:', error);
        return;
      }

      if (data) {
        setObsToken(data);
        updateUrls(data);
      }
    } catch (error) {
      console.error('Error loading OBS token:', error);
    }
  };

  const updateUrls = (token: string) => {
    const baseUrl = window.location.origin;
    setAlertsUrl(`${baseUrl}/demostreamer-alerts/${token}`);
  };

  const generateNewToken = async () => {
    try {
      setIsGenerating(true);
      
      const newToken = generateObsToken();
      
      const { data, error } = await supabase
        .rpc('regenerate_obs_token', {
          p_streamer_id: session?.streamerId,
          p_new_token: newToken
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const generatedToken = data[0].token;
        setObsToken(generatedToken);
        updateUrls(generatedToken);
        
        toast({
          title: "Token generated",
          description: "New OBS token has been generated successfully"
        });
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Failed to generate token",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied`
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Failed to copy",
        description: "Please copy the text manually",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OBS settings...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/demostreamer/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OBS Settings</h1>
              <p className="text-gray-600">Configure your streaming alerts and overlays</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Token Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                OBS Token
              </CardTitle>
              <CardDescription>
                Generate and manage your secure OBS token for alerts and overlays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="obs-token">Current Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="obs-token"
                      type={showToken ? "text" : "password"}
                      value={obsToken}
                      readOnly
                      placeholder="No token generated yet"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(obsToken, 'OBS Token')}
                    disabled={!obsToken}
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={generateNewToken}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {obsToken ? 'Regenerate Token' : 'Generate Token'}
                  </>
                )}
              </Button>

              {obsToken && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Keep this token secure! Anyone with this token can access your donation alerts.
                    If you suspect it's been compromised, regenerate a new one immediately.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browser Sources */}
          {obsToken && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Donation Alerts
                  </CardTitle>
                  <CardDescription>
                    Browser source URL for donation alerts overlay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alerts-url">Browser Source URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="alerts-url"
                        value={alertsUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(alertsUrl, 'Alerts URL')}
                        variant="outline"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(alertsUrl, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">OBS Setup Instructions:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>In OBS, add a new "Browser Source"</li>
                      <li>Paste the URL above into the URL field</li>
                      <li>Set Width: 1920, Height: 1080</li>
                      <li>Enable "Shutdown source when not visible"</li>
                      <li>Enable "Refresh browser when scene becomes active"</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </div>
    </div>
  );
}