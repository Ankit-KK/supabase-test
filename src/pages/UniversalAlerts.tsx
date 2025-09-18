import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import UniversalAlertDisplay from '@/components/UniversalAlertDisplay';

const UniversalAlerts = () => {
  const { token } = useParams();
  const location = useLocation();
  
  // Get streamer slug from URL params
  const searchParams = new URLSearchParams(location.search);
  const streamerSlug = searchParams.get('streamer') || 'demostreamer';

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Alert URL</h1>
          <p className="text-slate-400">
            Please check your OBS browser source URL
          </p>
        </div>
      </div>
    );
  }

  return <UniversalAlertDisplay />;
};

export default UniversalAlerts;