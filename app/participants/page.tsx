/**
 * Participants Management Page
 * 
 * View, filter, and export participant data
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Dropdown } from '@/components/ui';
import { Participant, Organization } from '@/types';
import { 
  getAllParticipants, 
  deleteParticipant,
  exportParticipantsToCSV,
  downloadCSV,
} from '@/lib/participantsService';
import { getAllOrganizations } from '@/lib/organizationsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Participants.module.css';

/**
 * Participants page component
 */
export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    organization: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Apply filters when data or filters change
   */
  useEffect(() => {
    applyFilters();
  }, [participants, searchTerm, filters]);

  /**
   * Load participants and organizations
   */
  const loadData = async () => {
    try {
      setLoading(true);
      const [participantsData, orgsData] = await Promise.all([
        getAllParticipants(),
        getAllOrganizations(),
      ]);
      setParticipants(participantsData);
      setOrganizations(orgsData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply search and filters
   */
  const applyFilters = () => {
    let filtered = [...participants];

    // Search by name or mobile
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.mobileNumber.includes(term)
      );
    }

    // Filter by organization
    if (filters.organization) {
      filtered = filtered.filter((p) => p.organization === filters.organization);
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((p) => {
        if (!p.createdAt) return false;
        const enrollDate = new Date(p.createdAt);
        enrollDate.setHours(0, 0, 0, 0);
        return enrollDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((p) => {
        if (!p.createdAt) return false;
        const enrollDate = new Date(p.createdAt);
        return enrollDate <= endDate;
      });
    }

    setFilteredParticipants(filtered);
  };

  /**
   * Handle delete participant
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete participant "${name}"?`)) {
      return;
    }

    try {
      await deleteParticipant(id);
      toast.success('Participant deleted successfully');
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete participant';
      toast.error(message);
    }
  };

  /**
   * Handle export to CSV
   */
  const handleExport = () => {
    try {
      const csvContent = exportParticipantsToCSV(filteredParticipants);
      const filename = `participants_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success('Export successful');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.error(message);
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      organization: '',
      category: '',
      startDate: '',
      endDate: '',
    });
  };

  /**
   * Format date for display
   */
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasActiveFilters = 
    searchTerm || 
    filters.organization || 
    filters.category || 
    filters.startDate || 
    filters.endDate;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Participants</h1>
            <p className={styles.subtitle}>
              {filteredParticipants.length} of {participants.length} enrolled
            </p>
          </div>
          <Button onClick={handleExport} disabled={filteredParticipants.length === 0} size="small">
            Export CSV
          </Button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filters */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersHeader}>
            <span className={styles.filtersTitle}>FILTERS</span>
            {hasActiveFilters && (
              <Button variant="outline" size="small" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterItem}>
              <Dropdown
                label="Organization"
                options={[
                  { value: '', label: 'All Organizations' },
                  ...organizations.map((org) => ({
                    value: org.name,
                    label: org.name,
                  })),
                ]}
                value={filters.organization}
                onChange={(e) =>
                  setFilters({ ...filters, organization: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <Dropdown
                label="Category"
                options={[
                  { value: '', label: 'All Categories' },
                  { value: '3K', label: '3K' },
                  { value: '5K', label: '5K' },
                  { value: '10K', label: '10K' },
                ]}
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="startDate" className={styles.filterLabel}>
                From Date
              </label>
              <input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="endDate" className={styles.filterLabel}>
                To Date
              </label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className={styles.dateInput}
              />
            </div>
          </div>
        </div>

        {/* Participants List */}
        {loading ? (
          <div className={styles.loading}>Loading participants...</div>
        ) : filteredParticipants.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>
              {hasActiveFilters
                ? 'No participants match your filters.'
                : 'No participants enrolled yet.'}
            </p>
          </Card>
        ) : (
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <div>Name</div>
              <div>Organization</div>
              <div>Mobile</div>
              <div>Gender</div>
              <div>Category</div>
              <div>Size</div>
              <div>Date</div>
              <div>Actions</div>
            </div>
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className={styles.participantCard}>
                <div className={styles.participantName}>{participant.name}</div>
                <div className={styles.organization}>{participant.organization}</div>
                <div className={styles.detail}>{participant.mobileNumber}</div>
                <div className={styles.detail}>{participant.gender}</div>
                <div className={styles.detail}>{participant.category}</div>
                <div className={styles.detail}>{participant.size}</div>
                <div className={styles.date}>{formatDate(participant.createdAt)}</div>
                <div className={styles.participantActions}>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => participant.id && handleDelete(participant.id, participant.name)}
                    aria-label={`Delete ${participant.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
