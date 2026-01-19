import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileImage,
  Loader2
} from 'lucide-react';

interface MediaUploaderProps {
  streamerSlug: string;
  onMediaUploaded: (url: string, type: 'image' | 'gif' | 'video') => void;
  onMediaRemoved: () => void;
  disabled?: boolean;
  maxFileSizeMB?: number;
  maxVideoDurationSeconds?: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_GIF_TYPES = ['image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_GIF_TYPES, ...ALLOWED_VIDEO_TYPES];

const MediaUploader: React.FC<MediaUploaderProps> = ({
  streamerSlug,
  onMediaUploaded,
  onMediaRemoved,
  disabled = false,
  maxFileSizeMB = 10,
  maxVideoDurationSeconds = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'gif' | 'video' } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getMediaType = (mimeType: string): 'image' | 'gif' | 'video' => {
    if (ALLOWED_GIF_TYPES.includes(mimeType)) return 'gif';
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
    return 'image';
  };

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > maxVideoDurationSeconds) {
          toast({
            title: "Video too long",
            description: `Maximum video duration is ${maxVideoDurationSeconds} seconds. Your video is ${Math.round(video.duration)} seconds.`,
            variant: "destructive",
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        toast({
          title: "Invalid video",
          description: "Unable to read video file. Please try another file.",
          variant: "destructive",
        });
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const validateFile = async (file: File): Promise<boolean> => {
    // Check file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP, GIF, MP4, or WebM file.",
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxFileSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
        variant: "destructive",
      });
      return false;
    }

    // Check video duration
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
      const isDurationValid = await validateVideoDuration(file);
      if (!isDurationValid) return false;
    }

    return true;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File) => {
    const isValid = await validateFile(file);
    if (!isValid) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      const mediaType = getMediaType(file.type);
      setPreview({ url: previewUrl, type: mediaType });
      setUploadProgress(30);

      // Convert to base64
      const base64Data = await fileToBase64(file);
      setUploadProgress(50);

      // Upload to R2 via edge function
      const { data, error } = await supabase.functions.invoke('upload-donation-media', {
        body: {
          mediaData: base64Data,
          streamerSlug,
          mimeType: file.type,
          fileName: file.name
        }
      });

      setUploadProgress(90);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Upload failed');

      const uploadedMediaUrl = data.media_url;
      setUploadedUrl(uploadedMediaUrl);
      onMediaUploaded(uploadedMediaUrl, mediaType);
      setUploadProgress(100);

      toast({
        title: "Media uploaded",
        description: "Your media has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Media upload error:', error);
      setPreview(null);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload media. Please try again.',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || uploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [disabled, uploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    onMediaRemoved();
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {preview ? (
        <div className="relative rounded-lg border border-border bg-muted/30 p-2">
          {/* Preview content */}
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black/10 flex items-center justify-center">
            {preview.type === 'video' ? (
              <video
                ref={videoRef}
                src={preview.url}
                className="max-h-full max-w-full object-contain"
                controls
                muted
                loop
              />
            ) : (
              <img
                src={preview.url}
                alt="Media preview"
                className="max-h-full max-w-full object-contain"
              />
            )}
            
            {/* Remove button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}

          {/* Media type badge */}
          <div className="mt-2 flex items-center gap-2">
            {preview.type === 'image' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                <ImageIcon className="h-3 w-3" /> Image
              </span>
            )}
            {preview.type === 'gif' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
                <FileImage className="h-3 w-3" /> GIF
              </span>
            )}
            {preview.type === 'video' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                <VideoIcon className="h-3 w-3" /> Video
              </span>
            )}
            {uploadedUrl && (
              <span className="text-xs text-muted-foreground">Ready to send</span>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex flex-col items-center justify-center
            rounded-lg border-2 border-dashed p-6 cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground/50" />
          )}
          
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {uploading 
              ? 'Uploading...' 
              : 'Drag & drop or click to upload'
            }
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70 text-center">
            JPG, PNG, WebP, GIF, MP4, WebM (max {maxFileSizeMB}MB)
          </p>
          {ALLOWED_VIDEO_TYPES.length > 0 && (
            <p className="text-xs text-muted-foreground/70 text-center">
              Videos max {maxVideoDurationSeconds} seconds
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
