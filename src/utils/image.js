// Utility untuk crop + resize + kompres gambar (dari kamera ataupun file
// upload) agar:
// 1. Selalu berukuran POTRAIT TETAP 399x600 (mengikuti contoh foto
//    presensi), berapa pun resolusi/orientasi asli sumbernya (webcam
//    landscape beresolusi rendah, foto upload landscape, dsb) -> di-crop
//    tengah (center-crop) ke rasio target lalu diskalakan (termasuk
//    di-upscale bila sumber lebih kecil) ke ukuran target tersebut.
// 2. Ukuran file akhir selalu <= target maksimal (default 10KB). Dimensi
//    hanya diperkecil sebagai upaya terakhir, jika kompresi kualitas saja
//    tidak cukup untuk mencapai target ukuran file.

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024; // 10KB
const DEFAULT_WIDTH = 399; // px, mengikuti contoh foto presensi
const DEFAULT_HEIGHT = 600; // px, mengikuti contoh foto presensi

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function getSourceSize(source) {
  const width = source.videoWidth || source.naturalWidth || source.width;
  const height = source.videoHeight || source.naturalHeight || source.height;

  return { width, height };
}

/**
 * Menghitung area crop (center-crop) dari sumber asli supaya rasio
 * lebar:tinggi-nya sama dengan targetAspect, tanpa menggepengkan gambar.
 */
function getCenterCropRect(srcWidth, srcHeight, targetAspect) {
  const srcAspect = srcWidth / srcHeight;

  if (srcAspect > targetAspect) {
    // Sumber lebih "lebar" dari target -> potong kiri-kanan
    const sHeight = srcHeight;
    const sWidth = Math.round(srcHeight * targetAspect);
    const sx = Math.round((srcWidth - sWidth) / 2);

    return { sx, sy: 0, sWidth, sHeight };
  }

  // Sumber lebih "tinggi/kurus" dari target -> potong atas-bawah
  const sWidth = srcWidth;
  const sHeight = Math.round(srcWidth / targetAspect);
  const sy = Math.round((srcHeight - sHeight) / 2);

  return { sx: 0, sy, sWidth, sHeight };
}

/**
 * Mengompres gambar dari sumber (elemen <video> hasil kamera atau <img> hasil
 * upload file) menjadi blob JPEG potrait 399x600 dengan ukuran <= maxSizeBytes.
 *
 * Strategi:
 * 1. Center-crop sumber ke rasio potrait target (399:600), apa pun
 *    orientasi/resolusi aslinya, lalu skalakan (upscale/downscale) TEPAT
 *    ke ukuran target (targetWidth x targetHeight).
 * 2. Turunkan kualitas JPEG bertahap sampai ukuran memenuhi target.
 * 3. Jika kualitas minimum masih terlalu besar, baru perkecil dimensinya
 *    (tetap rasio potrait) sebagai upaya terakhir dan ulangi.
 *
 * Selalu menggambar ulang dari sumber asli (bukan dari hasil kompres
 * sebelumnya) supaya kualitas visual tetap maksimal untuk ukuran akhirnya.
 */
export async function compressImageToTarget(
  source,
  {
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    targetWidth = DEFAULT_WIDTH,
    targetHeight = DEFAULT_HEIGHT,
  } = {},
) {
  const { width: srcWidth, height: srcHeight } = getSourceSize(source);

  if (!srcWidth || !srcHeight) {
    throw new Error("Sumber gambar tidak valid.");
  }

  const aspect = targetWidth / targetHeight;

  // Area crop tetap (dihitung sekali dari sumber asli), dipakai ulang untuk
  // setiap percobaan resize/kompres di bawah.
  const { sx, sy, sWidth, sHeight } = getCenterCropRect(
    srcWidth,
    srcHeight,
    aspect,
  );

  let width = targetWidth;
  let height = targetHeight;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const renderAt = (w, h) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, w, h);
  };

  renderAt(width, height);

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, quality);

  // Turunkan kualitas dulu sebelum memperkecil dimensi
  while (blob.size > maxSizeBytes && quality > 0.1) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await canvasToBlob(canvas, quality);
  }

  // Jika kualitas minimum masih kebesaran, baru perkecil dimensi bertahap
  // (upaya terakhir, tetap rasio potrait) dan ulangi
  let safety = 0;

  while (blob.size > maxSizeBytes && height > 80 && safety < 20) {
    height = Math.round(height * 0.9);
    width = Math.round(height * aspect);
    renderAt(width, height);

    quality = 0.8;
    blob = await canvasToBlob(canvas, quality);

    while (blob.size > maxSizeBytes && quality > 0.1) {
      quality = Math.round((quality - 0.1) * 10) / 10;
      blob = await canvasToBlob(canvas, quality);
    }

    safety += 1;
  }

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  return {
    blob,
    dataUrl,
    width,
    height,
    quality,
    sizeBytes: blob.size,
  };
}

/**
 * Memuat File (hasil <input type="file">) menjadi elemen <img> yang siap
 * dipakai sebagai sumber untuk compressImageToTarget.
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Memuat data URL (mis. hasil foto dari plugin Capacitor Camera, yang
 * dikembalikan sebagai base64 data URL) menjadi elemen <img> yang siap
 * dipakai sebagai sumber untuk compressImageToTarget.
 */
export function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar dari kamera."));
    img.src = dataUrl;
  });
}

export const IMAGE_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_BYTES;
export const IMAGE_WIDTH = DEFAULT_WIDTH;
export const IMAGE_HEIGHT = DEFAULT_HEIGHT;
