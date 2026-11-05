import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Fuel,
  Zap,
  CreditCard,
  Hospital,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { CorridorStop, AmenityCategory } from '../../types/stops';
import type { Language } from '../../types/routing';
import { corridorStopsService } from '../../services/stops/corridorStopsService';

interface CorridorStopsSectionProps {
  polyline: [number, number][];
  language: Language;
  onSelectStop?: (stop: CorridorStop) => void;
  selectedStopId?: string | null;
}

export const CorridorStopsSection: React.FC<CorridorStopsSectionProps> = ({
  polyline,
  language,
  onSelectStop,
  selectedStopId,
}) => {
  const [activeCategory, setActiveCategory] = useState<AmenityCategory | 'ALL'>('ALL');

  // Find all stops along the polyline (within 4.5km buffer)
  const allStops = useMemo(() => {
    return corridorStopsService.findStopsAlongRoute(polyline, 4500);
  }, [polyline]);

  // Filter stops by selected category
  const filteredStops = useMemo(() => {
    return corridorStopsService.filterByCategory(allStops, activeCategory);
  }, [allStops, activeCategory]);

  const categories: { id: AmenityCategory | 'ALL'; label: string; icon: React.ReactNode }[] = [
    {
      id: 'ALL',
      label: language === 'hi' ? 'सभी सुविधाएं' : language === 'mr' ? 'सर्व सोयी' : 'All Highway Stops',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'DHABA_FOOD',
      label: language === 'hi' ? 'ढाबा व भोजन' : language === 'mr' ? 'धाबा व जेवण' : 'Dhabas & Food',
      icon: <Utensils className="w-3.5 h-3.5" />,
    },
    {
      id: 'PETROL_PUMP',
      label: language === 'hi' ? 'पेट्रोल पंप / वॉशरूम' : language === 'mr' ? 'पेट्रोल पंप / स्वच्छतागृह' : 'Fuel & Restrooms',
      icon: <Fuel className="w-3.5 h-3.5" />,
    },
    {
      id: 'EV_CHARGER',
      label: language === 'hi' ? 'EV फ़ास्ट चार्जिंग' : language === 'mr' ? 'EV जलद चार्जिंग' : 'EV Fast Chargers',
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      id: 'TOLL_PLAZA',
      label: language === 'hi' ? 'फ़ास्टैग टोल' : language === 'mr' ? 'फास्टॅग टोल' : 'Fastag Tolls',
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    {
      id: 'HOSPITAL',
      label: language === 'hi' ? 'इमरजेंसी हॉस्पिटल' : language === 'mr' ? 'आपत्कालीन रुग्णालय' : 'Emergency Care',
      icon: <Hospital className="w-3.5 h-3.5" />,
    },
  ];

  if (allStops.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'hi'
                  ? 'हाईवे सुविधाएं व स्टॉप्स'
                  : language === 'mr'
                  ? 'महामार्ग थांबे व सोयी'
                  : 'Highway Pit-Stops & Amenities Along Route'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {allStops.length} Verified Stops
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'स्वच्छ शौचालय, फ़ैमिली ढाबे, 24/7 पेट्रोल पंप और EV चार्जिंग'
                : language === 'mr'
                ? 'स्वच्छ स्वच्छतागृहे, कौटुंबिक धाबे, २४/७ पेट्रोल पंप व ईव्ही चार्जिंग'
                : 'Clean restrooms, verified family dhabas, 24/7 COCO fuel & rapid EV stations'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const count =
            cat.id === 'ALL'
              ? allStops.length
              : allStops.filter((s) => s.category === cat.id).length;

          if (cat.id !== 'ALL' && count === 0) return null;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List of Corridor Stops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {filteredStops.map((stop) => {
          const isHighlighted = selectedStopId === stop.id;

          return (
            <div
              key={stop.id}
              onClick={() => onSelectStop && onSelectStop(stop)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                isHighlighted
                  ? 'bg-sky-50/60 border-sky-500 shadow-md ring-2 ring-sky-500/10'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                      At {stop.distanceAlongRouteKm} km
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {stop.detourMeters < 100
                        ? 'On Highway'
                        : `${stop.detourMeters}m off highway`}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                    {stop.name}
                  </h4>
                  {stop.brand && (
                    <p className="text-xs font-semibold text-slate-600">
                      {stop.brand}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-900 text-xs font-bold shrink-0">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{stop.rating.toFixed(1)}</span>
                </div>
              </div>

              {stop.notes && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {stop.notes}
                </p>
              )}

              {/* Amenities Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-200/80">
                {stop.is24x7 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    <Clock className="w-2.5 h-2.5" />
                    24x7 Open
                  </span>
                )}
                {stop.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-sky-600" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

