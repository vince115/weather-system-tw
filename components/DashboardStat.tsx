import React from 'react';

interface StatProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string; // Optional hex or Tailwind class
}

export default function DashboardStat({ icon, value, label, color }: StatProps) {
  // Use simple theme-based colors
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-400', border: 'border-blue-600/20' },
    emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-400', border: 'border-emerald-600/20' },
    amber: { bg: 'bg-amber-600/10', text: 'text-amber-400', border: 'border-amber-600/20' },
    rose: { bg: 'bg-rose-600/10', text: 'text-rose-400', border: 'border-rose-600/20' },
    slate: { bg: 'bg-slate-600/10', text: 'text-slate-400', border: 'border-slate-600/20' },
    indigo: { bg: 'bg-indigo-600/10', text: 'text-indigo-400', border: 'border-indigo-600/20' },
  };

  const theme = colorMap[color || 'slate'] || colorMap.slate;

  return (
    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 hover:shadow-2xl transition-all group active:scale-95">
      <div className="flex items-center gap-4">
        <div className={`p-3.5 ${theme.bg} ${theme.text} rounded-2xl group-hover:scale-110 transition-transform shadow-inner`}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-black tracking-tight text-slate-100">{value}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}
