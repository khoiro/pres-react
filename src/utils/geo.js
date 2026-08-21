// Kumpulan util perhitungan geografis (jarak antar koordinat)

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Menghitung jarak antara dua koordinat (lat/lng) menggunakan formula Haversine.
 * Hasil dalam satuan kilometer.
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // radius bumi dalam km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
