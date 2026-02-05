/**
 * Bib Management Page
 * 
 * Generate and manage bib numbers for participants by organization and category.
 * Each category (3K, 5K, 10K) has its own bib number sequence.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BibOrganizationSelector from '@/components/bib-management/BibOrganizationSelector';
import BibGenerateView from '@/components/bib-management/BibGenerateView';
import BibManageView from '@/components/bib-management/BibManageView';
import { Participant, Organization } from '@/types';
import {
  getParticipantsByOrganization,
  generateBibNumbers,
  updateBibNumber,
  checkBibNumberDuplicate,
} from '@/lib/participantsService';

import { toast } from 'react-hot-toast';
import styles from '@/styles/BibManagement.module.css';
import { useParticipants } from '@/hooks/useParticipants';
import { useOrganizations } from '@/hooks/useOrganizations';

// Feature flag for safe migration
const USE_REALTIME_STORE = true;

// Available categories for bib generation
const CATEGORIES = ['3K', '5K', '10K'];

type CategoryConfig = {
  prefix: string;
  startNumber: string;
};

type CategoryData = {
  withoutBibs: Participant[];
  allParticipants: Participant[];
  loaded: boolean;
};

/**
 * Bib Management page component
 */
export default function BibManagementPage() {
  // Real-time Store Integration
  const {
    allParticipants,
    isLoading: isStoreLoading,
    initialize: initializeStore
  } = useParticipants({
    autoInitialize: USE_REALTIME_STORE
  });

  const {
    allOrganizations,
    isLoading: isOrgsLoading,
  } = useOrganizations({
    autoInitialize: USE_REALTIME_STORE
  });

  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [loading, setLoading] = useState(false);

  // Firestore read counter
  const [firestoreReads, setFirestoreReads] = useState(0);

  // Category-specific config and data
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, CategoryConfig>>({
    '3K': { prefix: '3K-', startNumber: '1' },
    '5K': { prefix: '5K-', startNumber: '1' },
    '10K': { prefix: '10K-', startNumber: '1' },
  });
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({
    '3K': { withoutBibs: [], allParticipants: [], loaded: false },
    '5K': { withoutBibs: [], allParticipants: [], loaded: false },
    '10K': { withoutBibs: [], allParticipants: [], loaded: false },
  });

  // Active category tab
  const [activeCategory, setActiveCategory] = useState('3K');
  const [viewMode, setViewMode] = useState<'generate' | 'manage'>('generate');

  // Generation state
  const [generating, setGenerating] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBibValue, setEditBibValue] = useState('');
  const [duplicateParticipant, setDuplicateParticipant] = useState<Participant | null>(null);
  const [savingBib, setSavingBib] = useState(false);



  // Sync real-time data to categoryData state
  useEffect(() => {
    if (USE_REALTIME_STORE && selectedOrganization && allParticipants.length > 0) {
      const newCategoryData: Record<string, CategoryData> = {};

      CATEGORIES.forEach(category => {
        const categoryParticipants = allParticipants.filter(
          p => p.organization === selectedOrganization && p.category === category
        );

        newCategoryData[category] = {
          allParticipants: categoryParticipants,
          withoutBibs: categoryParticipants.filter(p => !p.bibNumber),
          loaded: true
        };
      });

      setCategoryData(newCategoryData);
    } else if (USE_REALTIME_STORE && !selectedOrganization) {
      // Reset if no org selected
      setCategoryData({
        '3K': { withoutBibs: [], allParticipants: [], loaded: false },
        '5K': { withoutBibs: [], allParticipants: [], loaded: false },
        '10K': { withoutBibs: [], allParticipants: [], loaded: false },
      });
    }
  }, [USE_REALTIME_STORE, selectedOrganization, allParticipants]);

  // Load all categories when organization changes
  useEffect(() => {
    if (selectedOrganization) {
      loadAllCategoryData();
    } else {
      // Reset all category data
      setCategoryData({
        '3K': { withoutBibs: [], allParticipants: [], loaded: false },
        '5K': { withoutBibs: [], allParticipants: [], loaded: false },
        '10K': { withoutBibs: [], allParticipants: [], loaded: false },
      });
    }
  }, [selectedOrganization]);



  const loadAllCategoryData = async () => {
    if (!selectedOrganization) return;

    // If using real-time store, data is handled by the useEffect above
    if (USE_REALTIME_STORE) return;

    setLoading(true);
    try {
      // Load data for all categories in parallel
      const results = await Promise.all(
        CATEGORIES.map(async (category) => {
          const allParticipants = await getParticipantsByOrganization(selectedOrganization, category);
          // Filter locally for participants without bibs
          const withoutBibs = allParticipants.filter(p => !p.bibNumber);
          return { category, withoutBibs, allParticipants };
        })
      );

      const newCategoryData: Record<string, CategoryData> = {};
      let totalReads = 0;
      results.forEach(({ category, withoutBibs, allParticipants }) => {
        newCategoryData[category] = { withoutBibs, allParticipants, loaded: true };
        totalReads += allParticipants.length;
      });
      setCategoryData(newCategoryData);
      setFirestoreReads(prev => prev + totalReads);
    } catch (error) {
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (category: string) => {
    if (!selectedOrganization) return;

    // If using real-time store, data is handled by the useEffect above
    if (USE_REALTIME_STORE) return;

    setLoading(true);
    try {
      const allParticipants = await getParticipantsByOrganization(selectedOrganization, category);
      // Filter locally for participants without bibs
      const withoutBibs = allParticipants.filter(p => !p.bibNumber);

      setCategoryData(prev => ({
        ...prev,
        [category]: { withoutBibs, allParticipants, loaded: true },
      }));
      // Count reads for this category
      setFirestoreReads(prev => prev + allParticipants.length);
    } catch (error) {
      console.error(`Failed to load ${category} participants:`, error);
      toast.error(`Failed to load ${category} participants`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: 'prefix' | 'startNumber', value: string) => {
    setCategoryConfigs(prev => ({
      ...prev,
      [activeCategory]: { ...prev[activeCategory], [field]: value },
    }));
  };

  const handleGenerateBibs = async () => {
    const data = categoryData[activeCategory];
    const config = categoryConfigs[activeCategory];

    if (data.withoutBibs.length === 0) {
      toast.error(`No participants without bibs in ${activeCategory} category`);
      return;
    }

    const start = parseInt(config.startNumber, 10);
    if (isNaN(start) || start < 1) {
      toast.error('Please enter a valid starting number');
      return;
    }

    setGenerating(activeCategory);
    try {
      const participantIds = data.withoutBibs
        .filter(p => p.id)
        .map(p => p.id as string);

      const result = await generateBibNumbers(participantIds, config.prefix, start);

      if (result.success > 0) {
        toast.success(`Generated ${result.success} bib number(s) for ${activeCategory}`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} bib(s) skipped due to duplicates`);
      }

      // Reload this category's participants
      if (!USE_REALTIME_STORE) {
        await loadCategoryData(activeCategory);
      }
    } catch (error) {
      toast.error(`Failed to generate bib numbers for ${activeCategory}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleEditBib = (participant: Participant) => {
    setEditingId(participant.id || null);
    setEditBibValue(participant.bibNumber ? participant.bibNumber : '');
    setDuplicateParticipant(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBibValue('');
    setDuplicateParticipant(null);
  };

  const handleCheckDuplicate = async () => {
    if (!editBibValue.trim()) {
      setDuplicateParticipant(null);
      return;
    }

    try {
      const duplicate = await checkBibNumberDuplicate(editBibValue.trim(), editingId || undefined);
      setDuplicateParticipant(duplicate);
      // Duplicate check reads 1 document (or 0 if no match)
      setFirestoreReads(prev => prev + 1);
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
  };

  const handleSaveBib = async () => {
    if (!editingId) return;

    // Check for duplicate before saving
    if (editBibValue.trim()) {
      const duplicate = await checkBibNumberDuplicate(editBibValue.trim(), editingId);
      // Duplicate check reads 1 document
      setFirestoreReads(prev => prev + 1);
      if (duplicate) {
        setDuplicateParticipant(duplicate);
        toast.error('Bib number already exists');
        return;
      }
    }

    setSavingBib(true);

    // Store current state for optimistic update
    const previousData = { ...categoryData[activeCategory] };
    const updatedBib = editBibValue.trim() || null;

    // OPTIMIZATION: Optimistic update - update UI immediately
    // If using real-time store, we can skip this or keep it for instant feedback
    // Keeping it for instant feedback is good, store will reconcile shortly
    setCategoryData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        allParticipants: prev[activeCategory].allParticipants.map(p =>
          p.id === editingId ? { ...p, bibNumber: updatedBib || undefined } : p
        ),
        withoutBibs: prev[activeCategory].withoutBibs.filter(p => p.id !== editingId),
      },
    }));

    try {
      const result = await updateBibNumber(editingId, updatedBib);

      if (result.success) {
        toast.success('Bib number updated');
        handleCancelEdit();
      } else if (result.duplicateParticipant) {
        // Rollback on duplicate
        setCategoryData(prev => ({
          ...prev,
          [activeCategory]: previousData,
        }));
        setDuplicateParticipant(result.duplicateParticipant);
        toast.error('Bib number already exists');
      }
    } catch (error) {
      // Rollback on error
      setCategoryData(prev => ({
        ...prev,
        [activeCategory]: previousData,
      }));
      toast.error('Failed to update bib number');
    } finally {
      setSavingBib(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Lazy load will trigger via useEffect
  };

  // Get current category's data
  const currentData = categoryData[activeCategory];
  const currentConfig = categoryConfigs[activeCategory];

  // Get counts for all categories
  const getCategoryCounts = () => {
    return CATEGORIES.map(cat => ({
      category: cat,
      withoutBibs: categoryData[cat].withoutBibs.length,
      total: categoryData[cat].allParticipants.length,
    }));
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bib Management</h1>
            <p className={styles.subtitle}>Generate and manage bib numbers by category</p>
          </div>
          {/* <div className={styles.readCounter}>
            <span className={styles.readIcon}>🔥</span>
            <span className={styles.readCount}>{firestoreReads}</span>
            <span className={styles.readLabel}>reads</span>
          </div> */}
        </div>

        <BibOrganizationSelector
          organizations={allOrganizations}
          selectedOrganization={selectedOrganization}
          onOrganizationChange={setSelectedOrganization}
          categoryCounts={getCategoryCounts()}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentWithoutBibs={currentData.withoutBibs.length}
          currentTotal={currentData.allParticipants.length}
        />

        {selectedOrganization && (
          <>
            {loading ? (
              <div className={styles.loading}>Loading participants...</div>
            ) : viewMode === 'generate' ? (
              <BibGenerateView
                category={activeCategory}
                prefix={currentConfig.prefix}
                startNumber={currentConfig.startNumber}
                onPrefixChange={(value) => handleConfigChange('prefix', value)}
                onStartNumberChange={(value) => handleConfigChange('startNumber', value)}
                participants={currentData.withoutBibs}
                onGenerate={handleGenerateBibs}
                generating={generating === activeCategory}
              />
            ) : (
              <BibManageView
                category={activeCategory}
                participants={currentData.allParticipants}
                editingId={editingId}
                editBibValue={editBibValue}
                duplicateParticipant={duplicateParticipant}
                savingBib={savingBib}
                onEdit={handleEditBib}
                onBibValueChange={(value) => {
                  setEditBibValue(value);
                  setDuplicateParticipant(null);
                }}
                onBibBlur={handleCheckDuplicate}
                onSave={handleSaveBib}
                onCancel={handleCancelEdit}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
