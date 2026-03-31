'use client';

import { useQuery } from '@tanstack/react-query';
import { WeatherData } from '../types/weather';

async function fetchWeather(city: string): Promise<WeatherData> {
  const url = `/api/weather?city=${city}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Data acquisition failed: [${response.status}]`);
  }
  return response.json() as Promise<WeatherData>;
}

export function useWeather(city: string) {
  return useQuery({
    queryKey: ['weather', city],
    queryFn: () => fetchWeather(city),
    staleTime: 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: !!city,
  });
}
