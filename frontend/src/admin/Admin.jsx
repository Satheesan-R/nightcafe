import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

import { API, assetUrl, adminFetch } from "../api.js";
import CafePhotos from "./CafePhotos.jsx";
const emptyProduct = { name: "", category: "Juices", price: "", flavor: "", image: "", badge: "NEW" };
const emptyCafe = { label: "ABOUT AYRA JUICE SHOP", eyebrow: "FRESH HEART. LOCAL SOUL.", titleLineOne: "A little cafe.", titleLineTwo: "A lot to love.", description: "", stories: [1, 2, 3, 4].map(() => ({ label: "", title: "", description: "" })) };

function Stars({ value }) {
  return <span className="admin-stars" aria-label={`${value} out of 5 stars`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
}

export default function Admin({ admin, logout }) {
  const [section, setSection] = useState("Overview");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cafe, setCafe] = useState(emptyCafe);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [productResponse, reviewResponse, cafeResponse] = await Promise.all([
        adminFetch(`${API}/products`),
        adminFetch(`${API}/reviews`),
        adminFetch(`${API}/cafe-content`),
      ]);
      if (!productResponse.ok || !reviewResponse.ok || !cafeResponse.ok) throw new Error("The API returned an error.");
      setProducts(await productResponse.json());
      setReviews(await reviewResponse.json());
      setCafe(await cafeResponse.json());
    } catch (requestError) {
      setError(`${requestError.message} Start the API with "npm run server" and check MONGODB_URI.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    products: products.length,
    reviews: reviews.length,
    rating: reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "—",
  }), [products, reviews]);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function uploadImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await adminFetch(`${API}/uploads`, { method: "POST", body });
      if (!response.ok) throw new Error("Image upload failed.");
      const result = await response.json();
      setForm((current) => ({ ...current, image: result.url }));
      setNotice("Image uploaded. Save the product to publish it.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await adminFetch(`${API}/products${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Could not save product.");
      setNotice(editingId ? "Product updated." : "Product added.");
      setForm(emptyProduct);
      setEditingId(null);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    const response = await adminFetch(`${API}/products/${id}`, { method: "DELETE" });
    if (!response.ok) setError("Could not delete the product.");
    else { setNotice("Product deleted."); await load(); }
  }

  async function moderateReview(id, status) {
    const response = await adminFetch(`${API}/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) setError("Could not update the review.");
    else { setNotice(`Review ${status}.`); await load(); }
  }

  function updateCafe(event) {
    const { name, value } = event.target;
    setCafe((current) => ({ ...current, [name]: value }));
  }

  function updateStory(index, event) {
    const stories = cafe.stories.map((story, storyIndex) => storyIndex === index ? { ...story, [event.target.name]: event.target.value } : story);
    setCafe({ ...cafe, stories });
  }

  async function saveCafe(event) {
    event.preventDefault();
    setError("");
    const response = await adminFetch(`${API}/cafe-content`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cafe) });
    if (!response.ok) {
      setError((await response.json()).message || "Could not save cafe content.");
      return;
    }
    setCafe(await response.json());
    setNotice("Our little cafe section updated.");
  }

  function editProduct(product) {
    setSection("Products");
    setEditingId(product._id);
    setForm({ name: product.name, category: product.category, price: product.price, flavor: product.flavor, image: product.image || "", badge: product.badge || "NEW" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">Ayra<span>Juice Shop</span></a>
        <p className="admin-label">Workspace</p>
        {["Overview", "Products", "Our little cafe", "Cafe photos", "Reviews"].map((item) => (
          <button key={item} className={section === item ? "admin-nav active" : "admin-nav"} onClick={() => setSection(item)}>
            <span>{item === "Overview" ? "▦" : item === "Products" ? "◇" : "☆"}</span>{item}
          </button>
        ))}
        <a className="admin-view-site" href="/">← View website</a>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><p className="admin-kicker">AYRA JUICE SHOP / ADMIN</p><h1>{section}</h1></div><div className="admin-user"><span>{admin.name.slice(0, 2).toUpperCase()}</span><strong>{admin.name}</strong><button className="admin-primary" onClick={logout}>Sign out</button></div></header>
        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {notice && <div className="admin-alert success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
        {loading ? <div className="admin-loading">Loading your cafe data…</div> : (
          <>
            {section === "Overview" && <Overview stats={stats} products={products} reviews={reviews} go={setSection} />}
            {section === "Products" && <Products products={products} form={form} editingId={editingId} updateForm={updateForm} saveProduct={saveProduct} editProduct={editProduct} removeProduct={removeProduct} uploadImage={uploadImage} uploading={uploading} cancel={() => { setEditingId(null); setForm(emptyProduct); }} />}
            {section === "Our little cafe" && <CafeEditor cafe={cafe} updateCafe={updateCafe} updateStory={updateStory} saveCafe={saveCafe} />}
            {section === "Cafe photos" && <CafePhotos />}
            {section === "Reviews" && <Reviews reviews={reviews} moderateReview={moderateReview} />}
          </>
        )}
      </main>
    </div>
  );
}

function CafeEditor({ cafe, updateCafe, updateStory, saveCafe }) {
  return <div className="admin-content">
    <div className="admin-section-intro"><div><span className="admin-kicker">PUBLIC PAGE CONTENT</span><h2>Our little cafe</h2></div><span>Edit the story shown on the homepage</span></div>
    <form className="admin-panel cafe-editor" onSubmit={saveCafe}>
      <div className="panel-heading"><h3>About section</h3><span>Changes publish immediately</span></div>
      <div className="admin-form-grid">
        <label>Section label<input name="label" value={cafe.label} onChange={updateCafe} maxLength={80} required /></label>
        <label>Eyebrow<input name="eyebrow" value={cafe.eyebrow} onChange={updateCafe} maxLength={80} required /></label>
        <label>Heading line one<input name="titleLineOne" value={cafe.titleLineOne} onChange={updateCafe} maxLength={80} required /></label>
        <label>Heading line two<input name="titleLineTwo" value={cafe.titleLineTwo} onChange={updateCafe} maxLength={80} required /></label>
        <label className="wide">Introduction<textarea name="description" value={cafe.description} onChange={updateCafe} maxLength={500} rows={4} required /></label>
      </div>
      <h3 className="cafe-stories-title">Story cards</h3>
      <div className="cafe-stories-editor">{cafe.stories.map((story, index) => <fieldset key={index}><legend>Story {index + 1}</legend><label>Label<input name="label" value={story.label} onChange={(event) => updateStory(index, event)} maxLength={80} required /></label><label>Title<textarea name="title" value={story.title} onChange={(event) => updateStory(index, event)} maxLength={120} rows={2} required /></label><label>Description<textarea name="description" value={story.description} onChange={(event) => updateStory(index, event)} maxLength={300} rows={3} required /></label></fieldset>)}</div>
      <button className="admin-primary" type="submit">Save cafe section ↗</button>
    </form>
  </div>;
}

function Overview({ stats, products, reviews, go }) {
  return <div className="admin-content">
    <div className="admin-welcome"><div><span className="admin-kicker">GOOD MORNING, ADMIN</span><h2>Keep the good stuff<br /><em>flowing.</em></h2></div><button className="admin-primary" onClick={() => go("Products")}>+ Add product</button></div>
    <div className="admin-stat-grid"><Stat label="Menu products" value={stats.products} detail="Active items" /><Stat label="Reviews" value={stats.reviews} detail="All submissions" /><Stat label="Average rating" value={stats.rating} detail="Across reviews" /></div>
    <div className="admin-two-column"><section className="admin-panel"><div className="panel-heading"><h3>Menu snapshot</h3><button onClick={() => go("Products")}>Manage ↗</button></div>{products.slice(0, 5).map((product) => <div className="admin-list-row" key={product._id}><div className="admin-thumb">{product.image ? <img src={assetUrl(product.image)} alt="" /> : "✳"}</div><div><strong>{product.name}</strong><small>{product.category}</small></div><b>Rs. {product.price.toLocaleString()}</b></div>)}</section><section className="admin-panel"><div className="panel-heading"><h3>Latest reviews</h3><button onClick={() => go("Reviews")}>Moderate ↗</button></div>{reviews.slice(0, 4).map((review) => <div className="admin-review-row" key={review._id}><div><strong>{review.name}</strong><Stars value={review.rating} /></div><span className={`review-status ${review.status}`}>{review.status}</span><p>{review.message}</p></div>)}</section></div>
  </div>;
}

function Stat({ label, value, detail }) {
  return <div className="admin-stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Products({ products, form, editingId, updateForm, saveProduct, editProduct, removeProduct, uploadImage, uploading, cancel }) {
  return <div className="admin-content"><div className="admin-section-intro"><div><span className="admin-kicker">MENU MANAGEMENT</span><h2>Products</h2></div><span>{products.length} items in your menu</span></div><form className="product-editor admin-panel" onSubmit={saveProduct}><div className="panel-heading"><h3>{editingId ? "Edit product" : "Add a new product"}</h3>{editingId && <button type="button" onClick={cancel}>Cancel</button>}</div><div className="admin-form-grid"><label>Product name<input name="name" value={form.name} onChange={updateForm} required maxLength={80} placeholder="e.g. Mango mood" /></label><label>Category<select name="category" value={form.category} onChange={updateForm}>{["Juices", "Food", "Appam", "BBQ"].map((category) => <option key={category}>{category}</option>)}</select></label><label>Price (LKR)<input name="price" type="number" min="0" value={form.price} onChange={updateForm} required placeholder="550" /></label><label>Badge<input name="badge" value={form.badge} onChange={updateForm} maxLength={30} placeholder="TROPICAL PICK" /></label><label className="wide">Description<input name="flavor" value={form.flavor} onChange={updateForm} required maxLength={140} placeholder="Mango · tropical goodness" /></label><label className="wide">Image URL<input name="image" value={form.image} onChange={updateForm} placeholder="/uploads/product.jpg or an image URL" /></label><label className="wide file-field">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} />{uploading && <small>Uploading…</small>}</label></div><button className="admin-primary" type="submit">{editingId ? "Save changes" : "Add product"} ↗</button></form><section className="admin-panel product-table"><div className="panel-heading"><h3>All products</h3><span>CRUD inventory</span></div>{products.map((product) => <div className="product-admin-row" key={product._id}><div className="admin-thumb">{product.image ? <img src={assetUrl(product.image)} alt="" /> : "✳"}</div><div className="product-admin-info"><strong>{product.name}</strong><span>{product.category} · {product.flavor}</span></div><b>Rs. {product.price.toLocaleString()}</b><div className="row-actions"><button onClick={() => editProduct(product)}>Edit</button><button className="danger" onClick={() => removeProduct(product._id)}>Delete</button></div></div>)}</section></div>;
}

function Reviews({ reviews, moderateReview }) {
  return <div className="admin-content"><div className="admin-section-intro"><div><span className="admin-kicker">CUSTOMER VOICE</span><h2>Reviews</h2></div><span>Approve, hide, or remove feedback</span></div><section className="admin-panel reviews-table">{reviews.length === 0 && <p className="admin-empty">No reviews yet.</p>}{reviews.map((review) => <article className="review-admin-card" key={review._id}><div className="review-admin-head"><div><strong>{review.name}</strong><Stars value={review.rating} /><small>{new Date(review.createdAt).toLocaleDateString()}</small></div><span className={`review-status ${review.status}`}>{review.status}</span></div><p>“{review.message}”</p><div className="row-actions"><button onClick={() => moderateReview(review._id, "approved")}>Approve</button><button onClick={() => moderateReview(review._id, "hidden")}>Hide</button><button className="danger" onClick={() => moderateReview(review._id, "deleted")}>Delete</button></div></article>)}</section></div>;
}
