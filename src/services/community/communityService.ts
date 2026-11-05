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
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  getDeviceHash(): string {
    return this.deviceHash;
  }

  /**
   * Fetches active, unexpired real community reports created today
   */
  async getActiveReports(): Promise<CommunityReport[]> {
    const supabase = getSupabaseClient();
    const todayStr = new Date().toDateString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('traffic_reports')
          .select('*')
          .eq('status', 'ACTIVE')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data
            .filter((r: Record<string, unknown>) => new Date(String(r.created_at)).toDateString() === todayStr)
            .map((r: Record<string, unknown>) => ({
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

    // Local Storage reports created today
    return this.getLocalActiveReports();
  }

  /**
   * Fetches real live satellite & probe incidents from TomTom along the route
   */
  async fetchLiveRoadIncidents(routePolyline: [number, number][]): Promise<CommunityReport[]> {
    if (!routePolyline || routePolyline.length < 2) return [];

    const apiKey = (import.meta.env.VITE_TOMTOM_API_KEY as string | undefined) || null;
    if (!apiKey) return [];

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of routePolyline) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    // Add 5km buffer in degrees (~0.045)
    const pad = 0.05;
    const bbox = `${(minLng - pad).toFixed(4)},${(minLat - pad).toFixed(4)},${(maxLng + pad).toFixed(4)},${(maxLat + pad).toFixed(4)}`;

    try {
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay}}}&key=${encodeURIComponent(
        apiKey
      )}`;

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      const rawIncidents: Array<{
        geometry?: { coordinates?: any };
        properties?: {
          id?: string;
          iconCategory?: number;
          from?: string;
          to?: string;
          delay?: number;
          events?: Array<{ description?: string }>;
          startTime?: string;
          endTime?: string;
        };
      }> = data.incidents || [];

      const now = Date.now();
      const liveReports: CommunityReport[] = [];

      for (const inc of rawIncidents) {
        const props = inc.properties || {};
        const coords = inc.geometry?.coordinates;
        if (!coords) continue;

        const pt = Array.isArray(coords[0]) ? coords[0] : coords;
        const lat = pt[1];
        const lng = pt[0];

        if (typeof lat !== 'number' || typeof lng !== 'number') continue;

        // Verify proximity to the route polyline (within 4km)
        let minDistance = Infinity;
        const step = Math.max(1, Math.floor(routePolyline.length / 30));
        for (let i = 0; i < routePolyline.length; i += step) {
          const d = calculateHaversineDistance([lat, lng], routePolyline[i]);
          if (d < minDistance) minDistance = d;
        }

        if (minDistance <= 4000) {
          let category: ReportCategory = 'HEAVY_TRAFFIC';
          const cat = props.iconCategory;
          if (cat === 1) category = 'ACCIDENT';
          else if (cat === 7 || cat === 8) category = 'CONSTRUCTION';
          else if (cat === 2) category = 'WATERLOGGING';
          else if (cat === 6) category = 'HEAVY_TRAFFIC';
          else if (cat === 9) category = 'ROAD_CLOSURE';

          const road = props.from
            ? `${props.from}${props.to ? ' → ' + props.to : ''}`
            : 'Highway Corridor Stretch';

          const delayMins = props.delay ? Math.round(props.delay / 60) : 0;
          const eventDesc = props.events?.[0]?.description || 'Live Traffic Incident';
          const description = `${eventDesc}${delayMins > 0 ? ` (+${delayMins} min traffic delay)` : ''}`;

          liveReports.push({
            id: `live_sensor_${Math.random().toString(36).substring(2, 9)}`,
            category,
            roadName: road,
            description,
            lat,
            lng,
            reporterHash: 'satellite_sensor',
            confidenceScore: 5,
            confirmCount: 4,
            clearedCount: 0,
            worseCount: 0,
            status: 'ACTIVE',
            createdAt: props.startTime || new Date(now - 10 * 60 * 1000).toISOString(),
            expiresAt: props.endTime || new Date(now + 60 * 60 * 1000).toISOString(),
            distanceFromRouteMeters: Math.round(minDistance),
          });
        }
      }

      return liveReports;
    } catch (err) {
      console.warn('Failed to fetch real-time incident details:', err);
      return [];
    }
  }

  /**
   * Filters and merges authentic reports along a route corridor
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
        const step = Math.max(1, Math.floor(routePolyline.length / 40));
        for (let i = 0; i < routePolyline.length; i += step) {
          const dist = calculateHaversineDistance([report.lat, report.lng], routePolyline[i]);
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
   * Submits a new authentic community report with duplicate detection
   */
  async submitReport(input: CreateReportInput): Promise<{
    report: CommunityReport;
    isDuplicate: boolean;
  }> {
    const activeReports = await this.getActiveReports();

    // Duplicate Detection (within 250m and matching category within last 20 minutes)
    const existing = activeReports.find((r) => {
      if (r.category !== input.category) return false;
      const dist = calculateHaversineDistance([r.lat, r.lng], [input.lat, input.lng]);
      return dist <= 250;
    });

    if (existing) {
      await this.confirmReport(existing.id, 'STILL_HERE');
      return { report: existing, isDuplicate: true };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 75 * 60 * 1000); // 75 mins expiration

    const newReport: CommunityReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      category: input.category,
      roadName: input.roadName.trim(),
      description: input.description?.trim(),
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
          id: newReport.id,
          report_type: newReport.category,
          road_name: newReport.roadName,
          description: newReport.description,
          latitude: newReport.lat,
          longitude: newReport.lng,
          reporter_device_hash: this.deviceHash,
          confidence_score: 1,
          status: 'ACTIVE',
          created_at: newReport.createdAt,
          expires_at: newReport.expiresAt,
        });
      } catch (err) {
        console.warn('Failed to save to Supabase:', err);
      }
    }

    const current = this.getAllLocalReports();
    current.unshift(newReport);
    this.saveLocalReports(current);

    return { report: newReport, isDuplicate: false };
  }

  async confirmReport(reportId: string, type: ConfirmationType): Promise<void> {
    if (this.hasUserVoted(reportId)) return;

    const confirmations = this.getUserConfirmations();
    confirmations[reportId] = type;
    this.saveUserConfirmations(confirmations);

    const reports = this.getAllLocalReports();
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;

    if (type === 'STILL_HERE') {
      target.confirmCount += 1;
      target.confidenceScore += 1;
    } else if (type === 'CLEARED') {
      target.clearedCount += 1;
      target.confidenceScore = Math.max(0, target.confidenceScore - 1);
      if (target.clearedCount >= 3) {
        target.status = 'CLEARED';
      }
    } else if (type === 'WORSE') {
      target.worseCount += 1;
      target.confidenceScore += 1;
    }

    this.saveLocalReports(reports);
  }

  async reportAbuse(reportId: string, _reason: string): Promise<void> {
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
    return [];
  }

  private getLocalActiveReports(): CommunityReport[] {
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toDateString();
    return this.getAllLocalReports().filter(
      (r) => r.status === 'ACTIVE' && r.expiresAt > nowIso && new Date(r.createdAt).toDateString() === todayStr
    );
  }

  private saveLocalReports(reports: CommunityReport[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports.slice(0, 50)));
    } catch {
      // Ignore
    }
  }
}

export const communityService = new CommunityService();
