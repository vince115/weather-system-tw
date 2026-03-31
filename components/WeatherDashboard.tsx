'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { 
  Thermometer, Droplets, Wind, RefreshCw, MapPin, 
  CloudRain, Smile, ChevronRight, 
  Activity, Clock, Settings, Globe, Menu, Map as MapIcon,
  TrendingUp, Leaf, Sun, Moon, CloudSun, ChevronDown,
  Waves, Calendar, Cloud, CloudDrizzle, CloudLightning,
  LayoutGrid, Plus, Shield, Eye, Zap, AlertTriangle, X
} from 'lucide-react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import DigitalClock from './DigitalClock';

// 動態導入地圖組件
const OSMMap = dynamic(() => import('./OSMMap'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[480px] bg-slate-900/10"><RefreshCw size={24} className="animate-spin text-slate-500" /></div>
});

const REGIONS = [
  { id: 'all', name: '全臺', cities: ['基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣'] },
  { id: 'north', name: '北部', cities: ['基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣'] },
  { id: 'central', name: '中部', cities: ['苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣'] },
  { id: 'south', name: '南部', cities: ['嘉義市', '嘉義縣', '臺南市', '高雄市', '屏東縣'] },
  { id: 'east', name: '東部', cities: ['花蓮縣', '臺東縣'] },
  { id: 'islands', name: '外島', cities: ['澎湖縣', '金門縣', '連江縣'] },
];

const CITIES = [
  { id: 'Taipei', name: '臺北市', lat: 25.0330, lng: 121.5654 },
  { id: 'NewTaipei', name: '新北市', lat: 25.0117, lng: 121.4658 },
  { id: 'Keelung', name: '基隆市', lat: 25.1283, lng: 121.7419 },
  { id: 'Taoyuan', name: '桃園市', lat: 24.9936, lng: 121.3010 },
  { id: 'Taichung', name: '臺中市', lat: 24.1477, lng: 120.6736 },
  { id: 'Tainan', name: '臺南市', lat: 22.9997, lng: 120.2270 },
  { id: 'Kaohsiung', name: '高雄市', lat: 22.6273, lng: 120.3014 },
  { id: 'Hualien', name: '花蓮縣', lat: 23.9769, lng: 121.6044 },
];

async function fetchWeather(city: string) {
  const res = await fetch(`/api/weather?city=${city}`);
  return res.json();
}

async function fetchQuake() {
  const res = await fetch('/api/quake');
  return res.json();
}

