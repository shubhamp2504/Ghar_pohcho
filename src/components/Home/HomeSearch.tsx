import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Clock,
  Compass,
  History,
  AlertCircle,
  Car,
  Bike,
  Sparkles,
} from 'lucide-react';
import type { LocationPoint, Language, PopularRoutePreset } from '../../types/routing';
import { translations } from '../../i18n/translations';
import { POPULAR_ROUTE_PRESETS } from '../../data/popularRoutes';
import { placesService } from '../../services/places/placesService';
import { routingService } from '../../services/routing/routingService';

interface HomeSearchProps {
  language: Language;
  onSearch: (
    origin: LocationPoint,
    destination: LocationPoint,
    departureTime?: string,
    travelMode?: 'DRIVE' | 'TWO_WHEELER'
  ) => void;
  isLoading: boolean;
}

export const HomeSearch: React.FC<HomeSearchProps> = ({
  language,
  onSearch,
  isLoading,
}) => {
  const t = translations[language];

  const [fromQuery, setFromQuery] = useState('Bandra West, Mumbai');
  const [toQuery, setToQuery] = useState('Koregaon Park, Pune');

  const [fromLocation, setFromLocation] = useState<LocationPoint>({
    name: 'Bandra West, Mumbai',
    address: 'Bandra, Mumbai, Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
  });

  const [toLocation, setToLocation] = useState<LocationPoint>({
    name: 'Koregaon Park, Pune',
    address: 'Koregaon Park, Pune, Maharashtra',
    lat: 18.5362,
    lng: 73.8940,
  });

  const [fromSuggestions, setFromSuggestions] = useState<LocationPoint[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationPoint[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [departureWindow, setDepartureWindow] = useState<'now' | '30m' | '1h' | '2h'>('now');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TWO_WHEELER'>('DRIVE');

  const [recentJourneys] = useState<Array<{ origin: LocationPoint; destination: LocationPoint }>>(() =>
    routingService.getRecentSearches()
  );

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFromInputChange = async (val: string) => {
    setFromQuery(val);
    setActiveDropdown('from');
    if (val.trim().length >= 2) {
      const results = await placesService.searchPlaces(val);
      setFromSuggestions(results);
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToInputChange = async (val: string) => {
    setToQuery(val);
    setActiveDropdown('to');
    if (val.trim().length >= 2) {
      const results = await placesService.searchPlaces(val);
      setToSuggestions(results);
    } else {
      setToSuggestions([]);
    }
  };

  const handleSelectFrom = (place: LocationPoint) => {
    setFromLocation(place);
    setFromQuery(place.name);
    setActiveDropdown(null);
  };

  const handleSelectTo = (place: LocationPoint) => {
    setToLocation(place);
    setToQuery(place.name);
    setActiveDropdown(null);
  };

  const handleSwap = () => {
    const tempLoc = fromLocation;
    const tempQ = fromQuery;
    setFromLocation(toLocation);
    setFromQuery(toQuery);
    setToLocation(tempLoc);
    setToQuery(tempQ);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const geocoded = await placesService.reverseGeocode(lat, lng);
          setFromLocation(geocoded);
          setFromQuery(geocoded.name);
        } catch {
          setLocationError(t.locationError);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationError(t.locationError);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyPreset = (preset: PopularRoutePreset) => {
    setFromLocation(preset.origin);
    setFromQuery(preset.origin.name);
    setToLocation(preset.destination);
    setToQuery(preset.destination.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation || !toLocation) return;

    let departureIso: string | undefined = undefined;
    if (departureWindow !== 'now') {
      const now = Date.now();
      const mins = departureWindow === '30m' ? 30 : departureWindow === '1h' ? 60 : 120;
      departureIso = new Date(now + mins * 60 * 1000).toISOString();
    }

    onSearch(fromLocation, toLocation, departureIso, travelMode);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10" ref={searchContainerRef}>
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Free • Open Road Network & Traffic Intel</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {t.heroHeadline}
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-600 font-medium">
          {t.heroSubheading}
        </p>
      </div>

      {/* Main Search Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FROM field */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {t.fromLabel}
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 focus:outline-none transition-colors"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? t.locating : t.useMyLocation}
              </button>
            </div>

            <div className="relative flex items-center">
              <MapPin className="w-5 h-5 text-emerald-600 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => handleFromInputChange(e.target.value)}
                onFocus={() => setActiveDropdown('from')}
                placeholder={t.fromPlaceholder}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
                required
              />
            </div>

            {/* Suggestions dropdown for FROM */}
            {activeDropdown === 'from' && fromSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in-50">
                {fromSuggestions.map((place, idx) => (
                  <button
                    key={`from-${idx}`}
                    type="button"
                    onClick={() => handleSelectFrom(place)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/80 flex items-start gap-3 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{place.name}</p>
                      {place.address && (
                        <p className="text-xs text-slate-500 line-clamp-1">{place.address}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button Divider */}
          <div className="relative flex justify-center -my-2 z-10">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="p-2 bg-white rounded-full border border-slate-300 shadow-sm text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-transform active:scale-95 focus:outline-none"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO field */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                {t.toLabel}
              </label>
            </div>

            <div className="relative flex items-center">
              <MapPin className="w-5 h-5 text-red-600 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={toQuery}
                onChange={(e) => handleToInputChange(e.target.value)}
                onFocus={() => setActiveDropdown('to')}
                placeholder={t.toPlaceholder}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
                required
              />
            </div>

            {/* Suggestions dropdown for TO */}
            {activeDropdown === 'to' && toSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in-50">
                {toSuggestions.map((place, idx) => (
                  <button
                    key={`to-${idx}`}
                    type="button"
                    onClick={() => handleSelectTo(place)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/80 flex items-start gap-3 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{place.name}</p>
                      {place.address && (
                        <p className="text-xs text-slate-500 line-clamp-1">{place.address}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Departure Time & Travel Mode Selector */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Departure Options */}
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {t.leaveAt}
              </span>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDepartureWindow('now')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    departureWindow === 'now'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.leaveNow}
                </button>
                <button
                  type="button"
                  onClick={() => setDepartureWindow('30m')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    departureWindow === '30m'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.leaveIn30m}
                </button>
                <button
                  type="button"
                  onClick={() => setDepartureWindow('1h')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    departureWindow === '1h'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.leaveIn1h}
                </button>
                <button
                  type="button"
                  onClick={() => setDepartureWindow('2h')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    departureWindow === '2h'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.leaveIn2h}
                </button>
              </div>
            </div>

            {/* Travel Mode (Car vs Two Wheeler) */}
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                {t.travelMode}
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTravelMode('DRIVE')}
                  className={`py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                    travelMode === 'DRIVE'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{t.drive}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('TWO_WHEELER')}
                  className={`py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                    travelMode === 'TWO_WHEELER'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>{t.twoWheeler}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-3 touch-target"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t.calculating}</span>
              </>
            ) : (
              <>
                <span>{t.checkJourneyTime}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Popular Highway Corridors */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-orange-600" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            {t.popularCorridors}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {POPULAR_ROUTE_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-3 bg-white hover:bg-orange-50/60 border border-slate-200/80 rounded-2xl shadow-sm text-left transition-all hover:border-orange-300 group flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  {preset.titleKey}
                </div>
                <div className="text-xs text-slate-500">{preset.highwayTag}</div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                ~{preset.typicalDuration}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Journeys (if any) */}
      {recentJourneys.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2.5">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t.recentJourneys}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentJourneys.map((item, idx) => (
              <button
                key={`recent-${idx}`}
                onClick={() => {
                  setFromLocation(item.origin);
                  setFromQuery(item.origin.name);
                  setToLocation(item.destination);
                  setToQuery(item.destination.name);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>{item.origin.name.split(',')[0]}</span>
                <span className="text-slate-400">→</span>
                <span>{item.destination.name.split(',')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
