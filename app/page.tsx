"use client";
import ThermalWidget from "./components/ThermalWidget";

import { useForecast } from "./context/ForecastContext";

export default function HomePage() {
  const {
    hourly,
    selectedHourIndex,
    setSelectedHourIndex,
    lat,
    lon,
    loading,
  } = useForecast();

  if (loading) {
    return <div style={{ padding: 20 }}>Loading forecast…</div>;
  }

  if (!hourly.length) {
    return <div style={{ padding: 20 }}>No forecast data available</div>;
  }

  const selectedHour = hourly[selectedHourIndex];

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>Thermal Skies</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Location</h2>
        <p>
          Lat: {lat}, Lon: {lon}
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Time Control</h2>

        <input
          type="range"
          min={0}
          max={hourly.length - 1}
          value={selectedHourIndex}
          onChange={(e) =>
            setSelectedHourIndex(Number(e.target.value))
          }
          style={{ width: "100%" }}
        />

        <p>
          Hour index: {selectedHourIndex} / {hourly.length - 1}
        </p>
        <p>
          Time: <strong>{selectedHour.time}</strong>
        </p>
      </section>

      <section>
        <h2>Selected Hour Snapshot</h2>
        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 16,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(selectedHour, null, 2)}
        </pre>
      </section>
      <ThermalWidget />
    </main>
  );
}
