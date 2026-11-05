export type ReportCategory =
  | 'HEAVY_TRAFFIC'
  | 'SLOW_TRAFFIC'
  | 'ACCIDENT'
  | 'ROAD_CLOSURE'
  | 'CONSTRUCTION'
  | 'WATERLOGGING'
  | 'TOLL_QUEUE'
  | 'HAZARD';

export type ConfirmationType = 'STILL_HERE' | 'CLEARED' | 'WORSE';

export type ReportStatus = 'ACTIVE' | 'CLEARED' | 'EXPIRED' | 'FLAGGED';

export interface CommunityReport {
  id: string;
  category: ReportCategory;
  roadName: string;
  description?: string;
  lat: number;
  lng: number;
  reporterHash: string;
  confidenceScore: number;
  confirmCount: number;
  clearedCount: number;
  worseCount: number;
  status: ReportStatus;
  createdAt: string;
  expiresAt: string;
  distanceFromRouteMeters?: number;
}

export interface CreateReportInput {
  category: ReportCategory;
  roadName: string;
  description?: string;
  lat: number;
  lng: number;
}

export interface ConfirmationInput {
  reportId: string;
  type: ConfirmationType;
}

export type AbuseReason = 'SPAM' | 'INCORRECT_LOCATION' | 'OFFENSIVE' | 'FAKE';

