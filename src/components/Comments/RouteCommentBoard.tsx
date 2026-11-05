import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  MapPin,
  Clock,
  Sparkles,
  CloudRain,
  AlertTriangle,
  CreditCard,
  Hammer,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import type { RouteComment, CommentTag } from '../../types/comments';
import type { Language, LocationPoint } from '../../types/routing';
import { routeCommentService } from '../../services/comments/routeCommentService';

interface RouteCommentBoardProps {
  origin: LocationPoint;
  destination: LocationPoint;
  language: Language;
}

const TAG_CONFIG: Record<
  CommentTag,
  { label: Record<Language, string>; bg: string; text: string; icon: React.ReactNode }
> = {
  CLEAR_ROAD: {
    label: { en: 'Road Clear', hi: 'रास्ता साफ़', mr: 'रस्ता मोकळा' },
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
  },
  HEAVY_RAIN_FOG: {
    label: { en: 'Fog / Rain', hi: 'कोहरा / बारिश', mr: 'धुके / पाऊस' },
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: <CloudRain className="w-3 h-3 text-blue-600" />,
  },
  SUDDEN_SLOWDOWN: {
    label: { en: 'Sudden Slowdown', hi: 'धीमी रफ़्तार', mr: 'वाहतूक संथ' },
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <AlertTriangle className="w-3 h-3 text-red-600" />,
  },
  FASTAG_DELAY: {
    label: { en: 'Fastag Delay', hi: 'फ़ास्टैग देरी', mr: 'फास्टॅग विलंब' },
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: <CreditCard className="w-3 h-3 text-purple-600" />,
  },
  CONSTRUCTION: {
    label: { en: 'Lane Work', hi: 'सड़क कार्य', mr: 'रस्त्याचे काम' },
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: <Hammer className="w-3 h-3 text-orange-600" />,
  },
  ACCIDENT_CLEARED: {
    label: { en: 'Accident Cleared', hi: 'हादसा साफ़', mr: 'अपघात हटवला' },
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    icon: <CheckCircle2 className="w-3 h-3 text-teal-600" />,
  },
  GENERAL_TIP: {
    label: { en: 'Highway Tip', hi: 'हाईवे टिप', mr: 'महामार्ग सल्ला' },
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: <Lightbulb className="w-3 h-3 text-amber-600" />,
  },
};

function formatCommentDate(isoString: string): string {
  const d = new Date(isoString);
  const isToday = d.toDateString() === new Date().toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) {
    const diffMs = Date.now() - d.getTime();
    const mins = Math.max(1, Math.round(diffMs / 60000));
    return mins < 60 ? `Today, ${mins}m ago` : `Today at ${timeStr}`;
  }
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export const RouteCommentBoard: React.FC<RouteCommentBoardProps> = ({
  origin,
  destination,
  language,
}) => {
  const corridorKey = routeCommentService.generateCorridorKey(origin.name, destination.name);

  const [comments, setComments] = useState<RouteComment[]>([]);
  const [selectedTag, setSelectedTag] = useState<CommentTag>('CLEAR_ROAD');
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilterTag, setActiveFilterTag] = useState<CommentTag | 'ALL'>('ALL');

  const originShort = origin.name.split(',')[0];
  const destShort = destination.name.split(',')[0];

  const loadComments = useCallback(async () => {
    const list = await routeCommentService.getCommentsForCorridor(corridorKey);
    setComments(list);
  }, [corridorKey]);

  useEffect(() => {
    let isMounted = true;
    routeCommentService.getCommentsForCorridor(corridorKey).then((list) => {
      if (isMounted) {
        setComments(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [corridorKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await routeCommentService.postComment({
        corridorKey,
        authorName: authorName.trim() || undefined,
        locationTag: locationTag.trim() || undefined,
        tag: selectedTag,
        text: commentText.trim(),
      });
      setCommentText('');
      setLocationTag('');
      await loadComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    await routeCommentService.upvoteComment(id);
    await loadComments();
  };

  const filteredComments =
    activeFilterTag === 'ALL'
      ? comments
      : comments.filter((c) => c.tag === activeFilterTag);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'hi'
                  ? 'लाइव हाईवे कम्युनिटी चर्चा'
                  : language === 'mr'
                  ? 'थेट महामार्ग प्रवासी चर्चा'
                  : 'Live Highway Experience Board'}
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                {originShort} ↔ {destShort}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'इस रूट पर यात्रा कर रहे साथी यात्रियों के ताज़ा अनुभव व स्थिति'
                : language === 'mr'
                ? 'या मार्गावरील सहप्रवाशांचे थेट अनुभव व स्थिती'
                : 'Real-time ground chatter & tips from fellow drivers on this route'}
            </p>
          </div>
        </div>
      </div>

      {/* Input Box to Share Road Experience */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            {language === 'hi'
              ? 'सड़क की ताज़ा स्थिति शेयर करें:'
              : language === 'mr'
              ? 'रस्त्याची थेट माहिती नोंदवा:'
              : 'Share your live road condition:'}
          </span>
          <span className="text-[11px] text-slate-400">Route specific</span>
        </div>

        {/* 1-Tap Quick Tag Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(TAG_CONFIG) as CommentTag[]).map((tag) => {
            const cfg = TAG_CONFIG[tag];
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ring-2 ring-orange-500/30 shadow-sm`
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cfg.icon}
                <span>{cfg.label[language] || cfg.label.en}</span>
              </button>
            );
          })}
        </div>

        {/* Text Input */}
        <textarea
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={
            language === 'hi'
              ? 'जैसे: खंडाला घाट में हल्का कोहरा है, फ़ास्टैग लेन 3 तेज़ी से चल रही है...'
              : language === 'mr'
              ? 'उदा: घाटात हलके धुके आहे, फास्टॅग लेन ३ वेगाने पुढे सरकत आहे...'
              : 'e.g., Light fog at Khandala ghat, Fastag lane 3 moving fastest...'
          }
          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 placeholder-slate-400 resize-none"
        />

        {/* Author & Location Fields */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name (Optional)"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 w-36 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="text"
              value={locationTag}
              onChange={(e) => setLocationTag(e.target.value)}
              placeholder="Milestone (e.g. At Toll Plaza)"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 flex-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Posting...' : 'Post Update'}</span>
          </button>
        </div>
      </form>

      {/* Filter Chips for Existing Comments */}
      {comments.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilterTag('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              activeFilterTag === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Updates ({comments.length})
          </button>
          {(Object.keys(TAG_CONFIG) as CommentTag[]).map((t) => {
            const count = comments.filter((c) => c.tag === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveFilterTag(t)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  activeFilterTag === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {TAG_CONFIG[t].label[language]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {filteredComments.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">
              {language === 'hi'
                ? 'आज के लिए अभी तक कोई टिप्पणी पोस्ट नहीं की गई है।'
                : language === 'mr'
                ? 'आजसाठी अजून कोणतीही प्रतिक्रिया नोंदवलेली नाही.'
                : 'No comments posted yet for today.'}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'hi'
                ? 'क्या आप इस रूट पर हैं? ताज़ा सड़क स्थिति या सुझाव शेयर करें।'
                : language === 'mr'
                ? 'तुम्ही या मार्गावर आहात का? थेट रस्ता स्थिती किंवा सल्ला नोंदवा.'
                : 'Travelling this route right now? Share the current road condition, weather, or Fastag lane status to help other travellers!'}
            </p>
          </div>
        ) : (
          filteredComments.map((c) => {
            const cfg = TAG_CONFIG[c.tag] || TAG_CONFIG.GENERAL_TIP;
            const hasVoted = routeCommentService.hasUpvoted(c.id);

            return (
              <div
                key={c.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm space-y-2"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900">
                      {c.authorName}
                    </span>
                    {c.locationTag && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                        <MapPin className="w-2.5 h-2.5" />
                        {c.locationTag}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon}
                      <span>{cfg.label[language] || cfg.label.en}</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatCommentDate(c.createdAt)}</span>
                  </span>
                </div>

                {/* Comment Body */}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {c.text}
                </p>

                {/* Upvote / Helpful Button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpvote(c.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      hasVoted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                    <span>Helpful ({c.upvotes})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
