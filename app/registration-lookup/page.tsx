/**
 * Registration Lookup Page
 * 
 * Allows users to search for registration details using merchantOrderId
 */

import React from 'react';
import RegistrationLookup from '@/components/RegistrationLookup';

export const metadata = {
  title: 'Registration Lookup - Event Enrollment',
  description: 'Search for registration details by Merchant Order ID',
};

export default function RegistrationLookupPage() {
  return (
    <main>
      <RegistrationLookup />
    </main>
  );
}
