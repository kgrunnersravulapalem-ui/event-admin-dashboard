/**
 * Firestore Service (Legacy)
 * 
 * This file re-exports functions from the new modular services.
 * Kept for backward compatibility.
 * 
 * @deprecated Use participantsService.ts directly for new code
 * @module firestoreService
 */

export {
  addParticipant,
  validateParticipant,
  updateParticipant,
  deleteParticipant,
  getAllParticipants,
  getParticipantById,
} from './participantsService';
