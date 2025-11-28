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
      <SagarUjjwalGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#ef4444"
        streamerName="SAGAR UJJWAL GAMING"
      />
      
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: sagarujjwalgaming-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
        </div>
      )}
    </div>
  );
};

export default SagarUjjwalGamingObsAlerts;