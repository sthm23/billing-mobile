import {
  ImagePermissionError,
  ImageTooLargeError,
  PRODUCT_IMAGE_MAX_COUNT,
  pickImages,
  uploadProductImage,
  type PickSource,
  type PickedImage,
} from '@/libs/product-image';
import { useCallback, useRef, useState } from 'react';

export type PhotoStatus = 'uploading' | 'done' | 'error';

/** A photo tile of the product form; the first one is the main photo */
export interface FormPhoto {
  id: string;
  uri: string;
  status: PhotoStatus;
  /** 0…1 while uploading */
  progress: number;
  /** Object key once uploaded */
  key?: string;
  /** Why it failed: too large / other */
  error?: 'tooLarge' | 'failed';
  source: PickedImage;
}

export type PickError = 'permission' | 'failed';

let seq = 0;

/**
 * Photos of the product form: pick (camera / library), compress and upload each
 * right away (presigned PUT), keep order (first = main), remove, retry.
 * `keys` is what `POST /product` gets as `images`.
 */
export function useProductPhotos() {
  const [photos, setPhotos] = useState<FormPhoto[]>([]);
  // Removed while uploading → ignore its late result
  const removed = useRef(new Set<string>());

  const patch = useCallback((id: string, change: Partial<FormPhoto>) => {
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)));
  }, []);

  const upload = useCallback(
    (photo: FormPhoto) => {
      uploadProductImage(photo.source, (progress) => {
        if (!removed.current.has(photo.id)) patch(photo.id, { progress });
      })
        .then((key) => {
          if (!removed.current.has(photo.id)) patch(photo.id, { status: 'done', key, progress: 1 });
        })
        .catch((e: unknown) => {
          if (removed.current.has(photo.id)) return;
          patch(photo.id, { status: 'error', error: e instanceof ImageTooLargeError ? 'tooLarge' : 'failed' });
        });
    },
    [patch],
  );

  /** Pick and start uploading; resolves with an error kind or null. */
  const add = useCallback(
    async (source: PickSource): Promise<PickError | null> => {
      const free = PRODUCT_IMAGE_MAX_COUNT - photos.length;
      if (free <= 0) return null;
      let picked: PickedImage[];
      try {
        picked = await pickImages(source, free);
      } catch (e) {
        return e instanceof ImagePermissionError ? 'permission' : 'failed';
      }
      const added: FormPhoto[] = picked.map((source) => ({
        id: `photo-${++seq}`,
        uri: source.uri,
        status: 'uploading',
        progress: 0,
        source,
      }));
      setPhotos((list) => [...list, ...added].slice(0, PRODUCT_IMAGE_MAX_COUNT));
      added.forEach(upload);

      return null;
    },
    [photos.length, upload],
  );

  const remove = useCallback((id: string) => {
    removed.current.add(id);
    setPhotos((list) => list.filter((p) => p.id !== id));
  }, []);

  /** Move a photo to the front — it becomes the main one */
  const makeMain = useCallback((id: string) => {
    setPhotos((list) => {
      const photo = list.find((p) => p.id === id);
      return photo ? [photo, ...list.filter((p) => p.id !== id)] : list;
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (!photo || photo.error === 'tooLarge') return;
      patch(id, { status: 'uploading', progress: 0, error: undefined });
      upload(photo);
    },
    [photos, patch, upload],
  );

  return {
    photos,
    add,
    remove,
    makeMain,
    retry,
    canAdd: photos.length < PRODUCT_IMAGE_MAX_COUNT,
    isUploading: photos.some((p) => p.status === 'uploading'),
    hasErrors: photos.some((p) => p.status === 'error'),
    keys: photos.filter((p) => p.status === 'done' && p.key).map((p) => p.key!),
  };
}
