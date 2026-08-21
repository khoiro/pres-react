import { Capacitor } from "@capacitor/core";

/**
 * true jika aplikasi berjalan sebagai APK/IPA native (dibungkus Capacitor),
 * false jika berjalan sebagai halaman web biasa di browser (dev server,
 * atau dibuka lewat browser HP/PC).
 *
 * Dipakai untuk memilih jalur kamera & lokasi yang tepat:
 * - Native (APK)  -> plugin Capacitor (@capacitor/camera, @capacitor/geolocation),
 *                    karena izin (permission) HARUS diminta lewat native runtime
 *                    permission dialog Android, tidak bisa lewat WebView biasa.
 * - Web (browser) -> API bawaan browser (getUserMedia, navigator.geolocation).
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export function getPlatform() {
  return Capacitor.getPlatform(); // "android" | "ios" | "web"
}
