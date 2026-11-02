import { useEffect, useState } from 'react';
import { API, assetUrl, adminFetch, request } from '../api.js';

const emptyPhoto = { title: '', alt: '', image: '' };

export default function CafePhotos() {
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(emptyPhoto);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    request('/cafe-photos').then(setPhotos).catch((error) => setError(error.message));
  }, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await adminFetch(`${API}/uploads`, { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Upload failed.');
      setForm((current) => ({ ...current, image: result.url }));
      setNotice('Image uploaded. Save the photo to publish it.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await request(`/cafe-photos${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(emptyPhoto);
      setEditing(null);
      setNotice('Cafe photo saved and published.');
      setPhotos(await request('/cafe-photos'));
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this cafe photo?')) return;
    setBusy(true);
    setError('');
    try {
      await request(`/cafe-photos/${id}`, { method: 'DELETE' });
      setPhotos((current) => current.filter((photo) => photo._id !== id));
      if (editing === id) { setEditing(null); setForm(emptyPhoto); }
      setNotice('Cafe photo deleted.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return <div className="admin-content">
    <div className="admin-section-intro"><h2>Cafe photos</h2><span>Manage the customer gallery</span></div>
    {error && <p className="admin-alert error" role="alert">{error}</p>}
    {notice && <p className="admin-alert success" role="status">{notice}</p>}
    <form className="admin-panel product-editor" onSubmit={save}>
      <h3>{editing ? 'Edit photo' : 'Add a cafe photo'}</h3>
      <fieldset disabled={busy} className="admin-form-grid">
        <label>Caption<input name="title" value={form.title} onChange={change} maxLength={120} required /></label>
        <label>Image description<input name="alt" value={form.alt} onChange={change} maxLength={200} /></label>
        <label className="wide">Image URL<input name="image" value={form.image} onChange={change} required placeholder="/uploads/cafe.jpg or https://…" /></label>
        <label className="wide">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
      </fieldset>
      {form.image && <img src={assetUrl(form.image)} alt={form.alt || form.title} style={{ maxWidth: '240px', maxHeight: '180px', objectFit: 'cover' }} />}
      <div className="row-actions"><button className="admin-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save photo'}</button>{editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm(emptyPhoto); }}>Cancel</button>}</div>
    </form>
    <section className="admin-panel">
      {photos.length === 0 && <p>No cafe photos yet. Add your first photo above.</p>}
      {photos.map((photo) => <div className="product-admin-row" key={photo._id}>
        <div className="admin-thumb"><img src={assetUrl(photo.image)} alt={photo.alt || photo.title} /></div>
        <div className="product-admin-info"><strong>{photo.title}</strong><span>{photo.alt}</span></div>
        <div className="row-actions"><button disabled={busy} onClick={() => { setEditing(photo._id); setForm({ title: photo.title, alt: photo.alt || '', image: photo.image }); }}>Edit</button><button disabled={busy} className="danger" onClick={() => remove(photo._id)}>Delete</button></div>
      </div>)}
    </section>
  </div>;
}
