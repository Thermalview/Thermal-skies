"use client";

import { useForecast } from "@/app/context/ForecastContext";

const MS_TO_FPM = 196.85;
const USA_MULTIPLIER = 2.6;

function calcThermalFpm(hour: any) {
  if (!hour) return 0;

  // --- CAPE-based thermal velocity (m/s)
  const cape = hour.cape ?? 0;
  const velocityFromCape =
    cape > 0 ? Math.sqrt(2 * cape) * 0.1 : 0;

  // --- Sensible heat flux method (blue days)
  const heatFlux = hour.sensible_heat_flux_wm2 ?? 0;
  const velocityFromHeatFlux =
    heatFlux > 0 ? Math.cbrt(heatFlux / 150) : 0;

  // Take stronger of the two
  let velocity_ms = Math.max(
    velocityFromCape,
    velocityFromHeatFlux
  );

  // --- Humidity penalty
  const rh = hour.relative_humidity ?? 0;
  const humidityPenalty = 1 - Math.pow(rh / 100, 2);
  velocity_ms *= Math.max(0.3, humidityPenalty);

  // --- Country multiplier (USA)
  velocity_ms *= USA_MULTIPLIER;

  // Convert to feet per minute
  return Math.round(velocity_ms * MS_TO_FPM);
}

function classifyThermal(fpm: number) {
  if (fpm < 100) return { label: "Dead", color: "#666" };
  if (fpm < 250) return { label: "Weak", color: "#caa400" };
  if (fpm < 400) return { label: "Flyable", color: "#4caf50" };
  if (fpm < 600) return { label: "Strong", color: "#2196f3" };
  return { label: "XC", color: "#9c27b0" };
}

export default function ThermalWidget() {
  const { hourly, selectedHourIndex, loading } = useForecast();

  if (loading || !hourly.length) {
    return (
      <div style={{ padding: 12 }}>
        Loading thermal data…
      </div>
    );
  }

  const hour = hourly[selectedHourIndex];
  const thermalFpm = calcThermalFpm(hour);
  const classification = classifyThermal(thermalFpm);

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 8,
        background: "#111",
        color: "#fff",
      }}
    >
      <h3 style={{ marginBottom: 12 }}>
        Thermal Strength
      </h3>

      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: classification.color,
        }}
      >
        {thermalFpm} fpm
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 16,
          color: classification.color,
        }}
      >
        {classification.label}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        Heat Flux: {hour.sensible_heat_flux_wm2 ?? "—"} W/m²  
        <br />
        CAPE: {hour.cape ?? "—"} J/kg  
        <br />
        RH: {hour.relative_humidity ?? "—"}%
      </div>
    </section>
  );
}
