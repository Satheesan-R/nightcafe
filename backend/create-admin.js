import './config.js';
import mongoose from 'mongoose';
import { Admin, hashPassword } from './auth.js';

try {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;
  if (!MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env.');
  if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) throw new Error('Set a valid ADMIN_EMAIL in backend/.env.');
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 256) throw new Error('Set ADMIN_PASSWORD to 12–256 characters in backend/.env.');
  await mongoose.connect(MONGODB_URI);
  await Admin.init();
  if (await Admin.exists({ email: ADMIN_EMAIL.trim().toLowerCase() })) throw new Error('This admin already exists. Its password has not been changed.');
  await Admin.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash: await hashPassword(ADMIN_PASSWORD) });
  console.log('Admin created. You can now sign in at /admin/login. Remove ADMIN_PASSWORD from backend/.env after setup.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
