export interface StationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  temp: number | null;
  humidity: number | null;
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
      
      return {
        id: st.StationId,
        name: st.StationName,
        lat,
        lon,
        temp: st.WeatherElement?.AirTemperature === -99 ? null : st.WeatherElement?.AirTemperature,
        humidity: st.WeatherElement?.RelativeHumidity === -99 ? null : st.WeatherElement?.RelativeHumidity,
        weather: st.WeatherElement?.Weather === '-99' ? null : st.WeatherElement?.Weather,
        time: st.ObsTime?.DateTime,
      };
    }).filter((s: StationData) => s.lat !== 0 && s.lon !== 0);
  } catch (error) {
    console.error('Failed to fetch from CWA:', error);
    return [];
  }
};
