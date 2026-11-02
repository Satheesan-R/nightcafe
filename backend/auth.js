import './config.js';
import { security } from './config.js';
import { Router } from 'express';
import mongoose from 'mongoose';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const hashPrefix = 'scrypt$131072$8$1$';
export const Admin = mongoose.model('Admin', new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true }));
export const AdminSession = mongoose.model('AdminSession', new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}));

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, scryptOptions);
  return `${hashPrefix}${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const modern = stored.startsWith(hashPrefix);
  const parts = modern ? stored.slice(hashPrefix.length).split('$') : stored.split(':');
  const [salt, hash] = parts;
  if (parts.length !== 2 || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const key = await deriveKey(password, salt, 64, modern ? scryptOptions : {});
  return timingSafeEqual(key, Buffer.from(hash, 'hex'));
}

const cookieName = 'ayra_admin';
const sessionDuration = 8 * 60 * 60 * 1000;
const cookieOptions = () => ({ httpOnly: true, secure: security.production, sameSite: security.sameSite, path: '/api' });
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
function readToken(request) {
  const value = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
const safeAdmin = (admin) => ({ id: admin._id, name: admin.name, email: admin.email });

export async function requireAdmin(request, response, next) {
  try {
    const token = readToken(request);
    if (!token) return response.status(401).json({ message: 'Please log in to continue.' });
    const session = await AdminSession.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } }).populate('admin');
    if (!session?.admin) return response.status(401).json({ message: 'Your session has expired. Please log in again.' });
    request.admin = session.admin;
    next();
  } catch (error) { next(error); }
}

export function checkOrigin(request, response, next) {
  const origin = request.get('origin');
  if ((security.production && !origin) || (origin && origin !== security.frontendUrl)) {
    return response.status(403).json({ message: 'This origin is not allowed.' });
  }
  if (request.get('sec-fetch-site') === 'cross-site' && !(security.sameSite === 'none' && origin === security.frontendUrl)) return response.status(403).json({ message: 'Cross-site admin requests are not allowed.' });
  next();
}

export function protectWrites(request, response, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
  if (request.method === 'POST' && request.path === '/reviews') return next();
  checkOrigin(request, response, () => requireAdmin(request, response, next));
}

export const authRouter = Router();
authRouter.use((_request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });

// Atomic database counters survive restarts and are shared by API instances.
export const LoginAttempt = mongoose.model('LoginAttempt', new mongoose.Schema({
  _id: String,
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}));
export async function limitLogin(request, response, next) {
  try {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const window = Math.floor(now / windowMs);
    const expiresAt = new Date((window + 1) * windowMs);
    const _id = `${tokenHash(request.ip || request.socket.remoteAddress)}:${window}`;
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };
    let attempt;
    try {
      attempt = await LoginAttempt.findOneAndUpdate({ _id }, update, { upsert: true, new: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Another instance inserted this window's counter concurrently.
      attempt = await LoginAttempt.findOneAndUpdate({ _id }, { $inc: { count: 1 } }, { new: true });
    }
    if (!attempt) throw new Error('Login rate limit counter unavailable.');
    if (attempt.count > 10) {
      response.set('Retry-After', String(Math.ceil((expiresAt.getTime() - now) / 1000)));
      return response.status(429).json({ message: 'Too many login attempts. Try again later.' });
    }
    next();
  } catch (error) { next(error); }
}

authRouter.post('/login', checkOrigin, limitLogin, async (request, response, next) => {
  try {
    const { email, password } = request.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) {
      return response.status(400).json({ message: 'Enter a valid email and password.' });
    }
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    // Perform the same expensive password work when the account is absent.
    const valid = await verifyPassword(password, admin?.passwordHash || `${hashPrefix}${'0'.repeat(32)}$${'0'.repeat(128)}`);
    if (!admin || !valid) return response.status(401).json({ message: 'Incorrect email or password.' });
    // Upgrade existing hashes only after the old password has been verified.
    if (!admin.passwordHash.startsWith(hashPrefix)) {
      await Admin.updateOne({ _id: admin._id, passwordHash: admin.passwordHash }, { $set: { passwordHash: await hashPassword(password) } });
    }
    const token = randomBytes(32).toString('hex');
    await AdminSession.create({ tokenHash: tokenHash(token), admin: admin._id, expiresAt: new Date(Date.now() + sessionDuration) });
    const previous = readToken(request);
    if (previous) await AdminSession.deleteOne({ tokenHash: tokenHash(previous) });
    response.cookie(cookieName, token, { ...cookieOptions(), maxAge: sessionDuration });
    response.json({ admin: safeAdmin(admin) });
  } catch (error) { next(error); }
});

authRouter.get('/me', requireAdmin, (request, response) => response.json({ admin: safeAdmin(request.admin) }));
authRouter.post('/logout', checkOrigin, async (request, response, next) => {
  try {
    const token = readToken(request);
    if (token) await AdminSession.deleteOne({ tokenHash: tokenHash(token) });
    response.clearCookie(cookieName, cookieOptions());
    response.status(204).end();
  } catch (error) { next(error); }
});
