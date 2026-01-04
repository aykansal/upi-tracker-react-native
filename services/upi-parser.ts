import { UPIPaymentData, MerchantParams } from '@/types/transaction';

/** Parameters that indicate a merchant QR code */
export const MERCHANT_PARAM_KEYS = ['mode', 'purpose', 'mc', 'orgid', 'sign', 'tid'] as const;

/**
 * Parse UPI QR code data
 * Supports multiple formats:
 * - upi://pay?pa=merchant@upi&pn=MerchantName&am=100.00&cu=INR
 * - UPI://pay?pa=...
 * - Merchant QR codes with sign, mc, mode, orgid, purpose, tid parameters
 * 
 * For merchant QR codes (with signature), preserves original URL to maintain security.
 * For P2P transactions, allows URL reconstruction with custom amounts.
 */
export const parseUPIQRCode = (qrData: string): UPIPaymentData | null => {
  try {
    if (!qrData) return null;

    // Preserve original QR data exactly as scanned (before any processing)
    const originalQRData = qrData.trim();

    // Normalize the URL scheme for parsing only
    let normalizedData = originalQRData;
    
    // Handle case-insensitive upi:// prefix
    if (normalizedData.toLowerCase().startsWith('upi://')) {
      normalizedData = 'upi://' + normalizedData.substring(6);
    } else if (normalizedData.toLowerCase().startsWith('upi:')) {
      // Some QR codes might have upi: without //
      normalizedData = 'upi://' + normalizedData.substring(4);
    } else {
      // Not a UPI QR code
      return null;
    }

    // Parse the URL
    const url = new URL(normalizedData);
    const params = url.searchParams;

    // Extract required UPI ID (pa = payee address)
    const upiId = params.get('pa');
    if (!upiId) {
      console.error('UPI QR code missing payee address (pa)');
      return null;
    }

    // Extract payee name (pn), default to "Unknown"
    let payeeName = params.get('pn') || 'Unknown';
    try {
      payeeName = decodeURIComponent(payeeName);
    } catch (e) {
      // Keep original if decode fails
    }

    // Extract amount if present (am)
    const amountStr = params.get('am');
    let amount: number | undefined;
    if (amountStr) {
      const parsedAmount = parseFloat(amountStr);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
      }
    }

    // Extract transaction note if present (tn)
    let transactionNote: string | undefined;
    const tnValue = params.get('tn');
    if (tnValue) {
      try {
        transactionNote = decodeURIComponent(tnValue);
      } catch (e) {
        transactionNote = tnValue;
      }
    }

    // Check for merchant params and extract them
    const merchantParams: MerchantParams = {};
    let isMerchant = false;

    for (const key of MERCHANT_PARAM_KEYS) {
      const value = params.get(key);
      if (value) {
        // Special case: if sign exists but is empty, treat as P2P
        if (key === 'sign' && !value.trim()) {
          continue;
        }
        merchantParams[key as keyof MerchantParams] = value;
        isMerchant = true;
      }
    }

    return {
      upiId,
      payeeName,
      amount,
      transactionNote,
      originalQRData,
      isMerchant,
      merchantParams: isMerchant ? merchantParams : undefined,
    };
  } catch (error) {
    console.error('Failed to parse UPI QR code:', error);
    return null;
  }
};

/**
 * Validate UPI ID format
 * Basic validation: should contain @ and have valid characters
 */
export const isValidUPIId = (upiId: string): boolean => {
  if (!upiId || typeof upiId !== 'string') return false;
  
  // UPI ID format: username@bankhandle
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiPattern.test(upiId.trim());
};

/**
 * Format UPI ID for display
 */
export const formatUPIId = (upiId: string): string => {
  if (!upiId) return '';
  return upiId.trim().toLowerCase();
};
