import React from 'react';
import { useUniversalOBS } from '@/hooks/useUniversalOBS';
import { useParams } from 'react-router-dom';

const UniversalAlertDisplay = () => {
  const { token } = useParams();
  const streamerSlug = new URLSearchParams(window.location.search).get('streamer') || 'demostreamer';
  
  const { currentAlert, isVisible, connectionStatus } = useUniversalOBS(
    token || '',
    streamerSlug
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-bold">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-sm ${
          connectionStatus === 'connected' 
            ? 'bg-green-600' 
            : connectionStatus === 'connecting'
            ? 'bg-yellow-600'
            : 'bg-red-600'
        }`}>
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 
           'Disconnected'}
        </div>
      </div>

      {/* Alert Display */}
      {currentAlert && (
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-all duration-500 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className={`
            relative p-8 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 text-center
            ${currentAlert.is_hyperemote 
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-500 animate-pulse' 
              : 'bg-gradient-to-br from-blue-600 to-purple-700'
            }
          `}>
            
            {/* Hyperemote Effects */}
            {currentAlert.is_hyperemote && (
              <>
                <div className="absolute -top-4 -left-4 text-6xl animate-bounce">🎉</div>
                <div className="absolute -top-4 -right-4 text-6xl animate-bounce delay-100">✨</div>
                <div className="absolute -bottom-4 -left-4 text-6xl animate-bounce delay-200">🚀</div>
                <div className="absolute -bottom-4 -right-4 text-6xl animate-bounce delay-300">💫</div>
              </>
            )}

            {/* Amount */}
            <div className="mb-4">
              <div className={`text-6xl font-black mb-2 ${
                currentAlert.is_hyperemote 
                  ? 'text-yellow-200 animate-pulse' 
                  : 'text-white'
              }`}>
                {formatAmount(currentAlert.amount)}
              </div>
              {currentAlert.is_hyperemote && (
                <div className="text-2xl font-bold text-yellow-200 animate-bounce">
                  🎊 HYPEREMOTE! 🎊
                </div>
              )}
            </div>

            {/* Donor Name */}
            <div className="mb-4">
              <div className="text-2xl text-white/90 mb-1">Thank you</div>
              <div className={`text-4xl font-black ${
                currentAlert.is_hyperemote 
                  ? 'text-yellow-100 animate-pulse' 
                  : 'text-white'
              }`}>
                {currentAlert.name}!
              </div>
            </div>

            {/* Message */}
            {currentAlert.message && (
              <div className="mb-4">
                <div className={`text-xl ${
                  currentAlert.is_hyperemote 
                    ? 'text-yellow-100' 
                    : 'text-white/90'
                } bg-black/20 rounded-xl p-4 backdrop-blur-sm`}>
                  "{currentAlert.message}"
                </div>
              </div>
            )}

            {/* Voice Message Indicator */}
            {currentAlert.voice_message_url && (
              <div className="mb-4">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                  currentAlert.is_hyperemote 
                    ? 'bg-yellow-200 text-purple-800' 
                    : 'bg-white/20 text-white'
                } backdrop-blur-sm animate-pulse`}>
                  🎤 Voice Message Playing
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalAlertDisplay;