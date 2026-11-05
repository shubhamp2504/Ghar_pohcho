import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  Cone,
  Droplets,
  CreditCard,
  Ban,
  ThumbsUp,
  Check,
  TrendingUp,
  Flag,
  ShieldCheck,
} from 'lucide-react';
import type { Language } from '../../types/routing';
import type { CommunityReport, ConfirmationType } from '../../types/community';
import { translations } from '../../i18n/translations';
import { communityService } from '../../services/community/communityService';

interface CommunityReportCardProps {
  report: CommunityReport;
  language: Language;
  onVoted?: () => void;
}

function getMinutesAgo(isoDate: string): number {
  const created = new Date(isoDate).getTime();
  if (isNaN(created)) return 1;
  return Math.max(1, Math.round((Date.now() - created) / 60000));
}

export const CommunityReportCard: React.FC<CommunityReportCardProps> = ({
  report,
  language,
  onVoted,
}) => {
  const t = translations[language];
  const [hasVoted, setHasVoted] = useState(() => communityService.hasUserVoted(report.id));
  const [voteNotice, setVoteNotice] = useState<string | null>(null);
  const [minutesAgo] = useState(() => getMinutesAgo(report.createdAt));

  const handleVote = async (type: ConfirmationType) => {
    if (hasVoted) {
      setVoteNotice(t.alreadyVoted);
      setTimeout(() => setVoteNotice(null), 2000);
      return;
    }

    await communityService.confirmReport(report.id, type);
    setHasVoted(true);
    setVoteNotice(t.votedThanks);
    setTimeout(() => setVoteNotice(null), 2500);
    if (onVoted) onVoted();
  };

  const handleFlag = async () => {
    if (confirm('Flag this report as inaccurate or spam?')) {
      await communityService.reportAbuse(report.id, 'INACCURATE');
      if (onVoted) onVoted();
    }
  };

  const getCategoryMeta = () => {
    switch (report.category) {
      case 'HEAVY_TRAFFIC':
        return { label: t.cat_HEAVY_TRAFFIC, icon: <Flame className="w-4 h-4" />, color: 'bg-red-100 text-red-800 border-red-200' };
      case 'SLOW_TRAFFIC':
        return { label: t.cat_SLOW_TRAFFIC, icon: <Clock className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'ACCIDENT':
        return { label: t.cat_ACCIDENT, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'TOLL_QUEUE':
        return { label: t.cat_TOLL_QUEUE, icon: <CreditCard className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'WATERLOGGING':
        return { label: t.cat_WATERLOGGING, icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'CONSTRUCTION':
        return { label: t.cat_CONSTRUCTION, icon: <Cone className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'ROAD_CLOSURE':
        return { label: t.cat_ROAD_CLOSURE, icon: <Ban className="w-4 h-4" />, color: 'bg-stone-100 text-stone-800 border-stone-200' };
      default:
        return { label: t.cat_HAZARD, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    }
  };

  const meta = getCategoryMeta();

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all space-y-3">
      {/* Header with Category Badge and Time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${meta.color}`}>
            {meta.icon}
            <span>{meta.label}</span>
          </span>
          {report.distanceFromRouteMeters !== undefined && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {report.distanceFromRouteMeters < 500
                ? 'Directly on Route'
                : `${(report.distanceFromRouteMeters / 1000).toFixed(1)} km from path`}
            </span>
          )}
        </div>

        <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Active Today • {minutesAgo}m ago</span>
        </span>
      </div>

      {/* Road / Location and Description */}
      <div>
        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
          {report.roadName}
        </h4>
        {report.description && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {report.description}
          </p>
        )}
      </div>

      {/* Confidence Pill & Community Ground Truth */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-700">
            {t.confidenceScore}: {report.confidenceScore}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">
            {report.confirmCount} confirmations
          </span>
        </div>

        <button
          onClick={handleFlag}
          title={t.flagAbuse}
          className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Flag className="w-3 h-3" />
        </button>
      </div>

      {/* Confirmation Upvoting / Status Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => handleVote('STILL_HERE')}
          disabled={hasVoted}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
            hasVoted
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 active:scale-98'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{t.stillHappening}</span>
        </button>

        <button
          onClick={() => handleVote('WORSE')}
          disabled={hasVoted}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
            hasVoted
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 active:scale-98'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t.gettingWorse}</span>
        </button>

        <button
          onClick={() => handleVote('CLEARED')}
          disabled={hasVoted}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
            hasVoted
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 active:scale-98'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t.cleared}</span>
        </button>
      </div>

      {voteNotice && (
        <div className="text-[11px] font-bold text-center text-emerald-600 bg-emerald-50 py-1 rounded-lg animate-in fade-in">
          {voteNotice}
        </div>
      )}
    </div>
  );
};
