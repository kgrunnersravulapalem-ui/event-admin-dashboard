/**
 * Transaction Data Utility
 * 
 * Handles parsing and filtering of PhonePe transaction data from CSV
 */

export interface Transaction {
  merchantId: string;
  transactionType: string;
  merchantOrderId: string;
  merchantReferenceId: string;
  phonepeReferenceId: string;
  phonepeTransactionReferenceId: string;
  phonepeAttemptReferenceId: string;
  transactionUtr: string;
  totalTransactionAmount: number;
  transactionDate: string;
  transactionStatus: string;
  upiAmount: number;
  walletAmount: number;
  creditCardAmount: number;
  debitCardAmount: number;
  externalWalletAmount: number;
  egvAmount: number;
  storeId: string;
  terminalId: string;
  storeName: string;
  terminalName: string;
  errorCode: string;
  detailedErrorCode: string;
  errorDescription: string;
  errorSource: string;
  errorStage: string;
}

const CSV_FILENAME = '/M23TCNCX7K1K7_FORWARD_TRANSACTION_17704333216757008588580096252872.csv';

/**
 * Parse CSV string into Transaction objects
 */
const parseCSV = (csvContent: string): Transaction[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length === headers.length) {
      transactions.push({
        merchantId: values[0] || '',
        transactionType: values[1] || '',
        merchantOrderId: values[2] || '',
        merchantReferenceId: values[3] || '',
        phonepeReferenceId: values[4] || '',
        phonepeTransactionReferenceId: values[5] || '',
        phonepeAttemptReferenceId: values[6] || '',
        transactionUtr: values[7] || '',
        totalTransactionAmount: parseFloat(values[8]) || 0,
        transactionDate: values[9] || '',
        transactionStatus: values[10] || '',
        upiAmount: parseFloat(values[11]) || 0,
        walletAmount: parseFloat(values[12]) || 0,
        creditCardAmount: parseFloat(values[13]) || 0,
        debitCardAmount: parseFloat(values[14]) || 0,
        externalWalletAmount: parseFloat(values[15]) || 0,
        egvAmount: parseFloat(values[16]) || 0,
        storeId: values[17] || '',
        terminalId: values[18] || '',
        storeName: values[19] || '',
        terminalName: values[20] || '',
        errorCode: values[21] || '',
        detailedErrorCode: values[22] || '',
        errorDescription: values[23] || '',
        errorSource: values[24] || '',
        errorStage: values[25] || '',
      });
    }
  }

  return transactions;
};

/**
 * Load transactions from CSV file
 */
export const loadTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch(CSV_FILENAME);
    if (!response.ok) {
      throw new Error('Failed to load transaction data');
    }
    const csvContent = await response.text();
    return parseCSV(csvContent);
  } catch (error) {
    console.error('Error loading transactions:', error);
    throw new Error('Failed to load transaction data');
  }
};

/**
 * Filter transactions by PhonePe Reference ID
 */
export const filterByPhonepeReferenceId = (
  transactions: Transaction[],
  referenceId: string
): Transaction[] => {
  if (!referenceId.trim()) return [];
  
  const searchTerm = referenceId.trim().toUpperCase();
  return transactions.filter(tx =>
    tx.phonepeReferenceId.toUpperCase().includes(searchTerm)
  );
};

/**
 * Filter transactions by Transaction UTR
 */
export const filterByTransactionUtr = (
  transactions: Transaction[],
  utr: string
): Transaction[] => {
  if (!utr.trim()) return [];
  
  const searchTerm = utr.trim().toUpperCase();
  return transactions.filter(tx =>
    tx.transactionUtr.toUpperCase().includes(searchTerm)
  );
};

/**
 * Filter transactions by status
 */
export const filterByStatus = (
  transactions: Transaction[],
  status: string
): Transaction[] => {
  if (!status) return transactions;
  return transactions.filter(tx => tx.transactionStatus === status);
};

/**
 * Get unique transaction statuses
 */
export const getUniqueStatuses = (transactions: Transaction[]): string[] => {
  const statuses = new Set(transactions.map(tx => tx.transactionStatus));
  return Array.from(statuses).sort();
};
