
/**
 * Utility functions to check streamer authentication status
 */

/**
 * Check if a specific streamer is currently logged in
 * @param streamerType The type of streamer to check (ankit or harish)
 * @returns boolean indicating if the streamer is logged in
 */
export const isStreamerLoggedIn = (streamerType: 'ankit' | 'harish'): boolean => {
  const authKey = `${streamerType}Auth`;
  return sessionStorage.getItem(authKey) === "true";
};
