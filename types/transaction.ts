export type CategoryType = 'food' | 'utility' | 'college' | 'rent' | 'other';

export interface Transaction {
  id: string;
  amount: number;
  upiId: string;
  payeeName: string;
  category: CategoryType;
  reason: string;
  description?: string;
  timestamp: number;
  monthKey: string; // 'YYYY-MM' format for quick filtering
}

export interface UPIPaymentData {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
}

export interface MonthlyStats {
  monthKey: string;
  total: number;
  categoryBreakdown: Record<CategoryType, number>;
  transactionCount: number;
}

export interface CategoryInfo {
  key: CategoryType;
  label: string;
  icon: string;
  color: string;
}

