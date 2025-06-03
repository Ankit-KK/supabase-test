
import { useState, useEffect } from 'react';

export const use3DAnimation = () => {
  const [donationAmount, setDonationAmount] = useState(15000);
  const [goalAmount] = useState(50000);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate donation updates (you can replace this with real data)
  useEffect(() => {
    try {
      const interval = setInterval(() => {
        setDonationAmount(prev => {
          const newAmount = prev + Math.floor(Math.random() * 500);
          return Math.min(newAmount, goalAmount);
        });
      }, 5000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error in use3DAnimation hook:', error);
    }
  }, [goalAmount]);

  const triggerCelebration = () => {
    try {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    } catch (error) {
      console.error('Error in triggerCelebration:', error);
    }
  };

  return {
    donationAmount,
    goalAmount,
    isAnimating,
    triggerCelebration,
    progress: donationAmount / goalAmount
  };
};
