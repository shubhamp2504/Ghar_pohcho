import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Clock,
  Cone,
  Droplets,
  CreditCard,
  Ban,
  CheckCircle2,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import type { Language, LocationPoint } from '../../types/routing';
import type { ReportCategory, CreateReportInput } from '../../types/community';
import { translations } from '../../i18n/translations';
import { communityService } from '../../services/community/communityService';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  defaultLocation?: LocationPoint;
  onReportSubmitted?: () => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  language,
  defaultLocation,
  onReportSubmitted,
}) => {
  const t = translations[language];

  const [step, setStep] = useState<'SAFETY' | 'FORM' | 'SUCCESS'>('SAFETY');
  const [category, setCategory] = useState<ReportCategory>('HEAVY_TRAFFIC');
  const [roadName, setRoadName] = useState(defaultLocation?.name || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  if (!isOpen) return null;

  const categories: Array<{
    id: ReportCategory;
    name: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'HEAVY_TRAFFIC',
      name: t.cat_HEAVY_TRAFFIC,
      icon: <Flame className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      id: 'SLOW_TRAFFIC',
      name: t.cat_SLOW_TRAFFIC,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'ACCIDENT',
      name: t.cat_ACCIDENT,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      id: 'TOLL_QUEUE',
      name: t.cat_TOLL_QUEUE,
      icon: <CreditCard className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'WATERLOGGING',
      name: t.cat_WATERLOGGING,
      icon: <Droplets className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'CONSTRUCTION',
      name: t.cat_CONSTRUCTION,
      icon: <Cone className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'ROAD_CLOSURE',
      name: t.cat_ROAD_CLOSURE,
      icon: <Ban className="w-5 h-5" />,
      color: 'bg-stone-50 text-stone-700 border-stone-200',
    },
    {
      id: 'HAZARD',
      name: t.cat_HAZARD,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadName.trim()) return;

    setIsSubmitting(true);
    setDuplicateAlert(false);

    try {
      const lat = defaultLocation?.lat || 18.762;
      const lng = defaultLocation?.lng || 73.385;

      const input: CreateReportInput = {
        category,
        roadName: roadName.trim(),
        description: description.trim() || undefined,
        lat,
        lng,
      };

      const { isDuplicate } = await communityService.submitReport(input);

      if (isDuplicate) {
        setDuplicateAlert(true);
      }

      setStep('SUCCESS');
      if (onReportSubmitted) onReportSubmitted();

      setTimeout(() => {
        onClose();
        setStep('SAFETY');
        setRoadName('');
        setDescription('');
      }, 1800);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: SAFETY DISCLAIMER (Mandatory per Product Principles) */}
        {step === 'SAFETY' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {t.drivingSafetyTitle}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-sm mx-auto">
              {t.drivingSafetyWarning}
            </p>

            <button
              onClick={() => setStep('FORM')}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-98 text-sm"
            >
              {t.confirmPassenger}
            </button>
          </div>
        )}

        {/* STEP 2: REPORT SUBMISSION FORM */}
        {step === 'FORM' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-orange-600 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900">
                {t.reportRoadCondition}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.selectCategory}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md scale-[1.02]'
                            : `bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200`
                        }`}
                      >
                        <span className={isSelected ? 'text-white' : ''}>
                          {cat.icon}
                        </span>
                        <span className="text-xs font-bold leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Road Name / Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  {t.roadLocationLabel}
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder={t.roadLocationPlaceholder}
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.descriptionLabel}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t.submitting}</span>
                ) : (
                  <span>{t.submitReportBtn}</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS FEEDBACK */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {t.reportSuccessTitle}
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {duplicateAlert ? t.duplicateNotice : t.reportSuccessDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

