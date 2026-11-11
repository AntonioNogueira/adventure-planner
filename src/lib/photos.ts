// Photos for stop stories: made smaller in the browser (long side 1600 px, JPEG), kept here until the trip is saved,
// then uploaded to Firebase Storage with the trip (like booking files) and referenced by their link.
import type { Story, StoryPhoto } from '../types';

const pending = new Map<string, { blob: Blob; url: string }>();

/** Most photos per stop: enough for a story, small enough to keep trips light. */
export const MAX_PHOTOS = 8;
const MAX_SIDE = 1600;

/** The longest side scaled down to `max`, keeping the shape. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** A photo made smaller (and turned upright, as the camera took it) as a JPEG. */
export async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not read the photo'))), 'image/jpeg', 0.82));
}

/** Keep a photo until the trip is saved; returns its id. */
export function keepPhoto(blob: Blob): string {
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pending.set(id, { blob, url: URL.createObjectURL(blob) });
  return id;
}

/** Where to show a photo from: its uploaded link, or the copy waiting in this browser. */
export function photoSrc(photo: StoryPhoto): string | undefined {
  return photo.url || (photo.pendingId ? pending.get(photo.pendingId)?.url : undefined);
}

export function pendingPhoto(id?: string): Blob | undefined {
  return id ? pending.get(id)?.blob : undefined;
}

/** A story with nothing in it (no text, no photos that can still be shown) is no story. */
export function isEmptyStory(story?: Story | null): boolean {
  return !story || (!story.text.trim() && !story.photos.some(p => photoSrc(p)));
}
