# 🇹🇼 台灣即時氣象視覺化平台 (Taiwan Weather Tracker)

一個以現代化「玻璃擬態 (Glassmorphism)」與高質感深色風格設計的台灣即時氣象儀表板。本專案透過直接串接中央氣象署 (CWA) 開放資料 API，並結合互動式地圖，提供直觀、即時且精美的天氣觀測體驗。

## 🌟 Demo 網站
線上即時展示（透過 Vercel 部署）：[https://week3-eosin-iota.vercel.app/](https://week3-eosin-iota.vercel.app/)

## ✨ 核心特色與亮點

- **純自製高質感 UI**：全新設計的互動體驗，採用純 Vanilla CSS 實作出漂浮於地圖上的玻璃擬態面板，確保畫面美觀且帶來沉浸式體驗。
- **即時全台測站整合**：直接串接 CWA 開放資料平臺（透過 `O-A0001-001` 等 API），即時抓取溫度、濕度、風速與降雨量，並顯示在動態儀表板上。
- **色彩切換與資料視覺化**：具備多維度的屬性圖層，能隨時在地圖上切換「氣溫」、「雨量」、「風速」或是「濕度」視角。各觀測站的標記顏色會依照數值的多寡動態變換（例如高溫顯示紅色、強風顯示橘色），一眼看懂全台天氣分布。
- **使用者自動定位**：內建快捷的一鍵定位功能，能將地圖立即平移至你目前的所在位置。
- **雷達天氣提醒**：自動彙整目前出現極端氣象（如強降雨、強風）的測站數量，並在面板中提供提示。

## 🛠 系統架構與技術棧 (Tech Stack)

摒棄了龐大且臃腫的 CSS 框架，回歸最原生、輕量的現代化 React CSR (Client-Side Rendering) 開發模式：

- **核心框架**：React + Vite (TypeScript)
- **地圖底層整合**：Leaflet / [React-Leaflet](https://react-leaflet.js.org/)
- **底圖 (Basemap)**：CartoDB Voyager Raster Tiles
- **UI 圖示庫**：Lucide React
- **樣式與動畫**：純原生 Vanilla CSS 架構

## 🚀 快速開始 (Quick Start)

### 1. 系統需求
請確保您的開發環境中已經安裝 [Node.js](https://nodejs.org/zh-tw/)。

### 2. 執行專案
```bash
# 1. 進入專案目錄，安裝所需要的依賴與套件
npm install

# 2. 啟動開發伺服器
npm run dev
```
啟動後，指令列會提示本機網址，請在瀏覽器打開 `http://localhost:5173` 即可看見專案運作。

※若要發布至生產環境，請執行 `npm run build`。

## 📡 資料與授權說明
- **氣象資料來源**：[交通部中央氣象署開放資料平臺 (CWA Open Data API)](https://opendata.cwa.gov.tw/)
- **地圖版權**：&copy; OpenStreetMap contributors, &copy; CARTO
