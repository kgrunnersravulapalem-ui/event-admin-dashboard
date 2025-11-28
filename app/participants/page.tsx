/**
 * Participants Management Page
 * 
 * View, filter, and export participant data with server-side pagination
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Dropdown, DatePicker, Modal, Input, RadioGroup } from '@/components/ui';
import { Participant, Organization } from '@/types';
import { 
  getPaginatedParticipants,
  getAllParticipants, 
  deleteParticipant,
  updateParticipant,
  exportParticipantsToCSV,
  downloadCSV,
  subscribeToParticipantCount,
  ParticipantFilters,
} from '@/lib/participantsService';
import { getAllOrganizations } from '@/lib/organizationsService';
import UploadParticipantsModal from '@/components/modals/UploadParticipantsModal';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Participants.module.css';

/**
 * Participants page component
 */
export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pending filters (user is selecting but not yet applied)
  const [pendingFilters, setPendingFilters] = useState({
    organization: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  
  // Applied filters (actually used for fetching data)
  const [appliedFilters, setAppliedFilters] = useState({
    organization: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  /**
   * Build filters object for API call (uses applied filters only)
   */
  const buildFilters = useCallback((): ParticipantFilters => {
    const apiFilters: ParticipantFilters = {};
    
    if (appliedFilters.organization) {
      apiFilters.organization = appliedFilters.organization;
    }
    if (appliedFilters.category) {
      apiFilters.category = appliedFilters.category;
    }
    if (appliedFilters.startDate) {
      apiFilters.startDate = new Date(appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      apiFilters.endDate = new Date(appliedFilters.endDate);
    }
    if (appliedSearchTerm) {
      apiFilters.searchTerm = appliedSearchTerm;
    }
    
    return apiFilters;
  }, [appliedFilters, appliedSearchTerm]);

  /**
   * Load organizations on mount
   */
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgsData = await getAllOrganizations();
        setOrganizations(orgsData);
      } catch (error) {
        toast.error('Failed to load organizations');
        console.error(error);
      }
    };
    loadOrganizations();
  }, []);

  /**
   * Subscribe to real-time participant count updates
   * This will trigger a reload when new participants are added
   */
  useEffect(() => {
    const unsubscribe = subscribeToParticipantCount(
      (newCount) => {
        // If count changed and we're on page 1 with no filters, reload
        if (newCount !== totalCount) {
          loadParticipants();
        }
      },
      (error) => {
        console.error('Real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [totalCount, appliedFilters, appliedSearchTerm, currentPage, itemsPerPage]);

  /**
   * Load participants when applied filters or pagination changes
   */
  useEffect(() => {
    loadParticipants();
  }, [currentPage, itemsPerPage, appliedFilters, appliedSearchTerm]);

  /**
   * Load participants with pagination
   */
  const loadParticipants = async () => {
    try {
      setLoading(true);
      const apiFilters = buildFilters();
      
      const result = await getPaginatedParticipants(
        apiFilters,
        currentPage,
        itemsPerPage
      );
      
      setParticipants(result.participants);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Failed to load participants');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      loadParticipants();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update participant';
      toast.error(message);
    }
  };

  /**
   * Handle delete participant (optimistic update)
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete participant "${name}"?`)) {
      return;
    }

    // Store current state for rollback
    const previousParticipants = [...participants];
    const previousTotalCount = totalCount;

    // Optimistic update - remove from UI immediately
    setParticipants(prev => prev.filter(p => p.id !== id));
    setTotalCount(prev => prev - 1);

    try {
      await deleteParticipant(id);
      toast.success('Participant deleted successfully');
      
      // If current page is now empty and not on first page, go to previous page
      if (participants.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error: unknown) {
      // Rollback on error
      setParticipants(previousParticipants);
      setTotalCount(previousTotalCount);
      const message = error instanceof Error ? error.message : 'Failed to delete participant';
      toast.error(message);
    }
  };

  /**
   * Handle export to CSV - fetches all matching participants
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const apiFilters = buildFilters();
      const allParticipants = await getAllParticipants(apiFilters);
      const csvContent = exportParticipantsToCSV(allParticipants);
      const filename = `participants_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(`Exported ${allParticipants.length} participants`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Apply filters - copies pending filters to applied filters
   */
  const applyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setAppliedSearchTerm(pendingSearchTerm);
    setCurrentPage(1);
  };

  /**
   * Handle search - applies search term
   */
  const handleSearch = () => {
    setAppliedSearchTerm(pendingSearchTerm);
    setCurrentPage(1);
  };

  /**
   * Handle search on Enter key
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setPendingSearchTerm('');
    setPendingFilters({
      organization: '',
      category: '',
      startDate: '',
      endDate: '',
    });
    setAppliedSearchTerm('');
    setAppliedFilters({
      organization: '',
      category: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
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

  // Check if there are any applied filters
  const hasAppliedFilters = 
    appliedSearchTerm || 
    appliedFilters.organization || 
    appliedFilters.category || 
    appliedFilters.startDate || 
    appliedFilters.endDate;

  // Check if pending filters differ from applied (show apply button)
  const hasPendingChanges = 
    pendingSearchTerm !== appliedSearchTerm ||
    pendingFilters.organization !== appliedFilters.organization ||
    pendingFilters.category !== appliedFilters.category ||
    pendingFilters.startDate !== appliedFilters.startDate ||
    pendingFilters.endDate !== appliedFilters.endDate;

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + participants.length, totalCount);

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
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
              Upload CSV
            </Button>
            <Button onClick={handleExport} disabled={totalCount === 0 || isExporting}>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={pendingSearchTerm}
            onChange={(e) => setPendingSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={styles.searchInput}
          />
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className={styles.filtersCard}>
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
                value={pendingFilters.organization}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, organization: e.target.value })
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
                value={pendingFilters.category}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, category: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <DatePicker
                label="From Date"
                name="startDate"
                value={pendingFilters.startDate}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, startDate: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <DatePicker
                label="To Date"
                name="endDate"
                value={pendingFilters.endDate}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, endDate: e.target.value })
                }
              />
            </div>

            <div className={styles.filterItem}>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>

            {(hasAppliedFilters || hasPendingChanges) && (
              <div className={styles.filterItem}>
                <Button variant="danger" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Participants List */}
        {loading ? (
          <div className={styles.loading}>Loading participants...</div>
        ) : totalCount === 0 ? (
          <Card className={styles.emptyState}>
            <p>
              {hasAppliedFilters
                ? 'No participants match your filters.'
                : 'No participants enrolled yet.'}
            </p>
          </Card>
        ) : (
          <>
            <div className={styles.paginationTop}>
              <div className={styles.paginationInfo}>
                Showing {startIndex + 1} to {endIndex} of {totalCount} participants
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
              {participants.map((participant: Participant) => (
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

      {/* Upload Modal */}
      <UploadParticipantsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        organizations={organizations}
        onUploadComplete={loadParticipants}
      />
    </DashboardLayout>
  );
}
