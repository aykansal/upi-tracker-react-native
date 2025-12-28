import * as Linking from 'expo-linking';
import { buildGPayUrl, buildUPIUrl } from '@/constants/upi-config';

interface LaunchPaymentParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
}

/**
 * Launch UPI payment with Google Pay as primary, falling back to system chooser
 */
export const launchPayment = async (params: LaunchPaymentParams): Promise<boolean> => {
  try {
    // Try Google Pay first
    const gpayUrl = buildGPayUrl(params);
    const canOpenGPay = await Linking.canOpenURL(gpayUrl);
    
    if (canOpenGPay) {
      await Linking.openURL(gpayUrl);
      return true;
    }

    // Fallback to universal UPI intent
    const upiUrl = buildUPIUrl(params);
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

/**
 * Check if Google Pay is available
 */
export const isGPayAvailable = async (): Promise<boolean> => {
  try {
    const testUrl = 'gpay://upi/pay';
    return await Linking.canOpenURL(testUrl);
  } catch (error) {
    return false;
  }
};

