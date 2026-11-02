// Only upload paths belong to the API host. Frontend artwork and external URLs
// retain their existing locations; no stored MongoDB values are rewritten.
export function resolveAssetUrl(value, backendUrl) {
  if (typeof value !== 'string') return value;
  const image = value.trim();
  const uploadPath = image.replace(/^(?:\.\/)?uploads\//, '/uploads/');
  return uploadPath.startsWith('/uploads/')
    ? `${backendUrl.replace(/\/+$/, '')}${uploadPath}`
    : image;
}
