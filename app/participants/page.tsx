/**
 * Participants Management Page
 * 
 * View, filter, and export participant data with server-side pagination
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card } from '@/components/ui';
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
import ParticipantsFilter from '@/components/participants/ParticipantsFilter';
import ParticipantsTable from '@/components/participants/ParticipantsTable';
import ParticipantsPagination from '@/components/participants/ParticipantsPagination';
import EditParticipantModal from '@/components/participants/EditParticipantModal';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Participants.module.css';
import { useParticipants } from '@/hooks/useParticipants';
import { useOrganizations } from '@/hooks/useOrganizations';

// Feature flag for safe migration
const USE_REALTIME_STORE = true;

/**
 * Participants page component
 */
export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filters (apply instantly)
  const [filters, setFilters] = useState({
    organization: '',
    category: '',
    gender: '',
    swagKitGiven: undefined as boolean | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Search term with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Changed from 10 to 25
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
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

  // Firestore read counter
  const [firestoreReads, setFirestoreReads] = useState(0);

  // Ref to track if organizations have been loaded (prevents double load in strict mode)
  const organizationsLoadedRef = useRef(false);

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Auto-clear filters when user starts searching
  useEffect(() => {
    if (searchTerm.trim()) {
      setFilters({
        organization: '',
        category: '',
        gender: '',
        swagKitGiven: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [searchTerm]);

  // Real-time Store Integration
  const realtimeStore = useParticipants({
    filters: {
      organization: filters.organization,
      category: filters.category,
      gender: filters.gender,
      swagKitGiven: filters.swagKitGiven,
      searchTerm: debouncedSearchTerm,
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    pageSize: itemsPerPage,
    currentPage: currentPage,
    autoInitialize: USE_REALTIME_STORE,
  });

  const {
    allOrganizations,
    isLoading: isOrgsLoading,
  } = useOrganizations({
    autoInitialize: USE_REALTIME_STORE
  });

  // Sync real-time store data to local state when enabled
  useEffect(() => {
    if (USE_REALTIME_STORE) {
      setParticipants(realtimeStore.participants);
      setTotalCount(realtimeStore.totalCount);
      setLoading(realtimeStore.isLoading);
      setHasMore(realtimeStore.hasNextPage);
      setOrganizations(allOrganizations);
    }
  }, [
    USE_REALTIME_STORE,
    realtimeStore.participants,
    realtimeStore.totalCount,
    realtimeStore.isLoading,
    realtimeStore.hasNextPage,
    allOrganizations
  ]);


  /**
   * Build filters object for API call
   */
  const buildFilters = useCallback((): ParticipantFilters => {
    const apiFilters: ParticipantFilters = {};

    if (filters.organization) {
      apiFilters.organization = filters.organization;
    }
    if (filters.category) {
      apiFilters.category = filters.category;
    }
    if (filters.gender) {
      apiFilters.gender = filters.gender;
    }
    if (filters.swagKitGiven !== undefined) {
      apiFilters.swagKitGiven = filters.swagKitGiven;
    }
    if (filters.startDate) {
      apiFilters.startDate = filters.startDate;
    }
    if (filters.endDate) {
      apiFilters.endDate = filters.endDate;
    }
    if (debouncedSearchTerm) {
      apiFilters.searchTerm = debouncedSearchTerm;
    }

    return apiFilters;
  }, [filters, debouncedSearchTerm]);

  /**
   * Load organizations on mount (only once)
   * DEPRECATED: Using useOrganizations store
   */
  useEffect(() => {
    // Guard to prevent double loading (especially in React strict mode)
    if (organizationsLoadedRef.current) return;
    organizationsLoadedRef.current = true;

    if (!USE_REALTIME_STORE) {
      const loadOrganizations = async () => {
        try {
          const orgsData = await getAllOrganizations();
          setOrganizations(orgsData);
          // Count organization reads
          setFirestoreReads(prev => prev + orgsData.length);
        } catch (error) {
          toast.error('Failed to load organizations');
          console.error(error);
        }
      };
      loadOrganizations();
    }
  }, []);

  /**
   * Real-time subscription disabled to prevent unnecessary reloads
   * The subscription was triggering on EVERY participant update (not just additions),
   * causing wasteful Firestore reads. With optimistic updates, we don't need this.
   * 
   * If you need to detect new participants added by other users, consider:
   * 1. Manual refresh button
   * 2. Periodic polling (e.g., every 30 seconds)
   * 3. More selective subscription (only on additions, not updates)
   */
  // useEffect(() => {
  //   let isFirstCallback = true;
  //   const unsubscribe = subscribeToParticipantCount(
  //     (newCount) => {
  //       if (isUploading) return;
  //       setTotalCount(newCount);
  //       if (isFirstCallback) {
  //         isFirstCallback = false;
  //         return;
  //       }
  //       loadParticipants();
  //     },
  //     (error) => {
  //       console.error('Real-time subscription error:', error);
  //     }
  //   );
  //   return () => unsubscribe();
  // }, [totalCount, filters, debouncedSearchTerm, currentPage, itemsPerPage, isUploading]);

  /**
   * Load participants using pagination (DEPRECATED - using real-time store)
   */
  const loadParticipants = async () => {
    // Skip if using real-time store
    if (USE_REALTIME_STORE) return;

    // Trigger data fetch when filters change (only for non-real-time mode)
    useEffect(() => {
      if (!USE_REALTIME_STORE) {
        loadParticipants();
      }
    }, [currentPage, itemsPerPage, filters, debouncedSearchTerm]);
    if (USE_REALTIME_STORE) return;

    try {
      setLoading(true);
      const apiFilters = buildFilters();

      const cursor = pageCursors[currentPage - 1];

      const result = await getPaginatedParticipants(
        apiFilters,
        cursor,
        itemsPerPage
      );

      setParticipants(result.participants);
      setHasMore(result.hasMore);

      // Update next page cursor if available
      if (result.lastVisible) {
        setPageCursors(prev => {
          const newCursors = [...prev];
          newCursors[currentPage] = result.lastVisible;
          return newCursors;
        });
      }

      // Count reads: participants
      setFirestoreReads(prev => prev + result.participants.length);
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
      // Count read for duplicate check
      setFirestoreReads(prev => prev + 1);
    } catch (error) {
      console.error('Error checking bib duplicate:', error);
    }
  };

  /**
   * Handle update participant
   */
  const handleUpdate = async () => {
    if (!editingParticipant?.id) return;

    // Check for bib duplicate before saving (only if bib was changed)
    const bibNumber = editFormData.bibNumber?.trim();
    const originalBib = editingParticipant.bibNumber?.trim();
    const bibChanged = bibNumber !== originalBib;

    if (bibNumber && bibChanged) {
      const duplicate = await checkBibNumberDuplicate(bibNumber, editingParticipant.id);
      // Count read for duplicate check
      setFirestoreReads(prev => prev + 1);
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

      // Optimistically update the local state instead of reloading
      setParticipants(prev => prev.map(p =>
        p.id === editingParticipant.id
          ? {
            ...p,
            ...editFormData,
            bibNumber: bibNumber || undefined,
            updatedAt: new Date()
          }
          : p
      ));

      setIsEditModalOpen(false);
      setEditingParticipant(null);
      setBibDuplicate(null);
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
    const newStatus = !participant.disabled;

    // Optimistic update
    setParticipants(prev => prev.map(p =>
      p.id === participant.id ? { ...p, disabled: newStatus } : p
    ));

    try {
      await toggleParticipantStatus(participant.id, newStatus);
      toast.success(`Participant ${action}ed successfully`);
    } catch (error: unknown) {
      // Rollback on error
      setParticipants(prev => prev.map(p =>
        p.id === participant.id ? { ...p, disabled: !newStatus } : p
      ));
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
    const previousSelectedIds = new Set(selectedIds);
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
        // Partial rollback - only rollback failed items
        // Since we don't know which ones failed, we need to reload
        loadParticipants();
        setSelectedIds(new Set());
      }
    } catch (error) {
      // Rollback on error
      setParticipants(previousParticipants);
      setSelectedIds(previousSelectedIds);
      toast.error(`Bulk ${action} failed`);
    }
  };

  /**
   * Handle export to CSV - fetches all matching participants
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);

      let allParticipants: Participant[];

      if (USE_REALTIME_STORE && realtimeStore.allParticipants.length > 0) {
        // Use cached data if available (saves reads)
        // Apply current filters to all participants
        allParticipants = realtimeStore.filteredParticipants;
      } else {
        // Fallback to fetching from API
        const apiFilters = buildFilters();
        allParticipants = await getAllParticipants(apiFilters);
      }

      const csvContent = exportParticipantsToCSV(allParticipants);
      const filename = `participants_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      // Count reads for export
      setFirestoreReads(prev => prev + allParticipants.length);
      toast.success(`Exported ${allParticipants.length} participants`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };





  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters({
      organization: '',
      category: '',
      gender: '',
      swagKitGiven: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
    setPageCursors([null]); // Reset cursors
  };

  // Check if there are any active filters
  const hasAppliedFilters =
    debouncedSearchTerm ||
    filters.organization ||
    filters.category ||
    filters.gender ||
    filters.swagKitGiven !== undefined ||
    filters.startDate ||
    filters.endDate;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setPageCursors([null]); // Reset cursors
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Participants</h1>
          </div>
          <div className={styles.headerActions}>
            {/* <div className={styles.readCounter}>
              <span className={styles.readIcon}>🔥</span>
              <span className={styles.readCount}>{firestoreReads}</span>
              <span className={styles.readLabel}>reads</span>
            </div> */}
            <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
              Upload CSV
            </Button>
            <Button onClick={handleExport} disabled={totalCount === 0 || isExporting}>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <ParticipantsFilter
          filters={filters}
          setFilters={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          organizations={organizations}
          onClear={clearFilters}
          hasAppliedFilters={!!hasAppliedFilters}
        />

        {/* Participants List */}
        {loading ? (
          <div className={styles.loading}>Loading participants...</div>
        ) : participants.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>
              {hasAppliedFilters
                ? 'No participants match your filters.'
                : 'No participants enrolled yet.'}
            </p>
          </Card>
        ) : (
          <>
            <ParticipantsPagination
              currentPage={currentPage}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              currentCount={participants.length}
              showInfo={true}
              showNavigation={false}
            />

            <ParticipantsTable
              participants={participants}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onToggleSwagKit={handleToggleSwagKit}
              onBulkDelete={handleBulkDelete}
              onBulkToggleStatus={handleBulkToggleStatus}
              isBulkDeleting={isBulkDeleting}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
            />

            <ParticipantsPagination
              currentPage={currentPage}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              currentCount={participants.length}
              showInfo={false}
              showNavigation={true}
            />
          </>
        )}
      </div>

      {/* Edit Participant Modal */}
      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editFormData={editFormData}
        onInputChange={handleEditInputChange}
        onUpdate={handleUpdate}
        organizations={organizations}
        bibDuplicate={bibDuplicate}
        onBibBlur={handleBibBlur}
      />

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
