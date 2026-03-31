'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function DigitalClock({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-xl border font-mono text-sm tracking-tight shadow-inner transition-colors duration-300 ${!isDarkMode ? 'bg-slate-100/80 border-slate-200 text-slate-800' : 'bg-mist-800/50 border-slate-700/30 text-slate-300'}`}>
      <Clock size={14} className={!isDarkMode ? 'text-blue-600' : 'text-blue-500/80'} />
      <span className={`tracking-widest text-[10px] font-bold ${!isDarkMode ? 'text-slate-400' : 'opacity-50'}`}>UTC+8</span>
      <span className={`font-black ${!isDarkMode ? 'text-slate-800' : 'text-slate-200'}`}>
        {time.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}
