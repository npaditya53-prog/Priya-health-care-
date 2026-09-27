import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';
import { api } from './api';

/**
 * Utility to convert dataUrl string to Blob reliably on all browsers (including mobile Safari)
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Optimizes an image File into a high-quality, lightweight WebP (or JPEG) blob and data URL.
 * Resizes down to max 800x800 while preserving aspect ratio.
 * Completely fail-safe across mobile Safari, Chrome, Firefox, and WebViews.
 */
export async function optimizeDoctorPhoto(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      objectUrl = null;
    }

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    };

    // Ultra-reliable fallback reader if canvas fails
    const fallbackToRawReader = () => {
      cleanup();
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = (reader.result as string) || '';
        resolve({
          blob: file,
          dataUrl: rawDataUrl,
          width: 800,
          height: 800,
        });
      };
      reader.onerror = () => {
        resolve({
          blob: file,
          dataUrl: '',
          width: 800,
          height: 800,
        });
      };
      reader.readAsDataURL(file);
    };

    const img = new Image();

    const processLoadedImage = (imageElement: HTMLImageElement) => {
      try {
        const maxDim = 800;
        let width = imageElement.naturalWidth || imageElement.width || 800;
        let height = imageElement.naturalHeight || imageElement.height || 800;

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
          fallbackToRawReader();
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imageElement, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.85);
        } catch {
          dataUrl = '';
        }
        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        const fallbackBlob = dataUrlToBlob(dataUrl);

        try {
          canvas.toBlob(
            (blob) => {
              resolve({
                blob: blob || fallbackBlob,
                dataUrl,
                width,
                height,
              });
            },
            dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
            0.85
          );
        } catch {
          resolve({
            blob: fallbackBlob,
            dataUrl,
            width,
            height,
          });
        }
      } catch (err) {
        console.warn('[PhotoUpload] Canvas optimization notice, falling back:', err);
        fallbackToRawReader();
      }
    };

    img.onload = () => {
      cleanup();
      processLoadedImage(img);
    };

    img.onerror = () => {
      cleanup();
      // Try FileReader fallback
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => processLoadedImage(fallbackImg);
        fallbackImg.onerror = () => fallbackToRawReader();
        fallbackImg.src = reader.result as string;
      };
      reader.onerror = () => fallbackToRawReader();
      reader.readAsDataURL(file);
    };

    if (objectUrl) {
      img.src = objectUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => fallbackToRawReader();
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Uploads a doctor profile photo with resilient multi-tier caching and storage.
 * 1. Optimizes the photo client-side into lightweight WebP/JPEG (never throws, always succeeds).
 * 2. Attempts upload to local backend server /api/upload (fastest, standard storage).
 * 3. Attempts Firebase Storage upload with versioned name if available.
 * 4. Guaranteed fallback to optimized data URI directly (~30KB),
 *    so the photo is immediately usable and stored in Firestore.
 */
export async function uploadDoctorPhoto(file: File): Promise<{
  url: string;
  source: 'backend_server' | 'firebase_storage' | 'optimized_data_uri';
}> {
  // Step 1: Optimize photo client-side
  let blob: Blob = file;
  let dataUrl = '';

  try {
    const res = await optimizeDoctorPhoto(file);
    blob = res.blob;
    dataUrl = res.dataUrl;
  } catch (err) {
    console.warn('[PhotoUpload] Client optimization error:', err);
  }

  // Step 2: Try backend server upload first (instant local endpoint)
  try {
    // Wrap blob into a File if needed
    const uploadableFile =
      blob instanceof File
        ? blob
        : new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
            type: blob.type || 'image/webp',
          });

    const serverRes = await api.uploadFile(uploadableFile);
    if (serverRes.success && serverRes.data?.url) {
      console.log('[PhotoUpload] Successfully uploaded to backend server:', serverRes.data.url);
      return { url: serverRes.data.url, source: 'backend_server' };
    }
  } catch (serverErr) {
    console.warn('[PhotoUpload] Backend upload notice, checking fallbacks:', serverErr);
  }

  // Step 3: Attempt Firebase Storage upload with a fast 2.5s timeout
  try {
    const storage = getStorage(db.app);
    const versionedName = `doctor-profile/profile-v${Date.now()}.webp`;
    const storageRef = ref(storage, versionedName);

    const uploadPromise = uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    });

    const timeoutPromise = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('Firebase Storage timeout')), 2500)
    );

    await Promise.race([uploadPromise, timeoutPromise]);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[PhotoUpload] Uploaded to Firebase Storage:', downloadUrl);
    return { url: downloadUrl, source: 'firebase_storage' };
  } catch (storageErr: any) {
    console.warn('[PhotoUpload] Firebase Storage notice:', storageErr?.message || storageErr);
  }

  // Step 4: Guaranteed fallback to optimized data URI
  // Firestore rules allow up to 500,000 characters for image_url
  if (dataUrl && dataUrl.length > 20) {
    console.log('[PhotoUpload] Using optimized data URI fallback (guaranteed display & Firestore sync)');
    return { url: dataUrl, source: 'optimized_data_uri' };
  }

  // Final fallback: read raw file as data URL
  const rawDataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('Could not read image file'));
    r.readAsDataURL(file);
  });

  return { url: rawDataUrl, source: 'optimized_data_uri' };
}
