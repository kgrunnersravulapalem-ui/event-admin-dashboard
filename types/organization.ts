/**
 * Organization Type Definition
 */
export interface OrganizationStats {
  totalParticipants: number;
  swagKitTaken: number;

  // 3K Stats
  total3K: number;
  male3K: number;
  female3K: number;
  swag3K: number;

  // 5K Stats
  total5K: number;
  male5K: number;
  female5K: number;
  swag5K: number;

  // 10K Stats
  total10K: number;
  male10K: number;
  female10K: number;
  swag10K: number;
}

export interface Organization {
  id?: string;
  name: string;
  code: string;
  // Participant stats
  totalParticipants?: number;
  category3K?: number;
  category5K?: number;
  category10K?: number;
  // Detailed stats
  stats?: OrganizationStats;
  // Swag kit stats (real-time aggregation)
  createdAt?: Date;
  updatedAt?: Date;
}
