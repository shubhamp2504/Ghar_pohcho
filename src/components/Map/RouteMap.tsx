import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { RouteOption, LocationPoint, Language } from '../../types/routing';
import type { CommunityReport } from '../../types/community';
import { getCongestionColor } from '../../utils/geo';
import { routingService } from '../../services/routing/routingService';

interface RouteMapProps {
  routes: RouteOption[];
  selectedRouteIndex: number;
  origin: LocationPoint;
  destination: LocationPoint;
  language: Language;
  communityReports?: CommunityReport[];
  onSelectRoute?: (index: number) => void;
  userLocation?: { lat: number; lng: number; heading?: number } | null;
  highlightedPoint?: { lat: number; lng: number; title: string; category?: string } | null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteIndex,
  origin,
  destination,
  language,
  communityReports,
  onSelectRoute,
  userLocation,
  highlightedPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const incidentsLayerRef = useRef<L.TileLayer | null>(null);

  const tomtomKey = routingService.getStoredTomTomKey();
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  // Initialize Map and Layers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([19.076, 72.8777], 9);

      // Clean base tile layer: Use OpenStreetMap Standard (100% open, zero watermark) or TomTom main map
      const baseMapUrl = tomtomKey
        ? `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomKey}`
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(baseMapUrl, {
        maxZoom: 19,
        zIndex: 1,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Real-Time Traffic Flow & Incidents Overlay
      if (tomtomKey) {
        const flowLayer = L.tileLayer(
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${tomtomKey}`,
          {
            maxZoom: 19,
            opacity: 0.85,
            zIndex: 2,
          }
        );
        trafficLayerRef.current = flowLayer;
        flowLayer.addTo(map);

        const incLayer = L.tileLayer(
          `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${tomtomKey}`,
          {
            maxZoom: 19,
            opacity: 0.9,
            zIndex: 3,
          }
        );
        incidentsLayerRef.current = incLayer;
        incLayer.addTo(map);
      }

      // Add Zoom control at bottom right for mobile ergonomics
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      routeLayersRef.current = L.layerGroup().addTo(map);
    }
  }, [tomtomKey]);

  // Sync layer toggle visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trafficLayerRef.current) {
      if (showTrafficFlow && !map.hasLayer(trafficLayerRef.current)) {
        map.addLayer(trafficLayerRef.current);
      } else if (!showTrafficFlow && map.hasLayer(trafficLayerRef.current)) {
        map.removeLayer(trafficLayerRef.current);
      }
    }

    if (incidentsLayerRef.current) {
      if (showIncidents && !map.hasLayer(incidentsLayerRef.current)) {
        map.addLayer(incidentsLayerRef.current);
      } else if (!showIncidents && map.hasLayer(incidentsLayerRef.current)) {
        map.removeLayer(incidentsLayerRef.current);
      }
    }
  }, [showTrafficFlow, showIncidents]);

  // Render Polylines, Markers, Incidents, User GPS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayersRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();

    const selectedRoute = routes[selectedRouteIndex];
    if (!selectedRoute) return;

    const allBounds = L.latLngBounds([]);

    // 1. Draw alternative (unselected) routes first in subtle gray
    routes.forEach((route, idx) => {
      if (idx === selectedRouteIndex || route.polyline.length === 0) return;

      const altPolyline = L.polyline(route.polyline, {
        color: '#94A3B8', // Slate 400
        weight: 4,
        opacity: 0.6,
        dashArray: '6, 8',
      }).addTo(layerGroup);

      altPolyline.on('click', () => {
        if (onSelectRoute) onSelectRoute(idx);
      });

      altPolyline.bindTooltip(
        `${route.name} (${Math.round(route.durationSeconds / 60)} min)`,
        { sticky: true }
      );
    });

    // 2. Draw selected route base polyline
    if (selectedRoute.polyline.length > 0) {
      const mainLine = L.polyline(selectedRoute.polyline, {
        color: '#2563EB', // Blue 600
        weight: 6,
        opacity: 0.85,
      }).addTo(layerGroup);

      mainLine.bindTooltip(
        `<b>${selectedRoute.name}</b><br/>${Math.round(selectedRoute.distanceMeters / 1000)} km`,
        { sticky: true }
      );

      selectedRoute.polyline.forEach(([lat, lng]) => {
        allBounds.extend([lat, lng]);
      });
    }

    // 3. Draw traffic congestion segments over selected route
    if (selectedRoute.trafficSegments && selectedRoute.trafficSegments.length > 0) {
      selectedRoute.trafficSegments.forEach((seg) => {
        if (seg.polyline.length < 2) return;
        const color = getCongestionColor(seg.congestionLevel);

        const segLine = L.polyline(seg.polyline, {
          color,
          weight: 8,
          opacity: 0.95,
        }).addTo(layerGroup);

        const delayMins = Math.round(seg.delaySeconds / 60);
        const delayStr =
          language === 'hi'
            ? `+${delayMins} मिनट देरी`
            : language === 'mr'
            ? `+${delayMins} मि विलंब`
            : `+${delayMins} min traffic delay`;

        segLine.bindPopup(`
          <div style="font-family: system-ui; min-width: 180px; padding: 4px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${color};">
              ${seg.congestionLevel} CONGESTION
            </div>
            <div style="font-weight: 600; font-size: 13px; margin: 2px 0;">${seg.roadName}</div>
            <div style="color: #DC2626; font-weight: 600; font-size: 12px;">${delayStr}</div>
            ${seg.description ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;">${seg.description}</div>` : ''}
          </div>
        `);
      });
    }

    // 4. Custom Start Pin (Green)
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="background: #10B981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 13px;">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const startMarker = L.marker([origin.lat, origin.lng], { icon: startIcon }).addTo(layerGroup);
    startMarker.bindPopup(`<b>Start</b><br/>${origin.name}`);
    allBounds.extend([origin.lat, origin.lng]);

    // 5. Custom Destination Pin (Red Home / Flag)
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div style="background: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 14px;">
          🏠
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(layerGroup);
    destMarker.bindPopup(`<b>Destination (Home)</b><br/>${destination.name}`);
    allBounds.extend([destination.lat, destination.lng]);

    // 6. Draw Community Incidents along the corridor
    if (communityReports && communityReports.length > 0) {
      communityReports.forEach((rep) => {
        let badgeEmoji = '⚠️';
        let bg = '#EF4444';
        if (rep.category === 'ROAD_CLOSURE') { badgeEmoji = '⛔'; bg = '#991B1B'; }
        else if (rep.category === 'WATERLOGGING') { badgeEmoji = '🌊'; bg = '#2563EB'; }
        else if (rep.category === 'TOLL_QUEUE') { badgeEmoji = '💳'; bg = '#9333EA'; }
        else if (rep.category === 'CONSTRUCTION') { badgeEmoji = '🚧'; bg = '#EA580C'; }
        else if (rep.category === 'ACCIDENT') { badgeEmoji = '🚨'; bg = '#DC2626'; }
        else if (rep.category === 'HEAVY_TRAFFIC') { badgeEmoji = '🔥'; bg = '#DC2626'; }

        const incidentIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: `
            <div style="background: ${bg}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-size: 13px;">
              ${badgeEmoji}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const incidentMarker = L.marker([rep.lat, rep.lng], { icon: incidentIcon }).addTo(layerGroup);
        incidentMarker.bindPopup(`
          <div style="font-family: system-ui; min-width: 180px; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: ${bg}; text-transform: uppercase;">
              COMMUNITY REPORT • CONFIDENCE ${rep.confidenceScore}
            </div>
            <div style="font-weight: 700; font-size: 13px; margin: 2px 0;">${rep.roadName}</div>
            ${rep.description ? `<div style="font-size: 11px; color: #475569;">${rep.description}</div>` : ''}
          </div>
        `);
      });
    }

    // 7. Highlighted Point (e.g., Selected Highway Dhaba, Petrol Pump, EV Charger)
    if (highlightedPoint) {
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="background: #0284C7; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
            <span>📍</span>
            <span>${highlightedPoint.title}</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      });
      const stopMarker = L.marker([highlightedPoint.lat, highlightedPoint.lng], { icon: stopIcon, zIndexOffset: 800 }).addTo(layerGroup);
      stopMarker.bindPopup(`<b>${highlightedPoint.title}</b><br/>${highlightedPoint.category || 'Corridor Stop'}`).openPopup();
      allBounds.extend([highlightedPoint.lat, highlightedPoint.lng]);
    }

