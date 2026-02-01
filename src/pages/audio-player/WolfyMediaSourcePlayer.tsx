/**
 * DEPRECATED: OBS Media Source is no longer supported
 * 
 * OBS Media Source re-downloads audio on every play, scene change, and replay,
 * causing 3-10x bandwidth amplification.
 * 
 * Please use OBS Browser Source with the alerts page instead:
 * /obs/alerts/wolfy
 */

const WolfyMediaSourcePlayer = () => {
  return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">
          ⚠️ Media Source Deprecated
        </h1>
        <p className="text-gray-700 mb-4">
          OBS Media Source causes excessive bandwidth usage due to repeated audio downloads.
        </p>
        <p className="text-gray-700 mb-4">
          Please switch to OBS Browser Source using your alerts URL instead.
        </p>
        <code className="block bg-gray-100 p-2 rounded text-sm mb-4">
          /obs/alerts/wolfy
        </code>
        <p className="text-gray-500 text-xs">
          The Browser Source handles both audio and visual alerts with proper caching.
        </p>
      </div>
    </div>
  );
};

export default WolfyMediaSourcePlayer;
