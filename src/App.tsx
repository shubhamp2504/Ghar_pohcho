import { useState } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { HomeSearch } from './components/Home/HomeSearch';
import { JourneyResults } from './components/Results/JourneyResults';
import { ApiKeyModal } from './components/Modal/ApiKeyModal';
import type { Language, LocationPoint, RouteCalculationResult } from './types/routing';
import { routingService } from './services/routing/routingService';
import { translations } from './i18n/translations';

const LANGUAGE_KEY = 'gharpahucho_lang';
const CURRENT_YEAR = new Date().getFullYear();

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const savedLang = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  if (savedLang && (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr')) {
    return savedLang;
  }
  return 'en';
}

export function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [activeView, setActiveView] = useState<'HOME' | 'RESULTS'>('HOME');
  const [currentResult, setCurrentResult] = useState<RouteCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(() => routingService.hasConfiguredApiKey());

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem(LANGUAGE_KEY, newLang);
  };

  const handleSearch = async (
    origin: LocationPoint,
    destination: LocationPoint,
    departureTime?: string,
    travelMode?: 'DRIVE' | 'TWO_WHEELER'
  ) => {
    setIsLoading(true);
    try {
      const result = await routingService.calculateRoutes({
        origin,
        destination,
        departureTime,
        travelMode,
      });
      setCurrentResult(result);
      setActiveView('RESULTS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Route calculation failed:', err);
      alert('Unable to calculate route. Please verify your origin and destination.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = (key: string | null) => {
    routingService.setApiKey(key);
    setHasCustomApiKey(routingService.hasConfiguredApiKey());
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomApiKey={hasCustomApiKey}
        onResetToHome={() => setActiveView('HOME')}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeView === 'HOME' ? (
          <HomeSearch
            language={language}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        ) : (
          currentResult && (
            <JourneyResults
              result={currentResult}
              language={language}
              onBack={() => setActiveView('HOME')}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
            <span>{t.appName}</span>
            <span>•</span>
            <span>{t.tagline}</span>
          </div>
          <p className="max-w-md mx-auto text-slate-400">
            Designed for Indian highway travellers, families, daily commuters and festival travellers. Powered by provider-independent routing and transparent delay calculations.
          </p>
          <div className="text-[11px] text-slate-400 pt-1">
            © {CURRENT_YEAR} GharPahucho. Built with pride in India 🇮🇳
          </div>
        </div>
      </footer>

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={routingService.getStoredApiKey()}
        onSaveKey={handleSaveApiKey}
        language={language}
      />
    </div>
  );
}

export default App;