export default function WeatherDashboard() {
  const [activeModule, setActiveModule] = useState<'weather' | 'quake' | 'forecast'>('weather');
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedQuakeId, setSelectedQuakeId] = useState<string | null>(null);

  const { data: quakeData } = useQuery({
    queryKey: ['quake'],
    queryFn: fetchQuake,
    refetchInterval: 300000, 
  });

  const activeQuake = useMemo(() => {
    if (!quakeData?.history) return null;
    if (!selectedQuakeId) return quakeData.latest;
    const found = quakeData.history.find((q: any) => q.id === selectedQuakeId);
    return found || quakeData.latest;
  }, [quakeData, selectedQuakeId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['weather', selectedCity.id],
    queryFn: () => fetchWeather(selectedCity.id),
    refetchInterval: 600000, 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const forecastDays = useMemo(() => {
    const days = [];
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    for (let i = 0; i < 7; i++) {
       const d = new Date();
       d.setDate(d.getDate() + i);
       days.push({
         date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
         day: weekdays[d.getDay()],
         isWeekend: d.getDay() === 0 || d.getDay() === 6
       });
    }
    return days;
  }, []);

  const chartOptions = {
    backgroundColor: 'transparent',
    legend: { icon: 'roundRect', textStyle: { color: isDarkMode ? '#dae1e7' : '#334155', fontSize: 10, fontWeight: 'black' }, top: 5, right: 40 },
    tooltip: { 
      trigger: 'axis',
      backgroundColor: isDarkMode ? '#0f172a' : '#fff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      textStyle: { color: isDarkMode ? '#cbd5e1' : '#1e293b', fontSize: 10, fontWeight: 'bold' },
      formatter: (params: any) => {
        let res = `<div style="padding:4px 8px; border-bottom:1px solid rgba(128,128,128,0.1); margin-bottom:4px; font-weight:900;">T+ SEQUENCE: ${params[0].name}</div>`;
        params.forEach((p: any) => {
          res += `<div style="padding:2px 8px; display:flex; justify-content:space-between; gap:20px; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px">
              <div style="width:8px; height:8px; border-radius:50%; background:${p.color}"></div>
              <span>${p.seriesName}</span>
            </div>
            <span style="font-weight:900; font-family:monospace; color:${p.color}">${p.value}${p.seriesName.includes('降雨') ? '%' : '°'}</span>
          </div>`;
        });
        return res;
      }
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '3%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data?.forecast ? data.forecast.map((f: any) => f.time) : ['06:00', '12:00', '18:00', '00:00', '06:00', '12:00', '18:00'],
      axisLine: { lineStyle: { color: isDarkMode ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 'bold' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'TEMP (°C)',
        min: 15, max: 35,
        splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontStyle: 'italic' },
        nameTextStyle: { color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 9, fontWeight: 'black', padding: [0, 0, 10, 0] }
      },
      {
        type: 'value',
        name: 'RAIN (%)',
        min: 0, max: 100,
        splitLine: { show: false },
        axisLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
        nameTextStyle: { color: '#3b82f6', fontSize: 9, fontWeight: 'black' }
      }
    ],
    series: [
      {
        name: '氣溫 (Temp)',
        data: data?.forecast ? data.forecast.map((f: any) => f.temp) : [22, 26, 28, 24, 21, 26, 22],
        type: 'line',
        smooth: true,
        symbolSize: 0,
        itemStyle: { color: '#087f8c' },
        lineStyle: { width: 4, color: '#087f8c' }, 
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(8, 127, 140, 0.2)' },
            { offset: 1, color: 'transparent' }
          ])
        }
      },
      {
        name: '降雨 (PoP)',
        data: data?.forecast ? data.forecast.map((f: any) => f.pop) : [10, 30, 60, 20, 10, 40, 10],
        type: 'bar',
        yAxisIndex: 1,
        itemStyle: { color: '#3b82f6', opacity: 0.6, borderRadius: [2, 2, 0, 0] },
        barWidth: '20%'
      }
    ]
  };

  const getCitiesInRegion = () => {
    return REGIONS.find(r => r.id === selectedRegion)?.cities || [];
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  const accentColor = !isDarkMode ? '#087f8c' : '#3b82f6';
  const systemBorder = isDarkMode ? 'border-slate-800' : 'border-slate-200';
  const systemDivider = isDarkMode ? 'divide-slate-800' : 'divide-slate-200';

  return (
    <div className={`flex flex-col min-h-screen font-sans tracking-tight transition-colors duration-300 ${!isDarkMode ? 'bg-[#f1f5f9] text-slate-900' : 'bg-[#020617] text-slate-100'}`} suppressHydrationWarning>
      {/* Navbar - Global Priority */}
      <nav className={`h-14 border-b flex items-center justify-between px-6 sticky top-0 z-[4000] backdrop-blur-xl ${!isDarkMode ? 'bg-white/95 border-slate-200' : 'bg-[#0f172a]/95 border-slate-800'}`}>
        <div className="flex items-center gap-6">
          <button className={`p-2 rounded transition-colors ${!isDarkMode ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} />
          </button>
           <div className="flex items-center gap-3">
             <Shield className={!isDarkMode ? 'text-[#087f8c]' : 'text-blue-500'} size={20} />
             <h1 className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider md:tracking-[0.2em] leading-none whitespace-nowrap">Taiwan Weather Command Terminal</h1>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button className={`p-2 rounded transition-all hover:scale-105 ${!isDarkMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`} onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className={`hidden lg:flex items-center gap-2 px-4 py-1.5 rounded border transition-all ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`w-2 h-2 rounded-full ${!data?.isMock ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse outline'}`} />
            <span className="text-xs font-black uppercase tracking-wider opacity-70">LIVE_OPS</span>
          </div>
          <div className="hidden sm:block">
            <DigitalClock isDarkMode={isDarkMode} />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Dropdown / Desktop Sidebar - RWD Refactored */}
        <aside className={`lg:relative fixed top-14 lg:top-0 left-0 right-0 lg:right-auto z-[3500] flex flex-col transition-all duration-300 pointer-events-auto
          ${isSidebarCollapsed ? 
            'lg:translate-x-0 lg:translate-y-0 -translate-y-full lg:opacity-100 opacity-0 lg:pointer-events-auto pointer-events-none' : 
            'lg:translate-x-0 lg:translate-y-0 translate-y-0 lg:opacity-100 opacity-100'
          } 
          ${isSidebarCollapsed ? 'lg:w-16 lg:flex-shrink-0' : 'lg:w-72 w-full lg:flex-shrink-0'} 
          ${!isDarkMode ? 'bg-white border-b lg:border-b-0 lg:border-r border-slate-200' : 'bg-[#0f172a] border-b lg:border-b-0 lg:border-r border-slate-800'}`}>
           
           {/* Mobile Backdrop Overlay */}
           {!isSidebarCollapsed && (
             <div className="lg:hidden fixed top-0 inset-0 bg-black/60 backdrop-blur-sm z-[-1] transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
           )}
           
           <div 
             className={`flex flex-col overflow-hidden h-auto lg:h-[calc(100vh-56px)] ${isSidebarCollapsed ? 'pt-1 pb-4 lg:items-center px-0' : 'py-6 items-stretch px-4'} scrollbar-hide overflow-y-auto ${!isDarkMode ? 'bg-white' : 'bg-[#0f172a]'}`}
             style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
           >
             
             <div className="space-y-0.5">
               <SidebarItem 
                 icon={<Globe size={20} />} 
                 label="即時氣象監測" 
                 active={activeModule === 'weather'} 
                 activeColor="#087f8c"
                 isDarkMode={isDarkMode} 
                 isCollapsed={isSidebarCollapsed}
                 onClick={() => setActiveModule('weather')} 
               />
               <SidebarItem 
                 icon={<Calendar size={20} />} 
                 label="一週天氣預報" 
                 active={activeModule === 'forecast'} 
                 activeColor="#3b82f6"
                 isDarkMode={isDarkMode} 
                 isCollapsed={isSidebarCollapsed}
                 onClick={() => setActiveModule('forecast')} 
               />
               <SidebarItem 
                 icon={<Activity size={20} />} 
                 label="地震活動監控" 
                 active={activeModule === 'quake'} 
                 activeColor="#9e4539"
                 isDarkMode={isDarkMode} 
                 isCollapsed={isSidebarCollapsed}
                 onClick={() => setActiveModule('quake')} 
               />
             </div>
           </div>
        </aside>

        {/* Content Area - Symmetrically Balanced for Wide Screens */}
        <main className={`flex-1 lg:overflow-y-auto overflow-y-visible px-4 py-6 md:px-6 lg:px-6 lg:py-8 space-y-6 lg:space-y-8 ${!isDarkMode ? 'bg-[#f1f5f9]' : 'bg-[#020617]'}`}>
          {activeModule === 'weather' ? (
            <div className="w-full space-y-8 animate-in fade-in duration-500">
               <ModuleTitleBar icon={<Globe size={24} />} title="即時氣象監測" subTitle="STATION MONITORING CORE" statusText="SYSTEM_ONLINE" isDarkMode={isDarkMode} accent="#087f8c" onRefresh={refetch} />
                <div className={`p-1.5 rounded border flex flex-wrap gap-1.5 w-full ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  {CITIES.map(city => (
                    <button key={city.id} onClick={() => setSelectedCity(city)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all ${selectedCity.id === city.id ? (!isDarkMode ? 'bg-[#087f8c] text-white' : 'bg-[#087f8c] text-white') : (!isDarkMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800')}`}>{city.name}</button>
                  ))}
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <StatCard value={`${data?.temperature?.toFixed(1) || '--'}°C`} label="即時氣溫" subLabel={selectedCity.name} icon={<Thermometer />} isDarkMode={isDarkMode} accent="#087f8c" />
                  <StatCard value={`${data?.humidity || '--'} %`} label="相對濕度" subLabel="H_LEVEL" icon={<Droplets />} isDarkMode={isDarkMode} accent="#0ea5e9" />
                  <StatCard value={`${data?.windSpeed || '--'} m/s`} label="平均風速" subLabel="W_FORCE" icon={<Wind />} isDarkMode={isDarkMode} accent="#94a3b8" />
                  <StatCard value={`${data?.rainPossibility || '--'} %`} label="降雨機率" subLabel="P_LEVEL" icon={<CloudRain />} isDarkMode={isDarkMode} accent="#3b82f6" />
                  <StatCard value={data?.comfortLevel || '--'} label="舒適程度" subLabel="T_INDEX" icon={<Smile />} isDarkMode={isDarkMode} accent="#10b981" />
                  <StatCard value={`${data?.aqi || '--'}`} label="空氣品質" subLabel={data?.aqiStatus || 'AQ_INDEX'} icon={<Activity />} isDarkMode={isDarkMode} accent="#f59e0b" />
                  <StatCard value={`${data?.uvi || 0}`} label="紫外線量" subLabel="UV_RAD" icon={<Sun />} isDarkMode={isDarkMode} accent="#f43f5e" />
                  <StatCard value={`${data?.visibility || '10'} km`} label="能見距離" subLabel="V_RANGE" icon={<Eye />} isDarkMode={isDarkMode} accent="#d946ef" />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className={`lg:col-span-2 rounded border overflow-hidden relative ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="h-[350px] lg:h-[480px]" style={{ '--map-filter': isDarkMode ? 'invert(100%) hue-rotate(188deg) brightness(0.9) contrast(1.2) saturate(0.6)' : 'none' } as React.CSSProperties}>
                      <OSMMap cities={CITIES} selectedCity={selectedCity} onCitySelect={setSelectedCity} isDarkMode={isDarkMode} zoom={12} />
                    </div>
                  </div>
                  <div className={`lg:col-span-3 p-2 md:p-6 rounded border flex flex-col ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40 flex items-center gap-2 border-b pb-4 border-inherit">Meteorological Pulse Matrix</h3>
                    <div className="h-[320px] lg:h-[360px] w-full">
                      <ReactECharts option={chartOptions} style={{ height: '100%' }} />
                    </div>
                  </div>
               </div>
            </div>
          ) : activeModule === 'forecast' ? (
            <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <ModuleTitleBar icon={<Calendar size={24} />} title="一週天氣預報" subTitle="7-DAY SYNOPTIC REPORT" statusText="DATA_SYNC" isDarkMode={isDarkMode} accent="#0ea5e9" />
               <div className={`p-1 rounded border flex gap-1 items-center w-fit ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                 {REGIONS.map(r => (
                   <button key={r.id} onClick={() => setSelectedRegion(r.id)} className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded transition-all ${selectedRegion === r.id ? (!isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (!isDarkMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800')}`}>{r.name}</button>
                 ))}
               </div>
               <div className={`rounded border overflow-hidden ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-[#0a121f] border-slate-800'}`}>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse table-fixed min-w-[1240px]">
                     <thead>
                       <tr className={!isDarkMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-[#0f172a] text-slate-300 border-b border-slate-800'}>
                         <th className={`w-[140px] p-4 text-xs font-black uppercase sticky left-0 z-10 bg-inherit border-r ${systemBorder}`}>監控站點</th>
                         <th className={`w-[80px] p-4 text-xs font-black uppercase text-center border-r ${systemBorder}`}>時段</th>
                         {forecastDays.map(day => (
                           <th key={day.date} className={`p-4 text-center border-r transition-colors ${systemBorder} ${day.isWeekend ? (!isDarkMode ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400') : ''}`}>
                             <div className="text-[10px] font-bold opacity-60 mb-1">{day.date}</div>
                             <div className="text-sm font-black">{day.day}</div>
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className={`divide-y ${systemDivider}`}>
                       {getCitiesInRegion().map(cityName => (
                         <React.Fragment key={cityName}>
                           <tr className={`transition-colors ${!isDarkMode ? 'bg-white hover:bg-slate-50' : 'bg-[#050b16] hover:bg-blue-500/5'}`}>
                             <td rowSpan={2} className={`p-4 font-black text-sm border-r sticky left-0 z-10 ${!isDarkMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#050b16] border-slate-800 text-slate-100'}`}>
                               <div className="flex items-center gap-2">{cityName}<Plus size={12} className="text-slate-400 opacity-20" /></div>
                             </td>
                             <td className={`p-4 text-center text-[10px] font-black uppercase border-r ${!isDarkMode ? 'bg-emerald-50/20 text-[#087f8c] border-slate-200' : 'bg-slate-800/10 text-blue-400 border-slate-800'}`}>日間報</td>
                             {forecastDays.map((day, i) => (
                               <td key={i} className={`p-6 text-center border-r ${systemBorder} ${day.isWeekend ? (!isDarkMode ? 'bg-rose-50/50' : 'bg-rose-500/5') : ''}`}>
                                 <div className="flex flex-col items-center gap-2">
                                   <div className="mb-2">{(i + cityName.length) % 3 === 0 ? <Sun className="text-amber-500" size={32} /> : (i % 2 === 0 ? <CloudSun className="text-yellow-200" size={32} /> : <Cloud className="text-slate-300" size={32} />)}</div>
                                   <div className="text-sm font-black tabular-nums tracking-tighter">22 - 28°C</div>
                                 </div>
                               </td>
                             ))}
                           </tr>
                           <tr className={`transition-colors ${!isDarkMode ? 'bg-white hover:bg-slate-50' : 'bg-[#050b16] hover:bg-blue-500/5'}`}>
                             <td className={`p-4 text-center text-[12px] font-black uppercase border-r ${!isDarkMode ? 'bg-slate-50/50 text-slate-400 border-slate-200' : 'bg-slate-900/20 text-slate-500 border-slate-800'}`}>夜間</td>
                             {forecastDays.map((day, i) => (
                               <td key={i} className={`p-6 text-center border-r ${systemBorder} ${day.isWeekend ? (!isDarkMode ? 'bg-rose-50/50' : 'bg-rose-500/5') : ''}`}>
                                 <div className="flex flex-col items-center gap-2">
                                   <Moon className="text-indigo-400 opacity-60" size={20} />
                                   <div className="text-sm font-bold tabular-nums text-slate-500 tracking-tighter">19 - 24°C</div>
                                 </div>
                               </td>
                             ))}
                           </tr>
                         </React.Fragment>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
               <ModuleTitleBar 
                 icon={<Activity size={20} />} 
                 title="地震活動監控" 
                 subTitle="LIVE SEISMIC COMMAND" 
                 statusText={quakeData ? 'REPORT_READY' : 'FETCHING...'}
                 isDarkMode={isDarkMode} 
                 accent="#9e4539" 
               />
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-160px)] h-auto overflow-visible lg:overflow-hidden pb-10 lg:pb-0">
                  {/* Right Column (50%): 2x2 Stats + Tactical Map */}
                  <div className="lg:col-span-1 flex flex-col gap-4 lg:overflow-hidden lg:h-full h-auto">
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className={`p-4 rounded border transition-all ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-rose-950/20 border-rose-900/40'}`}>
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded bg-rose-500/10 text-rose-500"><Zap size={20} /></div>
                          <div>
                            <div className="text-xl font-black tracking-tighter text-rose-500 leading-none">{activeQuake?.id || '--'}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">ID_NO</div>
                          </div>
                        </div>
                      </div>
                      <StatCard value={`M ${activeQuake?.magnitude || '--'}`} label="規模" subLabel="TOTAL_MAG" icon={<AlertTriangle size={18} />} isDarkMode={isDarkMode} accent="#9e4539" />
                      <StatCard value={`${activeQuake?.depth || '--'} km`} label="深度" subLabel="FOCAL" icon={<Waves size={18} />} isDarkMode={isDarkMode} accent="#f59e0b" />
                      <StatCard value={activeQuake?.maxIntensity || '--'} label="震度" subLabel="MAX_INT" icon={<Zap size={18} />} isDarkMode={isDarkMode} accent="#fbbf24" />
                    </div>

                    <div className={`flex-1 rounded border overflow-hidden relative flex flex-col ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <div className={`p-3 border-b text-[9px] font-black uppercase tracking-widest flex items-center justify-between ${isDarkMode ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                           <div className="flex items-center gap-2 text-blue-500 font-bold"><MapPin size={10} /> {activeQuake?.location || 'FOCAL_MAP'}</div>
                           <div className="opacity-40 italic">{activeQuake?.time}</div>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-[400px] lg:min-h-0" style={{ '--map-filter': isDarkMode ? 'invert(100%) hue-rotate(188deg) brightness(0.9) contrast(1.2) saturate(0.6)' : 'none' } as React.CSSProperties}>
                          {mounted && activeQuake && (
                            <OSMMap 
                              key={`${activeQuake.lat}-${activeQuake.lng}`}
                              cities={CITIES} 
                              selectedCity={{ id: 'epicenter', name: activeQuake.location, lat: activeQuake.lat, lng: activeQuake.lng }} 
                              zoom={10}
                              isDarkMode={isDarkMode}
                            />
                          )}
                        </div>
                    </div>
                  </div>

                  {/* Left Column (50%): Report + History */}
                  <div className="lg:col-span-1 flex flex-col gap-4 lg:overflow-hidden lg:h-full h-auto">
                    <div className={`p-2 rounded border h-fit flex flex-col min-h-0 ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 border-b pb-2 border-inherit flex items-center justify-between">
                        <div className="flex items-center gap-2"><MapIcon size={14} className="text-rose-500" /> 地震報告大圖 SEISMIC_REPORT</div>
                        {activeQuake?.id && <div className="text-[9px] font-black text-rose-500 uppercase px-2 py-0.5 rounded border border-rose-500/20 tracking-tighter">SEQ_{activeQuake.id}</div>}
                      </h3>
                      <div className="bg-white rounded overflow-hidden border border-slate-700/10">
                        {activeQuake?.reportImage ? (
                          <img 
                            src={activeQuake.reportImage} 
                            alt="CWA Report" 
                            className="w-full h-auto object-contain transition-transform duration-500 hover:scale-[1.01]" 
                            key={activeQuake.reportImage} 
                          />
                        ) : (
                          <div className="h-[300px] w-full flex items-center justify-center text-slate-500/20 bg-black/10 text-xs font-black uppercase italic">
                            Capturing Telemetry...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`flex-1 min-h-0 rounded border overflow-hidden shadow-sm flex flex-col ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 font-bold tracking-tight'}`}>
                      <div className={`px-4 py-1.5 border-b text-[9px] font-black uppercase tracking-widest flex items-center justify-between ${isDarkMode ? 'bg-slate-800/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                         HISTORICAL_EVENT_LOGS
                      </div>
                      <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <table className="w-full text-xs border-collapse">
                          <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-slate-50 border-b border-slate-100'}`}>
                            <tr className="opacity-60 text-[8px] font-black uppercase tracking-widest">
                              <th className="p-3 text-center w-10">ALRT</th>
                              <th className="p-3 text-left">QUAKE_ID</th>
                              <th className="p-3 text-left">TIME_STAMP</th>
                              <th className="p-3 text-left">LOCATION</th>
                              <th className="p-3 text-center">MAG</th>
                              <th className="p-3 text-center">MAX_INT</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${systemDivider}`}>
                            {quakeData?.history?.map((q: any) => (
                              <tr 
                                key={q.id} 
                                onClick={() => setSelectedQuakeId(q.id)}
                                className={`cursor-pointer transition-colors group ${activeQuake?.id === q.id ? (isDarkMode ? 'bg-blue-600/20 text-blue-400 font-black' : 'bg-blue-100/50 text-blue-700 font-black') : (isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}
                              >
                                <td className="p-3 text-center">
                                  <div className={`w-2.5 h-2.5 rounded-full mx-auto ${
                                    q.alertLevel === 4 ? 'bg-rose-500 animate-pulse' :
                                    q.alertLevel === 3 ? 'bg-orange-500 animate-pulse' :
                                    q.alertLevel === 2 ? 'bg-amber-400' :
                                    'bg-emerald-500/40'
                                  }`} />
                                </td>
                                <td className="p-3 opacity-30 text-[10px] font-black">{String(q.id).slice(-3)}</td>
                                <td className="p-3 whitespace-nowrap opacity-70 tabular-nums">{q.time}</td>
                                <td className="p-3 truncate font-bold">{q.location}</td>
                                <td className="p-3 text-center font-black">M{q.magnitude}</td>
                                <td className={`p-3 text-center font-black ${
                                  q.alertLevel >= 3 ? 'text-rose-500' : 
                                  q.alertLevel === 2 ? 'text-amber-500' : 'text-slate-500'
                                }`}>{q.maxIntensity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer (Mirroring Navbar Style with Localized Info) */}
      <footer className={`h-10 border-t flex items-center justify-between px-6 z-[2000] backdrop-blur-xl flex-shrink-0 ${!isDarkMode ? 'bg-white/95 border-slate-200 text-slate-500' : 'bg-[#0f172a]/95 border-slate-800 text-slate-400'}`}>
        <div className="flex items-center gap-5 text-[9px] font-black tracking-widest">
           <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-inherit opacity-60">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="uppercase text-[8px]">TWC_CENTRAL_OPS</span>
           </div>
           <div className="flex items-center gap-3 opacity-60">
             <span className="text-blue-500/80">系統版本 v1.4.2</span>
             <span className="opacity-20 inline">|</span>
             <span className="opacity-80">監控範圍：臺灣全境及周邊海域</span>
           </div>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-[9px] font-black opacity-30 tracking-[0.2em]">
           <span>資料來源：交通部中央氣象署 (CWA)</span>
           <span className="w-1 h-1 rounded-full bg-current" />
           <span>授權等級：戰術情報終端</span>
        </div>

        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.1em] opacity-40">
           <div className="flex items-center gap-5">
             <span className="flex items-center gap-1.5"><Activity size={10} className="text-blue-500" /> 系統狀態：全線穩定</span>
             <span className="hidden sm:flex items-center gap-1.5"><Shield size={10} className="text-[#087f8c]" /> 數據完整度：100%</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

// Global Components (Precision Restored)
function ModuleTitleBar({ icon, title, subTitle, statusText, isDarkMode, accent, onRefresh }: any) {
  const systemBorder = isDarkMode ? 'border-slate-800' : 'border-slate-200';
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 ${systemBorder}`}>
      <div className="flex items-center gap-6">
        <div className={`p-3.5 rounded border shadow-inner transition-colors duration-300`} style={{ backgroundColor: `${accent}10`, borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', color: accent }}>{icon}</div>
        <div>
          <h1 className={`text-xl font-black uppercase tracking-[0.15em] leading-none ${!isDarkMode ? 'text-slate-900' : 'text-slate-100'}`}>{title}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">{subTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`px-4 py-2 rounded-sm border text-[10px] font-black tracking-widest ${!isDarkMode ? 'bg-slate-100 border-slate-200 text-slate-600 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 shadow-inner'}`}>
          STATUS: <span className={statusText?.includes('SYNC') || statusText?.includes('ONLINE') || statusText?.includes('READY') ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}>{statusText}</span>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className={`p-2 rounded border transition-all active:scale-95 ${!isDarkMode ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 shadow-sm' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 shadow-sm shadow-black'}`}>
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isDarkMode, isCollapsed, activeColor }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`group relative flex items-center transition-all duration-300 outline-none
        ${isCollapsed ? 'justify-center py-0.5 w-full mx-auto' : 'gap-4 p-3 rounded-xl px-4 w-full'}
        ${!isCollapsed && active ? 'text-white' : ''}
        ${!isCollapsed && !active ? (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900') : ''}
      `}
      style={{ 
        backgroundColor: (!isCollapsed && active) ? activeColor : undefined
      }}
    >
      <div 
        className={`transition-all duration-300 flex items-center justify-center flex-shrink-0
          ${isCollapsed ? (
            active 
              ? 'w-12 h-12 text-white rounded-xl' 
              : `w-12 h-12 rounded-xl text-slate-500 ${isDarkMode ? 'hover:bg-slate-800 hover:text-slate-200' : 'hover:bg-slate-100 hover:text-slate-800'}`
          ) : ''}
        `}
        style={{ 
          backgroundColor: (isCollapsed && active) ? activeColor : undefined
        }}
      >
        {icon}
      </div>
      {!isCollapsed && <span className="text-[13px] font-black uppercase tracking-[0.1em] truncate">{label}</span>}
    </button>
  );
}

function StatCard({ label, value, subLabel, icon, isDarkMode, accent }: any) {
  return (
    <div className={`p-5 rounded border transition-all group hover:-translate-y-1 min-w-0 ${!isDarkMode ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800/80'}`}>
      <div className="flex items-center gap-5">
        <div className="p-3.5 rounded transition-colors duration-300 shrink-0" style={{ backgroundColor: `${accent}15`, color: accent }}>{icon}</div>
        <div className="flex-1 min-w-0">
           <div className={`text-2xl font-black tracking-tighter ${!isDarkMode ? 'text-slate-900' : 'text-slate-100'}`}>{value}</div>
           <div className="flex items-center justify-between mt-1.5 pt-1.5">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</span>
             <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{subLabel}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
