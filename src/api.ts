import { cwaEndpoint } from './config';

export interface StationData {
  id: string;
  name: string;
  /** 所屬縣市（CWA GeoInfo.CountyName，例如「臺北市」） */
  county: string | null;
  lat: number;
  lon: number;
  temp: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  weather: string | null;
  time: string;
}

/** 座標點（用於距離計算） */
export interface GeoPoint {
  lat: number;
  lon: number;
}

const API_URL = cwaEndpoint('O-A0001-001');

/**
 * 將 CWA 回傳的值轉成數字。
 * O-A0001-001 的數值皆為字串（例如 "29.9"、"0.0"），
 * 無資料以 "-99" 表示；非純數字或數值 ≤ -99 一律回傳 null。
 */
const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number <= -99) return null;
  return number;
};

export const fetchWeather = async (): Promise<StationData[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API fetch failed (HTTP ${response.status})`);
    const data = await response.json();
    const stations = data.records?.Station || [];

    return stations
      .map((st: any) => {
        // Find WGS84 coordinates
        const wgs84 = st.GeoInfo?.Coordinates?.find(
          (c: any) => c.CoordinateName === 'WGS84'
        );

        const lat = toNumber(wgs84?.StationLatitude) ?? 0;
        const lon = toNumber(wgs84?.StationLongitude) ?? 0;

        const weatherElement = st.WeatherElement || {};
        const precipitation = weatherElement.Now?.Precipitation ?? weatherElement.Rainfall?.Precipitation ?? weatherElement.Precipitation;
        const weather = String(weatherElement.Weather ?? '').trim();

        return {
          id: st.StationId,
          name: st.StationName,
          county: typeof st.GeoInfo?.CountyName === 'string' && st.GeoInfo.CountyName !== '' ? st.GeoInfo.CountyName : null,
          lat,
          lon,
          temp: toNumber(weatherElement.AirTemperature),
          humidity: toNumber(weatherElement.RelativeHumidity),
          rainfall: toNumber(precipitation),
          windSpeed: toNumber(weatherElement.WindSpeed),
          windDirection: toNumber(weatherElement.WindDirection),
          weather: weather !== '' && weather !== '-99' ? weather : null,
          time: st.ObsTime?.DateTime ?? '',
        } satisfies StationData;
      })
      .filter((s: StationData) => s.lat !== 0 && s.lon !== 0);
  } catch (error) {
    console.error('Failed to fetch from CWA:', error);
    return [];
  }
};

/** 兩點間距離（km，haversine 公式） */
const distanceKm = (a: GeoPoint, b: GeoPoint): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * 取得中心點（縣市）周邊的觀測站，供「即時概況」依選取縣市統計：
 * 1. 先取距離 ≤ 40km 的觀測站
 * 2. 不足 4 站時（離島或幅員狹長的縣市）改取最近的 6 站
 * 3. center 為 null 時回傳全部站（全台統計）
 */
export const stationsNear = (
  stations: StationData[],
  center: GeoPoint | null,
  radiusKm = 40,
  minCount = 4,
  fallbackCount = 6
): StationData[] => {
  if (!center) return stations;
  const sorted = [...stations].sort((a, b) => distanceKm(a, center) - distanceKm(b, center));
  const within = sorted.filter((station) => distanceKm(station, center) <= radiusKm);
  if (within.length >= minCount) return within;
  return sorted.slice(0, fallbackCount);
};

/**
 * 取得指定縣市的觀測站，供「即時概況」依「一週氣溫預報」選取的縣市統計：
 * 1. 優先以 GeoInfo.CountyName 精確比對縣市名稱
 * 2. 找不到時（名稱不一致或測站未標註）退回以縣市中心點做距離篩選
 * 3. region 為 null 時回傳全部站（全台統計）
 */
export const stationsForRegion = (
  stations: StationData[],
  region: string | null,
  center: GeoPoint | null
): StationData[] => {
  if (!region) return stations;
  const exact = stations.filter((station) => station.county === region);
  if (exact.length > 0) return exact;
  return stationsNear(stations, center);
};

