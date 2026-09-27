import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';

/**
 * Optimizes an image File into a high-quality, lightweight WebP (or JPEG) blob and data URL.
 * Resizes down to max 800x800 while preserving aspect ratio.
 */
export async function optimizeDoctorPhoto(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image format'));
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context not available'));
        }

        // Crisp rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let mimeType = 'image/webp';
        let dataUrl = canvas.toDataURL('image/webp', 0.88);
        if (!dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Failed to compress image blob'));
            }
            resolve({ blob, dataUrl, width, height });
          },
          mimeType,
          0.88
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a doctor profile photo with cache-busting versioning.
 * 1. Optimizes the photo client-side.
 * 2. Attempts upload to Firebase Storage with a uniquely versioned path:
 *    doctor-profile/profile-v${Date.now()}.webp
 *    and immutable cacheControl.
 * 3. If Firebase Storage is available, returns the permanent download URL.
 * 4. If Firebase Storage returns 404 or fails, falls back gracefully to the optimized
 *    data URL so the doctor profile update never breaks or loses the photo.
 */
export async function uploadDoctorPhoto(file: File): Promise<{
  url: string;
  source: 'firebase_storage' | 'optimized_data_uri';
}> {
  const { blob, dataUrl } = await optimizeDoctorPhoto(file);

  try {
    const storage = getStorage(db.app);
    const versionedName = `doctor-profile/profile-v${Date.now()}.webp`;
    const storageRef = ref(storage, versionedName);

    // Upload with long-term cache headers since the filename is uniquely versioned
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[PhotoUpload] Uploaded to Firebase Storage:', downloadUrl);
    return { url: downloadUrl, source: 'firebase_storage' };
  } catch (storageErr: any) {
    console.warn(
      '[PhotoUpload] Firebase Storage upload notice (using optimized image data):',
      storageErr?.message || storageErr
    );
    // Graceful fallback to the crisp ~30KB optimized data URI directly
    return { url: dataUrl, source: 'optimized_data_uri' };
  }
}
