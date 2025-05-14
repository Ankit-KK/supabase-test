
/**
 * Utility functions for dashboard calculations
 */

/**
 * Calculate total donations for the current month
 * @param donations Array of donation objects
 * @returns The sum of donation amounts for the current month
 */
export const calculateMonthlyTotal = (donations: any[]) => {
  if (!donations || donations.length === 0) return 0;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Filter donations for current month
  const monthlyDonations = donations.filter(donation => {
    const donationDate = new Date(donation.created_at);
    return donationDate.getMonth() === currentMonth && 
           donationDate.getFullYear() === currentYear;
  });
  
  // Sum up the amounts
  return monthlyDonations.reduce((sum, donation) => sum + Number(donation.amount), 0);
};

/**
 * Format currency with the given symbol
 * @param amount Numeric amount to format
 * @param symbol Currency symbol (defaults to ₹)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, symbol: string = '₹') => {
  return `${symbol}${amount.toLocaleString()}`;
};
