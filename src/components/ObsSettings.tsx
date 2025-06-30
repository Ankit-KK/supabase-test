
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Eye, Settings, ExternalLink } from "lucide-react";
import { generateObsToken } from "@/utils/secureIdGenerator";

const ObsSettings = () => {
  const [obsToken, setObsToken] = useState<string>("");
  const [showMessages, setShowMessages] = useState(true);
  const [showGoal, setShowGoal] = useState(false);
  const [goalName, setGoalName] = useState("Support Goal");
  const [goalTarget, setGoalTarget] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateToken = async () => {
    setIsGenerating(true);
    try {
      // Call Supabase function to create OBS token
      const { data, error } = await supabase.rpc('create_obs_token', {
        p_admin_type: 'chiaa_gaming'
      });

      if (error) {
        console.error("Error generating OBS token:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate OBS token. Please try again.",
        });
        return;
      }

      setObsToken(data);
      toast({
        title: "OBS Token Generated",
        description: "Your secure OBS token has been created successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getObsUrl = () => {
    if (!obsToken) return "";
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      showMessages: showMessages.toString(),
      showGoal: showGoal.toString(),
      goalName,
      goalTarget: goalTarget.toString(),
    });
    return `${baseUrl}/chiaa_gaming/obs/${obsToken}?${params}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const openPreview = () => {
    const url = getObsUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="bg-black/50 border-pink-500/30">
      <CardHeader>
        <CardTitle className="text-pink-100 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          OBS Overlay Settings
        </CardTitle>
        <CardDescription className="text-pink-300">
          Generate secure OBS overlay links for your streaming setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Generation */}
        <div className="space-y-3">
          <Label className="text-pink-200">OBS Access Token</Label>
          {obsToken ? (
            <div className="flex items-center gap-2">
              <Input 
                value={obsToken} 
                readOnly 
                className="bg-black/30 border-pink-500/50 text-pink-100 font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(obsToken)}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={generateToken} 
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isGenerating ? "Generating..." : "Generate OBS Token"}
            </Button>
          )}
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <Label className="text-pink-200 text-base font-semibold">Display Options</Label>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-pink-100">Show Donation Messages</Label>
              <p className="text-sm text-pink-300">Display donation alerts and messages</p>
            </div>
            <Switch
              checked={showMessages}
              onCheckedChange={setShowMessages}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-pink-100">Show Goal Progress</Label>
              <p className="text-sm text-pink-300">Display donation goal tracker</p>
            </div>
            <Switch
              checked={showGoal}
              onCheckedChange={setShowGoal}
            />
          </div>

          {showGoal && (
            <div className="space-y-3 pl-4 border-l-2 border-pink-500/30">
              <div>
                <Label className="text-pink-200">Goal Name</Label>
                <Input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="bg-black/30 border-pink-500/50 text-pink-100"
                  placeholder="Support Goal"
                />
              </div>
              <div>
                <Label className="text-pink-200">Goal Target (₹)</Label>
                <Input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="bg-black/30 border-pink-500/50 text-pink-100"
                  min="1"
                />
              </div>
            </div>
          )}
        </div>

        {/* OBS URL */}
        {obsToken && (
          <div className="space-y-3">
            <Label className="text-pink-200">OBS Browser Source URL</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={getObsUrl()} 
                readOnly 
                className="bg-black/30 border-pink-500/50 text-pink-100 font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(getObsUrl())}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openPreview}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-pink-300">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/50">
                Secure
              </Badge>
              <span>Token expires in 24 hours</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-200 font-semibold mb-2">OBS Setup Instructions</h4>
          <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
            <li>Generate an OBS token above</li>
            <li>Copy the Browser Source URL</li>
            <li>In OBS, add a new Browser Source</li>
            <li>Paste the URL and set dimensions to 1920x1080</li>
            <li>Enable "Shutdown source when not visible" and "Refresh browser when scene becomes active"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObsSettings;
