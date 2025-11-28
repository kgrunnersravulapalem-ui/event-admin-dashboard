/**
 * Participants Management Page
 * 
 * View, filter, and export participant data with server-side pagination
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Dropdown, Modal, Input, RadioGroup } from '@/components/ui';
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
  bulkDeleteParticipants,
  toggleParticipantStatus,
  bulkToggleParticipantStatus,
  toggleSwagKitStatus,
  checkBibNumberDuplicate,
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
  });
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  
  // Applied filters (actually used for fetching data)
  const [appliedFilters, setAppliedFilters] = useState({
    organization: '',
    category: '',
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
    bibNumber: '',
  });
  const [bibDuplicate, setBibDuplicate] = useState<Participant | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
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
   * Disabled during bulk uploads to prevent excessive reads
   */
  useEffect(() => {
    const unsubscribe = subscribeToParticipantCount(
      (newCount) => {
        // Skip updates during bulk upload to save reads
        if (isUploading) return;
        
        // If count changed, reload
        if (newCount !== totalCount) {
          loadParticipants();
        }
      },
      (error) => {
        console.error('Real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [totalCount, appliedFilters, appliedSearchTerm, currentPage, itemsPerPage, isUploading]);

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
      bibNumber: participant.bibNumber || '',
    });
    setBibDuplicate(null);
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
    
    // Clear bib duplicate when changing bib number
    if (name === 'bibNumber') {
      setBibDuplicate(null);
    }
  };

  /**
   * Check for bib number duplicate on blur
   */
  const handleBibBlur = async () => {
    const bibNumber = editFormData.bibNumber?.trim();
    if (!bibNumber) {
      setBibDuplicate(null);
      return;
    }
    
    try {
      const duplicate = await checkBibNumberDuplicate(bibNumber, editingParticipant?.id);
      setBibDuplicate(duplicate);
    } catch (error) {
      console.error('Error checking bib duplicate:', error);
    }
  };

  /**
   * Handle update participant
   */
  const handleUpdate = async () => {
    if (!editingParticipant?.id) return;

    // Check for bib duplicate before saving
    const bibNumber = editFormData.bibNumber?.trim();
    if (bibNumber) {
      const duplicate = await checkBibNumberDuplicate(bibNumber, editingParticipant.id);
      if (duplicate) {
        setBibDuplicate(duplicate);
        toast.error('Bib number already exists');
        return;
      }
    }

    try {
      await updateParticipant(editingParticipant.id, {
        ...editFormData,
        bibNumber: bibNumber || undefined,
      });
      toast.success('Participant updated successfully');
      setIsEditModalOpen(false);
      setEditingParticipant(null);
      setBibDuplicate(null);
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
   * Handle select/deselect a single participant
   */
  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  /**
   * Handle select/deselect all participants on current page
   */
  const handleSelectAll = () => {
    if (selectedIds.size === participants.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all on current page
      const allIds = participants.map(p => p.id!).filter(Boolean);
      setSelectedIds(new Set(allIds));
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} participant(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    
    // Store current state for potential rollback
    const previousParticipants = [...participants];
    const idsToDelete = Array.from(selectedIds);
    
    // Optimistic update - remove from UI immediately
    setParticipants(prev => prev.filter(p => !selectedIds.has(p.id || '')));
    setSelectedIds(new Set());
    
    try {
      const result = await bulkDeleteParticipants(idsToDelete);
      
      if (result.success > 0) {
        toast.success(`Deleted ${result.success} participant(s)`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} participant(s)`);
        // Reload to get accurate state if some failed
        loadParticipants();
      }
    } catch (error) {
      // Rollback on error
      setParticipants(previousParticipants);
      toast.error('Bulk delete failed');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  /**
   * Handle toggle participant enrollment status
   */
  const handleToggleStatus = async (participant: Participant) => {
    if (!participant.id) return;
    
    const action = participant.disabled ? 're-enroll' : 'unenroll';
    
    try {
      await toggleParticipantStatus(participant.id, !participant.disabled);
      toast.success(`Participant ${action}ed successfully`);
      loadParticipants();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to ${action} participant`;
      toast.error(message);
    }
  };

  /**
   * Handle toggle swag kit status
   */
  const handleToggleSwagKit = async (participant: Participant) => {
    if (!participant.id) return;
    
    const newStatus = !participant.swagKitGiven;
    
    // Optimistic update
    setParticipants(prev => prev.map(p => 
      p.id === participant.id ? { ...p, swagKitGiven: newStatus } : p
    ));
    
    try {
      await toggleSwagKitStatus(participant.id, newStatus);
    } catch (error: unknown) {
      // Rollback on error
      setParticipants(prev => prev.map(p => 
        p.id === participant.id ? { ...p, swagKitGiven: !newStatus } : p
      ));
      const message = error instanceof Error ? error.message : 'Failed to update swag kit status';
      toast.error(message);
    }
  };

  /**
   * Handle bulk toggle status
   */
  const handleBulkToggleStatus = async (disable: boolean) => {
    if (selectedIds.size === 0) return;
    
    const action = disable ? 'unenroll' : 're-enroll';
    
    // Store current state for potential rollback
    const previousParticipants = [...participants];
    const idsToToggle = Array.from(selectedIds);
    
    // Optimistic update - update UI immediately
    setParticipants(prev => prev.map(p => 
      selectedIds.has(p.id || '') ? { ...p, disabled: disable } : p
    ));
    setSelectedIds(new Set());
    
    try {
      const result = await bulkToggleParticipantStatus(idsToToggle, disable);
      
      if (result.success > 0) {
        toast.success(`${action === 'unenroll' ? 'Unenrolled' : 'Re-enrolled'} ${result.success} participant(s)`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to ${action} ${result.failed} participant(s)`);
        // Reload to get accurate state if some failed
        loadParticipants();
      }
    } catch (error) {
      // Rollback on error
      setParticipants(previousParticipants);
      toast.error(`Bulk ${action} failed`);
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
    });
    setAppliedSearchTerm('');
    setAppliedFilters({
      organization: '',
      category: '',
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
    appliedFilters.category;

  // Check if pending filters differ from applied (show apply button)
  const hasPendingChanges = 
    pendingSearchTerm !== appliedSearchTerm ||
    pendingFilters.organization !== appliedFilters.organization ||
    pendingFilters.category !== appliedFilters.category;

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

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectedCount}>
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleBulkToggleStatus(true)}
                >
                  Unenroll Selected
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleBulkToggleStatus(false)}
                >
                  Re-enroll Selected
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div className={styles.list}>
              <div className={styles.listHeader}>
                <div className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && selectedIds.size === participants.length}
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                  />
                </div>
                <div>Name</div>
                <div>Organization</div>
                <div>Mobile</div>
                <div>Gender</div>
                <div>Category</div>
                <div>Size</div>
                <div>Bib Number</div>
                <div>Swag Kit</div>
                <div>Actions</div>
              </div>
              {participants.map((participant: Participant) => (
                <div 
                  key={participant.id} 
                  className={`${styles.participantCard} ${participant.disabled ? styles.disabledRow : ''}`}
                >
                  <div className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(participant.id!)}
                      onChange={() => handleSelect(participant.id!)}
                      className={styles.checkbox}
                    />
                  </div>
                  <div className={styles.participantName}>{participant.name}</div>
                  <div className={styles.organization}>{participant.organization}</div>
                  <div className={styles.detail}>{participant.mobileNumber}</div>
                  <div className={styles.detail}>{participant.gender}</div>
                  <div className={styles.detail}>{participant.category}</div>
                  <div className={styles.detail}>{participant.size}</div>
                  <div className={styles.bibCell}>
                    {participant.bibNumber ? (
                      <span className={styles.bibBadge}>{participant.bibNumber}</span>
                    ) : (
                      <span className={styles.noBib}>-</span>
                    )}
                  </div>
                  <div className={styles.swagKitCell}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={participant.swagKitGiven || false}
                        onChange={() => handleToggleSwagKit(participant)}
                        className={styles.toggleInput}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.actionsCell}>
                    <button
                      className={styles.menuButton}
                      onClick={() => setOpenMenuId(openMenuId === participant.id ? null : participant.id || null)}
                      aria-label="Actions menu"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                    {openMenuId === participant.id && (
                      <div className={styles.actionMenu}>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            handleEdit(participant);
                            setOpenMenuId(null);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            handleToggleStatus(participant);
                            setOpenMenuId(null);
                          }}
                        >
                          {participant.disabled ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Re-enroll
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                              Unenroll
                            </>
                          )}
                        </button>
                        <div className={styles.menuDivider} />
                        <button
                          className={`${styles.menuItem} ${styles.menuItemDanger}`}
                          onClick={() => {
                            participant.id && handleDelete(participant.id, participant.name);
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

          <div className={styles.bibInputContainer}>
            <Input
              label="Bib Number"
              name="bibNumber"
              value={editFormData.bibNumber || ''}
              onChange={handleEditInputChange}
              onBlur={handleBibBlur}
              placeholder="e.g., 3K-101"
            />
            {bibDuplicate && (
              <div className={styles.bibDuplicateWarning}>
                ⚠️ Already assigned to: {bibDuplicate.name} ({bibDuplicate.organization})
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <UploadParticipantsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        organizations={organizations}
        onUploadStart={() => setIsUploading(true)}
        onUploadComplete={() => {
          setIsUploading(false);
          loadParticipants();
        }}
      />
    </DashboardLayout>
  );
}
