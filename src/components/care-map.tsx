"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
export default function CareMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !ref.current ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return;
    const map = new maplibregl.Map({
      container: ref.current,
      center: [lng, lat],
      zoom: 14,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    new maplibregl.Marker({ color: "#a85034" })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => map.remove();
  }, [lat, lng]);
  return (
    <div
      ref={ref}
      className="map-container"
      role="region"
      aria-label="本人が登録した通院先の地図"
      style={{ marginTop: 20 }}
    />
  );
}
