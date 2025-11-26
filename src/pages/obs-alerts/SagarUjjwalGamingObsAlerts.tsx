import { usePusherConfig } from '@/hooks/usePusherConfig';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { SagarUjjwalGamingAlertDisplay } from '@/components/SagarUjjwalGamingAlertDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const SagarUjjwalGamingObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading, error: configError } = usePusherConfig('sagarujjwalgaming');
  
  const { 
    currentAlert, 
    isVisible, 
    connectionStatus 
  } = usePusherAlerts({
    channelName: 'sagarujjwalgaming-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayBeforeDisplay: 60000,
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <p className="text-white">Loading configuration...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <p className="text-red-500">Error: {configError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' :
          'bg-red-500'
        } text-white`}>
          {connectionStatus}
        </div>
      </div>
      
      <SagarUjjwalGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#ef4444"
        streamerName="SAGAR UJJWAL GAMING"
      />
    </div>
  );
};

export default SagarUjjwalGamingObsAlerts;