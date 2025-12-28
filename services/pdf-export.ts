import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';

import { Transaction, CategoryType, MonthlyStats } from '@/types/transaction';
import { CATEGORIES } from '@/constants/categories';
import { CategoryColors } from '@/constants/theme';
import { getAllTransactions, getMonthlyStats, getAvailableMonths } from './storage';

/**
 * Generate HTML content for PDF
 */
const generateHTML = (
  transactions: Transaction[],
  monthlyStats: MonthlyStats[],
  title: string
): string => {
  const now = format(new Date(), 'MMMM d, yyyy');
  
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Category totals
  const categoryTotals: Record<CategoryType, number> = {
    food: 0,
    utility: 0,
    college: 0,
    rent: 0,
    other: 0,
  };
  
  transactions.forEach((tx) => {
    categoryTotals[tx.category] += tx.amount;
  });

  const transactionRows = transactions
    .map((tx) => {
      const category = CATEGORIES[tx.category];
      const dateStr = format(new Date(tx.timestamp), 'MMM d, yyyy');
      return `
        <tr>
          <td>${dateStr}</td>
          <td>
            <span class="category-badge" style="background-color: ${category.color}20; color: ${category.color}">
              ${category.label}
            </span>
          </td>
          <td>${tx.reason}</td>
          <td>${tx.payeeName}</td>
          <td class="amount">₹${tx.amount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    })
    .join('');

  const categoryRows = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([key, amount]) => {
      const category = CATEGORIES[key as CategoryType];
      const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0';
      return `
        <tr>
          <td>
            <span class="category-badge" style="background-color: ${category.color}20; color: ${category.color}">
              ${category.label}
            </span>
          </td>
          <td class="amount">₹${amount.toLocaleString('en-IN')}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          color: #333;
          line-height: 1.5;
          padding: 40px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #14B8A6;
        }
        
        .header h1 {
          font-size: 24px;
          color: #14B8A6;
          margin-bottom: 8px;
        }
        
        .header p {
          color: #666;
          font-size: 14px;
        }
        
        .summary-cards {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          flex: 1;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .summary-card h3 {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .summary-card .value {
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }
        
        .summary-card .value.highlight {
          color: #14B8A6;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          font-size: 16px;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          border-bottom: 2px solid #eee;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .amount {
          text-align: right;
          font-weight: 600;
          font-family: 'SF Mono', monospace;
        }
        
        .category-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #999;
          font-size: 11px;
        }
        
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>UPI Tracker</h1>
        <p>${title} • Generated on ${now}</p>
      </div>
      
      <div class="summary-cards">
        <div class="summary-card">
          <h3>Total Spent</h3>
          <div class="value highlight">₹${totalAmount.toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-card">
          <h3>Transactions</h3>
          <div class="value">${transactions.length}</div>
        </div>
      </div>
      
      ${categoryRows ? `
      <div class="section">
        <h2>Category Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right">Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="section">
        <h2>All Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Reason</th>
              <th>Payee</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows || '<tr><td colspan="5" style="text-align: center; color: #999;">No transactions</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>This report was generated by UPI Tracker. All data is stored locally on your device.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Export all transactions to PDF
 */
export const exportToPDF = async (monthKey?: string): Promise<void> => {
  try {
    let transactions: Transaction[];
    let title: string;
    
    if (monthKey) {
      // Export specific month
      const allTransactions = await getAllTransactions();
      transactions = allTransactions.filter((tx) => tx.monthKey === monthKey);
      title = `Expense Report - ${format(new Date(monthKey + '-01'), 'MMMM yyyy')}`;
    } else {
      // Export all
      transactions = await getAllTransactions();
      title = 'Complete Expense Report';
    }

    const months = await getAvailableMonths();
    const monthlyStatsPromises = months.map((month) => getMonthlyStats(month));
    const monthlyStats = await Promise.all(monthlyStatsPromises);

    const html = generateHTML(transactions, monthlyStats, title);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create a better filename
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    const newFileName = monthKey
      ? `UPI_Tracker_${monthKey}.pdf`
      : `UPI_Tracker_All_${timestamp}.pdf`;
    
    const newUri = `${FileSystem.documentDirectory}${newFileName}`;

    // Move the file to a better location
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Expense Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      console.log('Sharing not available, file saved to:', newUri);
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export transactions for a specific month
 */
export const exportMonthToPDF = async (monthKey: string): Promise<void> => {
  return exportToPDF(monthKey);
};

