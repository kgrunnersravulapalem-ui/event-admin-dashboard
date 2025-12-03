/**
 * Organizations Management Page
 * 
 * CRUD operations for organizations
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Input } from '@/components/ui';
import { Organization } from '@/types';
import {

  addOrganization,
  updateOrganization,
  deleteOrganization,
  recalculateOrganizationStats
} from '@/lib/organizationsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Organizations.module.css';
import { useOrganizations } from '@/hooks/useOrganizations';

/**
 * Format organization name to kebab-case with first letter capital
 * e.g., "ABC Organization" -> "Abc-organization"
 */
const formatOrgName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .split('-')
    .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join('-');
};

/**
 * Organizations page component
 */
export default function OrganizationsPage() {
  // Use organizations store
  const {
    allOrganizations,
    isLoading: isStoreLoading,
  } = useOrganizations({
    autoInitialize: true
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  /**
   * Organizations are now managed by the store
   * No need to manually load
   */

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest(`.${styles.actionsCell}`)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);


  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        await updateOrganization(editingId, formData);
        toast.success('Organization updated successfully');

        // Real-time store will update automatically
      } else {
        const newId = await addOrganization(formData);
        toast.success('Organization added successfully');

        // Real-time store will update automatically
      }

      setFormData({ name: '', code: '' });
      setShowForm(false);
      setEditingId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  };

  /**
   * Handle edit button click
   */
  const handleEdit = (org: Organization) => {
    if (!org.id) return;

    setFormData({
      name: org.name,
      code: org.code,
    });
    setEditingId(org.id);
    setShowForm(true);
  };

  /**
   * Handle delete button click
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteOrganization(id);
      toast.success('Organization deleted successfully');
      // Real-time store will update automatically
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization';
      toast.error(message);
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    setFormData({ name: '', code: '' });
    setShowForm(false);
    setEditingId(null);
  };

  /**
   * Handle recalculate stats button click
   */
  const handleRecalculateStats = async (name: string) => {
    try {
      setLoading(true);
      await recalculateOrganizationStats(name);
      toast.success(`Stats recalculated for ${name}`);
      setOpenMenuId(null);
      // Real-time store will update automatically
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to recalculate stats';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Organizations/Schools</h1>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              + Add Organization/School
            </Button>
          )}
        </div>

        {showForm && (
          <Card className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Edit Organization' : 'Add New Organization'}
            </h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Organization Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
                required
              />
              <Input
                label="Organization Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., ORG001"
                required
              />
              <div className={styles.formButtons}>
                <Button type="submit">
                  {editingId ? 'Update' : 'Add'} Organization
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isStoreLoading ? (
          <div className={styles.loading}>Loading organizations...</div>
        ) : allOrganizations.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>No organizations found. Add your first organization to get started.</p>
          </Card>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.grid}>
              <div className={styles.listHeader}>
                <div>Organization Name</div>
                <div className={styles.statsHeader}>Total</div>
                <div className={styles.statsHeader}>3K</div>
                <div className={styles.statsHeader}>5K</div>
                <div className={styles.statsHeader}>10K</div>
                <div className={styles.statsHeader}>Actions</div>
              </div>
              {allOrganizations.map((org) => (
                <div key={org.id} className={styles.orgCard}>
                  <div className={styles.orgName}>{formatOrgName(org.name)}</div>
                  <div className={styles.statValue} data-label="Total">{org.totalParticipants || 0}</div>
                  <div className={styles.statValue} data-label="3K">{org.category3K || 0}</div>
                  <div className={styles.statValue} data-label="5K">{org.category5K || 0}</div>
                  <div className={styles.statValue} data-label="10K">{org.category10K || 0}</div>

                  <div className={styles.actionsCell}>
                    <button
                      className={styles.menuButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (org.id) {
                          setOpenMenuId(openMenuId === org.id ? null : org.id);
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>

                    {org.id && openMenuId === org.id && (
                      <div className={styles.actionMenu}>
                        <button
                          className={styles.menuItem}
                          onClick={() => handleEdit(org)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => handleRecalculateStats(org.name)}
                          disabled={loading}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                          Recalculate Stats
                        </button>
                        <div className={styles.menuDivider} />
                        <button
                          className={`${styles.menuItem} ${styles.menuItemDanger}`}
                          onClick={() => org.id && handleDelete(org.id, org.name)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
