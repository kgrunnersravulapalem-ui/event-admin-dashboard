/**
 * CSV Upload Service
 * 
 * Handles CSV file parsing, validation, and bulk participant upload.
 * 
 * @module csvUploadService
 */

import {
  collection,
  writeBatch,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Participant } from '@/types';
import { bulkIncrementOrgParticipantStats } from './organizationsService';

/**
 * Expected CSV headers (case-insensitive)
 */
export const EXPECTED_HEADERS = ['Name', 'Gender', 'MobileNumber', 'Category', 'Size'] as const;

/**
 * Valid values for validation
 */
const VALID_GENDERS = ['Male', 'Female', 'Other'];
const VALID_CATEGORIES = ['3K', '5K', '10K'];

/**
 * Result of CSV parsing
 */
export interface CSVParseResult {
  success: boolean;
  data: Omit<Participant, 'id' | 'createdAt' | 'updatedAt' | 'organization'>[];
  errors: string[];
  warnings: string[];
}

/**
 * Result of bulk upload
 */
export interface BulkUploadResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Parse CSV content from file
 */
export const parseCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Normalize header name for comparison
 */
const normalizeHeader = (header: string): string => {
  return header.trim().toLowerCase().replace(/\s+/g, '');
};

/**
 * Validate CSV headers match expected format
 */
/**
 * Validate CSV headers and return mapping
 */
export const validateHeaders = (headers: string[]): { valid: boolean; message: string; mapping?: Record<string, number> } => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const expectedNormalized = EXPECTED_HEADERS.map(h => normalizeHeader(h));
  const mapping: Record<string, number> = {};

  // Check if all required headers are present
  const missingHeaders = expectedNormalized.filter(expected => !normalizedHeaders.includes(expected));

  if (missingHeaders.length > 0) {
    // Map back to original header names for better error message
    const missingOriginals = missingHeaders.map(h => {
      const index = expectedNormalized.indexOf(h);
      return EXPECTED_HEADERS[index];
    });

    return {
      valid: false,
      message: `Missing required columns: ${missingOriginals.join(', ')}`,
    };
  }

  // Create mapping
  expectedNormalized.forEach((expected, index) => {
    const foundIndex = normalizedHeaders.indexOf(expected);
    mapping[EXPECTED_HEADERS[index]] = foundIndex;
  });

  return { valid: true, message: 'Headers are valid', mapping };
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

/**
 * Validate and normalize gender value
 * Accepts: M, Male, F, Female, Other (case-insensitive)
 */
const normalizeGender = (value: string): 'Male' | 'Female' | 'Other' | null => {
  const normalized = value.trim().toUpperCase();

  // Handle single letter and full word variations
  if (normalized === 'M' || normalized === 'MALE') return 'Male';
  if (normalized === 'F' || normalized === 'FEMALE') return 'Female';
  if (normalized === 'O' || normalized === 'OTHER') return 'Other';

  return null;
};

/**
 * Validate and normalize category value
 * Accepts: 3, 3K, 5, 5K, 10, 10K (case-insensitive)
 */
const normalizeCategory = (value: string): '3K' | '5K' | '10K' | null => {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '');

  // Handle numeric values without K suffix
  if (normalized === '3') return '3K';
  if (normalized === '5') return '5K';
  if (normalized === '10') return '10K';

  // Handle values with K suffix
  if (normalized === '3K') return '3K';
  if (normalized === '5K') return '5K';
  if (normalized === '10K') return '10K';

  // Handle values with KM suffix
  if (normalized === '3KM') return '3K';
  if (normalized === '5KM') return '5K';
  if (normalized === '10KM') return '10K';

  return null;
};

/**
 * Validate mobile number
 */
const validateMobileNumber = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Parse and validate CSV content
 */
