# 天氣預報網站 Workflow

本文件整理 Taiwan Weather Forecast
天氣預報網站的開發流程。原流程排除步驟 1、2、11、22、23、24，並以 Vercel
取代原本 Streamlit 的網站建立方式。

## 3. 中央氣象署 CWA

**目的：** 取得天氣預報資料來源。

-   註冊中央氣象署 Open Data 帳號
-   取得 API Key
-   選擇適合的天氣預報資料集
-   確認 API 請求方式與資料格式

**產出：** CWA API Key、天氣預報 API、JSON 氣象資料。

## 4. API 資料取得

**目的：** 使用 Python Requests 取得 CWA JSON。

**流程：** API URL → HTTP Request → JSON Response。

## 5. JSON 資料結構解析

**目的：** 從 JSON 找到真正需要的氣象資料。

## 6. 提取最高與最低氣溫

**目的：** 將 JSON 中的最高、最低氣溫轉成結構化資料。

流程： 1. 解析 JSON 2. 找到各地區資料 3. 擷取 MinT 4. 擷取 MaxT 5.
擷取日期 6. 整理成固定欄位

## 7. 資料整理與預覽

**目的：** 使用 Pandas 將資料轉成 DataFrame。

## 8. 建立 SQLite 資料庫

**目的：** 保存從 CWA API 取得並整理好的天氣資料。

流程：建立資料庫 → 建立資料表 → 插入氣溫資料 → 避免重複插入。

## 9. 資料庫設計

**資料表：** `TemperatureForecasts`

## 10. 查詢資料驗證

**目的：** 使用 SQL 確認資料正確寫入 SQLite。

驗證地區、日期、最低溫、最高溫及重複資料。

## 12. 從資料庫讀取資料

**目的：** 讓網站從 SQLite 取得天氣預報資料。

資料流程：SQLite → SQL Query → Pandas DataFrame → 網站。

## 13. 下拉選單選擇地區

**目的：** 讓使用者選擇要查看的台灣地區。

互動流程：

``` text
使用者選擇地區
↓
取得 regionName
↓
查詢 SQLite
↓
取得該地區資料
↓
顯示預報
```

## 14. 繪製折線圖

**目的：** 呈現一段期間的最高、最低氣溫變化。

-   X 軸：日期
-   Y 軸：溫度
-   `MaxT`：最高氣溫
-   `MinT`：最低氣溫

## 15. 顯示資料表格

**目的：** 以表格提供精確的每日氣溫。

## 16. 整合 Web App 介面

**目的：** 將資料庫、地區選擇、折線圖與資料表整合成 Taiwan Weather
Forecast。

``` text
地區選擇
↓
查詢天氣資料
↓
氣溫折線圖 + 天氣資料表
```

產出：具備基本互動功能的天氣預報 Web App。

## 17. 進階：台灣地圖視覺化

**目的：** 將各地區氣溫資料放到台灣地圖上。

**技術：** (CARTO | RiChi) 

溫度分類：

``` text
< 20°C
20 - 25°C
25 - 30°C
> 30°C
```

## 18. 互動式天氣地圖(可選擇日期顯示地圖)

**目的：** 選擇特定日期，查看當日各地區天氣。

``` text
選擇日期
↓
查詢 SQLite
↓
取得指定日期資料
↓
更新台灣地圖
↓
顯示各地區氣溫
```

例如：

``` text
中部地區
Min: 20°C
Max: 30°C
```

## 19. 程式碼品質與優化

**目的：** 提高可維護性與後續擴充能力。

-   程式結構清晰
-   錯誤處理機制
-   重複執行不重複插入
-   良好的註解

建議資料流：

``` text
資料取得
↓
資料解析
↓
資料清理
↓
資料庫
↓
資料查詢
↓
Web UI
```

## 20. 專案上傳至 GitHub

**目的：** 使用 GitHub 管理程式碼，並作為 Vercel 的部署來源。

``` text
本機專案
↓
Git Repository
↓
Commit
↓
Push
↓
GitHub Repository
```

主要工作： 1. 建立 GitHub Repository 2. 初始化 Git Repository 3. 設定
GitHub remote 4. Commit 程式碼 5. Push 到 GitHub

**注意：** API Key 等敏感資訊不要直接寫入
GitHub，應使用環境變數或安全的設定方式。

## 22. Vercel 使用

**目的：** 網站建立部署。

**內容：** 連結 GitHub 帳號，自動建立網站。

部署流程：

``` text
GitHub Repository
↓
連結 Vercel
↓
選擇 Repository
↓
設定 Build / Deploy
↓
Deploy
↓
自動建立網站
↓
取得網站網址
```

GitHub 與 Vercel 自動部署：

``` text
修改程式碼
↓
Git Commit
↓
Git Push
↓
GitHub
↓
Vercel 自動偵測
↓
重新 Build
↓
自動部署
↓
更新線上天氣預報網站
```

**最終產出：** 透過 Vercel 部署、可從網路存取的 Taiwan Weather Forecast
網站。

------------------------------------------------------------------------

# 完整 Workflow

``` text
CWA Open Data
↓
API
↓
JSON
↓
Python Requests
↓
JSON Parsing
↓
MinT / MaxT / 地區 / 日期
↓
Pandas
↓
結構化天氣資料
↓
SQLite（data.db）
↓
SQL Query
↓
Web App
├── 地區選擇
├── 日期選擇
├── 氣溫折線圖
├── 資料表
└── (CARTO | RiChi) 台灣地圖
↓
Taiwan Weather Dashboard
↓
程式碼品質優化
↓
GitHub
↓
Vercel
↓
線上 Taiwan Weather Forecast 網站
```

# 技術堆疊

  層級         技術            用途
  ------------ --------------- --------------------
  資料來源     CWA Open Data   取得台灣氣象資料
  API          REST API        取得 JSON
  程式語言     Python          資料取得與處理
  資料格式     JSON            API 原始資料
  資料分析     Pandas          資料整理與轉換
  資料庫       SQLite          儲存天氣預報
  查詢         SQL             查詢與驗證資料
  地圖         (CARTO | RiChi)          台灣天氣地圖
  Web          Web App         呈現互動式天氣資訊
  版本控制     Git             管理程式碼
  程式碼平台   GitHub          儲存專案
  部署         Vercel          建立與部署網站
