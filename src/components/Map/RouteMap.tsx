import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { RouteOption, LocationPoint, Language } from '../../types/routing';
import { getCongestionColor } from '../../utils/geo';

interface RouteMapProps {
  routes: RouteOption[];
  selectedRouteIndex: number;
  origin: LocationPoint;
  destination: LocationPoint;
  language: Language;
  onSelectRoute?: (index: number) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteIndex,
  origin,
  destination,
  language,
  onSelectRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([19.076, 72.8777], 9);

      // Clean CartoDB Voyager or OSM tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom control at bottom right for mobile ergonomics
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      routeLayersRef.current = L.layerGroup().addTo(map);
    }

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

    // Fit map bounds
    if (allBounds.isValid()) {
      map.fitBounds(allBounds, {
        padding: [30, 30],
        maxZoom: 14,
      });
    }
  }, [routes, selectedRouteIndex, origin, destination, language, onSelectRoute]);

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
