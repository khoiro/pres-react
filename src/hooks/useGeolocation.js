import { useCallback, useEffect, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";

import { isNativePlatform } from "../utils/platform";

/**
 * Hook pengambil lokasi GPS yang bekerja di DUA mode:
 *
 * 1. Native (APK Android, dibungkus Capacitor)
 *    -> pakai plugin @capacitor/geolocation. Izin lokasi diminta lewat
 *       dialog permission NATIVE Android (ActivityCompat), sehingga benar-benar
 *       memicu popup izin di HP. Ini yang sebelumnya tidak terjadi kalau
 *       memakai navigator.geolocation polos di dalam WebView APK -> browser
 *       API tidak bisa memicu dialog izin native, sehingga lokasi selalu gagal.
 *
 * 2. Web (dibuka lewat browser biasa, termasuk saat development)
 *    -> pakai navigator.geolocation bawaan browser seperti biasa.
 */
export function useGeolocation() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjusted, setAdjusted] = useState(false);

  const fetchWeb = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Perangkat/browser ini tidak mendukung GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () =>
          reject(
            new Error(
              "Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan di browser.",
            ),
          ),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });
  }, []);

  const fetchNative = useCallback(async () => {
    const current = await Geolocation.checkPermissions();

    const alreadyGranted =
      current.location === "granted" || current.coarseLocation === "granted";

    if (!alreadyGranted) {
      const requested = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"],
      });

      const granted =
        requested.location === "granted" ||
        requested.coarseLocation === "granted";

      if (!granted) {
        throw new Error(
          "Izin lokasi ditolak. Aktifkan izin Lokasi untuk aplikasi ini di Pengaturan HP > Aplikasi.",
        );
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = isNativePlatform()
        ? await fetchNative()
        : await fetchWeb();

      setLat(result.lat);
      setLng(result.lng);
      setAdjusted(false);
    } catch (err) {
      setError(err?.message || "Gagal mengambil lokasi.");
    } finally {
      setLoading(false);
    }
  }, [fetchNative, fetchWeb]);

  // Dipanggil saat user menggeser marker manual di peta
  const setManualPosition = useCallback((newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    setAdjusted(true);
  }, []);

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    lat,
    lng,
    loading,
    error,
    adjusted,
    refetch: fetchLocation,
    setManualPosition,
  };
}
