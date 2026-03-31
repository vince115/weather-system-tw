import { NextResponse } from 'next/server';

const CWA_QUAKE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001';
const BACKUP_API_KEY = 'CWA-4C7F7F6C-CAC7-4E23-842A-B920016384BD';

export async function GET() {
  const apiKey = process.env.CWA_API_KEY || BACKUP_API_KEY;

  try {
    const res = await fetch(`${CWA_QUAKE_URL}?Authorization=${apiKey}&format=JSON&limit=10`, {
      cache: 'no-store'
    });
    
    if (!res.ok) throw new Error(`CWA_FETCH_ERROR: ${res.status}`);

    const data = await res.json();
    const earthquakeList = data.records?.Earthquake || data.records?.earthquake || [];

    if (earthquakeList.length === 0) {
       return NextResponse.json({ error: 'NO_SIGNALS_DETECTED' }, { status: 404 });
    }

    const formattedRecords = earthquakeList.map((item: any) => {
      const info = item.EarthquakeInfo;
      const epi = info?.Epicenter;
      const reportImage = item.ReportImageURI || null;
      
      // 精確掃描全臺所有地區，尋找真正的「最大震度」
      let maxIntensityRaw = '0';
      const shakingArea = item.Intensity?.ShakingArea || [];
      if (shakingArea.length > 0) {
        // 部分 API 格式不同，遍歷獲取數值最高的震度字串 (如 5弱)
        const areaIntensities = shakingArea.map((area: any) => area.AreaIntensity);
        // 這邊需要自定義排序順序以獲得真正的最大值
        const intensityOrder = ['0', '1', '2', '3', '4', '5弱', '5強', '6弱', '6強', '7'];
        maxIntensityRaw = areaIntensities.reduce((max: string, current: string) => {
          return intensityOrder.indexOf(current) > intensityOrder.indexOf(max) ? current : max;
        }, '0');
      } else {
        maxIntensityRaw = item.Intensity?.Area?.[0]?.AreaIntensity || '0';
      }

      // 計算警戒燈號等級 (1-4)
      const mag = parseFloat(info?.EarthquakeMagnitude?.MagnitudeValue || '0');
      const intNum = parseInt(maxIntensityRaw) || 0;
      let alertLevel = 1; // 綠燈 (預設)

      if (mag >= 6.5 && (maxIntensityRaw.includes('6') || maxIntensityRaw === '7')) {
        alertLevel = 4; // 紅燈
      } else if (mag >= 6.0 && (maxIntensityRaw.includes('5') || maxIntensityRaw.includes('6'))) {
        alertLevel = 3; // 橘燈
      } else if (mag >= 5.5 && intNum >= 4) {
        alertLevel = 2; // 黃燈
      }

      return {
        id: item.EarthquakeNo || 'Unknown',
        time: info?.OriginTime || '未知時間',
        magnitude: mag.toFixed(1),
        depth: info?.EarthquakeDepth?.Value || '0.0',
        location: epi?.Location || '未知地點',
        lat: parseFloat(epi?.EpicenterLatitude || '0'),
        lng: parseFloat(epi?.EpicenterLongitude || '0'),
        maxIntensity: maxIntensityRaw === '0' ? '無感' : `${maxIntensityRaw}級`,
        alertLevel: alertLevel,
        reportImage: reportImage,
        isSignificant: mag > 6.0
      };
    });

    return NextResponse.json({
      latest: formattedRecords[0],
      history: formattedRecords,
      raw_source: 'CWA_CENTRAL_TELEMETRY'
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'LIVE_DATA_LINK_INTERRUPTED' }, { status: 500 });
  }
}
