/**
 * Organization Type Definition
 */
export interface Organization {
  id?: string;
  name: string;
  code: string;
  // Participant stats
  totalParticipants?: number;
  category3K?: number;
  category5K?: number;
  category10K?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
