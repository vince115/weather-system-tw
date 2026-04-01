'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Cloud, CloudRain, CloudSun, Sun, Moon,
  Calendar, RefreshCw, Plus,
} from 'lucide-react';
import WeeklyForecastMobile from './WeeklyForecastMobile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  wx: string;
  icon?: string;
  minT?: string;
  maxT?: string;
  pop?: string;
}

interface DayForecast {
  date: string;   // "MM/DD"
  day: Slot;
  night: Slot;
}

interface CityForecast {
  city: string;
  forecast: DayForecast[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REGIONS = [
  { id: 'all',     name: '全臺', cities: ['基隆市','臺北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','臺中市','彰化縣','南投縣','雲林縣'] },
  { id: 'north',   name: '北部', cities: ['基隆市','臺北市','新北市','桃園市','新竹市','新竹縣'] },
  { id: 'central', name: '中部', cities: ['苗栗縣','臺中市','彰化縣','南投縣','雲林縣'] },
  { id: 'south',   name: '南部', cities: ['嘉義市','嘉義縣','臺南市','高雄市','屏東縣'] },
  { id: 'east',    name: '東部', cities: ['花蓮縣','臺東縣'] },
  { id: 'islands', name: '外島', cities: ['澎湖縣','金門縣','連江縣'] },
];

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize 台 → 臺 so city keys always match */
const norm = (s: string) => s.replace(/台/g, '臺');

/** Derive weekday label from "MM/DD" of current year */
function weekdayFromDate(mmdd: string): { day: string; isWeekend: boolean } {
  const [mm, dd] = mmdd.split('/').map(Number);
  const now = new Date();
  const d = new Date(now.getFullYear(), mm - 1, dd);
  // If the month has already passed this year, it must be next year
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)) {
    d.setFullYear(now.getFullYear() + 1);
  }
  const dow = d.getDay();
  return { day: WEEKDAYS[dow], isWeekend: dow === 0 || dow === 6 };
}

