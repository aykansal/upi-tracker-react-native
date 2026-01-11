import * as Sharing from 'expo-sharing';

interface ShareQRParams {
  /** URI of the captured QR code image */
  qrImageUri: string;
}

/**
 * Share QR image to UPI apps via Android share sheet.
 * User can select GPay, PhonePe, Paytm, or any other UPI app.
 * The selected app will scan the QR from the shared image and process payment.
 */
export const shareQRImage = async (params: ShareQRParams): Promise<boolean> => {
  try {
    // Check if sharing is available on this device
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error('Sharing is not available on this device');
      return false;
    }

    // Share the QR image via native share sheet
    await Sharing.shareAsync(params.qrImageUri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Pay with UPI App',
    });

    return true;
  } catch (error) {
    console.error('Error sharing QR image:', error);
    return false;
  }
};

/**
 * Check if sharing is available on the device
 */
export const isSharingAvailable = async (): Promise<boolean> => {
  try {
    return await Sharing.isAvailableAsync();
  } catch (error) {
    return false;
  }
};
