
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Play, Pause } from "lucide-react";

interface GifUploadProps {
  onGifSelect: (file: File | null) => void;
  selectedGif: File | null;
  disabled?: boolean;
}

const GifUpload: React.FC<GifUploadProps> = ({ onGifSelect, selectedGif, disabled }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateGif = (file: File): boolean => {
    // Check file type
    if (!file.type.includes('gif')) {
      toast({
        title: "Invalid file type",
        description: "Please select a GIF file only",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "GIF must be smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateGif(file)) {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPlaying(true);
    onGifSelect(file);
  };

  const handleRemoveGif = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsPlaying(true);
    onGifSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs sm:text-sm font-medium text-white">
        Upload GIF Alert (Optional) {disabled && "(Disabled - Voice/Sound selected)"}
      </label>
      
      {!selectedGif ? (
        <div className="relative">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".gif"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400 h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            {disabled ? "Voice/Sound selected - GIF disabled" : "Choose GIF (Max 5MB)"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative bg-black/20 rounded-lg p-3 border border-pink-300/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-medium">
                  {selectedGif.name}
                </span>
                <span className="text-white/70 text-xs">
                  ({formatFileSize(selectedGif.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveGif}
                className="text-pink-200 hover:text-pink-100 hover:bg-pink-500/20 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="GIF preview"
                  className="w-full max-w-xs mx-auto rounded-lg border border-pink-300/30"
                  style={{ 
                    maxHeight: '150px',
                    objectFit: 'contain',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayback}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-white/80">
            Your GIF will be displayed as an animated alert on stream for 12 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default GifUpload;
