// app/api/forecast/route.ts
import { NextResponse } from 'next/server';

// F-D0047-091 = 臺灣各縣市鄉鎮未來1週逐12小時天氣預報
const CWA_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091';

function formatDate(isoStr: string): string {
  // e.g. "2026-04-01T06:00:00+08:00"
  const d = new Date(isoStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

export async function GET() {
  const apiKey = process.env.CWA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'MISSING_API_KEY' }, { status: 401 });
  }

  try {
    const res = await fetch(`${CWA_URL}?Authorization=${apiKey}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`CWA_FETCH_FAILED: ${res.status}`);
    }

    const data = await res.json();

    // Real API uses PascalCase: records.Locations[].Location[]
    const locations: any[] = data.records?.Locations?.[0]?.Location ?? [];

    if (!Array.isArray(locations) || locations.length === 0) {
      console.error('[forecast] empty locations. Full response keys:', Object.keys(data.records ?? {}));
      return NextResponse.json({ success: false, error: 'NO_LOCATION_DATA' });
    }

    const result = locations.map((loc: any) => {
      const elements: any[] = loc.WeatherElement ?? [];

      // Element names are Chinese in this dataset
      const wxEl   = elements.find((e) => e.ElementName === '天氣現象');
      const minTEl = elements.find((e) => e.ElementName === '最低溫度');
      const maxTEl = elements.find((e) => e.ElementName === '最高溫度');
      const popEl  = elements.find((e) => e.ElementName === '12小時降雨機率');

      // Build startTime-keyed lookup maps (no index alignment risk)
      const minTMap: Record<string, string> = {};
      (minTEl?.Time ?? []).forEach((t: any) => {
        minTMap[t.StartTime] = t.ElementValue?.[0]?.MinTemperature ?? '--';
      });

      const maxTMap: Record<string, string> = {};
      (maxTEl?.Time ?? []).forEach((t: any) => {
        maxTMap[t.StartTime] = t.ElementValue?.[0]?.MaxTemperature ?? '--';
      });

      const popMap: Record<string, string> = {};
      (popEl?.Time ?? []).forEach((t: any) => {
        // PoP value is stored under key "ProbabilityOfPrecipitation"
        popMap[t.StartTime] =
          t.ElementValue?.[0]?.ProbabilityOfPrecipitation ?? '0';
      });

      // Keep only 06:00 (day) and 18:00 (night) slots from Wx
      const wxTimes: any[] = (wxEl?.Time ?? []).filter(
        (t: any) =>
          t.StartTime?.includes('T06:00') || t.StartTime?.includes('T18:00')
      );

      // Pair consecutive slots: [day06, night18, day06, night18, ...]
      const daily: any[] = [];
      for (let i = 0; i + 1 < wxTimes.length; i += 2) {
        const daySlot   = wxTimes[i];
        const nightSlot = wxTimes[i + 1];

        // Safety: ensure first slot is 06 and second is 18
        if (
          !daySlot?.StartTime?.includes('T06:00') ||
          !nightSlot?.StartTime?.includes('T18:00')
        ) continue;

        daily.push({
          date: formatDate(daySlot.StartTime),
          day: {
            wx:   daySlot.ElementValue?.[0]?.Weather ?? '',
            code: daySlot.ElementValue?.[0]?.WeatherCode ?? '',
            minT: minTMap[daySlot.StartTime] ?? '--',
            maxT: maxTMap[daySlot.StartTime] ?? '--',
            pop:  popMap[daySlot.StartTime]  ?? '0',
          },
          night: {
            wx:   nightSlot.ElementValue?.[0]?.Weather ?? '',
            code: nightSlot.ElementValue?.[0]?.WeatherCode ?? '',
            minT: minTMap[nightSlot.StartTime] ?? '--',
            maxT: maxTMap[nightSlot.StartTime] ?? '--',
            pop:  popMap[nightSlot.StartTime]  ?? '0',
          },
        });
      }

      return {
        city: loc.LocationName,
        forecast: daily.slice(0, 7),
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      updatedTime: data.records?.Locations?.[0]?.DataTime ?? new Date().toISOString(),
    });

  } catch (err) {
    console.error('[forecast API] error:', err);
    return NextResponse.json({ error: 'SYSTEM_LINKAGE_FAILED', detail: String(err) }, { status: 500 });
  }
}