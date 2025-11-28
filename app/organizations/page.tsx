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
 * Organizations page component
 */
export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      } else {
        await addOrganization(formData);
        toast.success('Organization added successfully');
      }
      
      setFormData({ name: '', code: '' });
      setShowForm(false);
      setEditingId(null);
      loadOrganizations();
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
      loadOrganizations();
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
              <div>Code</div>
              <div className={styles.statsHeader}>Total</div>
              <div className={styles.statsHeader}>3K</div>
              <div className={styles.statsHeader}>5K</div>
              <div className={styles.statsHeader}>10K</div>
              <div>Actions</div>
            </div>
            {organizations.map((org) => (
              <div key={org.id} className={styles.orgCard}>
                <div className={styles.orgName}>{org.name}</div>
                <div className={styles.orgCode}>{org.code}</div>
                <div className={styles.statValue}>{org.totalParticipants || 0}</div>
                <div className={styles.statValue}>{org.category3K || 0}</div>
                <div className={styles.statValue}>{org.category5K || 0}</div>
                <div className={styles.statValue}>{org.category10K || 0}</div>
                <div className={styles.orgActions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(org)}
                    aria-label={`Edit ${org.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => org.id && handleDelete(org.id, org.name)}
                    aria-label={`Delete ${org.name}`}
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
