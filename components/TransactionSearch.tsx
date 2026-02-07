/**
 * Transaction Search Component
 * 
 * Search and filter PhonePe transactions by Reference ID or UTR
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  loadTransactions,
  filterByPhonepeReferenceId,
  filterByTransactionUtr,
  filterByStatus,
  getUniqueStatuses,
  Transaction,
} from '@/lib/transactionService';
import { Input, Button, Card } from '@/components/ui';
import styles from '@/styles/TransactionSearch.module.css';

export default function TransactionSearch() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  // Load transactions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTransactions();
        setTransactions(data);
        setUniqueStatuses(getUniqueStatuses(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a PhonePe Reference ID or Transaction UTR');
      return;
    }

    let results = transactions;

    // Search by both Reference ID and UTR
    const refResults = filterByPhonepeReferenceId(transactions, searchQuery);
    const utrResults = filterByTransactionUtr(transactions, searchQuery);
    
    // Combine results (remove duplicates by merchantOrderId)
    const combinedResults = [...refResults];
    utrResults.forEach(tx => {
      if (!combinedResults.some(r => r.merchantOrderId === tx.merchantOrderId)) {
        combinedResults.push(tx);
      }
    });

    results = combinedResults;

    // Filter by status if selected
    if (statusFilter) {
      results = filterByStatus(results, statusFilter);
    }

    setFilteredTransactions(results);
    setSearched(true);
    setError(null);
  };

  // Reset search
  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setFilteredTransactions([]);
    setSearched(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transaction Search</h1>
        <p className={styles.subtitle}>Search PhonePe transactions by Reference ID or UTR</p>
      </div>

      <Card className={styles.searchCard}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputGrid}>
            <Input
              type="text"
              placeholder="Search by PhonePe Reference ID or Transaction UTR"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />

            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.buttonGroup}>
            <Button type="submit" disabled={loading}>
              Search
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className={styles.resetBtn}
            >
              Reset
            </Button>
          </div>
        </form>

        {error && <div className={styles.error}>{error}</div>}
      </Card>

      {searched && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2>Results ({filteredTransactions.length})</h2>
            {filteredTransactions.length > 0 && (
              <span className={styles.resultCount}>
                Showing {filteredTransactions.length} transaction(s)
              </span>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className={styles.noResults}>
              <p>No transactions found matching your criteria. Please try different search terms.</p>
            </Card>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>PhonePe Ref ID</th>
                    <th>Transaction UTR</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className={styles[`status-${tx.transactionStatus.toLowerCase()}`]}>
                      <td className={styles.referenceId} title={tx.phonepeReferenceId}>
                        {tx.phonepeReferenceId}
                      </td>
                      <td className={styles.utr} title={tx.transactionUtr}>
                        {tx.transactionUtr}
                      </td>
                      <td className={styles.orderId}>{tx.merchantOrderId}</td>
                      <td className={styles.amount}>₹{tx.totalTransactionAmount.toFixed(2)}</td>
                      <td className={styles.date}>
                        {new Date(tx.transactionDate).toLocaleDateString('en-IN')}<br />
                        <small>{new Date(tx.transactionDate).toLocaleTimeString('en-IN')}</small>
                      </td>
                      <td className={styles.status}>
                        <span className={`${styles.statusBadge} ${styles[`badge-${tx.transactionStatus.toLowerCase()}`]}`}>
                          {tx.transactionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <Card className={styles.detailsCard}>
              <h3>Transaction Details</h3>
              {filteredTransactions.map((tx, idx) => (
                <div key={idx} className={styles.transactionDetail}>
                  <div className={styles.detailHeader}>
                    <h4>{tx.phonepeReferenceId}</h4>
                    <span className={`${styles.detailStatus} ${styles[`status-${tx.transactionStatus.toLowerCase()}`]}`}>
                      {tx.transactionStatus}
                    </span>
                  </div>

                  <div className={styles.detailGrid}>
                    <div>
                      <strong>PhonePe Ref ID:</strong>
                      <p>{tx.phonepeReferenceId}</p>
                    </div>
                    <div>
                      <strong>Transaction UTR:</strong>
                      <p>{tx.transactionUtr}</p>
                    </div>
                    <div>
                      <strong>Merchant Order ID:</strong>
                      <p>{tx.merchantOrderId}</p>
                    </div>
                    <div>
                      <strong>Amount:</strong>
                      <p>₹{tx.totalTransactionAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <strong>Date & Time:</strong>
                      <p>{new Date(tx.transactionDate).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <strong>Payment Method:</strong>
                      <p>
                        {tx.upiAmount > 0 && 'UPI'}
                        {tx.walletAmount > 0 && (tx.upiAmount > 0 ? ', Wallet' : 'Wallet')}
                        {tx.creditCardAmount > 0 && (tx.upiAmount > 0 || tx.walletAmount > 0 ? ', Credit Card' : 'Credit Card')}
                        {tx.debitCardAmount > 0 && (tx.upiAmount > 0 || tx.walletAmount > 0 || tx.creditCardAmount > 0 ? ', Debit Card' : 'Debit Card')}
                      </p>
                    </div>

                    {tx.transactionStatus === 'ERRORED' && (
                      <>
                        <div>
                          <strong>Error Code:</strong>
                          <p>{tx.errorCode || 'N/A'}</p>
                        </div>
                        <div>
                          <strong>Error Description:</strong>
                          <p>{tx.errorDescription || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {!searched && !error && (
        <Card className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h2>Search Transactions</h2>
          <p>Enter a PhonePe Reference ID or Transaction UTR to search for transaction details.</p>
        </Card>
      )}
    </div>
  );
}