export const parseCSVContent = (content: string): CSVParseResult => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: Omit<Participant, 'id' | 'createdAt' | 'updatedAt' | 'organization'>[] = [];

  if (lines.length === 0) {
    return { success: false, data: [], errors: ['CSV file is empty'], warnings: [] };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  const headerValidation = validateHeaders(headers);

  if (!headerValidation.valid || !headerValidation.mapping) {
    return { success: false, data: [], errors: [headerValidation.message], warnings: [] };
  }

  const mapping = headerValidation.mapping;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const rowNumber = i + 1;
    const values = parseCSVLine(line);

    // Check if we have enough columns based on the max index in mapping
    const maxIndex = Math.max(...Object.values(mapping));
    if (values.length <= maxIndex) {
      // Pad with empty strings if needed
      while (values.length <= maxIndex) {
        values.push('');
      }
    }

    // Extract values using mapping
    const name = values[mapping['Name']] || '';
    const gender = values[mapping['Gender']] || '';
    const mobileNumber = values[mapping['MobileNumber']] || '';
    const category = values[mapping['Category']] || '';
    const size = values[mapping['Size']] || '';

    // Skip completely empty rows
    if (!name && !gender && !mobileNumber && !category && !size) {
      warnings.push(`Row ${rowNumber}: Completely empty row, skipping`);
      continue;
    }

    // Validate name - use placeholder if missing
    const finalName = name && name.trim().length > 0
      ? name.trim()
      : `Participant-${rowNumber}`;

    if (!name || name.trim().length === 0) {
      warnings.push(`Row ${rowNumber}: Name is missing, using "${finalName}"`);
    }

    // Validate gender - use default if invalid
    let normalizedGender = normalizeGender(gender);
    if (!normalizedGender) {
      normalizedGender = 'Male'; // Default to Male
      warnings.push(`Row ${rowNumber}: Invalid or missing gender "${gender}", defaulting to "Male"`);
    }

    // Validate mobile number - use placeholder if invalid
    let finalMobileNumber = mobileNumber;
    if (!validateMobileNumber(mobileNumber)) {
      finalMobileNumber = '0000000000'; // Placeholder
      warnings.push(`Row ${rowNumber}: Invalid or missing mobile number "${mobileNumber}", using placeholder "0000000000"`);
    } else {
      finalMobileNumber = mobileNumber.replace(/\D/g, '').slice(-10); // Keep last 10 digits
    }

    // Validate category - use default if invalid
    let normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      normalizedCategory = '5K'; // Default to 5K
      warnings.push(`Row ${rowNumber}: Invalid or missing category "${category}", defaulting to "5K"`);
    }

    // Size is optional
    const finalSize = size?.trim() || '';
    if (!finalSize) {
      warnings.push(`Row ${rowNumber}: Size is empty for "${finalName}"`);
    }

    data.push({
      name: finalName,
      gender: normalizedGender,
      mobileNumber: finalMobileNumber,
      category: normalizedCategory,
      size: finalSize,
    });
  }

  return {
    success: data.length > 0, // Success if we have at least one row
    data,
    errors,
    warnings,
  };
};

/**
 * Upload participants in bulk using Firestore batch operations
 * This is more efficient than individual adds and reduces reads/writes
 */
export const bulkUploadParticipants = async (
  participants: Omit<Participant, 'id' | 'createdAt' | 'updatedAt' | 'organization'>[],
  organization: string,
  onProgress?: (current: number, total: number) => void
): Promise<BulkUploadResult> => {
  const errors: string[] = [];
  const BATCH_SIZE = 500; // Firestore batch limit

  try {
    const participantsRef = collection(db, 'participants');

    // Track stats for bulk update
    const statsMap: Map<string, number> = new Map();

    // Process in batches
    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchParticipants = participants.slice(i, i + BATCH_SIZE);

      batchParticipants.forEach((participant) => {
        const docRef = doc(participantsRef);
        batch.set(docRef, {
          ...participant,
          organization,
          disabled: false,
          swagKitGiven: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Track category counts for stats
        const category = participant.category;
        statsMap.set(category, (statsMap.get(category) || 0) + 1);
      });

      await batch.commit();
      onProgress?.(Math.min(i + BATCH_SIZE, participants.length), participants.length);
    }

    // Update organization stats in bulk
    const statsPromises = Array.from(statsMap.entries()).map(([category, count]) =>
      bulkIncrementOrgParticipantStats(organization, category as '3K' | '5K' | '10K', count)
    );
    await Promise.all(statsPromises);

    return {
      success: true,
      totalProcessed: participants.length,
      successCount: participants.length,
      failedCount: 0,
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Batch upload failed: ${message}`);

    return {
      success: false,
      totalProcessed: participants.length,
      successCount: 0,
      failedCount: participants.length,
      errors,
    };
  }
};

/**
 * Generate sample CSV content for download
 */
export const generateSampleCSV = (): string => {
  const headers = EXPECTED_HEADERS.join(',');
  const sampleRows = [
    'John Doe,Male,9876543210,5K,L',
    'Jane Smith,Female,8765432109,3K,M',
    'Alex Kumar,Male,7654321098,10K,XL',
  ];
  return [headers, ...sampleRows].join('\n');
};

/**
 * Download sample CSV file
 */
export const downloadSampleCSV = (): void => {
  const content = generateSampleCSV();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample_participants.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
