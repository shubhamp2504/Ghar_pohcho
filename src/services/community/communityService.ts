import type {
  CommunityReport,
  CreateReportInput,
  ConfirmationType,
  ReportCategory,
} from '../../types/community';
import { calculateHaversineDistance } from '../../utils/geo';
import { getSupabaseClient } from '../supabase/supabaseClient';

const LOCAL_REPORTS_KEY = 'gharpahucho_community_reports';
const DEVICE_ID_KEY = 'gharpahucho_device_id';
const CONFIRMATIONS_LOG_KEY = 'gharpahucho_user_confirmations';

export class CommunityService {
  private deviceHash: string;

  constructor() {
    this.deviceHash = this.getOrCreateDeviceHash();
  }

  private getOrCreateDeviceHash(): string {
    if (typeof window === 'undefined') return 'server-dev-hash';
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      // Create random pseudo-anonymous 32-char device token
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  getDeviceHash(): string {
    return this.deviceHash;
  }

  /**
   * Fetches active, unexpired community reports
   */
  async getActiveReports(): Promise<CommunityReport[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('traffic_reports')
          .select('*')
          .eq('status', 'ACTIVE')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: Record<string, unknown>) => ({
            id: String(r.id),
            category: r.report_type as ReportCategory,
            roadName: String(r.road_name),
            description: r.description ? String(r.description) : undefined,
            lat: Number(r.latitude),
            lng: Number(r.longitude),
            reporterHash: String(r.reporter_device_hash),
            confidenceScore: Number(r.confidence_score || 1),
            confirmCount: Number(r.confirm_count || 0),
            clearedCount: Number(r.cleared_count || 0),
            worseCount: Number(r.worse_count || 0),
            status: 'ACTIVE',
            createdAt: String(r.created_at),
            expiresAt: String(r.expires_at),
          }));
        }
      } catch (err) {
        console.warn('Failed to query Supabase reports, using local store:', err);
      }
    }

    // Local / Persistent Storage with Pre-seeded Indian Corridor reports
    return this.getLocalActiveReports();
  }

  /**
   * Filters community reports within a specific corridor buffer (e.g. 5 km) along a route polyline
   */
  filterReportsAlongRoute(
    reports: CommunityReport[],
    routePolyline: [number, number][],
    bufferMeters = 5000
  ): CommunityReport[] {
    if (!routePolyline || routePolyline.length === 0) return [];

    return reports
      .map((report) => {
        let minDistance = Infinity;

        // Sample along route polyline (check every 2nd or 3rd point for efficiency)
        const step = Math.max(1, Math.floor(routePolyline.length / 40));
        for (let i = 0; i < routePolyline.length; i += step) {
          const dist = calculateHaversineDistance(
            [report.lat, report.lng],
            routePolyline[i]
          );
          if (dist < minDistance) {
            minDistance = dist;
          }
        }

        return {
          ...report,
          distanceFromRouteMeters: Math.round(minDistance),
        };
      })
      .filter((report) => (report.distanceFromRouteMeters ?? Infinity) <= bufferMeters)
      .sort((a, b) => (a.distanceFromRouteMeters ?? 0) - (b.distanceFromRouteMeters ?? 0));
  }

  /**
   * Submits a new community report with duplicate detection and rate limiting
   */
  async submitReport(input: CreateReportInput): Promise<{
    report: CommunityReport;
    isDuplicate: boolean;
  }> {
    const activeReports = await this.getActiveReports();

    // 1. Duplicate Detection (within 250m and matching category within last 20 minutes)
    const existing = activeReports.find((r) => {
      if (r.category !== input.category) return false;
      const dist = calculateHaversineDistance([r.lat, r.lng], [input.lat, input.lng]);
      return dist <= 250;
    });

    if (existing) {
      // Auto-confirm the existing report instead of creating a duplicate
      await this.confirmReport(existing.id, 'STILL_HERE');
      return { report: existing, isDuplicate: true };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 75 * 60 * 1000); // 75 mins expiration

    const newReport: CommunityReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      category: input.category,
      roadName: input.roadName,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      reporterHash: this.deviceHash,
      confidenceScore: 1,
      confirmCount: 0,
      clearedCount: 0,
      worseCount: 0,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('traffic_reports').insert({
          report_type: newReport.category,
          road_name: newReport.roadName,
          description: newReport.description,
          latitude: newReport.lat,
          longitude: newReport.lng,
          reporter_device_hash: newReport.reporterHash,
          confidence_score: 1,
          status: 'ACTIVE',
          expires_at: newReport.expiresAt,
        });
      } catch (err) {
        console.warn('Failed to insert report into Supabase:', err);
      }
    }

    // Always update local store for instant reactive UI
    const allLocal = this.getAllLocalReports();
    allLocal.unshift(newReport);
    this.saveLocalReports(allLocal);

    return { report: newReport, isDuplicate: false };
  }

  /**
   * Confirms or updates an existing report
   */
  async confirmReport(reportId: string, type: ConfirmationType): Promise<void> {
    // Record user action locally to prevent repeat spam
    const confirmations = this.getUserConfirmations();
    if (confirmations[reportId]) {
      return; // Already voted on this report
    }
    confirmations[reportId] = type;
    this.saveUserConfirmations(confirmations);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('traffic_confirmations').insert({
          report_id: reportId,
          confirmation_type: type,
          device_hash: this.deviceHash,
        });
      } catch (err) {
        console.warn('Failed to insert confirmation in Supabase:', err);
      }
    }

    // Update local reports cache
    const reports = this.getAllLocalReports();
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;

    if (type === 'STILL_HERE') {
      target.confirmCount += 1;
      target.confidenceScore += 1;
    } else if (type === 'WORSE') {
      target.worseCount += 1;
      target.confidenceScore += 2;
    } else if (type === 'CLEARED') {
      target.clearedCount += 1;
      target.confidenceScore -= 2;
      if (target.clearedCount >= 2 && target.clearedCount > target.confirmCount) {
        target.status = 'CLEARED';
      }
    }

    this.saveLocalReports(reports);
  }

  /**
   * Reports abuse / spam on a report
   */
  async reportAbuse(reportId: string, reason: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('abuse_reports').insert({
          report_id: reportId,
          reason,
          reporter_device_hash: this.deviceHash,
        });
      } catch (err) {
        console.warn('Failed to report abuse to Supabase:', err);
      }
    }

    // Locally mark as flagged
    const reports = this.getAllLocalReports();
    const target = reports.find((r) => r.id === reportId);
    if (target) {
      target.status = 'FLAGGED';
      this.saveLocalReports(reports);
    }
  }

  hasUserVoted(reportId: string): boolean {
    return Boolean(this.getUserConfirmations()[reportId]);
  }

  private getUserConfirmations(): Record<string, ConfirmationType> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(CONFIRMATIONS_LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveUserConfirmations(map: Record<string, ConfirmationType>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONFIRMATIONS_LOG_KEY, JSON.stringify(map));
    } catch {
      // Storage error
    }
  }

  private getAllLocalReports(): CommunityReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    // Pre-seed realistic Indian corridor incidents if first run
    const seeded = this.generateSeededReports();
    this.saveLocalReports(seeded);
    return seeded;
  }

  private getLocalActiveReports(): CommunityReport[] {
    const nowIso = new Date().toISOString();
    return this.getAllLocalReports().filter(
      (r) => r.status === 'ACTIVE' && r.expiresAt > nowIso
    );
  }

  private saveLocalReports(reports: CommunityReport[]): void {
    if (typeof window === 'undefined') return;
    try {
      // Keep at most 50 recent reports
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports.slice(0, 50)));
    } catch {
      // Ignore
    }
  }

  private generateSeededReports(): CommunityReport[] {
    const now = Date.now();
    return [
      {
        id: 'rep_seed_1',
        category: 'HEAVY_TRAFFIC',
        roadName: 'Khandala Ghat Section (Mumbai-Pune Expressway)',
        description: 'Multi-axle container truck breakdown on right climbing lane. Traffic moving at ~10 km/h.',
        lat: 18.7620,
        lng: 73.3850,
        reporterHash: 'seed_user_1',
        confidenceScore: 4,
        confirmCount: 3,
        clearedCount: 0,
        worseCount: 1,
        status: 'ACTIVE',
        createdAt: new Date(now - 18 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'rep_seed_2',
        category: 'TOLL_QUEUE',
        roadName: 'Khalapur Toll Plaza (Lane 4 & 5 Fastag Reader Slow)',
        description: 'Heavy queue of private cars towards Pune. Allow extra 8-10 mins at toll barrier.',
        lat: 18.8200,
        lng: 73.3100,
        reporterHash: 'seed_user_2',
        confidenceScore: 3,
        confirmCount: 2,
        clearedCount: 0,
        worseCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 50 * 60 * 1000).toISOString(),
      },
      {
        id: 'rep_seed_3',
        category: 'WATERLOGGING',
        roadName: 'Hero Honda Chowk Underpass (NH 48 Gurgaon)',
        description: 'Water accumulation on service lane after recent showers. Light vehicles advised to stick to main flyover.',
        lat: 28.4420,
        lng: 77.0180,
        reporterHash: 'seed_user_3',
        confidenceScore: 5,
        confirmCount: 4,
        clearedCount: 0,
        worseCount: 1,
        status: 'ACTIVE',
        createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 70 * 60 * 1000).toISOString(),
      },
      {
        id: 'rep_seed_4',
        category: 'CONSTRUCTION',
        roadName: 'Bidadi Bypass Link Road (Bengaluru-Mysuru Hwy)',
        description: 'Overhead signage maintenance work. Leftmost lane barricaded with warning cones.',
        lat: 12.8050,
        lng: 77.3700,
        reporterHash: 'seed_user_4',
        confidenceScore: 3,
        confirmCount: 2,
        clearedCount: 0,
        worseCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 40 * 60 * 1000).toISOString(),
      },
      {
        id: 'rep_seed_5',
        category: 'ACCIDENT',
        roadName: 'Chakan MIDC 4-Way Cross (NH 60 Pune-Nashik)',
        description: 'Minor fender-bender between two commercial tempos. Traffic police on scene directing vehicles.',
        lat: 18.7500,
        lng: 73.8500,
        reporterHash: 'seed_user_5',
        confidenceScore: 4,
        confirmCount: 3,
        clearedCount: 0,
        worseCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 65 * 60 * 1000).toISOString(),
      },
    ];
  }
}

export const communityService = new CommunityService();
