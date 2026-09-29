/**
 * 天氣預報資料取得與解析（workflow 步驟 4、5、6、7）
 *
 * 資料來源：CWA F-D0047-091「臺灣各縣市鄉鎮未來 1 週逐 12 小時天氣預報」
 * 流程：API URL → HTTP Request → JSON Response → 解析 MinT / MaxT / 地區 / 日期
 *       → 整理成固定欄位（region, date, minT, maxT，相當於 Pandas DataFrame）
 *       → 寫入 SQLite（src/db.ts）
 */
import { cwaEndpoint } from './config';
import type { TemperatureForecastRow } from './db';

/** 預報資料集編號：臺灣各縣市鄉鎮未來 1 週逐 12 小時天氣預報 */
const FORECAST_DATASET = 'F-D0047-091';

/** 各地區緯經度快取的 localStorage 鍵名 */
const COORD_STORAGE_KEY = 'forecast-coords';

/** 地區（縣市）中心點座標，用於地圖標記 */
export interface RegionCoord {
    region: string;
    lat: number;
    lon: number;
}

/** 預報資料包：氣溫列資料 + 地區座標 */
export interface ForecastBundle {
    rows: TemperatureForecastRow[];
    coords: RegionCoord[];
}

/** 地圖上的預報標記（列資料 + 座標） */
export interface ForecastMarker extends TemperatureForecastRow {
    lat: number;
    lon: number;
}

/** CWA JSON 中任意巢狀結構（維持與既有 api.ts 相同的寬鬆處理方式） */
type JsonRecord = Record<string, any>;

/** 將字串數值轉成數字；非純數字（如 "-99"、">= 11"）回傳 null */
const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
};

/** 檢查某個天氣元素是否含有指定的數值欄位（如 MinTemperature） */
const hasValueKey = (element: JsonRecord | undefined, key: string): boolean =>
    (element?.Time ?? []).some((time: JsonRecord) =>
        (time?.ElementValue ?? []).some((value: JsonRecord) => value && Object.prototype.hasOwnProperty.call(value, key))
    );

/**
 * 步驟 6：將單一元素的逐 12 小時時段，依日期彙整成每日最低 / 最高溫。
 * 時段以 StartTime 所屬日期歸類（例：09-29 18:00 起的夜間時段計入 09-29）。
 */
const collectDaily = (
    element: JsonRecord | undefined,
    valueKey: 'MinTemperature' | 'MaxTemperature',
    target: Map<string, { minT: number | null; maxT: number | null }>
): void => {
    for (const time of element?.Time ?? []) {
        const date = String(time?.StartTime ?? '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        for (const value of time?.ElementValue ?? []) {
            const number = toNumber(value?.[valueKey]);
            if (number === null) continue;
            const aggregate = target.get(date) ?? { minT: null, maxT: null };
            if (valueKey === 'MinTemperature') {
                aggregate.minT = aggregate.minT === null ? number : Math.min(aggregate.minT, number);
            } else {
                aggregate.maxT = aggregate.maxT === null ? number : Math.max(aggregate.maxT, number);
            }
            target.set(date, aggregate);
        }
    }
};

/**
 * 從 CWA API 取得一週氣溫預報，整理成固定欄位。
 * @throws 網路失敗、API 回應失敗或解析不到 MinT / MaxT 時丟出錯誤
 */
