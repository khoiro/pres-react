import { useEffect, useRef, useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

import {
  compressImageToTarget,
  loadImageFromFile,
  loadImageFromDataUrl,
} from "../../utils/image";
import { isNativePlatform } from "../../utils/platform";

/**
 * Komponen ambil foto, dengan DUA jalur berbeda sesuai platform:
 *
 * - Native (APK Android)  -> plugin @capacitor/camera (Camera.getPhoto).
 *   Ini membuka kamera NATIVE Android dan izin kamera diminta lewat dialog
 *   permission native, sehingga benar-benar memicu popup izin di HP dan
 *   kamera bisa diakses. Sebelumnya, getUserMedia() di dalam WebView APK
 *   tidak bisa memicu dialog izin native itu, sehingga kamera gagal diakses.
 * - Web (browser biasa / development) -> getUserMedia bawaan browser,
 *   dipakai untuk live preview webcam PC/laptop maupun kamera HP dari browser.
 *
 * Untuk KEDUA jalur, maupun untuk upload file dari galeri, hasil akhirnya
 * SELALU diproses lewat compressImageToTarget agar resolusi & ukuran file
 * konsisten: potrait tetap 399x600px, ukuran file <= 10KB.
 */
export default function CameraCapture({ onCapture, capturedImage, onRetake }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const native = isNativePlatform();

  const [mode, setMode] = useState("camera"); // "camera" | "upload"
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [processing, setProcessing] = useState(false);
  const [resultInfo, setResultInfo] = useState(null); // { width, height, sizeBytes }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (m = facingMode) => {
    stopCamera();
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: m,
          width: { ideal: 720 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError(
        "Tidak dapat mengakses kamera. Pastikan browser memiliki izin kamera.",
      );
    }
  };

  // Live preview getUserMedia HANYA dipakai di web, tidak pernah dipanggil
  // di native (APK) supaya tidak mencoba akses kamera lewat WebView.
  useEffect(() => {
    if (!capturedImage && mode === "camera" && !native) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage, mode]);

  const handleCapture = async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) return;

    setProcessing(true);

    try {
      const result = await compressImageToTarget(video);

      stopCamera();
      setResultInfo(result);
      onCapture(result.blob, result.dataUrl);
    } catch (err) {
      setError("Gagal memproses foto. Silakan coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  // Jalur kamera NATIVE (APK): buka kamera Android lewat plugin Capacitor.
  // Plugin ini sendiri yang menampilkan dialog izin kamera native jika belum
  // diberikan, jadi tidak perlu getUserMedia sama sekali.
  const handleNativeCapture = async () => {
    setError("");
    setProcessing(true);

    try {
      const current = await Camera.checkPermissions();

      if (current.camera !== "granted") {
        const requested = await Camera.requestPermissions({
          permissions: ["camera"],
        });

        if (requested.camera !== "granted") {
          throw new Error(
            "Izin kamera ditolak. Aktifkan izin Kamera untuk aplikasi ini di Pengaturan HP > Aplikasi.",
          );
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
      });

      const img = await loadImageFromDataUrl(photo.dataUrl);
      const result = await compressImageToTarget(img);

      setResultInfo(result);
      onCapture(result.blob, result.dataUrl);
    } catch (err) {
      const message = err?.message || "";

      // User membatalkan pengambilan foto -> jangan tampilkan sebagai error
      if (!/cancel/i.test(message)) {
        setError(message || "Gagal mengambil foto dari kamera.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSwitchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";

    setFacingMode(next);
    startCamera(next);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];

    e.target.value = ""; // supaya bisa pilih file yang sama lagi jika perlu

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File yang dipilih harus berupa gambar.");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      const img = await loadImageFromFile(file);
      const result = await compressImageToTarget(img);

      setResultInfo(result);
      onCapture(result.blob, result.dataUrl);
    } catch (err) {
      setError("Gagal memproses file gambar. Silakan coba file lain.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetakeInternal = () => {
    setResultInfo(null);
    onRetake();
  };

  const sizeKb = resultInfo ? (resultInfo.sizeBytes / 1024).toFixed(1) : null;

  return (
    <div className="camera-capture text-center">
      {!capturedImage && (
        <div className="btn-group mb-3" role="group">
          <button
            type="button"
            className={`btn btn-sm ${mode === "camera" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => {
              setMode("camera");
              setError("");
            }}
          >
            <i className="bi bi-camera-fill me-1"></i>
            Kamera
          </button>

          <button
            type="button"
            className={`btn btn-sm ${mode === "upload" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => {
              setMode("upload");
              setError("");
            }}
          >
            <i className="bi bi-upload me-1"></i>
            Upload File
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>

          {mode === "camera" && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => (native ? handleNativeCapture() : startCamera())}
            >
              Coba Lagi
            </button>
          )}
        </div>
      )}

      {/* Kamera - NATIVE (APK): tombol buka kamera Android, tanpa live preview */}
      {!capturedImage && !error && mode === "camera" && native && (
        <div className="border rounded p-4 d-flex flex-column align-items-center gap-2">
          <i className="bi bi-camera fs-1 text-secondary"></i>

          <div className="text-muted small">
            Ambil foto langsung dari kamera HP Anda.
          </div>

          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={handleNativeCapture}
            disabled={processing}
          >
            <i className="bi bi-camera-fill me-2"></i>
            {processing ? "Memproses..." : "Buka Kamera"}
          </button>
        </div>
      )}

      {/* Kamera - WEB (browser): live preview webcam/kamera hp lewat getUserMedia */}
      {!capturedImage && !error && mode === "camera" && !native && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded border mx-auto d-block"
            style={{
              width: "100%",
              maxWidth: 280,
              aspectRatio: "399 / 600",
              objectFit: "cover",
              background: "#000",
            }}
          />

          <div className="mt-3 d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCapture}
              disabled={processing}
            >
              <i className="bi bi-camera-fill me-2"></i>
              {processing ? "Memproses..." : "Ambil Foto"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleSwitchCamera}
              disabled={processing}
            >
              <i className="bi bi-arrow-repeat me-2"></i>
              Ganti Kamera
            </button>
          </div>
        </>
      )}

      {!capturedImage && mode === "upload" && (
        <div className="border rounded p-4 d-flex flex-column align-items-center gap-2">
          <i className="bi bi-image fs-1 text-secondary"></i>

          <div className="text-muted small">
            Pilih file gambar dari perangkat Anda (JPG/PNG). File akan
            otomatis dikompres agar ukurannya kecil.
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <i className="bi bi-upload me-2"></i>
            {processing ? "Memproses..." : "Pilih File"}
          </button>
        </div>
      )}

      {capturedImage && (
        <>
          <img
            src={capturedImage}
            alt="Foto Checkout"
            className="rounded border mx-auto d-block"
            style={{
              width: "100%",
              maxWidth: 280,
              aspectRatio: "399 / 600",
              objectFit: "cover",
            }}
          />

          {resultInfo && (
            <div className="text-muted small mt-2">
              {resultInfo.width}x{resultInfo.height}px &middot; {sizeKb}KB
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleRetakeInternal}
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Ambil Ulang
            </button>
          </div>
        </>
      )}
    </div>
  );
}
