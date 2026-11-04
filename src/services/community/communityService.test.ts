import { describe, it, expect, beforeEach } from 'vitest';
import { CommunityService } from './communityService';
import type { CreateReportInput } from '../../types/community';

describe('CommunityService (Intelligence & Verification)', () => {
  let service: CommunityService;

  beforeEach(() => {
    localStorage.clear();
    service = new CommunityService();
  });

  it('generates an anonymous persistent device hash', () => {
    const hash1 = service.getDeviceHash();
    expect(hash1).toBeDefined();
    expect(hash1.length).toBeGreaterThan(10);

    // Creates matching hash on same storage
    const newService = new CommunityService();
    expect(newService.getDeviceHash()).toBe(hash1);
  });

  it('submits a new report and stores it in active reports', async () => {
    const input: CreateReportInput = {
      category: 'ACCIDENT',
      roadName: 'Mumbai Expressway KM 45',
      description: 'Minor collision near Khalapur food mall',
      lat: 18.825,
      lng: 73.315,
    };

    const { report, isDuplicate } = await service.submitReport(input);
    expect(isDuplicate).toBe(false);
    expect(report.category).toBe('ACCIDENT');
    expect(report.roadName).toBe(input.roadName);
    expect(report.confidenceScore).toBe(1);

    const active = await service.getActiveReports();
    const found = active.find((r) => r.id === report.id);
    expect(found).toBeDefined();
  });

  it('detects duplicate reports within 250m radius and upvotes existing instead', async () => {
    const input1: CreateReportInput = {
      category: 'HEAVY_TRAFFIC',
      roadName: 'Western Express Highway Goregaon',
      lat: 19.1620,
      lng: 72.8450,
    };

    // First submission
    const res1 = await service.submitReport(input1);
    expect(res1.isDuplicate).toBe(false);

    // Second submission ~60m away with same category
    const input2: CreateReportInput = {
      category: 'HEAVY_TRAFFIC',
      roadName: 'WEH Goregaon Flyover',
      lat: 19.1623,
      lng: 72.8453,
    };

    const res2 = await service.submitReport(input2);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.report.id).toBe(res1.report.id);
  });

  it('updates confidence score when confirmed and prevents multi-voting from same device', async () => {
    const input: CreateReportInput = {
      category: 'TOLL_QUEUE',
      roadName: 'Talegaon Toll Plaza',
      lat: 18.660,
      lng: 73.680,
    };

    const { report } = await service.submitReport(input);
    expect(report.confirmCount).toBe(0);

    // Confirm as STILL_HERE
    await service.confirmReport(report.id, 'STILL_HERE');
    expect(service.hasUserVoted(report.id)).toBe(true);

    const reportsAfter = await service.getActiveReports();
    const target = reportsAfter.find((r) => r.id === report.id);
    expect(target?.confirmCount).toBe(1);
    expect(target?.confidenceScore).toBe(2);

    // Trying to vote again should not increment
    await service.confirmReport(report.id, 'STILL_HERE');
    const reportsAfterSecond = await service.getActiveReports();
    const targetSecond = reportsAfterSecond.find((r) => r.id === report.id);
    expect(targetSecond?.confirmCount).toBe(1);
  });

  it('filters reports along route polyline within buffer distance', async () => {
    const routePolyline: [number, number][] = [
      [19.0596, 72.8295], // Bandra Mumbai
      [18.9800, 73.1100], // Kalamboli
      [18.7700, 73.3800], // Khandala
      [18.5362, 73.8940], // Pune
    ];

    const reports = await service.getActiveReports();
    // Pre-seeded reports include Khandala (close to route) and Hero Honda Chowk Gurgaon (far away in Delhi)
    const filtered = service.filterReportsAlongRoute(reports, routePolyline, 5000); // 5km buffer

    expect(filtered.length).toBeGreaterThan(0);
    // Khandala report should be included
    const hasKhandala = filtered.some((r) => r.roadName.includes('Khandala'));
    expect(hasKhandala).toBe(true);

    // Gurgaon report should NOT be included for a Mumbai-Pune trip!
    const hasGurgaon = filtered.some((r) => r.roadName.includes('Gurgaon'));
    expect(hasGurgaon).toBe(false);
  });
});
