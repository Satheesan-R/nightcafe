import { useEffect, useState } from 'react';
import { request } from '../api.js';
import Admin from './Admin.jsx';
import './Admin.css';

const cleanEmail = (value) => value.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();

export default function AdminAuth() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    request('/auth/me').then((result) => {
      if (active) {
        setAdmin(result.admin);
        window.history.replaceState({}, '', '/admin');
      }
    }).catch((error) => {
      if (active) {
        if (error.status !== 401) setError(error.message);
        window.history.replaceState({}, '', '/admin/login');
      }
    }).finally(() => { if (active) setChecking(false); });
    function expire() {
      setAdmin(null);
      setError('Your session has expired. Please sign in again.');
      window.history.replaceState({}, '', '/admin/login');
    }
    window.addEventListener('admin-session-expired', expire);
    return () => { active = false; window.removeEventListener('admin-session-expired', expire); };
  }, []);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cleanEmail(values.get('email')), password: values.get('password') }) });
      setAdmin(result.admin);
      window.history.replaceState({}, '', '/admin');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    setError('');
    try {
      await request('/auth/logout', { method: 'POST' });
      setAdmin(null);
      window.history.replaceState({}, '', '/admin/login');
    } catch (error) { setError(error.message); }
  }

  if (checking) return <main className="admin-login"><p role="status">Checking your session…</p></main>;
  if (admin) return <>{error && <p className="admin-alert error" role="alert">{error}</p>}<Admin admin={admin} logout={logout} /></>;
  return <main className="admin-login">
    <form className="admin-panel admin-login-card" onSubmit={login}>
      <a className="admin-brand" href="/">Ayra<span>Juice Shop</span></a>
      <p className="admin-kicker">ADMIN WORKSPACE</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your cafe.</p>
      {error && <p className="admin-alert error" role="alert">{error}</p>}
      <label>Email<input name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={(event) => { event.currentTarget.value = cleanEmail(event.currentTarget.value); }} maxLength={254} required disabled={busy} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" maxLength={256} required disabled={busy} /></label>
      <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <a href="/">Back to the customer page</a>
    </form>
  </main>;
}
