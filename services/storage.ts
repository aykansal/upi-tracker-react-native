import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, MonthlyStats, CategoryType, UPIPaymentData } from '@/types/transaction';

const TRANSACTIONS_KEY = '@upitracker_transactions';

/**
 * Get all transactions from storage, sorted by date (newest first)
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (!data) return [];
    
    const transactions: Transaction[] = JSON.parse(data);
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

/**
 * Save a new transaction
 */
export const saveTransaction = async (
  paymentData: UPIPaymentData,
  category: CategoryType,
  reason: string,
  description?: string,
  amount?: number
): Promise<Transaction> => {
  try {
    const transactions = await getAllTransactions();
    const timestamp = Date.now();
    
    const newTransaction: Transaction = {
      id: uuidv4(),
      amount: amount || paymentData.amount || 0,
      upiId: paymentData.upiId,
      payeeName: paymentData.payeeName,
      category,
      reason,
      description,
      timestamp,
      monthKey: format(new Date(timestamp), 'yyyy-MM'),
    };

    transactions.unshift(newTransaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    
    return newTransaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

/**
 * Get transactions for a specific month
 */
export const getTransactionsByMonth = async (monthKey: string): Promise<Transaction[]> => {
  try {
    const transactions = await getAllTransactions();
    return transactions.filter((tx) => tx.monthKey === monthKey);
  } catch (error) {
    console.error('Error getting transactions by month:', error);
    return [];
  }
};

/**
 * Delete a single transaction by ID
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const transactions = await getAllTransactions();
    const filtered = transactions.filter((tx) => tx.id !== id);
    
    if (filtered.length === transactions.length) {
      return false; // Transaction not found
    }
    
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

/**
 * Clear all transaction data
 */
export const clearAllData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(TRANSACTIONS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Get monthly statistics
 */
export const getMonthlyStats = async (monthKey: string): Promise<MonthlyStats> => {
  try {
    const transactions = await getTransactionsByMonth(monthKey);
    
    const categoryBreakdown: Record<CategoryType, number> = {
      food: 0,
      utility: 0,
      college: 0,
      rent: 0,
      other: 0,
    };

    let total = 0;

    transactions.forEach((tx) => {
      total += tx.amount;
      categoryBreakdown[tx.category] += tx.amount;
    });

    return {
      monthKey,
      total,
      categoryBreakdown,
      transactionCount: transactions.length,
    };
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return {
      monthKey,
      total: 0,
      categoryBreakdown: {
        food: 0,
        utility: 0,
        college: 0,
        rent: 0,
        other: 0,
      },
      transactionCount: 0,
    };
  }
};

/**
 * Get list of all months with transactions
 */
export const getAvailableMonths = async (): Promise<string[]> => {
  try {
    const transactions = await getAllTransactions();
    const months = [...new Set(transactions.map((tx) => tx.monthKey))];
    return months.sort().reverse(); // Most recent first
  } catch (error) {
    console.error('Error getting available months:', error);
    return [];
  }
};

/**
 * Search transactions by reason, description, or category
 */
export const searchTransactions = async (query: string): Promise<Transaction[]> => {
  try {
    const transactions = await getAllTransactions();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) return transactions;

    return transactions.filter((tx) => {
      return (
        tx.reason.toLowerCase().includes(lowerQuery) ||
        tx.description?.toLowerCase().includes(lowerQuery) ||
        tx.category.toLowerCase().includes(lowerQuery) ||
        tx.payeeName.toLowerCase().includes(lowerQuery) ||
        tx.upiId.toLowerCase().includes(lowerQuery)
      );
    });
  } catch (error) {
    console.error('Error searching transactions:', error);
    return [];
  }
};

/**
 * Get recent transactions (last N)
 */
export const getRecentTransactions = async (limit: number = 5): Promise<Transaction[]> => {
  try {
    const transactions = await getAllTransactions();
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
};

/**
 * Get current month key
 */
export const getCurrentMonthKey = (): string => {
  return format(new Date(), 'yyyy-MM');
};

