// app/api/forecast/route.ts
import { NextResponse } from 'next/server';

// F-D0047-091 = 臺灣各縣市鄉鎮未來1週逐12小時天氣預報
const CWA_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091';

function formatDate(isoStr: string): string {
  // e.g. "2026-04-01T06:00:00+08:00" -> "04/01"
  return `${isoStr.slice(5, 7)}/${isoStr.slice(8, 10)}`;
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

      // ── Group ALL Wx slots by date, classified as day or night ──────────────
      const dayMap:   Record<string, any> = {};
      const nightMap: Record<string, any> = {};

      for (const t of (wxEl?.Time ?? [])) {
        const time: string = t.StartTime ?? '';
        const dateKey = time.slice(0, 10);
        if (!dateKey) continue;

        if (time.includes('T06:00')) {
          dayMap[dateKey] = t;
        } else if (time.includes('T12:00')) {
          if (!dayMap[dateKey]) {
            dayMap[dateKey] = t;
          }
        } else if (time.includes('T18:00')) {
          nightMap[dateKey] = t;
        }
      }

      // Collect all dates that have at least a day OR night slot, sorted
      const allDates = Array.from(
        new Set([...Object.keys(dayMap), ...Object.keys(nightMap)])
      ).sort();

      const daily: any[] = [];
      for (const dateKey of allDates) {
        const daySlot   = dayMap[dateKey];
        const nightSlot = nightMap[dateKey];

        // Need at least one of the two slots to emit a row
        if (!daySlot && !nightSlot) continue;

        const makeSlot = (slot: any) => slot ? {
          wx:   slot.ElementValue?.[0]?.Weather ?? '',
          code: slot.ElementValue?.[0]?.WeatherCode ?? '',
          minT: minTMap[slot.StartTime] ?? '--',
          maxT: maxTMap[slot.StartTime] ?? '--',
          pop:  popMap[slot.StartTime]  ?? '0',
        } : { wx: '', code: '', minT: '--', maxT: '--', pop: '0' };

        daily.push({
          date: formatDate(dateKey), // Safer to just use dateKey + '-00T00' or simply format dateKey
          day:   makeSlot(daySlot),
          night: makeSlot(nightSlot),
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