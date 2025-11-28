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
  // Swag kit stats (real-time aggregation)
  swagKitTaken?: number; // Count of participants who have received swag kits
  createdAt?: Date;
  updatedAt?: Date;
}
