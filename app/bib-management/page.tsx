/**
 * Bib Management Page
 * 
 * Generate and manage bib numbers for participants by organization and category.
 * Each category (3K, 5K, 10K) has its own bib number sequence.
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button, Card, Dropdown, Input } from '@/components/ui';
import { Participant, Organization } from '@/types';
import { 
  getParticipantsByOrganization,
  generateBibNumbers,
  updateBibNumber,
  checkBibNumberDuplicate,
} from '@/lib/participantsService';
import { getAllOrganizations } from '@/lib/organizationsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/BibManagement.module.css';

// Available categories for bib generation
const CATEGORIES = ['3K', '5K', '10K'];

type CategoryConfig = {
  prefix: string;
  startNumber: string;
};

type CategoryData = {
  withoutBibs: Participant[];
  allParticipants: Participant[];
};

/**
 * Bib Management page component
 */
export default function BibManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
    '3K': { withoutBibs: [], allParticipants: [] },
    '5K': { withoutBibs: [], allParticipants: [] },
    '10K': { withoutBibs: [], allParticipants: [] },
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

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load participants when organization changes
  useEffect(() => {
    if (selectedOrganization) {
      loadAllCategoryData();
    } else {
      // Reset all category data
      setCategoryData({
        '3K': { withoutBibs: [], allParticipants: [] },
        '5K': { withoutBibs: [], allParticipants: [] },
        '10K': { withoutBibs: [], allParticipants: [] },
      });
    }
  }, [selectedOrganization]);

  const loadOrganizations = async () => {
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
      // Count organization reads
      setFirestoreReads(prev => prev + orgs.length);
    } catch (error) {
      toast.error('Failed to load organizations');
    }
  };

  const loadAllCategoryData = async () => {
    if (!selectedOrganization) return;
    
    setLoading(true);
    try {
      // Load data for all categories in parallel - only fetch all participants once per category
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
        newCategoryData[category] = { withoutBibs, allParticipants };
        // Only count one query per category now
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
    
    try {
      const allParticipants = await getParticipantsByOrganization(selectedOrganization, category);
      // Filter locally for participants without bibs
      const withoutBibs = allParticipants.filter(p => !p.bibNumber);
      
      setCategoryData(prev => ({
        ...prev,
        [category]: { withoutBibs, allParticipants },
      }));
      // Count reads for this category reload - only one query now
      setFirestoreReads(prev => prev + allParticipants.length);
    } catch (error) {
      console.error(`Failed to load ${category} participants:`, error);
    }
  };

  const handleConfigChange = (category: string, field: 'prefix' | 'startNumber', value: string) => {
    setCategoryConfigs(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleGenerateBibs = async (category: string) => {
    const data = categoryData[category];
    const config = categoryConfigs[category];
    
    if (data.withoutBibs.length === 0) {
      toast.error(`No participants without bibs in ${category} category`);
      return;
    }

    const start = parseInt(config.startNumber, 10);
    if (isNaN(start) || start < 1) {
      toast.error('Please enter a valid starting number');
      return;
    }

    setGenerating(category);
    try {
      const participantIds = data.withoutBibs
        .filter(p => p.id)
        .map(p => p.id as string);
      
      const result = await generateBibNumbers(participantIds, config.prefix, start);
      
      if (result.success > 0) {
        toast.success(`Generated ${result.success} bib number(s) for ${category}`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} bib(s) skipped due to duplicates`);
      }
      
      // Reload this category's participants
      await loadCategoryData(category);
    } catch (error) {
      toast.error(`Failed to generate bib numbers for ${category}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleEditBib = (participant: Participant) => {
    setEditingId(participant.id || null);
    setEditBibValue(participant.bibNumber || '');
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
    try {
      const result = await updateBibNumber(
        editingId,
        editBibValue.trim() || null
      );

      if (result.success) {
        toast.success('Bib number updated');
        handleCancelEdit();
        // Reload the active category
        await loadCategoryData(activeCategory);
      } else if (result.duplicateParticipant) {
        setDuplicateParticipant(result.duplicateParticipant);
        toast.error('Bib number already exists');
      }
    } catch (error) {
      toast.error('Failed to update bib number');
    } finally {
      setSavingBib(false);
    }
  };

  // Get current category's data
  const currentData = categoryData[activeCategory];
  const currentConfig = categoryConfigs[activeCategory];

  // Preview bib numbers that will be generated
  const previewBibs = currentData.withoutBibs.map((p, index) => ({
    ...p,
    previewBib: `${currentConfig.prefix}${parseInt(currentConfig.startNumber, 10) + index}`,
  }));

  // Get counts for all categories
  const getCategoryCounts = () => {
    return CATEGORIES.map(cat => ({
      category: cat,
      withoutBibs: categoryData[cat].withoutBibs.length,
      total: categoryData[cat].allParticipants.length,
    }));
  };

  const organizationOptions = [
    { value: '', label: 'Select Organization' },
    ...organizations.map(org => ({ value: org.name, label: org.name })),
  ];

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bib Management</h1>
            <p className={styles.subtitle}>Generate and manage bib numbers by category</p>
          </div>
          <div className={styles.readCounter}>
            <span className={styles.readIcon}>🔥</span>
            <span className={styles.readCount}>{firestoreReads}</span>
            <span className={styles.readLabel}>reads</span>
          </div>
        </div>

        {/* Organization Selection */}
        <Card className={styles.selectionCard}>
          <div className={styles.selectionGrid}>
            <div className={styles.field}>
              <Dropdown
                label="Organization"
                options={organizationOptions}
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {selectedOrganization && (
          <>
            {/* Category Summary Cards */}
            <div className={styles.categorySummary}>
              {getCategoryCounts().map(({ category, withoutBibs, total }) => (
                <div 
                  key={category}
                  className={`${styles.summaryCard} ${activeCategory === category ? styles.summaryCardActive : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <div className={styles.summaryCategory}>{category}</div>
                  <div className={styles.summaryStats}>
                    <span className={styles.summaryPending}>{withoutBibs} pending</span>
                    <span className={styles.summaryTotal}>/ {total} total</span>
                  </div>
                </div>
              ))}
            </div>

            {/* View Mode Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${viewMode === 'generate' ? styles.tabActive : ''}`}
                onClick={() => setViewMode('generate')}
              >
                Generate Bibs ({currentData.withoutBibs.length})
              </button>
              <button
                className={`${styles.tab} ${viewMode === 'manage' ? styles.tabActive : ''}`}
                onClick={() => setViewMode('manage')}
              >
                Manage All ({currentData.allParticipants.length})
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading participants...</div>
            ) : viewMode === 'generate' ? (
              /* Generate Bibs View */
              <Card className={styles.contentCard}>
                <h2 className={styles.sectionTitle}>
                  Generate Bib Numbers for {activeCategory}
                </h2>
                
                {currentData.withoutBibs.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>All {activeCategory} participants have bib numbers assigned.</p>
                  </div>
                ) : (
                  <>
                    {/* Bib Configuration */}
                    <div className={styles.configGrid}>
                      <div className={styles.field}>
                        <Input
                          label="Prefix"
                          placeholder="e.g., 3K-"
                          value={currentConfig.prefix}
                          onChange={(e) => handleConfigChange(activeCategory, 'prefix', e.target.value)}
                        />
                      </div>
                      <div className={styles.field}>
                        <Input
                          label="Starting Number"
                          type="number"
                          min="1"
                          value={currentConfig.startNumber}
                          onChange={(e) => handleConfigChange(activeCategory, 'startNumber', e.target.value)}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.previewLabel}>Preview Format</label>
                        <div className={styles.previewValue}>
                          {currentConfig.prefix}{currentConfig.startNumber} → {currentConfig.prefix}{parseInt(currentConfig.startNumber, 10) + currentData.withoutBibs.length - 1}
                        </div>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>New Bib Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewBibs.map((p, index) => (
                            <tr key={p.id}>
                              <td>{index + 1}</td>
                              <td>{p.name}</td>
                              <td>{p.mobileNumber}</td>
                              <td className={styles.bibPreview}>{p.previewBib}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className={styles.actions}>
                      <Button
                        onClick={() => handleGenerateBibs(activeCategory)}
                        disabled={generating === activeCategory}
                      >
                        {generating === activeCategory 
                          ? 'Generating...' 
                          : `Generate ${currentData.withoutBibs.length} Bibs for ${activeCategory}`}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ) : (
              /* Manage All View */
              <Card className={styles.contentCard}>
                <h2 className={styles.sectionTitle}>
                  All {activeCategory} Participants
                </h2>
                
                {currentData.allParticipants.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No {activeCategory} participants in this organization.</p>
                  </div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Bib Number</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.allParticipants.map((p, index) => (
                          <tr key={p.id} className={p.disabled ? styles.disabledRow : ''}>
                            <td>{index + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.mobileNumber}</td>
                            <td>
                              {editingId === p.id ? (
                                <div className={styles.editBibContainer}>
                                  <input
                                    type="text"
                                    value={editBibValue}
                                    onChange={(e) => {
                                      setEditBibValue(e.target.value);
                                      setDuplicateParticipant(null);
                                    }}
                                    onBlur={handleCheckDuplicate}
                                    className={styles.bibInput}
                                    placeholder="Enter bib number"
                                    autoFocus
                                  />
                                  {duplicateParticipant && (
                                    <div className={styles.duplicateWarning}>
                                      ⚠️ Already assigned to: {duplicateParticipant.name} ({duplicateParticipant.organization})
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className={p.bibNumber ? styles.bibNumber : styles.noBib}>
                                  {p.bibNumber || 'Not assigned'}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingId === p.id ? (
                                <div className={styles.editActions}>
                                  <Button
                                    size="small"
                                    onClick={handleSaveBib}
                                    disabled={savingBib || !!duplicateParticipant}
                                  >
                                    {savingBib ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="secondary"
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outline"
                                  onClick={() => handleEditBib(p)}
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
