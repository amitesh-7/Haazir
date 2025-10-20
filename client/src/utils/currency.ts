/**
 * Currency formatting utilities for Indian Rupees
 */

/**
 * Formats number to Indian currency format (₹)
 * @param amount - The amount to format
 * @param includeDecimals - Whether to include decimal places
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, includeDecimals: boolean = false): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  
  return formatter.format(amount);
};

/**
 * Formats number using Indian numbering system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted number with Indian numbering
 */
export const formatIndianNumber = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

/**
 * Converts USD to INR (approximate rate: 1 USD = 83 INR)
 * @param usdAmount - Amount in USD
 * @returns Amount in INR
 */
export const convertUSDtoINR = (usdAmount: number): number => {
  const exchangeRate = 83; // Approximate USD to INR rate
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Gets currency symbol for India
 */
export const getCurrencySymbol = (): string => '₹';

/**
 * Pricing tiers for Indian market
 */
export const indianPricingTiers = {
  starter: {
    monthly: 2400,
    yearly: 24000,
    currency: 'INR'
  },
  professional: {
    monthly: 7200,
    yearly: 72000,
    currency: 'INR'
  },
  enterprise: {
    monthly: null,
    yearly: null,
    currency: 'INR',
    label: 'Custom'
  }
};