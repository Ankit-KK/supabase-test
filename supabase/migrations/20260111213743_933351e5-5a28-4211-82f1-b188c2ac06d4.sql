-- Add leaderboard widget toggle for streamers
ALTER TABLE streamers 
ADD COLUMN leaderboard_widget_enabled BOOLEAN DEFAULT true;