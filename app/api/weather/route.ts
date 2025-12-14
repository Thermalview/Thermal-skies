import { NextResponse } from "next/server";

export const runtime = "edge";

function buildOpenMeteoUrl(lat: number, lon: number, hourlyVars: string[]) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: hourlyVars.join(","),
    timezone: "UTC",
    forecast_days: "7",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchOpenMeteoWithFallback(lat: number, lon: number) {
  // Base variables (these should work)
  const baseHourly = [
    "temperature_2m",
    "relative_humidity_2m",
    "cape",
    "cloud_cover",
    "pressure_msl",
    "boundary_layer_height",
    "windspeed_850hPa",
    "windspeed_925hPa",
    "windspeed_975hPa",
    "winddirection_850hPa",
    "winddirection_925hPa",
    "winddirection_975hPa",
  ];

  // Try these possible names for “sensible heat flux” (Open-Meteo model/endpoint dependent)
  const heatFluxCandidates = [
    "sensible_heat_flux",
    "surface_sensible_heat_flux",
    "sensible_heat_flux_0h",
  ];

  // 1) Try each heat flux candidate (one at a time)
  for (const hf of heatFluxCandidates) {
    const url = buildOpenMeteoUrl(lat, lon, [...baseHourly, hf]);
    const res = await fetch(url);

    if (res.ok) {
      const json = await res.json();
      return { json, heatFluxVar: hf };
    }

    // If it's NOT a 400, something else is wrong (rate limit, network, etc) → stop early
    if (res.status !== 400) {
      const text = await res.text().catch(() => "");
      throw new Error(`Open-Meteo error ${res.status}: ${text}`);
    }
  }

  // 2) Fallback: fetch without heat flux so we don’t break the API
  const fallbackUrl = buildOpenMeteoUrl(lat, lon, baseHourly);
  const fallbackRes = await fetch(fallbackUrl);

  if (!fallbackRes.ok) {
    const text = await fallbackRes.text().catch(() => "");
    throw new Error(`Open-Meteo error ${fallbackRes.status}: ${text}`);
  }

  const json = await fallbackRes.json();
  return { json, heatFluxVar: null as string | null };
}

function toNumberOrNull(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = toNumberOrNull(searchParams.get("lat"));
    const lon = toNumberOrNull(searchParams.get("lon"));

    if (lat === null || lon === null) {
      return NextResponse.json(
        { error: "Missing or invalid lat/lon" },
        { status: 400 }
      );
    }

    const { json, heatFluxVar } = await fetchOpenMeteoWithFallback(lat, lon);

    const h = json?.hourly;
    if (!h?.time) {
      return NextResponse.json(
        { error: "Open-Meteo response missing hourly.time" },
        { status: 502 }
      );
    }

    const times: string[] = h.time;

    // Pull arrays safely
    const temp = h.temperature_2m ?? [];
    const rh = h.relative_humidity_2m ?? [];
    const cape = h.cape ?? [];
    const cloud = h.cloud_cover ?? [];
    const pmsl = h.pressure_msl ?? [];
    const blh = h.boundary_layer_height ?? [];

    const ws850 = h.windspeed_850hPa ?? [];
    const ws925 = h.windspeed_925hPa ?? [];
    const ws975 = h.windspeed_975hPa ?? [];

    const wd850 = h.winddirection_850hPa ?? [];
    const wd925 = h.winddirection_925hPa ?? [];
    const wd975 = h.winddirection_975hPa ?? [];

    // Heat flux array (only present if the candidate worked)
    const heatFluxArr =
      heatFluxVar && h[heatFluxVar] ? (h[heatFluxVar] as any[]) : null;

    const hourly = times.map((t, i) => ({
      time: t,
      temperature_c: toNumberOrNull(temp[i]),
      relative_humidity: toNumberOrNull(rh[i]),
      cape: toNumberOrNull(cape[i]),
      cloud_cover_percent: toNumberOrNull(cloud[i]),
      pressure_msl_hpa: toNumberOrNull(pmsl[i]),
      boundary_layer_height_m: toNumberOrNull(blh[i]),

      // For now keep your winds like you already display them
      wind: {
        ft1000: {
          speed_kmh: toNumberOrNull(ws975[i]),
          direction_deg: toNumberOrNull(wd975[i]),
        },
        ft2500: {
          speed_kmh: toNumberOrNull(ws925[i]),
          direction_deg: toNumberOrNull(wd925[i]),
        },
        ft5000: {
          speed_kmh: toNumberOrNull(ws850[i]),
          direction_deg: toNumberOrNull(wd850[i]),
        },
      },

      // NEW: sensible heat flux (W/m²) if available, else null
      sensible_heat_flux_wm2: heatFluxArr ? toNumberOrNull(heatFluxArr[i]) : null,
      heat_flux_source_var: heatFluxVar, // helpful debug: which variable name worked (or null)
    }));

    return NextResponse.json({
      status: "ok",
      route: "weather",
      lat,
      lon,
      heat_flux_source_var: heatFluxVar,
      hourly,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch or normalize Open-Meteo data",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
