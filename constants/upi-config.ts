/**
 * UPI Configuration and Intent URLs
 */

import { MERCHANT_PARAM_KEYS } from '@/services/upi-parser';

export const UPI_CONFIG = {
  currency: 'INR',
};

/**
 * Build universal UPI intent URL for P2P transactions.
 * Only includes basic params (pa, pn, am, cu, tn) - no merchant security params.
 * Use this for manual entry or when reconstructing P2P payments.
 */
export const buildUPIUrl = (params: {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
}): string => {
  const { upiId, payeeName, amount, transactionNote } = params;
  
  const queryParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toString(),
    cu: UPI_CONFIG.currency,
  });

  if (transactionNote) {
    queryParams.set('tn', transactionNote);
  }

  return `upi://pay?${queryParams.toString()}`;
};

/**
 * Check if QR data contains merchant-specific parameters.
 * Merchant QR codes include sign, mc, mode, orgid, purpose, or tid params.
 * These require the original URL to be preserved for security validation.
 * 
 * @param qrData - Raw QR code data string
 * @returns true if QR contains merchant parameters
 */
export const isMerchantQRCode = (qrData: string): boolean => {
  try {
    if (!qrData) return false;
    
    // Normalize for parsing
    let normalizedData = qrData.trim();
    if (normalizedData.toLowerCase().startsWith('upi://')) {
      normalizedData = 'upi://' + normalizedData.substring(6);
    } else if (normalizedData.toLowerCase().startsWith('upi:')) {
      normalizedData = 'upi://' + normalizedData.substring(4);
    } else {
      return false;
    }
    
    const url = new URL(normalizedData);
    
    // Check if any merchant param key exists with a non-empty value
    return MERCHANT_PARAM_KEYS.some(key => {
      const value = url.searchParams.get(key);
      // For 'sign', ensure it's not empty
      if (key === 'sign') {
        return value && value.trim().length > 0;
      }
      return value !== null;
    });
  } catch {
    return false;
  }
};
