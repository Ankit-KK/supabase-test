import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Palette, 
  DollarSign, 
  Zap, 
  Save, 
  AlertCircle,
  Heart,
  Link,
  Copy,
  Trophy
} from 'lucide-react';

interface SettingsPanelProps {
  streamerData: {
    id: string;
    streamer_slug: string;
    streamer_name: string;
    brand_color?: string;
    brand_logo_url?: string;
    hyperemotes_enabled?: boolean;
    hyperemotes_min_amount?: number;
    leaderboard_widget_enabled?: boolean;
  };
  onSettingsUpdate: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  streamerData,
  onSettingsUpdate
}) => {
  const [settings, setSettings] = useState({
    streamer_name: streamerData.streamer_name,
    brand_color: streamerData.brand_color || '#3b82f6',
    brand_logo_url: streamerData.brand_logo_url || '',
    hyperemotes_enabled: streamerData.hyperemotes_enabled || false,
    hyperemotes_min_amount: streamerData.hyperemotes_min_amount || 1,
    leaderboard_widget_enabled: streamerData.leaderboard_widget_enabled ?? true
  });
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('streamers')
        .update({
          streamer_name: settings.streamer_name,
          brand_color: settings.brand_color,
          brand_logo_url: settings.brand_logo_url || null,
          hyperemotes_enabled: settings.hyperemotes_enabled,
          hyperemotes_min_amount: settings.hyperemotes_min_amount,
          leaderboard_widget_enabled: settings.leaderboard_widget_enabled
        })
        .eq('id', streamerData.id);

      if (error) throw error;

      // Broadcast settings update via Pusher for real-time OBS updates
      await supabase.functions.invoke('broadcast-settings-update', {
        body: {
          streamer_slug: streamerData.streamer_slug,
          settings: {
            brand_color: settings.brand_color,
            leaderboard_widget_enabled: settings.leaderboard_widget_enabled,
          }
        }
      });

      toast({
        title: "Settings Saved",
        description: "Your streamer settings have been updated successfully.",
      });

      onSettingsUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const donationUrl = `${window.location.origin}/${streamerData.streamer_slug}`;

  const copyDonationUrl = async () => {
    try {
      await navigator.clipboard.writeText(donationUrl);
      setCopySuccess(true);
      toast({
        title: "Copied!",
        description: "Donation URL copied to clipboard.",
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const predefinedColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow/Orange
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

  return (
    <div className="space-y-6">
      {/* Donation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Your Donation Link</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Share this link with your audience</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={donationUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyDonationUrl}
              >
                {copySuccess ? 
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Copied!
                  </Badge> :
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                }
              </Button>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Add this link to your stream overlays, social media bio, or anywhere you want to receive donations.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Branding & Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="streamer_name">Display Name</Label>
            <Input
              id="streamer_name"
              value={settings.streamer_name}
              onChange={(e) => handleInputChange('streamer_name', e.target.value)}
              placeholder="Your streamer name"
            />
          </div>

          {/* Brand Color */}
          <div className="space-y-3">
            <Label>Brand Color</Label>
            <div className="flex items-center space-x-3">
              <Input
                type="color"
                value={settings.brand_color}
                onChange={(e) => handleInputChange('brand_color', e.target.value)}
                className="w-16 h-10 p-1 rounded cursor-pointer"
              />
              <Input
                value={settings.brand_color}
                onChange={(e) => handleInputChange('brand_color', e.target.value)}
                placeholder="#3b82f6"
                className="font-mono"
              />
            </div>
            
            {/* Predefined Colors */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Quick colors:</span>
              {predefinedColors.map(color => (
                <button
                  key={color}
                  onClick={() => handleInputChange('brand_color', color)}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="brand_logo_url">Logo URL (Optional)</Label>
            <Input
              id="brand_logo_url"
              value={settings.brand_logo_url}
              onChange={(e) => handleInputChange('brand_logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {settings.brand_logo_url && (
              <div className="mt-2">
                <img 
                  src={settings.brand_logo_url} 
                  alt="Logo preview" 
                  className="w-16 h-16 object-contain rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hyperemotes Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Hyperemotes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Hyperemotes</Label>
              <p className="text-sm text-muted-foreground">
                Allow donors to send animated emotes with their donations
              </p>
            </div>
            <Switch
              checked={settings.hyperemotes_enabled}
              onCheckedChange={(checked) => handleInputChange('hyperemotes_enabled', checked)}
            />
          </div>

          {settings.hyperemotes_enabled && (
            <div className="space-y-2">
              <Label htmlFor="hyperemotes_min_amount">Minimum Amount for Hyperemotes</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="hyperemotes_min_amount"
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.hyperemotes_min_amount}
                  onChange={(e) => handleInputChange('hyperemotes_min_amount', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
                <span className="text-sm text-muted-foreground">INR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Donors need to donate at least this amount to send hyperemotes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard Widget Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Leaderboard Widget</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Leaderboard on OBS</Label>
              <p className="text-sm text-muted-foreground">
                Display Top Donator and !hyperchat widget on your stream
              </p>
            </div>
            <Switch
              checked={settings.leaderboard_widget_enabled}
              onCheckedChange={(checked) => handleInputChange('leaderboard_widget_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Advanced Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              More advanced settings like auto-moderation, custom webhooks, and API integrations 
              will be available in future updates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;