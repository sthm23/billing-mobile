import { api } from '@/api/axios-instance';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Same limits as the backend (`PRODUCT_IMAGE_MAX_COUNT`, `PRODUCT_IMAGE_MAX_SIZE`) */
export const PRODUCT_IMAGE_MAX_COUNT = 5;
export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
/** Longest side after compression — enough for a product card, keeps files well under 5 MB */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
const MIME_TYPE = 'image/jpeg';

export type PickSource = 'camera' | 'library';

/** A picked photo before upload */
export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** A compressed photo ready to upload */
export interface PreparedImage {
  uri: string;
  blob: Blob;
  size: number;
  mimeType: string;
}

/** `POST /image/upload` item: presigned PUT URL + object key the product stores */
interface PresignedUpload {
  url: string;
  key: string;
  expiresIn: number;
}

export class ImagePermissionError extends Error {}
export class ImageTooLargeError extends Error {}

/**
 * Pick photos from the camera (one) or the library (up to `limit`).
 * Returns [] when the user cancels; throws `ImagePermissionError` when access is denied.
 */
export async function pickImages(source: PickSource, limit: number): Promise<PickedImage[]> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new ImagePermissionError(source);

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({
          ...options,
          allowsMultipleSelection: limit > 1,
          selectionLimit: limit,
        });
  if (result.canceled) return [];

  return result.assets.slice(0, limit).map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

/** Resize (longest side ≤ 1600 px) and re-encode as JPEG; throws `ImageTooLargeError` above 5 MB. */
export async function prepareImage(image: PickedImage): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(image.uri);
  if (Math.max(image.width, image.height) > MAX_SIDE) {
    context.resize(image.width >= image.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  const blob = await (await fetch(saved.uri)).blob();
  if (blob.size > PRODUCT_IMAGE_MAX_SIZE) throw new ImageTooLargeError(String(blob.size));

  return { uri: saved.uri, blob, size: blob.size, mimeType: MIME_TYPE };
}

/** `POST /image/upload` for one file — the backend signs its exact size and type. */
async function requestUpload(image: PreparedImage): Promise<PresignedUpload> {
  const response = await api.post<PresignedUpload[]>('/image/upload', {
    files: [{ fileName: 'photo.jpg', fileSize: image.size, mimeType: image.mimeType }],
  });

  return response.data[0];
}

/** PUT the file to the presigned URL with progress (0…1). */
function putWithProgress(url: string, image: PreparedImage, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', image.mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed: network'));
    xhr.send(image.blob);
  });
}

/** Compress + upload one photo; resolves with the object key for `POST /product` `images`. */
export async function uploadProductImage(image: PickedImage, onProgress: (p: number) => void): Promise<string> {
  const prepared = await prepareImage(image);
  const upload = await requestUpload(prepared);
  await putWithProgress(upload.url, prepared, onProgress);
  onProgress(1);

  return upload.key;
}
