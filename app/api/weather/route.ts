import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      {
        status: "error",
        message: "Missing lat or lon query parameters",
      },
      { status: 400 }
    );
  }

  const openMeteoUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&hourly=` +
    [
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
    ].join(",") +
    `&timezone=auto`;

  try {
    const res = await fetch(openMeteoUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo error: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      status: "ok",
      source: "open-meteo",
      latitude: lat,
      longitude: lon,
      fetchedAt: new Date().toISOString(),
      raw: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch Open-Meteo data",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
