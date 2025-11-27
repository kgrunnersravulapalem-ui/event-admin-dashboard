/**
 * Participants Management Page
 * 
 * View, filter, and export participant data
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Dropdown, DatePicker, Modal, Input, RadioGroup } from '@/components/ui';
import { Participant, Organization } from '@/types';
import { 
  getAllParticipants, 
  deleteParticipant,
  updateParticipant,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    organization: '',
    gender: 'Male',
    mobileNumber: '',
    category: '3K',
    size: '',
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
   * Handle edit participant
   */
  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditFormData({
      name: participant.name,
      organization: participant.organization,
      gender: participant.gender,
      mobileNumber: participant.mobileNumber,
      category: participant.category,
      size: participant.size,
    });
    setIsEditModalOpen(true);
  };

  /**
   * Handle form input change
   */
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle update participant
   */
  const handleUpdate = async () => {
    if (!editingParticipant?.id) return;

    try {
      await updateParticipant(editingParticipant.id, editFormData);
      toast.success('Participant updated successfully');
      setIsEditModalOpen(false);
      setEditingParticipant(null);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update participant';
      toast.error(message);
    }
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

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
              <DatePicker
                label="From Date"
                name="startDate"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <DatePicker
                label="To Date"
                name="endDate"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
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
          <>
            <div className={styles.paginationTop}>
              <div className={styles.paginationInfo}>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length} participants
              </div>
              <div className={styles.itemsPerPageContainer}>
                <span className={styles.itemsPerPageLabel}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className={styles.itemsPerPageSelect}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

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
              {currentParticipants.map((participant) => (
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
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(participant)}
                      aria-label={`Edit ${participant.name}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
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

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page and adjacent pages
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className={styles.ellipsis}>...</span>}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ''}`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Participant Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Participant"
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdate}>
              Update
            </Button>
          </>
        }
      >
        <div className={styles.editForm}>
          <Input
            label="Name"
            name="name"
            value={editFormData.name}
            onChange={handleEditInputChange}
            required
          />
          
          <Dropdown
            label="Organization"
            name="organization"
            options={organizations.map((org) => ({
              value: org.name,
              label: org.name,
            }))}
            value={editFormData.organization}
            onChange={handleEditInputChange}
            required
          />

          <RadioGroup
            label="Gender"
            name="gender"
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
            value={editFormData.gender}
            onChange={handleEditInputChange}
            direction="horizontal"
            required
          />
          
          <Input
            label="Mobile Number"
            name="mobileNumber"
            type="tel"
            value={editFormData.mobileNumber}
            onChange={handleEditInputChange}
            required
          />

          <RadioGroup
            label="Category"
            name="category"
            options={[
              { value: '3K', label: '3K' },
              { value: '5K', label: '5K' },
              { value: '10K', label: '10K' },
            ]}
            value={editFormData.category}
            onChange={handleEditInputChange}
            direction="horizontal"
            required
          />
          
          <Dropdown
            label="T-Shirt Size"
            name="size"
            options={[
              { value: 'XS', label: 'XS' },
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
              { value: 'XL', label: 'XL' },
              { value: 'XXL', label: 'XXL' },
            ]}
            value={editFormData.size}
            onChange={handleEditInputChange}
            required
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
