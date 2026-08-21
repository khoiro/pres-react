import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Perbaikan default marker icon Leaflet (path bawaan rusak saat dibundle Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Icon merah khusus untuk marker lokasi user (yang bisa digeser), supaya
// mudah dibedakan dari marker lokasi kantor (biru, default).
const currentLocationIcon = L.divIcon({
  className: "current-location-marker",
  html:
    '<div style="width:20px;height:20px;border-radius:50%;background:#dc3545;' +
    'border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.6);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Menyesuaikan tampilan peta (zoom/bounds) setiap koordinat berubah.
// Auto-fit dihentikan begitu user mulai menggeser marker, supaya peta
// tidak "melompat" menjauh dari titik yang sedang diatur user.
function FitBounds({ points, draggedRef }) {
  const map = useMap();

  useEffect(() => {
    if (draggedRef.current) return;

    if (points.length === 1) {
      map.setView(points[0], 17);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);

  return null;
}

/**
 * Menampilkan peta dengan:
 * - Marker lokasi kantor/pusat (branch) beserta radius area presensi
 * - Marker lokasi user saat ini (dari GPS), yang BISA DIGESER manual.
 *   Saat digeser, koordinat baru dikirim ke parent lewat onLocationChange
 *   sehingga jarak (distance) ikut mengikuti titik yang digeser.
 * - Garis penghubung antara keduanya
 */
export default function LocationMap({
  branchLat,
  branchLng,
  branchName,
  branchRadius,
  currentLat,
  currentLng,
  onLocationChange,
}) {
  const draggedRef = useRef(false);

  const branchPos = [Number(branchLat), Number(branchLng)];
  const hasCurrent = currentLat != null && currentLng != null;
  const currentPos = hasCurrent
    ? [Number(currentLat), Number(currentLng)]
    : null;

  const points = hasCurrent ? [branchPos, currentPos] : [branchPos];

  const handleDragEnd = (e) => {
    draggedRef.current = true;

    const pos = e.target.getLatLng();

    onLocationChange && onLocationChange(pos.lat, pos.lng);
  };

  return (
    <MapContainer
      center={branchPos}
      zoom={17}
      style={{ height: 300, width: "100%", borderRadius: 12 }}
      className="border"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={branchPos}>
        <Popup>Lokasi Kantor: {branchName || "-"}</Popup>
      </Marker>

      {branchRadius && (
        <Circle
          center={branchPos}
          radius={Number(branchRadius)}
          pathOptions={{
            color: "#0d6efd",
            fillColor: "#0d6efd",
            fillOpacity: 0.1,
          }}
        />
      )}

      {hasCurrent && (
        <>
          <Marker
            position={currentPos}
            icon={currentLocationIcon}
            draggable={true}
            eventHandlers={{
              dragstart: () => {
                draggedRef.current = true;
              },
              dragend: handleDragEnd,
            }}
          >
            <Popup>Lokasi Anda Saat Ini (geser titik ini jika perlu)</Popup>
          </Marker>

          <Polyline
            positions={[branchPos, currentPos]}
            pathOptions={{ color: "#6c757d", dashArray: "6 6", weight: 2 }}
          />
        </>
      )}

      <FitBounds points={points} draggedRef={draggedRef} />
    </MapContainer>
  );
}
