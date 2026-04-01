'use client';

import React, { useState, useMemo } from 'react';
import {
  Cloud, CloudRain, CloudSun, Sun, Moon,
  ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';

// ─── Types (mirrored from WeeklyForecast) ────────────────────────────────────

interface Slot {
  wx: string;
  icon?: string;
  minT?: string;
  maxT?: string;
  pop?: string;
}

interface DayForecast {
  date: string; // "MM/DD"
  day: Slot;
  night: Slot;
}

interface CityForecast {
  city: string;
  forecast: DayForecast[];
}

interface Props {
  data: CityForecast[];
  currentCities: string[];
  isDarkMode?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function weekdayShort(mmdd: string): { short: string; isWeekend: boolean } {
  const [mm, dd] = mmdd.split('/').map(Number);
  const now = new Date();
  const d = new Date(now.getFullYear(), mm - 1, dd);
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)) {
    d.setFullYear(now.getFullYear() + 1);
  }
  const dow = d.getDay();
  return { short: `週${WEEKDAYS[dow]}`, isWeekend: dow === 0 || dow === 6 };
}

function WeatherIcon({ wx, isNight, size = 20 }: { wx: string; isNight?: boolean; size?: number }) {
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

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({
  forecast,
  isDarkMode,
}: {
  forecast: DayForecast;
  isDarkMode: boolean;
}) {
  const { short, isWeekend } = weekdayShort(forecast.date);

  const cardBg    = isDarkMode ? 'bg-[#0c1624] border-slate-800' : 'bg-white border-slate-200';
  const dateBg    = isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-50';
  const dayLabel  = isDarkMode ? 'text-blue-400'   : 'text-teal-600';
  const nightLabel = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const tempDay   = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const tempNight = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const wxLabel   = 'opacity-40 text-[10px] truncate';
  const weekendDate = isWeekend
    ? isDarkMode ? 'text-rose-400' : 'text-rose-600'
    : isDarkMode ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
      {/* Date header */}
      <div className={`px-4 py-2 flex items-center justify-between ${dateBg}`}>
        <span className={`text-sm font-black tracking-wide ${weekendDate}`}>
          {forecast.date}
        </span>
        <span className={`text-xs font-bold ${weekendDate} opacity-70`}>
          {short}
        </span>
      </div>

      {/* Day / Night split */}
      <div className="grid grid-cols-2 divide-x divide-slate-800/30">
        {/* Day */}
        <div className="flex flex-col items-center gap-1.5 p-4">
          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dayLabel}`}>
            日間
          </span>
          <WeatherIcon wx={forecast.day.wx} isNight={false} size={28} />
          <div className={`text-base font-black tabular-nums ${tempDay}`}>
            {forecast.day.minT ?? '--'}–{forecast.day.maxT ?? '--'}°
          </div>
          {forecast.day.wx && (
            <div className={`${wxLabel} ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {forecast.day.wx}
            </div>
          )}
          {forecast.day.pop && forecast.day.pop !== '0' && (
            <div className="text-[10px] text-blue-400 font-bold">
              💧 {forecast.day.pop}%
            </div>
          )}
        </div>

        {/* Night */}
        <div className="flex flex-col items-center gap-1.5 p-4">
          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${nightLabel}`}>
            夜間
          </span>
          <WeatherIcon wx={forecast.night.wx} isNight size={24} />
          <div className={`text-base font-bold tabular-nums ${tempNight}`}>
            {forecast.night.minT ?? '--'}–{forecast.night.maxT ?? '--'}°
          </div>
          {forecast.night.wx && (
            <div className={`${wxLabel} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {forecast.night.wx}
            </div>
          )}
          {forecast.night.pop && forecast.night.pop !== '0' && (
            <div className="text-[10px] text-blue-400/70 font-bold">
              💧 {forecast.night.pop}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── City Section ─────────────────────────────────────────────────────────────

function CitySection({
  cityForecast,
  isDarkMode,
  defaultOpen = false,
}: {
  cityForecast: CityForecast;
  isDarkMode: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const headerBg   = isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200';
  const cityColor  = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const chevronCol = isDarkMode ? 'text-slate-500' : 'text-slate-400';

  // Today's weather at a glance for collapsed header
  const today = cityForecast.forecast[0];

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
      {/* City header — always visible, tap to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 border-b transition-colors active:opacity-70 ${headerBg}`}
      >
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-blue-500 shrink-0" />
          <span className={`text-sm font-black tracking-wide ${cityColor}`}>
            {cityForecast.city}
          </span>
          {today && (
            <span className={`text-xs font-bold tabular-nums ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              今日 {today.day.minT ?? '--'}–{today.day.maxT ?? '--'}°C
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={16} className={chevronCol} />
          : <ChevronDown size={16} className={chevronCol} />
        }
      </button>

      {/* Expanded: 7-day cards */}
      {open && (
        <div className={`p-4 flex flex-col gap-3 ${isDarkMode ? 'bg-[#070f1a]' : 'bg-slate-50/50'}`}>
          {cityForecast.forecast.map(df => (
            <DayCard key={df.date} forecast={df} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Mobile Component ────────────────────────────────────────────────────

export default function WeeklyForecastMobile({ data, currentCities, isDarkMode = true }: Props) {
  // Build city lookup from data
  const cityMap = useMemo(() => {
    const m = new Map<string, CityForecast>();
    data.forEach(c => m.set(c.city, c));
    return m;
  }, [data]);

  const visibleCities = useMemo(
    () => currentCities.map(name => cityMap.get(name)).filter(Boolean) as CityForecast[],
    [currentCities, cityMap],
  );

  if (visibleCities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 opacity-30 text-sm font-black tracking-widest">
        NO DATA
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleCities.map((cf, i) => (
        <CitySection
          key={cf.city}
          cityForecast={cf}
          isDarkMode={isDarkMode}
          defaultOpen={i === 0} // first city open by default
        />
      ))}
    </div>
  );
}
