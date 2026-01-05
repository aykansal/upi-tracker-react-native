/**
 * UPI Configuration and Intent URLs
 */

import { UPIApp } from '@/components/upi-app-picker';
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
  amount?: number;
  transactionNote?: string;
}): string => {
  const { upiId, payeeName, amount, transactionNote } = params;

  const queryParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    cu: UPI_CONFIG.currency,
  });

  if (amount && amount > 0) {
    queryParams.set('am', amount.toString());
  }

  if (transactionNote) {
    queryParams.set('tn', transactionNote);
  }

  return `upi://pay?${queryParams.toString()}`;
};

/**
 * Modify existing UPI URL by updating/adding amount and transaction note.
 * For merchant QR codes, preserves all merchant params but updates am/tn if provided.
 * For P2P, rebuilds URL with new params.
 */
export const modifyUPIUrl = (
  originalUrl: string,
  amount?: number,
  transactionNote?: string
): string => {
  try {
    // Normalize URL
    let normalizedUrl = originalUrl.trim();
    if (normalizedUrl.toLowerCase().startsWith('upi://')) {
      normalizedUrl = 'upi://' + normalizedUrl.substring(6);
    } else if (normalizedUrl.toLowerCase().startsWith('upi:')) {
      normalizedUrl = 'upi://' + normalizedUrl.substring(4);
    } else {
      return originalUrl; // Return original if can't parse
    }

    const url = new URL(normalizedUrl);
    const params = url.searchParams;

    // Update amount if provided
    if (amount !== undefined && amount > 0) {
      params.set('am', amount.toString());
    }

    // Update transaction note if provided
    if (transactionNote !== undefined) {
      if (transactionNote.trim()) {
        params.set('tn', transactionNote);
      } else {
        params.delete('tn'); // Remove if empty
      }
    }

    // Rebuild URL
    return `upi://pay?${params.toString()}`;
  } catch (error) {
    console.error('Error modifying UPI URL:', error);
    return originalUrl; // Return original on error
  }
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

export const UPI_APPS: UPIApp[] = [
  {
    packageName: 'com.google.android.apps.nbu.paisa.user',
    name: 'Google Pay',
    icon: require('@/assets/upi/google-pay.png'),
  },
  {
    packageName: 'com.phonepe.app',
    name: 'PhonePe',
    icon: require('@/assets/upi/phone-pe.png'),
  },
  {
    packageName: 'net.one97.paytm',
    name: 'Paytm',
    icon: require('@/assets/upi/paytm.png'),
  },
  {
    packageName: 'in.org.npci.upiapp',
    name: 'BHIM',
    icon: require('@/assets/upi/bhim.png'),
  },
  {
    packageName: 'in.amazon.mShop.android.shopping',
    name: 'Amazon Pay',
    icon: require('@/assets/upi/amazonpay.png'),
  },
];
