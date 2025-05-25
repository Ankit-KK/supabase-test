
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";

const ChiaaGaming = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to main website
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div 
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
            linear-gradient(135deg, #fef7ff 0%, #faf5ff 25%, #fdf2f8 50%, #f0f9ff 75%, #fef7ff 100%)
          `
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
              Redirecting...
            </h1>
            <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
          </div>
          <p className="text-pink-800 text-lg font-semibold">
            Taking you back to the main site 💕
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChiaaGaming;
