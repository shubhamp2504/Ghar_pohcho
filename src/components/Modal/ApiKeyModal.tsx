import React, { useState } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  RefreshCw,
  Database,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import type { Language } from '../../types/routing';
import { translations } from '../../i18n/translations';
import { getSupabaseCredentials, setSupabaseCredentials } from '../../services/supabase/supabaseClient';
import { quotaGuard } from '../../services/quota/quotaGuard';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string | null;
  onSaveKey: (key: string | null) => void;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onSaveKey,
  language,
}) => {
  const [keyValue, setKeyValue] = useState(currentApiKey || '');
  const initialSb = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(initialSb.url || '');
  const [sbKey, setSbKey] = useState(initialSb.anonKey || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [usageStats, setUsageStats] = useState(() => quotaGuard.getStats());

  if (!isOpen) return null;

  const t = translations[language];

  const handleSave = () => {
    onSaveKey(keyValue.trim() || null);
    if (sbUrl.trim() && sbKey.trim()) {
      setSupabaseCredentials(sbUrl.trim(), sbKey.trim());
    } else {
      setSupabaseCredentials(null, null);
    }

    setSaveStatus(t.keySaved);
    setUsageStats(quotaGuard.getStats());
    setTimeout(() => {
      setSaveStatus(null);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setKeyValue('');
    setSbUrl('');
    setSbKey('');
    onSaveKey(null);
    setSupabaseCredentials(null, null);
    setSaveStatus('Cleared! Using 100% Free Open Engine ($0)');
    setUsageStats(quotaGuard.getStats());
    setTimeout(() => {
      setSaveStatus(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{t.apiKeyTitle}</h3>
            <p className="text-xs text-slate-500">{t.apiKeySettings}</p>
          </div>
        </div>

        {/* Zero-Spend Protection Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-black text-emerald-900">
                Zero-Spend Free Quota Active
              </span>
            </div>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
              ₹0.00 / $0 Cost
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Google provides <strong>$200 in monthly free credit</strong> (~20,000 free route calculations/month). No daily restriction is applied — you can use your quota whenever you need.
          </p>

          {/* Monthly Meter */}
          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-emerald-900">
              <span>Calls Used This Month: {usageStats.monthlyCalls} / {usageStats.monthlyLimit}</span>
              <span>Today: {usageStats.todayCalls} calls</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (usageStats.monthlyCalls / usageStats.monthlyLimit) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-5">
          {/* Google Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Cloud API Key (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Routes API v2</span>
            </div>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="AIzaSy... (Leave empty to use 100% Free Open Engine)"
              className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50"
            />
          </div>

          {/* Payment Card / Activation Reality Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Does Google require a card to activate the free quota?</span>
            </div>
            <p className="leading-relaxed">
              <strong>Yes:</strong> Google Cloud does not charge you upfront, but they <strong>strictly require entering a Credit/Debit Card</strong> to verify identity and enable the API billing account (temporary ₹2 test authorization).
            </p>
            <p className="leading-relaxed text-amber-800">
              💡 <strong>If you do not want to enter any card:</strong> Simply leave this field blank! GharPahucho will run completely on our <strong>100% Free OpenStreetMap engine</strong> with zero cards, zero payments, and zero signups required.
            </p>
          </div>

          {/* Supabase backend */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Supabase PostGIS Backend (Optional)
              </label>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://xyz.supabase.co (Leave empty for local storage)"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50"
              />
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="Anon / Public Key"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {saveStatus && (
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-md transition-colors text-sm"
          >
            {t.saveKey}
          </button>
          {currentApiKey && (
            <button
              onClick={handleClear}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors text-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.clearKey}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
