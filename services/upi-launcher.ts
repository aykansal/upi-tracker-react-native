import * as Linking from 'expo-linking';
import { buildUPIUrl } from '@/constants/upi-config';

interface LaunchPaymentParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  /** Original QR URL for merchant transactions - preserves signature */
  originalQRData?: string;
  /** Whether this is a merchant QR code transaction */
  isMerchant?: boolean;
}

/**
 * Launch UPI payment - handles both merchant and P2P transactions.
 * 
 * For merchant QR codes (isMerchant=true with originalQRData):
 *   - Uses the original QR URL unchanged to preserve the digital signature
 *   - This prevents "merchant transaction failed" errors from GPay
 * 
 * For P2P transactions (isMerchant=false or no originalQRData):
 *   - Reconstructs the UPI URL with custom amount using buildUPIUrl()
 *   - Allows users to modify amount for personal payments
 */
export const launchPayment = async (params: LaunchPaymentParams): Promise<boolean> => {
  try {
    let upiUrl: string;

    // Merchant flow: use original QR URL unchanged (preserves signature)
    if (params.isMerchant && params.originalQRData) {
      upiUrl = params.originalQRData;
      console.log('Launching merchant payment with original QR URL');
    } else {
      // P2P flow: reconstruct URL with custom amount
      // This also serves as fallback if merchant but missing originalQRData
      if (params.isMerchant && !params.originalQRData) {
        console.warn('Merchant transaction missing originalQRData, falling back to P2P reconstruction');
      }
      upiUrl = buildUPIUrl({
        upiId: params.upiId,
        payeeName: params.payeeName,
        amount: params.amount,
        transactionNote: params.transactionNote,
      });
      console.log('Launching P2P payment with reconstructed URL');
    }

    const canOpenUPI = await Linking.canOpenURL(upiUrl);
    
    if (canOpenUPI) {
      await Linking.openURL(upiUrl);
      return true;
    }

    console.error('No UPI app available to handle payment');
    return false;
  } catch (error) {
    console.error('Error launching payment:', error);
    return false;
  }
};

/**
 * Check if any UPI app is available on the device
 */
export const isUPIAvailable = async (): Promise<boolean> => {
  try {
    const testUrl = 'upi://pay';
    return await Linking.canOpenURL(testUrl);
  } catch (error) {
    return false;
  }
};