    // 8. In-Car GPS Live Tracking Marker (Blue pulsating navigation indicator)
    if (userLocation) {
      const gpsIcon = L.divIcon({
        className: 'custom-gps-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563EB; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; transform: rotate(${userLocation.heading || 0}deg);">
              ▲
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(layerGroup);
      allBounds.extend([userLocation.lat, userLocation.lng]);
    }

    // Fit map bounds
    if (allBounds.isValid()) {
      map.fitBounds(allBounds, {
        padding: [30, 30],
        maxZoom: 14,
      });
    }
  }, [routes, selectedRouteIndex, origin, destination, language, communityReports, onSelectRoute, userLocation, highlightedPoint]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Right: TomTom Live Traffic & Incidents Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
        <div className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTrafficFlow((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              showTrafficFlow
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Toggle Live Traffic Flow layer"
          >
            <span className={`w-2 h-2 rounded-full ${showTrafficFlow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>🚦 Live Flow: {showTrafficFlow ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIncidents((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              showIncidents
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Toggle Live Traffic Incidents layer"
          >
            <span>⚠️ Incidents: {showIncidents ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {tomtomKey && showTrafficFlow && (
          <div className="bg-emerald-700/90 text-white backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            <span>Live Highway Traffic Sync</span>
          </div>
        )}
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200/80 text-xs flex flex-wrap gap-3 items-center">
        <span className="font-semibold text-slate-700">Traffic:</span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Normal
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          Moderate
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          Heavy Jam
        </span>
      </div>
    </div>
  );
};
