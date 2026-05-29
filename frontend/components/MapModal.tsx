"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, ExternalLink, Loader2 } from "lucide-react";

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  label: string;
  address?: string;
}

export default function MapModal({
  open,
  onClose,
  latitude,
  longitude,
  label,
  address,
}: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Build and destroy map
  useEffect(() => {
    if (!open) return;

    // Always destroy any previous instance first
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setMapLoaded(false);
    setMapError(false);

    // Wait for DOM to be painted
    const timer = setTimeout(async () => {
      if (!mapRef.current) return;

      try {
        // ── 1. Inject Leaflet CSS ─────────────────────────────────────────────
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          link.crossOrigin = "";
          document.head.appendChild(link);
          // Wait for CSS to load
          await new Promise((res) => { link.onload = res; setTimeout(res, 1000); });
        }

        // ── 2. Import Leaflet JS ──────────────────────────────────────────────
        const L = (await import("leaflet")).default;

        // ── 3. Fix broken default marker icons (webpack/Next.js bundler bug) ──
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Guard: container may have been removed if modal closed while loading
        if (!mapRef.current) return;

        // ── 4. Create map ─────────────────────────────────────────────────────
        const map = L.map(mapRef.current, {
          center: [latitude, longitude],
          zoom: 16,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // ── 5. OpenStreetMap tiles ────────────────────────────────────────────
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // ── 6. Marker + popup ─────────────────────────────────────────────────
        const popup = L.popup({ maxWidth: 260 }).setContent(
          `<div style="font-family:sans-serif;padding:4px 2px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${label}</div>
            ${address ? `<div style="font-size:11px;color:#555;margin-bottom:3px">${address}</div>` : ""}
            <div style="font-size:10px;color:#999;font-family:monospace">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</div>
          </div>`
        );

        L.marker([latitude, longitude]).addTo(map).bindPopup(popup).openPopup();

        // ── 7. Force tile redraw (fixes grey tiles on first open) ─────────────
        setTimeout(() => map.invalidateSize(), 200);

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.error("Map load error:", err);
        setMapError(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [open, latitude, longitude, label, address]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=16`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60"
        onClick={onClose}
      />

      {/* Modal — NOTE: NO overflow-hidden, that breaks Leaflet tiles */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
          style={{ overflow: "visible" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 rounded-t-2xl bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{label}</h2>
                {address && (
                  <p className="text-xs text-gray-500 mt-0.5">{address}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Google Maps
              </a>
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> OSM
              </a>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map container — explicit pixel height required for Leaflet */}
          <div style={{ position: "relative", height: "420px", width: "100%", borderRadius: "0 0 1rem 1rem", overflow: "hidden" }}>
            {/* Loading spinner */}
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            )}

            {/* Error state */}
            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-3">
                <MapPin className="w-10 h-10 text-gray-300" />
                <p className="text-sm text-gray-500">Could not load map</p>
                <div className="flex gap-2">
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline">Open in Google Maps</a>
                  <span className="text-gray-300">|</span>
                  <a href={osmUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline">Open in OpenStreetMap</a>
                </div>
              </div>
            )}

            {/* The actual Leaflet map div */}
            <div
              ref={mapRef}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
