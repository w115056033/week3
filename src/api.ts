export interface StationData {
  id: string;
  name: string;
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

const API_KEY = 'CWA-C3FC4AEB-C28E-4553-8076-EA76341330CD';
const API_URL = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${API_KEY}&format=JSON`;

export const fetchWeather = async (): Promise<StationData[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('API fetch failed');
    const data = await response.json();
    const stations = data.records?.Station || [];
    
    return stations.map((st: any) => {
      // Find WGS84 coordinates
      const wgs84 = st.GeoInfo?.Coordinates?.find(
        (c: any) => c.CoordinateName === 'WGS84'
      );
      
      const lat = wgs84?.StationLatitude ?? 0;
      const lon = wgs84?.StationLongitude ?? 0;
      
      const weatherElement = st.WeatherElement || {};
      const precipitation = weatherElement.Now?.Precipitation ?? weatherElement.Rainfall?.Precipitation ?? weatherElement.Precipitation;

      return {
        id: st.StationId,
        name: st.StationName,
        lat,
        lon,
        temp: weatherElement.AirTemperature === -99 ? null : weatherElement.AirTemperature,
        humidity: weatherElement.RelativeHumidity === -99 ? null : weatherElement.RelativeHumidity,
        rainfall: precipitation === -99 ? null : precipitation ?? null,
        windSpeed: weatherElement.WindSpeed === -99 ? null : weatherElement.WindSpeed ?? null,
        windDirection: weatherElement.WindDirection === -99 ? null : weatherElement.WindDirection ?? null,
        weather: weatherElement.Weather === '-99' ? null : weatherElement.Weather,
        time: st.ObsTime?.DateTime,
      };
    }).filter((s: StationData) => s.lat !== 0 && s.lon !== 0);
  } catch (error) {
    console.error('Failed to fetch from CWA:', error);
    return [];
  }
};
