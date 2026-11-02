import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true });

export function securityConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const frontendUrl = env.FRONTEND_URL || (production ? '' : 'http://localhost:5173');
  let url;
  try { url = new URL(frontendUrl); } catch { throw new Error('FRONTEND_URL must be an explicit HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== frontendUrl || url.username || url.password) {
    throw new Error('FRONTEND_URL must be an exact origin without a trailing slash or path.');
  }
  if (production && url.protocol !== 'https:') throw new Error('Production FRONTEND_URL must use HTTPS.');
  const sameSite = env.COOKIE_SAME_SITE || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite)) throw new Error('COOKIE_SAME_SITE must be lax, strict, or none.');
  if (sameSite === 'none' && !production) throw new Error('COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS.');
  const proxies = env.TRUST_PROXY?.trim();
  if (proxies && /^(true|false|\d+)$/i.test(proxies)) throw new Error('TRUST_PROXY must list trusted proxy IP addresses or CIDRs, not a boolean or hop count.');
  return { production, frontendUrl, sameSite, trustProxy: proxies ? proxies.split(',').map((entry) => entry.trim()) : false };
}

export const security = securityConfig();
