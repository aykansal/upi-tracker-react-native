// CategoryType is now a string to support dynamic user-created categories
export type CategoryType = string;

/** Merchant-specific parameters from UPI QR codes */
export interface MerchantParams {
  sign?: string;      // Digital signature
  mc?: string;        // Merchant category code
  mode?: string;      // Transaction mode
  orgid?: string;     // Organization ID
  purpose?: string;   // Purpose code
  tid?: string;       // Terminal ID
}

/** Extended UPI payment data with merchant support */
export interface UPIPaymentData {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  // Merchant support fields
  originalQRData?: string;        // Preserved original URL for merchants
  isMerchant: boolean;            // Merchant detection flag
  merchantParams?: MerchantParams; // Merchant-specific params if detected
}

export interface Transaction {
  id: string;
  amount: number;
  upiId: string;
  payeeName: string;
  category: CategoryType;
  reason?: string;
  timestamp: number;
  monthKey: string; // 'YYYY-MM' format for quick filtering
  // Merchant tracking fields
  transactionType?: 'merchant' | 'p2p';
  merchantCategory?: string;
  organizationId?: string;
}

export interface MonthlyStats {
  monthKey: string;
  total: number;
  categoryBreakdown: Record<CategoryType, number>;
  transactionCount: number;
}

export interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
}
