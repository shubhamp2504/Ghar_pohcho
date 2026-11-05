import React from 'react';
import { Home, Key, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import type { Language } from '../../types/routing';
import { translations } from '../../i18n/translations';

interface NavbarProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey: boolean;
  onResetToHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenApiKeyModal,
  hasCustomApiKey,
  onResetToHome,
}) => {
  const t = translations[currentLanguage];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <button
          onClick={onResetToHome}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-emerald-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                {t.appName}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                IN 🇮🇳
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            title={t.apiKeySettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasCustomApiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {hasCustomApiKey ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline font-bold text-emerald-700">TomTom Live Traffic</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline font-bold text-emerald-700">100% Free Engine ($0)</span>
              </>
            )}
            <Key className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Multilingual Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                currentLanguage === 'en'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                currentLanguage === 'hi'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => onLanguageChange('mr')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                currentLanguage === 'mr'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
