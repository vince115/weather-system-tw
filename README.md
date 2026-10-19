# 🌦️ Weather System TW

A real-time weather and disaster monitoring dashboard for Taiwan, built with Next.js, TypeScript, and TailwindCSS.

---

## 📖 專案說明

臺灣即時氣象與防災監控儀表板，串接中央氣象署（CWA）開放資料，把全臺各縣市的天氣、預報和地震資訊整合在同一個畫面。

**三大模組**

- **即時氣象監測**：選擇縣市後顯示氣溫、相對濕度、風速、降雨機率和舒適度，並在 OpenStreetMap 地圖上標示位置。空氣品質、紫外線和能見度目前是示範值，尚未串接真實資料。
- **一週天氣預報**：各縣市未來 7 天的白天／夜間天氣、最高最低溫和降雨機率，手機版有獨立版面。
- **地震活動監控**：最新與近期的顯著有感地震，包含規模、深度、最大震度、震央位置與時間。

**其他特色**

- 支援深色／淺色模式
- 資料每 5～10 分鐘自動更新（TanStack Query）
- API Key 只在 Next.js API Route（伺服器端）使用，前端看不到
- 沒有設定 API Key 時，即時氣象會改用模擬資料

**使用的 CWA 資料集**

| 資料集 | 內容 |
|---|---|
| O-A0003-001 | 氣象站即時觀測 |
| F-C0032-001 | 縣市 36 小時天氣預報 |
| F-D0047-091 | 鄉鎮一週逐 12 小時預報 |
| E-A0015-001 | 顯著有感地震報告 |

**本機執行**

先到[氣象資料開放平臺](https://opendata.cwa.gov.tw/)申請授權碼，在專案根目錄建立 `.env.local`：

```bash
CWA_API_KEY=你的授權碼
```

接著執行：

```bash
pnpm install
pnpm dev
```

---

## 🚀 Features

- 🌍 Taiwan real-time weather data integration (CWA Open Data)
- 🗺️ Map-based visualization (terrain, weather layers)
- ⚠️ Disaster monitoring (rainfall, alerts, geological risks)
- 🌙 Dark mode dashboard (optimized for data readability)
- 📊 Data-driven UI for quick decision making

---

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router), TypeScript
- **Styling:** TailwindCSS
- **Map:** Mapbox / Leaflet (depending on implementation)
- **API:** CWA Open Data API
- **State Management:** (optional: Zustand / Redux)

---

## 📦 Project Structure

```bash
app/
components/
lib/
hooks/
types/
api/