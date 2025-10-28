// Shared donation limit calculations for all streamer pages

export const getCharacterLimit = (amount: number): number => {
  if (amount >= 200) return 250;
  if (amount >= 100) return 200;
  if (amount >= 40) return 100;
  return 100;
};

export const getVoiceDuration = (amount: number): number => {
  if (amount >= 250) return 30;
  if (amount >= 200) return 20;
  if (amount >= 150) return 15;
  return 15;
};
