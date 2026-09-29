# 🇹🇼 台灣即時氣象視覺化平台 (Taiwan Weather Tracker)

一個以現代化「玻璃擬態 (Glassmorphism)」與高質感深色風格設計的台灣即時氣象儀表板。本專案透過直接串接中央氣象署 (CWA) 開放資料 API，並結合互動式地圖，提供直觀、即時且精美的天氣觀測體驗。

## 🌟 Demo 網站
線上即時展示（透過 Vercel 部署）：[https://week3-eosin-iota.vercel.app/](https://week3-eosin-iota.vercel.app/)

<img width="1919" height="939" alt="image" src="https://github.com/user-attachments/assets/21691360-8233-440b-9544-bd26e43505eb" />


## ✨ 核心特色與亮點

- **純自製高質感 UI**：全新設計的互動體驗，採用純 Vanilla CSS 實作出漂浮於地圖上的玻璃擬態面板，確保畫面美觀且帶來沉浸式體驗。
- **即時全台測站整合**：直接串接 CWA 開放資料平臺（透過 `O-A0001-001` 等 API），即時抓取溫度、濕度、風速與降雨量，並顯示在動態儀表板上。
- **色彩切換與資料視覺化**：具備多維度的屬性圖層，能隨時在地圖上切換「氣溫」、「雨量」、「風速」或是「濕度」視角。各觀測站的標記顏色會依照數值的多寡動態變換（例如高溫顯示紅色、強風顯示橘色），一眼看懂全台天氣分布。
- **使用者自動定位**：內建快捷的一鍵定位功能，能將地圖立即平移至你目前的所在位置。
- **雷達天氣提醒**：自動彙整目前出現極端氣象（如強降雨、強風）的測站數量，並在面板中提供提示。

## 🗄️ 一週氣溫預報：資料庫、折線圖與互動地圖（對照 workflow.md）

依 `workflow.md` 補齊原本尚未實作的步驟（步驟 1、2、11、22、23、24 原本即排除）：

| Workflow 步驟 | 實作內容 |
| --- | --- |
| 6. 提取最高與最低氣溫 | 串接 CWA `F-D0047-091`（臺灣未來 1 週逐 12 小時預報），解析 JSON 中的 `MinTemperature` / `MaxTemperature`，依「地區 + 日期」彙整 |
| 7. 資料整理與預覽 | 以 JavaScript 陣列（對應 Pandas DataFrame 的角色）整理成固定欄位：`region / date / minT / maxT` |
| 8、9. 建立 SQLite 資料庫與資料表 | 以 `sql.js`（SQLite 編譯成 WebAssembly）在瀏覽器建立 `data.db` 與 `TemperatureForecasts` 資料表，主鍵為 `(region, date)` |
| 10、12. 查詢驗證與從資料庫讀取 | 寫入後以 SQL `COUNT / DISTINCT` 驗證；讀取時以 `SELECT` 查詢地區、日期與氣溫 |
| 13. 下拉選單選擇地區 | 右側「一週氣溫預報」面板的縣市下拉選單（`SELECT DISTINCT region`） |
| 14. 繪製折線圖 | 以 SVG 繪製每日 `MaxT`（橘線）與 `MinT`（藍線）折線圖 |
| 15. 顯示資料表格 | 日期 / 星期 / 最低氣溫 / 最高氣溫表格（點選列可切換地圖日期） |
| 16. 整合 Web App 介面 | 地區選擇 → 查詢 SQLite → 氣溫折線圖 + 每日氣溫表 |
| 17. 台灣地圖視覺化 | 切換「氣溫預報」圖層，以 `<20 / 20-25 / 25-30 / >30°C` 四級分色標示各地區 |
| 18. 互動式天氣地圖 | 日期膠囊按鈕選擇日期 → 查詢 SQLite → 更新地圖標記與 Min / Max 彈窗 |
| 19. 程式碼品質 | upsert 避免重複插入、過期日期自動清除、錯誤處理回退至資料庫快取、完整註解 |
| 20. API Key 保護 | 金鑰改由環境變數 `VITE_CWA_API_KEY` 讀取（未設定時沿用預設金鑰） |

> **資料庫位置**：因 Vercel 為靜態託管，SQLite 資料庫在瀏覽器端建立，並以 base64 存於 `localStorage`（鍵名 `data.db`）；每 30 分鐘自動重新抓取預報並更新，觀測資料維持每 10 分鐘更新。



摒棄了龐大且臃腫的 CSS 框架，回歸最原生、輕量的現代化 React CSR (Client-Side Rendering) 開發模式：

- **核心框架**：React + Vite (TypeScript)
- **地圖底層整合**：Leaflet / [React-Leaflet](https://react-leaflet.js.org/)
- **底圖 (Basemap)**：CartoDB Voyager Raster Tiles
- **資料庫**：SQLite（[sql.js](https://sql.js.org/) WebAssembly）＋ localStorage 持久化
- **氣象資料**：CWA OpenData（觀測 `O-A0001-001`、一週預報 `F-D0047-091`）
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

### 3. （可選）指定自己的 CWA API Key
預設會沿用程式內建的金鑰；建議改用環境變數，避免金鑰寫死在程式碼中：
```bash
# 建立 .env.local（已列入 .gitignore，不會被提交）
VITE_CWA_API_KEY=你的_CWA_API_KEY
```
於 Vercel 部署時，亦可於專案 Settings → Environment Variables 加入 `VITE_CWA_API_KEY`。

## 📡 資料與授權說明
- **氣象資料來源**：[交通部中央氣象署開放資料平臺 (CWA Open Data API)](https://opendata.cwa.gov.tw/)
- **地圖版權**：&copy; OpenStreetMap contributors, &copy; CARTO
