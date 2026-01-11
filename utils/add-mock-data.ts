import { CategoryType, Transaction } from '@/types/transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Crypto from 'expo-crypto';

const TRANSACTIONS_KEY = '@upitracker_transactions_mock'; // mock data key/ compare with original while development

// Mock payee names and UPI IDs
const mockPayees = [
  { name: 'Coffee Shop', upiId: 'coffee@paytm' },
  { name: 'Grocery Store', upiId: 'grocery@phonepe' },
  { name: 'Restaurant', upiId: 'restaurant@bhim' },
  { name: 'Uber', upiId: 'uber@paytm' },
  { name: 'Amazon', upiId: 'amazon@phonepe' },
  { name: 'Swiggy', upiId: 'swiggy@paytm' },
  { name: 'Zomato', upiId: 'zomato@bhim' },
  { name: 'Book Store', upiId: 'books@phonepe' },
  { name: 'Pharmacy', upiId: 'pharma@paytm' },
  { name: 'Gas Station', upiId: 'gas@bhim' },
];

// Mock categories
const mockCategories: CategoryType[] = ['food', 'utility', 'college', 'rent', 'other'];

// Mock reasons
const mockReasons = [
  'Lunch',
  'Dinner',
  'Groceries',
  'Transport',
  'Shopping',
  'Books',
  'Medicine',
  'Snacks',
  'Coffee',
  'Utilities',
];

/**
 * Generate mock transactions for the past 2 weeks
 * Today is January 7, 2026
 */
export async function addMockDataForPastWeeks(): Promise<void> {
  try {
    const existingData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const existingTransactions: Transaction[] = existingData ? JSON.parse(existingData) : [];

    // Today is Jan 7, 2026
    const today = new Date(2026, 0, 7); // Month is 0-indexed, so 0 = January
    const mockTransactions: Transaction[] = [];

    // Generate transactions for the past 14 days (2 weeks)
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);

      // Generate 1-4 transactions per day (more on weekends)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const numTransactions = isWeekend ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numTransactions; i++) {
        const payee = mockPayees[Math.floor(Math.random() * mockPayees.length)];
        const category = mockCategories[Math.floor(Math.random() * mockCategories.length)];
        const reason = mockReasons[Math.floor(Math.random() * mockReasons.length)];

        // Generate random amount between 50 and 5000
        const amount = Math.floor(Math.random() * 4950) + 50;

        // Random time during the day (between 8 AM and 11 PM)
        const hour = Math.floor(Math.random() * 15) + 8;
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(date);
        timestamp.setHours(hour, minute, 0, 0);

        const transaction: Transaction = {
          id: Crypto.randomUUID(),
          amount,
          upiId: payee.upiId,
          payeeName: payee.name,
          category,
          reason,
          timestamp: timestamp.getTime(),
          monthKey: format(timestamp, 'yyyy-MM'),
          transactionType: 'p2p',
        };

        mockTransactions.push(transaction);
      }
    }

    // Combine with existing transactions and sort by timestamp (newest first)
    const allTransactions = [...existingTransactions, ...mockTransactions].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
    console.log(`Added ${mockTransactions.length} mock transactions for the past 2 weeks`);
  } catch (error) {
    console.error('Error adding mock data:', error);
    throw error;
  }
}

