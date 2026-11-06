export interface SnapshotRecord {
  siteSlug: string;
  siteName: string;
  siteColor: string;
  requestedDate: string; // YYYY-MM-DD
  snapshotTimestamp: string;
  snapshotUrl: string;
  statusCode: number | null;
  headline: string | null;
  available: boolean;
}

export interface DayResult {
  date: string;
  sites: SnapshotRecord[];
  warnings: string[];
}
