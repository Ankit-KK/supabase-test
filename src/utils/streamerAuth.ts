
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
  // Return true if the auth key exists and is set to "true"
  return sessionStorage.getItem(authKey) === "true";
};

/**
 * Set the login state for a streamer
 * @param streamerType The type of streamer (ankit or harish)
 * @param isLoggedIn Boolean indicating if the streamer is logged in
 */
export const setStreamerLoginState = (streamerType: 'ankit' | 'harish', isLoggedIn: boolean): void => {
  const authKey = `${streamerType}Auth`;
  if (isLoggedIn) {
    sessionStorage.setItem(authKey, "true");
  } else {
    sessionStorage.removeItem(authKey);
  }
};

