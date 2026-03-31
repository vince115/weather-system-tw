export interface WeatherData {
  stationName: string;
  obsTime: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  rainPossibility: string;
  comfortLevel: string;
  aqi: number;
  aqiStatus: string;
  uvi: number;
  isMock: boolean;
}
