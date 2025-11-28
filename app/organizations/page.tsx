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
  getAllOrganizations, 
  addOrganization, 
  updateOrganization, 
  deleteOrganization 
} from '@/lib/organizationsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Organizations.module.css';

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  /**
   * Load organizations
   */
  useEffect(() => {
    loadOrganizations();
  }, []);

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
   * Fetch all organizations from Firestore
   */
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      toast.error('Failed to load organizations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
        
        // Optimistically update local state instead of reloading
        setOrganizations(prev => prev.map(org => 
          org.id === editingId 
            ? { ...org, ...formData }
            : org
        ));
      } else {
        const newId = await addOrganization(formData);
        toast.success('Organization added successfully');
        
        // Add new organization to local state
        setOrganizations(prev => [...prev, {
          id: newId,
          ...formData,
          totalParticipants: 0,
          category3K: 0,
          category5K: 0,
          category10K: 0,
          swagKitTaken: 0,
        }]);
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

    // Store previous state for rollback
    const previousOrganizations = [...organizations];

    // Optimistically remove from UI
    setOrganizations(prev => prev.filter(org => org.id !== id));

    try {
      await deleteOrganization(id);
      toast.success('Organization deleted successfully');
    } catch (error: unknown) {
      // Rollback on error
      setOrganizations(previousOrganizations);
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

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Organizations</h1>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              + Add Organization
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

        {loading ? (
          <div className={styles.loading}>Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>No organizations found. Add your first organization to get started.</p>
          </Card>
        ) : (
          <div className={styles.grid}>
            <div className={styles.listHeader}>
              <div>Name</div>
              <div className={styles.statsHeader}>Total</div>
              <div className={styles.statsHeader}>3K</div>
              <div className={styles.statsHeader}>5K</div>
              <div className={styles.statsHeader}>10K</div>
              <div className={styles.swagHeader}>🎁 Swag</div>
              <div className={styles.statsHeader}>Actions</div>
            </div>
            {organizations.map((org) => (
              <div key={org.id} className={styles.orgCard}>
                <div className={styles.orgName}>{formatOrgName(org.name)}</div>
                <div className={styles.statValue}>{org.totalParticipants || 0}</div>
                <div className={styles.statValue}>{org.category3K || 0}</div>
                <div className={styles.statValue}>{org.category5K || 0}</div>
                <div className={styles.statValue}>{org.category10K || 0}</div>
                <div className={styles.swagValue}>{org.swagKitTaken || 0}</div>
                <div className={styles.actionsCell}>
                  <button
                    className={styles.menuButton}
                    onClick={() => setOpenMenuId(openMenuId === org.id ? null : org.id || null)}
                    aria-label="Actions menu"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>
                  {openMenuId === org.id && (
                    <div className={styles.actionMenu}>
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          handleEdit(org);
                          setOpenMenuId(null);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <div className={styles.menuDivider} />
                      <button
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        onClick={() => {
                          org.id && handleDelete(org.id, org.name);
                          setOpenMenuId(null);
                        }}
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
        )}
      </div>
    </DashboardLayout>
  );
}
