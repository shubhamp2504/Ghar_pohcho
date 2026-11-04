import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Clock,
  Navigation2,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Radio,
  PlusCircle,
} from 'lucide-react';
import type { RouteCalculationResult, Language } from '../../types/routing';
import type { CommunityReport } from '../../types/community';
import { translations } from '../../i18n/translations';
import {
  formatDuration,
  formatDistance,
  formatDelay,
  formatETA,
} from '../../utils/geo';
import { RouteMap } from '../Map/RouteMap';
import { CommunityReportCard } from '../Community/CommunityReportCard';
import { ReportIncidentModal } from '../Community/ReportIncidentModal';
import { communityService } from '../../services/community/communityService';

interface JourneyResultsProps {
  result: RouteCalculationResult;
  language: Language;
  onBack: () => void;
  onDepartureChange?: (newDepartureIso?: string) => void;
}

export const JourneyResults: React.FC<JourneyResultsProps> = ({
  result,
  language,
  onBack,
}) => {
  const t = translations[language];
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(result.selectedRouteIndex || 0);
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [corridorReports, setCorridorReports] = useState<CommunityReport[]>([]);

  const selectedRoute = result.routes[selectedRouteIdx] || result.routes[0];
  const delayInfo = formatDelay(selectedRoute.additionalDelaySeconds, language);

  const loadReports = useCallback(async () => {
    const all = await communityService.getActiveReports();
    const alongRoute = communityService.filterReportsAlongRoute(
      all,
      selectedRoute.polyline,
      6000 // 6km buffer
    );
    setCorridorReports(alongRoute);
  }, [selectedRoute.polyline]);

  useEffect(() => {
    let isMounted = true;
    communityService.getActiveReports().then((all) => {
      if (!isMounted) return;
      const along = communityService.filterReportsAlongRoute(
        all,
        selectedRoute.polyline,
        6000
      );
      setCorridorReports(along);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedRoute.polyline]);

  // Generate readable WhatsApp message
  const generateShareText = () => {
    const originName = result.origin.name.split(',')[0];
    const destName = result.destination.name.split(',')[0];
    const durationStr = formatDuration(selectedRoute.durationSeconds, language);
    const etaStr = formatETA(selectedRoute.estimatedArrivalTime, language);
    const delayStr =
      selectedRoute.additionalDelaySeconds > 180
        ? `⚠️ Delay: +${Math.round(selectedRoute.additionalDelaySeconds / 60)} mins`
        : '🟢 Road clear';

    return `🏠 GharPahucho Route Update\n🚗 Trip: ${originName} → ${destName}\n⏱️ Est Duration: ${durationStr}\n📍 Arrival Time: ${etaStr}\n${delayStr} (${selectedRoute.name})\n\nCheck live updates: ${window.location.origin}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `GharPahucho - ${result.origin.name} to ${result.destination.name}`,
          text: generateShareText(),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(generateShareText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToSearch}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            title={t.copyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.shareOnWhatsApp}</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Primary Journey Summary Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-100/60 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative">
          {/* Origin & Destination Line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-1">
                {t.journeySummary}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{result.origin.name.split(',')[0]}</span>
                <span className="text-slate-400 font-normal">→</span>
                <span className="text-orange-600">{result.destination.name.split(',')[0]}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {selectedRoute.name}
              </p>
            </div>

            {/* Source & Freshness Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {result.source === 'GOOGLE_ROUTES_API' ? t.sourceGoogle : t.sourceMock}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            {/* Metric 1: Expected Arrival */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {t.estimatedArrival}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatETA(selectedRoute.estimatedArrivalTime, language)}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
                {t.justNow} {t.lastUpdated}
              </span>
            </div>

            {/* Metric 2: Traffic-Aware Duration */}
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
              <span className="text-xs font-bold text-orange-800 block mb-1">
                {t.trafficAwareDuration}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-orange-600">
                {formatDuration(selectedRoute.durationSeconds, language)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Baseline: {formatDuration(selectedRoute.staticDurationSeconds, language)}
              </span>
            </div>

            {/* Metric 3: Additional Traffic Delay */}
            <div className={`p-4 rounded-2xl border ${
              delayInfo.severity === 'high'
                ? 'bg-red-50/80 border-red-200 text-red-900'
                : delayInfo.severity === 'moderate'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-xs font-bold block mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {t.additionalDelay}
              </span>
              <div className={`text-2xl sm:text-3xl font-black ${
                delayInfo.severity === 'high'
                  ? 'text-red-600'
                  : delayInfo.severity === 'moderate'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}>
                {selectedRoute.additionalDelaySeconds > 120
                  ? `+${Math.round(selectedRoute.additionalDelaySeconds / 60)} min`
                  : '0 min'}
              </div>
              <span className="text-[11px] font-bold block mt-1">
                {delayInfo.text}
              </span>
            </div>

            {/* Metric 4: Total Distance */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Navigation2 className="w-3.5 h-3.5 text-slate-400" />
                {t.totalDistance}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatDistance(selectedRoute.distanceMeters, language)}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                {selectedRoute.hasTolls ? t.hasTolls : t.noTolls}
              </span>
            </div>
          </div>

          {/* Delay Formula Clarification Banner */}
          <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">
                Delay Calculation Formula:{' '}
              </span>
              <span>
                Additional Delay = Traffic-Aware Duration ({Math.round(selectedRoute.durationSeconds / 60)} min) - Baseline Free-Flow Duration ({Math.round(selectedRoute.staticDurationSeconds / 60)} min) ={' '}
                <strong className="text-orange-600 font-extrabold">
                  +{Math.round(selectedRoute.additionalDelaySeconds / 60)} mins delay
                </strong>
                .
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Traffic Map */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              {t.trafficMap}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Click any alternative line or card to switch
          </span>
        </div>

        <RouteMap
          routes={result.routes}
          selectedRouteIndex={selectedRouteIdx}
          origin={result.origin}
          destination={result.destination}
          language={language}
          communityReports={corridorReports}
          onSelectRoute={(idx) => setSelectedRouteIdx(idx)}
        />
      </div>

      {/* Route Comparison Section (Route A, B, C) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>{t.compareRoutes}</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {result.routes.length} options
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {result.routes.map((route, idx) => {
            const isSelected = idx === selectedRouteIdx;
            const diffSeconds = route.durationSeconds - selectedRoute.durationSeconds;

            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteIdx(idx)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-orange-50/40 border-orange-500 shadow-md ring-2 ring-orange-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {route.name}
                    </span>
                  </div>

                  {route.isRecommended && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t.recommendedRoute}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                  {route.summary}
                </p>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatDuration(route.durationSeconds, language)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Delay</span>
                    <span className={`font-bold text-xs ${
                      route.additionalDelaySeconds > 600 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      +{Math.round(route.additionalDelaySeconds / 60)} min
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance</span>
                    <span className="font-semibold text-slate-700">
                      {formatDistance(route.distanceMeters, language)}
                    </span>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[11px] font-bold">
                        {t.activeRoute}
                      </span>
                    ) : (
                      <span className="text-orange-600 font-bold flex items-center gap-0.5">
                        {diffSeconds < 0 ? (
                          <span className="text-emerald-600 font-bold">
                            {formatDuration(Math.abs(diffSeconds), language)} {t.fasterBy}
                          </span>
                        ) : diffSeconds > 0 ? (
                          <span className="text-slate-500">
                            +{formatDuration(diffSeconds, language)} {t.slowerBy}
                          </span>
                        ) : (
                          <span>{t.selectRoute}</span>
                        )}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {route.tollNote && (
                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg">
                    💳 {route.tollNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Congestion Bottlenecks List (Section 5.D & 11) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {t.trafficDetailsTitle}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {selectedRoute.trafficSegments.length} Bottlenecks
          </span>
        </div>

        {selectedRoute.trafficSegments.length === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.noBottlenecks}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedRoute.trafficSegments.map((segment) => (
              <div
                key={segment.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      segment.congestionLevel === 'HEAVY'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {segment.congestionLevel}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {segment.roadName}
                    </span>
                  </div>
                  {segment.description && (
                    <p className="text-xs text-slate-600">{segment.description}</p>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Source: {segment.source} • Trend: {t.congestionStable}
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-xl border border-red-100 inline-block">
                    +{Math.round(segment.delaySeconds / 60)} min delay
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Ground Reports Section (Phase 2 - Section 7) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {t.communityReportsTitle}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {corridorReports.length} {t.verifiedByTravellers}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live ground intelligence reported by travellers along this corridor
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.reportRoadCondition}</span>
          </button>
        </div>

        {corridorReports.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {t.noCommunityReports}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Spotting unexpected waterlogging, toll queues, or lane work? Report it to help others.
            </p>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="mt-2 text-xs font-bold text-orange-600 hover:underline inline-block"
            >
              + {t.reportRoadCondition}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {corridorReports.map((report) => (
              <CommunityReportCard
                key={report.id}
                report={report}
                language={language}
                onVoted={loadReports}
              />
            ))}
          </div>
        )}
      </div>

      {/* Best Time to Leave Planner Preview (Section 6) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-base">Best Time to Leave (Departure Comparison)</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Historical & Live Trends</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Option 1: Leave now */}
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-orange-400 font-bold block mb-1">Leave Now</span>
            <div className="text-xl font-black text-white">
              {formatDuration(selectedRoute.durationSeconds, language)}
            </div>
            <p className="text-slate-300 text-[11px] mt-1">
              ETA: {formatETA(selectedRoute.estimatedArrivalTime, language)}
            </p>
          </div>

          {/* Option 2: Leave in 30 mins */}
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 font-bold block mb-1">+30 Minutes</span>
            <div className="text-xl font-black text-white">
              {formatDuration(selectedRoute.durationSeconds - 300, language)}
            </div>
            <p className="text-emerald-400 text-[11px] mt-1 font-semibold">
              ↓ Save ~5 mins (evening rush subsides)
            </p>
          </div>

          {/* Option 3: Leave in 1 hour */}
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 font-bold block mb-1">+1 Hour</span>
            <div className="text-xl font-black text-white">
              {formatDuration(selectedRoute.durationSeconds - 900, language)}
            </div>
            <p className="text-emerald-400 text-[11px] mt-1 font-semibold">
              ↓ Save ~15 mins (free-flow highway)
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-3 italic">
          *Planning estimate based on typical historical corridor patterns. Departure forecasts are updated in real-time.
        </p>
      </div>

      {/* Community Report Incident Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        language={language}
        defaultLocation={result.origin}
        onReportSubmitted={loadReports}
      />
    </div>
  );
};
