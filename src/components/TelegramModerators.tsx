import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, MessageSquare, UserCheck } from "lucide-react";

interface Moderator {
  id: string;
  streamer_id: string;
  telegram_id: number;
  telegram_username?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

const TelegramModerators = () => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTelegramId, setNewTelegramId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchModerators();
  }, []);

  const fetchModerators = async () => {
    try {
      const { data, error } = await supabase
        .from("moderators")
        .select("*")
        .eq("streamer_id", "chiaa_gaming")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModerators(data || []);
    } catch (error) {
      console.error("Error fetching moderators:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch moderators",
      });
    } finally {
      setLoading(false);
    }
  };

  const addModerator = async () => {
    if (!newTelegramId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Telegram ID",
      });
      return;
    }

    const telegramId = parseInt(newTelegramId.trim());
    if (isNaN(telegramId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid numeric Telegram ID",
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("moderators")
        .insert({
          streamer_id: "chiaa_gaming",
          telegram_id: telegramId,
          telegram_username: newUsername.trim() || null,
          permissions: ["approve_donations"],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setModerators(prev => [data, ...prev]);
      setNewTelegramId("");
      setNewUsername("");
      
      toast({
        title: "Success",
        description: "Moderator added successfully",
      });
    } catch (error: any) {
      console.error("Error adding moderator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message.includes("duplicate") 
          ? "This Telegram ID is already registered" 
          : "Failed to add moderator",
      });
    } finally {
      setAdding(false);
    }
  };

  const toggleModerator = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("moderators")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setModerators(prev => 
        prev.map(mod => 
          mod.id === id ? { ...mod, is_active: !currentStatus } : mod
        )
      );

      toast({
        title: "Success",
        description: `Moderator ${!currentStatus ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error updating moderator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update moderator status",
      });
    }
  };

  const removeModerator = async (id: string) => {
    if (!confirm("Are you sure you want to remove this moderator?")) return;

    try {
      const { error } = await supabase
        .from("moderators")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setModerators(prev => prev.filter(mod => mod.id !== id));
      
      toast({
        title: "Success",
        description: "Moderator removed successfully",
      });
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove moderator",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/50 border-pink-500/30">
        <CardContent className="p-6">
          <div className="text-center text-pink-300">Loading moderators...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-pink-500/30">
      <CardHeader>
        <CardTitle className="text-pink-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Telegram Moderators
        </CardTitle>
        <CardDescription className="text-pink-300">
          Manage moderators who can approve donations via Telegram bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Moderator */}
        <div className="flex gap-2">
          <Input
            placeholder="Telegram ID (e.g., 123456789)"
            value={newTelegramId}
            onChange={(e) => setNewTelegramId(e.target.value)}
            className="bg-pink-500/10 border-pink-500/30 text-pink-100 placeholder:text-pink-400"
          />
          <Input
            placeholder="Username (optional)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="bg-pink-500/10 border-pink-500/30 text-pink-100 placeholder:text-pink-400"
          />
          <Button
            onClick={addModerator}
            disabled={adding || !newTelegramId.trim()}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>

        {/* Moderators List */}
        <div className="space-y-2">
          {moderators.length === 0 ? (
            <div className="text-center py-4 text-pink-300">
              No moderators configured. Add one above to get started.
            </div>
          ) : (
            moderators.map((moderator) => (
              <div
                key={moderator.id}
                className="flex items-center justify-between p-3 bg-pink-500/10 rounded-lg border border-pink-500/20"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-pink-400" />
                  <div>
                    <div className="font-medium text-pink-100">
                      ID: {moderator.telegram_id}
                      {moderator.telegram_username && (
                        <span className="text-pink-300 ml-2">(@{moderator.telegram_username})</span>
                      )}
                    </div>
                    <div className="text-sm text-pink-400">
                      Permissions: {moderator.permissions.join(", ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={moderator.is_active ? "default" : "secondary"}
                    className={moderator.is_active 
                      ? "bg-green-600/20 text-green-300 border-green-500/30" 
                      : "bg-red-600/20 text-red-300 border-red-500/30"
                    }
                  >
                    {moderator.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleModerator(moderator.id, moderator.is_active)}
                    className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
                  >
                    {moderator.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeModerator(moderator.id)}
                    className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <h4 className="text-blue-200 font-semibold mb-2">How to get Telegram ID:</h4>
          <ol className="text-blue-300 text-sm space-y-1">
            <li>1. Add @userinfobot to Telegram</li>
            <li>2. Send any message to the bot</li>
            <li>3. Copy the numeric ID from the response</li>
            <li>4. Add the ID here to register as moderator</li>
          </ol>
        </div>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <h4 className="text-green-200 font-semibold mb-2">Bot Setup:</h4>
          <p className="text-green-300 text-sm">
            Moderators will receive notifications when new donations need approval. 
            They can click Approve/Reject buttons directly in Telegram.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramModerators;