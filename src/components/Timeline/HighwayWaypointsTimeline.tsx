import React, { useMemo } from 'react';
import {
  Milestone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type { RouteOption, LocationPoint, Language } from '../../types/routing';
import type { WaypointStatus } from '../../types/waypoints';
import { intermediateTownsService } from '../../services/waypoints/intermediateTownsService';
import { formatETA } from '../../utils/geo';

interface HighwayWaypointsTimelineProps {
  route: RouteOption;
  origin: LocationPoint;
  destination: LocationPoint;
  language: Language;
}

const STATUS_CONFIG: Record<
  WaypointStatus,
  { label: Record<Language, string>; bg: string; text: string; icon: React.ReactNode }
> = {
  CLEAR: {
    label: { en: 'Clear Flow', hi: 'रास्ता साफ़', mr: 'वाहतूक सुरळीत' },
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
  },
  MODERATE: {
    label: { en: 'Moderate', hi: 'मध्यम', mr: 'मध्यम' },
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
  },
  CONGESTED: {
    label: { en: 'Heavy Jam', hi: 'भारी जाम', mr: 'वाहतूक कोंडी' },
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <AlertTriangle className="w-3 h-3 text-red-600" />,
  },
  BLOCKED_DIVERTED: {
    label: { en: 'Road Block / Detour', hi: 'रास्ता बंद / डाइवर्जन', mr: 'रस्ता बंद / पर्यायी मार्ग' },
    bg: 'bg-rose-600 text-white border border-rose-700 shadow-sm',
    text: 'text-white',
    icon: <AlertTriangle className="w-3 h-3 text-white" />,
  },
};

export const HighwayWaypointsTimeline: React.FC<HighwayWaypointsTimelineProps> = ({
  route,
  origin,
  destination,
  language,
}) => {
  const waypoints = useMemo(() => {
    return intermediateTownsService.getWaypointsForRoute(route, origin, destination);
  }, [route, origin, destination]);

  if (waypoints.length <= 2) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'hi'
                  ? 'रास्ते में पड़ने वाले मुख्य शहर व पड़ाव'
                  : language === 'mr'
                  ? 'मार्गावरील मुख्य गावे, टोल व थांबे'
                  : 'Intermediate Highway Towns & Milestones'}
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {waypoints.length} Milestones
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'लंबे सफर में बीच में आने वाले शहर, टोल व उनकी लाइव स्थिति'
                : language === 'mr'
                ? 'प्रवासादरम्यान लागणारी शहरे, टोल नाके व त्यांची थेट वाहतूक स्थिती'
                : 'Sequential breakdown of towns, tolls & passes with distance and live status'}
            </p>
          </div>
        </div>
      </div>

      {/* Vertical Milestone Progress Timeline */}
      <div className="relative pl-3 sm:pl-4 space-y-6 pt-2">
        {/* Continuous Connecting Line */}
        <div className="absolute left-6 sm:left-7 top-6 bottom-6 w-0.5 bg-slate-200 pointer-events-none" />

        {waypoints.map((wp, idx) => {
          const cfg = STATUS_CONFIG[wp.status];
          const isFirst = idx === 0;
          const isLast = idx === waypoints.length - 1;

          return (
            <div key={wp.id} className="relative flex items-start gap-3 sm:gap-4 group">
              {/* Milestone Icon / Dot */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-sm ${
                    isFirst
                      ? 'bg-emerald-600 text-white border-emerald-300'
                      : isLast
                      ? 'bg-red-600 text-white border-red-300'
                      : wp.status === 'BLOCKED_DIVERTED'
                      ? 'bg-rose-700 text-white border-rose-300 animate-pulse'
                      : wp.status === 'CONGESTED'
                      ? 'bg-red-500 text-white border-red-200'
                      : wp.status === 'MODERATE'
                      ? 'bg-amber-500 text-white border-amber-200'
                      : 'bg-white text-slate-700 border-indigo-300'
                  }`}
                >
                  {isFirst ? 'A' : isLast ? '🏠' : idx}
                </div>
              </div>

              {/* Waypoint Details Card */}
              <div className="flex-1 bg-slate-50/70 hover:bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                      {wp.distanceKm} km
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {language !== 'en' && wp.localName ? wp.localName[language] : wp.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pill */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon}
                      <span>{cfg.label[language] || cfg.label.en}</span>
                    </span>

                    {/* ETA Pill */}
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatETA(wp.estimatedArrival, language)}</span>
                    </span>
                  </div>
                </div>

                {wp.highlight && (
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{wp.highlight}</span>
                  </p>
                )}

                {wp.delaySeconds > 120 && (
                  <div className="mt-2 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 inline-block">
                    ⚠️ +{Math.round(wp.delaySeconds / 60)} min slowdown near this milestone
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
