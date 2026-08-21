import { useContext, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import CameraCapture from "../components/common/CameraCapture";
import LocationMap from "../components/common/LocationMap";
import { haversineDistanceKm } from "../utils/geo";
import { useGeolocation } from "../hooks/useGeolocation";

export default function Checkin() {
  // Dipakai hanya sebagai fallback bila /home belum sempat memuat
  const { user } = useContext(AuthContext);

  const [homeData, setHomeData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);

  const [category, setCategory] = useState("Normal");
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Lokasi GPS (checkin_lat / checkin_lng): otomatis pakai plugin Capacitor
  // Geolocation saat aplikasi berjalan sebagai APK Android (native), atau
  // navigator.geolocation bawaan browser saat berjalan sebagai web biasa.
  const {
    lat: currentLat,
    lng: currentLng,
    loading: geoLoading,
    error: geoError,
    adjusted: locationAdjusted,
    refetch: fetchLocation,
    setManualPosition,
  } = useGeolocation();

  const branch =
    homeData?.branch?.find((b) => b.is_default) ||
    homeData?.branch?.[0] ||
    null;

  // Ambil data user, kantor (branch), status presensi & kategori dari /home
  const fetchHome = async () => {
    setLoadingHome(true);

    try {
      const response = await api.get("/home");

      setHomeData(response.data.data);
      setAttendance(response.data.attendance);
      setCategories(response.data.category_attendance || []);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan saat mengambil data presensi.",
      });
    } finally {
      setLoadingHome(false);
    }
  };

  // Dipanggil saat marker lokasi di peta digeser manual oleh user.
  // Jarak (distanceKm) otomatis mengikuti karena dihitung ulang dari
  // currentLat/currentLng via useMemo di bawah.
  const handleLocationChange = (lat, lng) => {
    setManualPosition(lat, lng);
  };

  useEffect(() => {
    fetchHome();
  }, []);

  const hasCurrentPoint = currentLat != null && currentLng != null;

  // Jarak antara lokasi user saat ini dengan lokasi kantor (branch)
  const distanceKm = useMemo(() => {
    if (!branch || currentLat == null || currentLng == null) return null;

    return haversineDistanceKm(
      Number(branch.lat),
      Number(branch.lng),
      currentLat,
      currentLng,
    );
  }, [branch, currentLat, currentLng]);

  const distanceLabel = distanceKm !== null ? distanceKm.toFixed(2) : null;

  // Format meniru contoh backend: ". Jarak : 0.06KM dari SMPN 1 TARIK"
  // atau "Perjalanan Dinas. Jarak : 4.01KM dari SMPN 1 TARIK" bila kategori bukan Normal
  const locNote = useMemo(() => {
    if (distanceLabel === null || !branch) return "";

    const prefix = category && category !== "Normal" ? category : "";

    return `${prefix}. Jarak : ${distanceLabel}KM dari ${branch.branch_name}`;
  }, [distanceLabel, branch, category]);

  const handleCapture = (blob, dataUrl) => {
    setPhotoBlob(blob);
    setPhotoPreview(dataUrl);
  };

  const handleRetake = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
  };

  const canSubmit =
    !!homeData &&
    !!branch &&
    currentLat != null &&
    currentLng != null &&
    !!photoBlob &&
    !attendance?.today?.has_checkin;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      const formData = new FormData();

      formData.append("checkin_img", photoBlob, `masuk-${today}.jpeg`);
      formData.append("checkin_lat", currentLat);
      formData.append("checkin_lng", currentLng);
      formData.append("checkin_category", category);
      formData.append("unor_id", homeData.unor_id);
      formData.append("nip", homeData.nip);
      formData.append("checkin_lat_branch", branch.lat);
      formData.append("checkin_lng_branch", branch.lng);
      formData.append("checkin_branch", branch.branch_name);
      formData.append("unor", homeData.unor);
      formData.append("checkin_loc_note", locNote);
      formData.append("checkin_range_km", `${distanceLabel}`);

      await api.post("/attendance/checkin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Checkin Berhasil",
        showConfirmButton: false,
        timer: 1500,
      });

      handleRetake();
      fetchHome();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Checkin Gagal",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan saat mengirim data checkin.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHome) {
    return (
      <div className="card card-custom">
        <div className="card-body text-center py-5">Memuat data...</div>
      </div>
    );
  }

  if (attendance?.today?.has_checkin) {
    return (
      <div className="card card-custom">
        <div className="card-body">
          <h3>Checkin Presensi</h3>

          <hr />

          <div className="alert alert-success mb-0">
            Anda sudah melakukan checkin hari ini pukul{" "}
            {attendance.today.checkin?.slice(11, 19)}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-custom">
      <div className="card-body">
        <h3>Checkin Presensi</h3>

        <hr />

        <div className="row g-4">
          <div className="col-lg-6">
            <h6 className="mb-3">Ambil Foto Checkin</h6>

            <CameraCapture
              onCapture={handleCapture}
              capturedImage={photoPreview}
              onRetake={handleRetake}
            />
          </div>

          <div className="col-lg-6">
            <h6 className="mb-3">Lokasi</h6>

            {geoLoading && (
              <div className="alert alert-info">Mengambil lokasi GPS...</div>
            )}

            {geoError && (
              <div className="alert alert-danger d-flex justify-content-between align-items-center">
                <span>{geoError}</span>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={fetchLocation}
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {branch && (
              <LocationMap
                branchLat={branch.lat}
                branchLng={branch.lng}
                branchName={branch.branch_name}
                branchRadius={branch.radius}
                currentLat={currentLat}
                currentLng={currentLng}
                onLocationChange={handleLocationChange}
              />
            )}

            {hasCurrentPoint && (
              <div className="form-text mt-1">
                <i className="bi bi-info-circle me-1"></i>
                Geser titik merah di peta jika lokasi GPS kurang tepat. Jarak
                akan otomatis menyesuaikan.
              </div>
            )}

            <div className="table-responsive mt-3">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <th width="180">Lokasi Kantor</th>

                    <td>{branch?.branch_name || "-"}</td>
                  </tr>

                  <tr>
                    <th>Koordinat Anda</th>

                    <td>
                      {currentLat != null
                        ? `${currentLat.toFixed(8)}, ${currentLng.toFixed(8)}`
                        : "-"}

                      {locationAdjusted && (
                        <span className="badge bg-warning text-dark ms-2">
                          Disesuaikan Manual
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <th>Jarak</th>

                    <td>
                      {distanceLabel !== null ? `${distanceLabel} KM` : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <hr />

        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Kategori Checkin</label>

              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Normal">Normal</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-8">
              <label className="form-label">Keterangan Lokasi</label>

              <input
                type="text"
                className="form-control"
                value={locNote || "-"}
                readOnly
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-4"
            disabled={!canSubmit || submitting}
          >
            <i className="bi bi-box-arrow-in-right me-2"></i>
            {submitting ? "Mengirim..." : "Checkin Sekarang"}
          </button>

          {!photoBlob && (
            <div className="form-text text-danger mt-2">
              Ambil foto terlebih dahulu sebelum checkin.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
