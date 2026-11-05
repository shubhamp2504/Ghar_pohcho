import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gauge,
  Clock,
  Navigation,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type { RouteOption, LocationPoint, Language } from '../../types/routing';
import { formatETA, formatDistance } from '../../utils/geo';

interface InCarDriveModeProps {
  route: RouteOption;
  origin: LocationPoint;
  destination: LocationPoint;
  language: Language;
  onClose: () => void;
  onUpdateLocation?: (loc: { lat: number; lng: number; heading?: number }) => void;
}

function hasGeolocation(): boolean {
  return typeof window !== 'undefined' && 'geolocation' in navigator;
}

export const InCarDriveMode: React.FC<InCarDriveModeProps> = ({
  route,
  destination,
  language,
  onClose,
  onUpdateLocation,
}) => {
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(() => (hasGeolocation() ? 0 : 65));
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(route.distanceMeters);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<'ACQUIRING' | 'LIVE' | 'SIMULATED'>(() =>
    hasGeolocation() ? 'ACQUIRING' : 'SIMULATED'
  );

  const watchIdRef = useRef<number | null>(null);

  // Look for first upcoming traffic bottleneck
  const primaryBottleneck = route.trafficSegments.find(
    (s) => s.congestionLevel === 'HEAVY' || s.congestionLevel === 'SEVERE' || s.congestionLevel === 'SLOW'
  );

  const upcomingWarning = primaryBottleneck
    ? `Upcoming Bottleneck: ${primaryBottleneck.roadName} (+${Math.round(primaryBottleneck.delaySeconds / 60)} min delay)`
    : null;

  // Geolocation tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus('LIVE');
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 62;
          setCurrentSpeedKmh(speed);

          if (onUpdateLocation) {
            onUpdateLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading || 0,
            });
          }
        },
        () => {
          // If denied or indoors, use graceful simulated cruise mode
          setGpsStatus('SIMULATED');
          setCurrentSpeedKmh(68);
          if (onUpdateLocation && route.polyline.length > 0) {
            onUpdateLocation({
              lat: route.polyline[0][0],
              lng: route.polyline[0][1],
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [onUpdateLocation, route.polyline]);

  // Countdown timer simulation for realistic in-car navigation feel
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingDistanceMeters((prev) => Math.max(0, prev - 120));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const destShortName = destination.name.split(',')[0];

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Top Bar: Road Name & GPS Status */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white shadow-lg">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-extrabold text-orange-400">
              {route.name}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>Towards {destShortName}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={audioAlertsEnabled ? 'Mute highway chimes' : 'Enable highway chimes'}
          >
            {audioAlertsEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* Exit Drive Mode Button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-sm shadow-lg transition-all active:scale-98"
          >
            <X className="w-4 h-4" />
            <span>Exit Drive</span>
          </button>
        </div>
      </div>

      {/* Center HUD: Speedometer & Big Live Stats */}
      <div className="my-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
        {/* Speedometer Gauge Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <Gauge className="w-4 h-4 text-orange-400" />
            <span>Current Speed</span>
          </div>
          <div className="text-6xl sm:text-7xl font-black text-white tracking-tight">
            {currentSpeedKmh}
          </div>
          <div className="text-xs font-extrabold text-orange-500 mt-1 uppercase">
            KM / H
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className={`w-2 h-2 rounded-full ${gpsStatus === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>GPS: {gpsStatus === 'LIVE' ? 'High Precision' : 'Cruise Simulation'}</span>
          </div>
        </div>

        {/* ETA & Travel Duration */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Expected Arrival</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
            {formatETA(route.estimatedArrivalTime, language)}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-2">
            Remaining Distance: {formatDistance(remainingDistanceMeters, language)}
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] font-extrabold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>On Schedule</span>
          </div>
        </div>

        {/* Traffic Delay Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Corridor Delay</span>
          </div>
          <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
            route.additionalDelaySeconds > 600 ? 'text-red-500' : 'text-amber-400'
          }`}>
            +{Math.round(route.additionalDelaySeconds / 60)} min
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-2">
            Baseline: {Math.round(route.staticDurationSeconds / 60)} min
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
            <span>{route.hasTolls ? 'Fastag Enabled' : 'No Tolls'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Alert Strip: Upcoming Bottleneck Warning */}
      {upcomingWarning && (
        <div className="bg-amber-950/80 border border-amber-600/60 p-4 rounded-3xl text-amber-200 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs uppercase font-extrabold text-amber-400">
                Highway Traffic Advisory
              </div>
              <div className="text-sm font-bold text-white">
                {upcomingWarning}
              </div>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl shrink-0">
            Keep Alert
          </span>
        </div>
      )}
    </div>
  );
};
