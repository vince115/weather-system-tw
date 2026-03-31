'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RefreshCw } from 'lucide-react';

// 1. 氣象專用標記 (高品質圖針 - 這是用戶要求的 Tag)
const weatherPinIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 2. 地震專用標記 (戰術雷達脈衝)
const createPulseIcon = () => L.divIcon({
  className: 'custom-pulse-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 bg-rose-500/20 rounded-full animate-ping"></div>
      <div class="absolute w-8 h-8 bg-rose-500/30 rounded-full animate-ping" style="animation-delay: 0.2s"></div>
      <div class="relative w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_10px_#f43f5e]"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createStationDot = (isActive: boolean) => L.divIcon({
  className: 'custom-station-icon',
  html: `
    <div class="flex items-center justify-center">
      <div class="${isActive ? 'w-3 h-3 bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'w-2 h-2 bg-slate-400 opacity-50'} rounded-full border border-white/50"></div>
    </div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface MapProps {
  cities: { id: string; name: string; lat: number; lng: number }[];
  selectedCity: { id: string; name: string; lat: number; lng: number };
  onCitySelect?: (city: any) => void;
  zoom?: number;
  isDarkMode: boolean;
}

function MapEffects({ isDarkMode, center, zoom }: { isDarkMode: boolean, center: [number, number], zoom: number }) {
  const map = useMap();

  useEffect(() => {
    const tilePane = map.getPanes().tilePane;
    if (tilePane) {
      tilePane.style.filter = isDarkMode
        ? 'invert(100%) hue-rotate(190deg) brightness(0.85) contrast(1.2) saturate(0.3) grayscale(0.4)'
        : 'none';
      tilePane.style.transition = 'filter 0.5s ease-in-out';
    }
  }, [isDarkMode, map]);

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);

  return null;
}

const OSMMap: React.FC<MapProps> = ({ cities, selectedCity, onCitySelect, zoom = 10, isDarkMode }) => {
  if (typeof window === 'undefined') return null;

  if (!selectedCity || typeof selectedCity.lat !== 'number' || typeof selectedCity.lng !== 'number' || isNaN(selectedCity.lat) || isNaN(selectedCity.lng)) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100/5 text-slate-500 text-xs font-black uppercase tracking-widest">
        <RefreshCw className="mr-3 animate-spin" size={16} />
        LINKAGE_WAIT
      </div>
    );
  }

  // 自動判斷模式
  const isSeismicMode = selectedCity.id === 'epicenter';
  const center: [number, number] = [selectedCity.lat, selectedCity.lng];

  return (
    <div className="h-full w-full relative z-[10]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: isDarkMode ? '#0f172a' : '#f8fafc' }}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 渲染邏輯：嚴格區分氣象圖針與地震脈衝點 (移除所有 Tooltips) */}
        {cities.map((city) => {
          const icon = isSeismicMode
            ? createStationDot(selectedCity.id === city.id)
            : weatherPinIcon(selectedCity.id === city.id ? 'red' : 'blue');

          return (
            <Marker
              key={city.id}
              position={[city.lat, city.lng]}
              icon={icon}
              eventHandlers={{ click: () => onCitySelect && onCitySelect(city) }}
            />
          );
        })}

        {isSeismicMode && (
          <Marker position={center} icon={createPulseIcon()} />
        )}

        <MapEffects isDarkMode={isDarkMode} center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};

export default OSMMap;