export const fetchForecast = async (): Promise<ForecastBundle> => {
    const response = await fetch(cwaEndpoint(FORECAST_DATASET));
    if (!response.ok) throw new Error(`CWA 預報請求失敗（HTTP ${response.status}）`);

    const data = await response.json();
    if (String(data?.success) !== 'true') {
        throw new Error(`CWA 預報回應失敗：${data?.RetMsg ?? data?.retMsg ?? '未知錯誤'}`);
    }

    const locations: JsonRecord[] = (data?.records?.Locations ?? []).flatMap((group: JsonRecord) => group?.Location ?? []);
    if (locations.length === 0) throw new Error('CWA 預報未回傳任何地區資料');

    const coords: RegionCoord[] = [];
    const daily = new Map<string, TemperatureForecastRow>();

    for (const location of locations) {
        const region = String(location?.LocationName ?? '');
        if (region === '') continue;

        const lat = toNumber(location?.Latitude);
        const lon = toNumber(location?.Longitude);
        if (lat !== null && lon !== null) coords.push({ region, lat, lon });

        const elements: JsonRecord[] = location?.WeatherElement ?? [];
        const minElement = elements.find((element) => hasValueKey(element, 'MinTemperature'));
        const maxElement = elements.find((element) => hasValueKey(element, 'MaxTemperature'));
        if (!minElement || !maxElement) continue;

        // 步驟 6：擷取 MinT / MaxT，並依日期彙整
        const perDate = new Map<string, { minT: number | null; maxT: number | null }>();
        collectDaily(minElement, 'MinTemperature', perDate);
        collectDaily(maxElement, 'MaxTemperature', perDate);

        for (const [date, aggregate] of perDate) {
            if (aggregate.minT === null || aggregate.maxT === null) continue;
            const key = `${region}|${date}`;
            const existing = daily.get(key);
            if (existing) {
                // 同地區同日期若出現多次（例如行政區層級資料），取極值合併
                existing.minT = Math.min(existing.minT, aggregate.minT);
                existing.maxT = Math.max(existing.maxT, aggregate.maxT);
            } else {
                daily.set(key, { region, date, minT: aggregate.minT, maxT: aggregate.maxT });
            }
        }
    }

    // 步驟 7：整理成固定欄位的結構化資料（列物件陣列）
    const rows = Array.from(daily.values()).sort(
        (a, b) => a.region.localeCompare(b.region, 'zh-Hant') || a.date.localeCompare(b.date)
    );
    if (rows.length === 0) throw new Error('預報資料解析失敗：沒有可用的 MinT / MaxT');

    return { rows, coords };
};

/** 步驟 17：地圖溫度分級（對應 workflow 的四個分類） */
export const TEMPERATURE_CLASSES = [
    { label: '< 20°C', color: '#60a5fa' },
    { label: '20 - 25°C', color: '#34d399' },
    { label: '25 - 30°C', color: '#facc15' },
    { label: '> 30°C', color: '#ef4444' },
] as const;

/** 依最高氣溫回傳所屬分級（<20、20-25、25-30、>30） */
export const classifyTemperature = (temperature: number) => {
    if (temperature < 20) return TEMPERATURE_CLASSES[0];
    if (temperature < 25) return TEMPERATURE_CLASSES[1];
    if (temperature <= 30) return TEMPERATURE_CLASSES[2];
    return TEMPERATURE_CLASSES[3];
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 將 YYYY-MM-DD 轉成 M/D 短標籤 */
export const shortDateLabel = (date: string): string => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 取得日期的星期幾（以 UTC 計算，不受使用者時區影響） */
export const weekdayOf = (date: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return '';
    return WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
};

/** 讀取地區座標快取（API 失敗時地圖仍可顯示標記） */
export const loadCachedCoords = (): RegionCoord[] => {
    try {
        const raw = localStorage.getItem(COORD_STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item): item is RegionCoord =>
                !!item &&
                typeof (item as RegionCoord).region === 'string' &&
                Number.isFinite((item as RegionCoord).lat) &&
                Number.isFinite((item as RegionCoord).lon)
        );
    } catch {
        return [];
    }
};

/** 保存地區座標快取 */
export const saveCachedCoords = (coords: RegionCoord[]): void => {
    try {
        localStorage.setItem(COORD_STORAGE_KEY, JSON.stringify(coords));
    } catch (error) {
        console.warn('[Forecast] 座標快取保存失敗：', error);
    }
};

