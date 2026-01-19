// Simplified currency support with hardcoded minimums for Razorpay

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exponent: number;
  spokenName: string;
  minText: number;
  minVoice: number;
  minHypersound: number;
  minMedia: number;
}

// Only 6 supported currencies with hardcoded minimums
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exponent: 2, spokenName: 'rupees', minText: 40, minVoice: 150, minHypersound: 30, minMedia: 100 },
  { code: 'USD', name: 'US Dollar', symbol: '$', exponent: 2, spokenName: 'dollars', minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', exponent: 2, spokenName: 'euros', minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', exponent: 2, spokenName: 'pounds', minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exponent: 2, spokenName: 'dirhams', minText: 4, minVoice: 12, minHypersound: 3, minMedia: 8 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exponent: 2, spokenName: 'Australian dollars', minText: 2, minVoice: 5, minHypersound: 1.5, minMedia: 3 },
];

// Get currency by code
export const getCurrencyByCode = (code: string): Currency | undefined => 
  SUPPORTED_CURRENCIES.find(c => c.code === code);

// Get currency symbol (fallback to code if not found)
export const getCurrencySymbol = (code: string): string => 
  getCurrencyByCode(code)?.symbol || code;

// Get spoken name for TTS
export const getSpokenCurrency = (code: string): string => 
  getCurrencyByCode(code)?.spokenName || code;

// Get exponent (default to 2 for unknown currencies)
export const getCurrencyExponent = (code: string): number => 
  getCurrencyByCode(code)?.exponent ?? 2;

// Get minimums for a currency (defaults to INR if not found)
export const getCurrencyMinimums = (code: string): { minText: number; minVoice: number; minHypersound: number; minMedia: number } => {
  const currency = getCurrencyByCode(code);
  return currency 
    ? { minText: currency.minText, minVoice: currency.minVoice, minHypersound: currency.minHypersound, minMedia: currency.minMedia }
    : { minText: 40, minVoice: 150, minHypersound: 30, minMedia: 100 }; // Default to INR
};

// Hardcoded exchange rates (approximate, for dashboard display)
export const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1,
  'USD': 89,
  'EUR': 94,
  'GBP': 113,
  'AED': 24,
  'AUD': 57,
};

// Convert any currency amount to INR equivalent
export const convertToINR = (amount: number, currency: string = 'INR'): number => {
  const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
  return amount * rate;
};

// Convert amount to subunits based on currency exponent
export const amountToSubunits = (amount: number, currencyCode: string): number => {
  const exponent = getCurrencyExponent(currencyCode);
  
  if (exponent === 0) {
    return Math.round(amount);
  } else if (exponent === 3) {
    const subunits = Math.round(amount * 1000);
    return Math.floor(subunits / 10) * 10;
  } else {
    return Math.round(amount * 100);
  }
};
