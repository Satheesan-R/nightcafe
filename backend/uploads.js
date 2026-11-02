import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { uploadCloudImage } from './cloudinary.js';

export const receiveImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
}).single('image');

export async function encodeImage(buffer) {
  try {
    const image = sharp(buffer, { limitInputPixels: 16_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) > 1) {
      throw new Error('Unsupported image.');
    }
    // Decode and re-encode; original filenames, metadata, and trailing payloads
    // never become publicly served files.
    return await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    const error = new Error('Upload a valid, non-animated JPG, PNG, or WebP image of at most 16 megapixels.');
    error.status = 400;
    throw error;
  }
}

export function saveImage(directory) {
  return async (request, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ message: 'An image is required (maximum 5 MB).' });
      const buffer = await encodeImage(request.file.buffer);
      const cloudUrl = await uploadCloudImage(buffer);
      if (cloudUrl) return response.status(201).json({ url: cloudUrl });
      const filename = `${randomUUID()}.webp`;
      await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
      response.status(201).json({ url: `/uploads/${filename}` });
    } catch (error) { next(error); }
  };
}
