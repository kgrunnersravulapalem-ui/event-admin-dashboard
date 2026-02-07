/**
 * Transaction Search Page
 * 
 * Search and view PhonePe transactions by Reference ID or UTR
 */

import React from 'react';
import TransactionSearch from '@/components/TransactionSearch';

export const metadata = {
  title: 'Transaction Search - Event Enrollment',
  description: 'Search PhonePe transactions by Reference ID or UTR',
};

export default function TransactionSearchPage() {
  return (
    <main>
      <TransactionSearch />
    </main>
  );
}