function WeatherIcon({ wx, isNight, size = 32 }: { wx: string; isNight?: boolean; size?: number }) {
  if (!wx) return <Cloud className="text-slate-400" size={size} />;
  if (wx.includes('晴') && !wx.includes('雲') && !wx.includes('雨')) {
    return isNight
      ? <Moon className="text-indigo-400" size={size} />
      : <Sun className="text-amber-400" size={size} />;
  }
  if (wx.includes('雨') || wx.includes('雷')) return <CloudRain className="text-blue-400" size={size} />;
  if (wx.includes('雲') && wx.includes('晴'))  return <CloudSun className="text-yellow-300" size={size} />;
  if (wx.includes('陰') || wx.includes('雲'))  return <Cloud className="text-slate-400" size={size} />;
  return <Cloud className="text-slate-300" size={size} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyForecast({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [data, setData]         = useState<CityForecast[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      console.log('[WeeklyForecast] API response', json);

      if (!json.success || !Array.isArray(json.data)) {
        console.error('[WeeklyForecast] unexpected shape:', json);
        throw new Error(json.error || 'BAD_RESPONSE');
      }

      // Normalize city names; remove any cities with empty forecasts
      const normalized: CityForecast[] = json.data
        .map((c: any) => ({ city: norm(c.city ?? ''), forecast: c.forecast ?? [] }))
        .filter((c: CityForecast) => c.city && c.forecast.length > 0);

      console.log('[WeeklyForecast] locations length', normalized.length);
      console.log('[WeeklyForecast] first city forecast', normalized[0]);

      setData(normalized);
    } catch (err: any) {
      console.error('[WeeklyForecast] fetch error:', err);
      setError(err.message ?? '數據獲取失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  /** Unique sorted dates from the first city */
  const forecastDates = useMemo(() => {
    if (data.length === 0) return [];
    const dates = [...new Set(data[0].forecast.map(f => f.date))].slice(0, 7);
    return dates.map(date => ({ date, ...weekdayFromDate(date) }));
  }, [data]);

  /** City lookup map keyed by normalized name */
  const cityMap = useMemo(() => {
    const m = new Map<string, CityForecast>();
    data.forEach(c => m.set(c.city, c));
    return m;
  }, [data]);

  const getSlot = (cityName: string, date: string, isNight: boolean): Slot | null => {
    const city = cityMap.get(norm(cityName));
    if (!city) return null;
    const day = city.forecast.find(f => f.date === date);
    if (!day) return null;
    return isNight ? day.night : day.day;
  };

  const currentCities = useMemo(
    () => REGIONS.find(r => r.id === selectedRegion)?.cities ?? [],
    [selectedRegion],
  );

  // ── Styles ──────────────────────────────────────────────────────────────────

  const border   = isDarkMode ? 'border-slate-800'  : 'border-slate-200';
  const divider  = isDarkMode ? 'divide-slate-800'  : 'divide-slate-200';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 ${border}`}>
        <div className="flex items-center gap-6">
          <div className="p-3.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-500">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className={`text-xl font-black uppercase tracking-[0.15em] leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              一週天氣預報
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">
              7-DAY SYNOPTIC REPORT · F-D0047-091
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-sm border text-[10px] font-black tracking-widest ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            STATUS:{' '}
            <span className={isLoading ? 'text-amber-400 animate-pulse' : error ? 'text-rose-500' : 'text-emerald-500'}>
              {isLoading ? 'SYNCING...' : error ? 'ERROR' : 'DATA_LIVE'}
            </span>
          </div>
          <button
            onClick={fetchData}
            className={`p-2 rounded border transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'}`}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && data.length === 0 && (
        <div className="w-full animate-pulse">
          {/* Default tabs skeleton */}
          <div className={`p-1 rounded border flex flex-wrap gap-1 items-center w-full sm:w-fit mb-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-8 w-14 sm:w-16 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden lg:block">
            <div className={`rounded border overflow-hidden ${isDarkMode ? 'bg-[#0a121f] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`w-full h-14 border-b ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-100 border-slate-200'}`} />
              <div className="divide-y divide-slate-800/50">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex">
                    <div className={`w-[140px] p-4 border-r ${isDarkMode ? 'border-slate-800 bg-[#050b16]' : 'border-slate-200 bg-white'}`}>
                      <div className={`h-5 w-16 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex-1 p-4 flex gap-4">
                      <div className={`h-16 flex-1 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
                      <div className={`h-16 flex-1 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
                      <div className={`h-16 flex-1 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
                      <div className={`h-16 flex-1 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Card Skeleton */}
          <div className="lg:hidden flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-[72px] rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-slate-50'}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="flex items-center justify-center h-40">
          <p className="text-rose-500 font-black text-sm tracking-widest">ERROR: {error}</p>
        </div>
      )}

      {/* ── Content ── */}
      {!isLoading && !error && data.length > 0 && (
        <>
          {/* Region tabs — shared by both layouts */}
          <div className={`p-1 rounded border flex flex-wrap gap-1 items-center w-full sm:w-fit ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {REGIONS.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded transition-all flex-1 sm:flex-none
                  ${selectedRegion === r.id
                    ? 'bg-blue-500 text-white'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* ── Desktop: table layout ── */}
          <div className="hidden lg:block">
            <div className={`rounded border overflow-hidden ${isDarkMode ? 'bg-[#0a121f] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1240px]">
                  <thead>
                    <tr className={isDarkMode ? 'bg-[#0f172a] text-slate-300 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
                      <th className={`w-[140px] p-4 text-xs font-black uppercase sticky left-0 z-10 bg-inherit border-r ${border}`}>監控站點</th>
                      <th className={`w-[80px] p-4 text-xs font-black uppercase text-center border-r ${border}`}>時段</th>
                      {forecastDates.map(fd => (
                        <th
                          key={fd.date}
                          className={`p-4 text-center border-r transition-colors ${border}
                            ${fd.isWeekend ? (isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600') : ''}`}
                        >
                          <div className="text-[10px] font-bold opacity-60 mb-1">{fd.date}</div>
                          <div className="text-sm font-black">{fd.day}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className={`divide-y ${divider}`}>
                    {currentCities.map(cityName => (
                      <React.Fragment key={cityName}>
                        {/* Day row */}
                        <tr className={`transition-colors ${isDarkMode ? 'bg-[#050b16] hover:bg-blue-500/5' : 'bg-white hover:bg-slate-50'}`}>
                          <td
                            rowSpan={2}
                            className={`p-4 font-black text-sm border-r sticky left-0 z-10
                              ${isDarkMode ? 'bg-[#050b16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
                          >
                            <div className="flex items-center gap-2">
                              {cityName}
                              <Plus size={12} className="text-slate-400 opacity-20" />
                            </div>
                          </td>
                          <td className={`p-4 text-center text-[10px] font-black uppercase border-r
                            ${isDarkMode ? 'bg-slate-800/10 text-blue-400 border-slate-800' : 'bg-emerald-50/20 text-[#087f8c] border-slate-200'}`}>
                            日間
                          </td>
                          {forecastDates.map(fd => {
                            const slot = getSlot(cityName, fd.date, false);
                            return (
                              <td
                                key={fd.date}
                                className={`p-4 text-center border-r ${border}
                                  ${fd.isWeekend ? (isDarkMode ? 'bg-rose-500/5' : 'bg-rose-50/50') : ''}`}
                              >
                                {slot ? (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <WeatherIcon wx={slot.wx} isNight={false} size={28} />
                                    <div className="text-sm font-black tabular-nums tracking-tight">
                                      {slot.minT ?? '--'} – {slot.maxT ?? '--'}°C
                                    </div>
                                    {slot.wx && (
                                      <div className="text-[9px] font-bold opacity-30 truncate max-w-[90px]">{slot.wx}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-16 flex items-center justify-center opacity-20 text-xs">---</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Night row */}
                        <tr className={`transition-colors ${isDarkMode ? 'bg-[#050b16] hover:bg-blue-500/5' : 'bg-white hover:bg-slate-50'}`}>
                          <td className={`p-4 text-center text-[10px] font-black uppercase border-r
                            ${isDarkMode ? 'bg-slate-900/20 text-slate-500 border-slate-800' : 'bg-slate-50/50 text-slate-400 border-slate-200'}`}>
                            夜間
                          </td>
                          {forecastDates.map(fd => {
                            const slot = getSlot(cityName, fd.date, true);
                            return (
                              <td
                                key={fd.date}
                                className={`p-4 text-center border-r ${border}
                                  ${fd.isWeekend ? (isDarkMode ? 'bg-rose-500/5' : 'bg-rose-50/50') : ''}`}
                              >
                                {slot ? (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <WeatherIcon wx={slot.wx} isNight size={24} />
                                    <div className="text-sm font-bold tabular-nums text-slate-500 tracking-tight">
                                      {slot.minT ?? '--'} – {slot.maxT ?? '--'}°C
                                    </div>
                                    {slot.wx && (
                                      <div className="text-[9px] font-bold opacity-25 truncate max-w-[90px]">{slot.wx}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-14 flex items-center justify-center opacity-20 text-xs">---</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Mobile: card layout ── */}
          <div className="lg:hidden">
            <WeeklyForecastMobile
              data={data}
              currentCities={currentCities}
              isDarkMode={isDarkMode}
            />
          </div>
        </>
      )}
    </div>
  );
}
