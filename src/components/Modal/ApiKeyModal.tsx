import React, { useState } from 'react';
import { X, Key, ShieldAlert, CheckCircle2, RefreshCw, Database } from 'lucide-react';
import type { Language } from '../../types/routing';
import { translations } from '../../i18n/translations';
import { getSupabaseCredentials, setSupabaseCredentials } from '../../services/supabase/supabaseClient';

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
    setSaveStatus('Cleared! Using Offline Corridor Model');
    setTimeout(() => {
      setSaveStatus(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t.apiKeyTitle}</h3>
            <p className="text-xs text-slate-500">{t.apiKeySettings}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {t.apiKeyDescription}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Keys entered here remain strictly inside your browser's private local storage. They are never sent to third-party tracking servers.
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Google Cloud API Key (Routes API v2 enabled)
            </label>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

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
                placeholder="https://xyz.supabase.co"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="Anon / Public Key"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              If left empty, GharPahucho uses built-in local PostGIS storage with simulated corridor feeds.
            </p>
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
            className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
          >
            {t.saveKey}
          </button>
          {currentApiKey && (
            <button
              onClick={handleClear}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm flex items-center gap-1.5"
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
