"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type HourlyData = {
  time: string;
  sensible_heat_flux_wm2: number | null;
heat_flux_source_var?: string | null;
  temperature_c: number | null;
  relative_humidity: number | null;
  cape: number | null;
  cloud_cover_percent: number | null;
  pressure_msl_hpa: number | null;
  boundary_layer_height_m: number | null;
  wind_1000ft_kph: number | null;
  wind_2500ft_kph: number | null;
  wind_5000ft_kph: number | null;
};

type ForecastContextType = {
  hourly: HourlyData[];
  selectedHourIndex: number;
  setSelectedHourIndex: (i: number) => void;
  lat: number;
  lon: number;
  setLocation: (lat: number, lon: number) => void;
  loading: boolean;
};

const ForecastContext = createContext<ForecastContextType | null>(
  null
);

export function ForecastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [selectedHourIndex, setSelectedHourIndex] =
    useState(0);
  const [lat, setLat] = useState(35.4676); // OKC default
  const [lon, setLon] = useState(-97.5164);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        setHourly(data.hourly ?? []);
        setSelectedHourIndex(0);
      } catch (err) {
        console.error("Forecast fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, [lat, lon]);

  function setLocation(newLat: number, newLon: number) {
    setLat(newLat);
    setLon(newLon);
  }

  return (
    <ForecastContext.Provider
      value={{
        hourly,
        selectedHourIndex,
        setSelectedHourIndex,
        lat,
        lon,
        setLocation,
        loading,
      }}
    >
      {children}
    </ForecastContext.Provider>
  );
}

export function useForecast() {
  const ctx = useContext(ForecastContext);
  if (!ctx) {
    throw new Error(
      "useForecast must be used inside ForecastProvider"
    );
  }
  return ctx;
}
