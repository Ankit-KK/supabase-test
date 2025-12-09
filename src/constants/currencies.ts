// Razorpay supported currencies with exponents and display info
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exponent: number; // 0, 2, or 3 decimal places
  spokenName: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  // Common currencies (shown first)
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exponent: 2, spokenName: 'rupees' },
  { code: 'USD', name: 'US Dollar', symbol: '$', exponent: 2, spokenName: 'dollars' },
  { code: 'EUR', name: 'Euro', symbol: '€', exponent: 2, spokenName: 'euros' },
  { code: 'GBP', name: 'British Pound', symbol: '£', exponent: 2, spokenName: 'pounds' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exponent: 2, spokenName: 'dirhams' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exponent: 2, spokenName: 'Singapore dollars' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exponent: 2, spokenName: 'Australian dollars' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exponent: 2, spokenName: 'Canadian dollars' },
  
  // Zero decimal currencies
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exponent: 0, spokenName: 'yen' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', exponent: 0, spokenName: 'won' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', exponent: 0, spokenName: 'dong' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', exponent: 0, spokenName: 'pesos' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', exponent: 0, spokenName: 'krónur' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', exponent: 0, spokenName: 'guaraníes' },
  
  // Three decimal currencies
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', exponent: 3, spokenName: 'Kuwaiti dinars' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', exponent: 3, spokenName: 'Bahraini dinars' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', exponent: 3, spokenName: 'Omani rials' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', exponent: 3, spokenName: 'Jordanian dinars' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', exponent: 3, spokenName: 'Tunisian dinars' },
  
  // Other common international currencies (2 decimal)
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exponent: 2, spokenName: 'Swiss francs' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', exponent: 2, spokenName: 'New Zealand dollars' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', exponent: 2, spokenName: 'Hong Kong dollars' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', exponent: 2, spokenName: 'Swedish kronor' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', exponent: 2, spokenName: 'Norwegian kroner' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', exponent: 2, spokenName: 'Danish kroner' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', exponent: 2, spokenName: 'złoty' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', exponent: 2, spokenName: 'koruny' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', exponent: 2, spokenName: 'forints' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', exponent: 2, spokenName: 'baht' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', exponent: 2, spokenName: 'ringgit' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', exponent: 2, spokenName: 'pesos' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', exponent: 2, spokenName: 'rupiah' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', exponent: 2, spokenName: 'rand' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', exponent: 2, spokenName: 'pesos' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', exponent: 2, spokenName: 'reais' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', exponent: 2, spokenName: 'riyals' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', exponent: 2, spokenName: 'riyals' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', exponent: 2, spokenName: 'lira' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', exponent: 2, spokenName: 'rubles' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', exponent: 2, spokenName: 'shekels' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exponent: 2, spokenName: 'pounds' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', exponent: 2, spokenName: 'rupees' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', exponent: 2, spokenName: 'taka' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', exponent: 2, spokenName: 'rupees' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', exponent: 2, spokenName: 'rupees' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exponent: 2, spokenName: 'naira' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exponent: 2, spokenName: 'shillings' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', exponent: 2, spokenName: 'cedis' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', exponent: 2, spokenName: 'Taiwan dollars' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exponent: 2, spokenName: 'yuan' },
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

// Convert amount to subunits based on currency exponent
export const amountToSubunits = (amount: number, currencyCode: string): number => {
  const exponent = getCurrencyExponent(currencyCode);
  
  if (exponent === 0) {
    // Zero decimal (JPY, KRW, etc.) - amount as-is
    return Math.round(amount);
  } else if (exponent === 3) {
    // Three decimal (KWD, BHD, OMR) - multiply by 1000
    // Razorpay requires last digit to be 0 for 3-decimal currencies
    const subunits = Math.round(amount * 1000);
    return Math.floor(subunits / 10) * 10;
  } else {
    // Two decimal (most currencies) - multiply by 100
    return Math.round(amount * 100);
  }
};
