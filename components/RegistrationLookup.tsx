/**
 * Registration Lookup Component
 * 
 * Component for searching and displaying registration details by merchantOrderId
 */

'use client';

import React, { useState } from 'react';
import { Registration, getRegistrationByMerchantOrderId } from '@/lib/registrationsService';
import { Input, Button, Card } from '@/components/ui';
import styles from '@/styles/RegistrationLookup.module.css';
import { Timestamp } from 'firebase/firestore';

/**
 * Format Firestore timestamp to readable date
 */
const formatTimestamp = (timestamp: Timestamp | any): string => {
  if (!timestamp) return 'N/A';
  
  // Handle Firestore Timestamp object
  if (timestamp.toDate) {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    }).format(timestamp.toDate());
  }
  
  // Handle Date object
  if (timestamp instanceof Date) {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    }).format(timestamp);
  }
  
  return 'N/A';
};

/**
 * Format date string (YYYY-MM-DD to readable format)
 */
const formatDateString = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export default function RegistrationLookup() {
  const [merchantOrderId, setMerchantOrderId] = useState('');
  const [registration, setRegistration] = useState<(Registration & { id: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchantOrderId.trim()) {
      setError('Please enter a Merchant Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    setRegistration(null);
    setSearched(true);

    try {
      const result = await getRegistrationByMerchantOrderId(merchantOrderId.trim());
      
      if (result) {
        setRegistration(result);
      } else {
        setError('No registration found with this Merchant Order ID');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <h1 className={styles.title}>Registration Lookup</h1>
        
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Input
            type="text"
            placeholder="Enter Merchant Order ID (e.g., ORDER_1769701991513)"
            value={merchantOrderId}
            onChange={(e) => setMerchantOrderId(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      {registration && (
        <Card className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <h2>Registration Details</h2>
            <span className={`${styles.badge} ${styles[`status-${registration.paymentStatus.toLowerCase()}`]}`}>
              {registration.paymentStatus}
            </span>
          </div>

          <div className={styles.detailsGrid}>
            {/* Personal Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              
              <div className={styles.detail}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{registration.name}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Gender</span>
                <span className={styles.value}>{registration.gender}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Date of Birth</span>
                <span className={styles.value}>{formatDateString(registration.dateOfBirth)}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Age</span>
                <span className={styles.value}>{registration.age} years</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Blood Group</span>
                <span className={styles.value}>{registration.bloodGroup}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              
              <div className={styles.detail}>
                <span className={styles.label}>Phone</span>
                <span className={styles.value}>{registration.phone}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{registration.email}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Emergency Contact</span>
                <span className={styles.value}>{registration.emergencyContact}</span>
              </div>
            </div>

            {/* Payment Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Payment Information</h3>
              
              <div className={styles.detail}>
                <span className={styles.label}>Merchant Order ID</span>
                <span className={styles.value}>{registration.merchantOrderId}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Amount</span>
                <span className={styles.value}>₹{registration.amount}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Payment Status</span>
                <span className={`${styles.value} ${styles[`status-${registration.paymentStatus.toLowerCase()}`]}`}>
                  {registration.paymentStatus}
                </span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Registration Date</span>
                <span className={styles.value}>{formatTimestamp(registration.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className={styles.docId}>
            <small>Document ID: {registration.id}</small>
          </div>
        </Card>
      )}

      {searched && !registration && !error && !loading && (
        <Card className={styles.noResult}>
          <p>No registration found. Please check the Merchant Order ID and try again.</p>
        </Card>
      )}
    </div>
  );
}
