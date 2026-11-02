import { createHash } from 'node:crypto';

// Credentials stay on the backend. With no credentials, local disk uploads
// continue to work; partial configuration must never silently lose cloud files.
export async function uploadCloudImage(buffer, { env = process.env, fetchImpl = fetch } = {}) {
  const cloud = env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = env.CLOUDINARY_API_KEY?.trim();
  const secret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud && !key && !secret) return null;
  if (!cloud || !key || !secret || !/^[a-zA-Z0-9_-]+$/.test(cloud)) {
    throw Object.assign(new Error('Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend.'), { status: 503 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash('sha256').update(`timestamp=${timestamp}${secret}`).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/webp' }), 'image.webp');
  form.append('timestamp', timestamp);
  form.append('api_key', key);
  form.append('signature', signature);

  try {
    const response = await fetchImpl(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('Upload failed.');
    const result = await response.json();
    const url = new URL(result.secure_url);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') throw new Error('Invalid image URL.');
    return url.href;
  } catch {
    // Do not forward provider responses that might contain account details.
    throw Object.assign(new Error('Cloud image upload failed. Check backend Cloudinary settings and try again.'), { status: 502 });
  }
}
