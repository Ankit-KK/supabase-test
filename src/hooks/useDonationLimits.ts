export const useDonationLimits = () => {
  const getCharacterLimit = (amount: number): number => {
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    if (amount >= 40) return 100;
    return 100;
  };

  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    if (amount >= 3) return 3;
    return 3;
  };

  return {
    getCharacterLimit,
    getVoiceDuration
  };
};
