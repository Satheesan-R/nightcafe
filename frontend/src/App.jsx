import { useEffect, useRef, useState } from "react";
import "./App.css";
import LegalDialog from "./LegalDialog.jsx";
import AdminAuth from "./admin/AdminAuth.jsx";
import { request, assetUrl } from "./api.js";

const defaultCafeContent = {
  label: "ABOUT AYRA JUICE SHOP",
  eyebrow: "FRESH HEART. LOCAL SOUL.",
  titleLineOne: "A little cafe.",
  titleLineTwo: "A lot to love.",
  description: "Welcome to Ayra Juice Shop — a place for fresh juices, comforting bites, and time well spent. Start with something fruity, settle in with a delicious Appam, or bring your appetite for BBQ. Whatever you're craving, there's something waiting for you.",
  stories: [
    { label: "01 / THE FRESH SIDE", title: "Fruit first.\nHappy always.", description: "Bright and refreshing juice flavours for slow afternoons, quick breaks, and every little moment in between." },
    { label: "02 / THE COMFORT SIDE", title: "From the pan.\nFrom the flame.", description: "Delicate Appam, satisfying snacks, and smoky BBQ. Different cravings. One happy table." },
    { label: "03 / THE GOOD VIBES SIDE", title: "Good food.\nBetter moments.", description: "A welcoming little space to catch up with friends, share a laugh, and make every visit feel special." },
    { label: "04 / THE LOCAL LOVE SIDE", title: "Rooted here.\nMade with love.", description: "Bringing fresh flavours and warm hospitality to our local community, one happy visit at a time." },
  ],
};
function Cup({ type = "orange" }) {
  const cupImages = {
    orange: "/images/ayra-orange-cup.png",
    melon: "/images/ayra-melon-cup.png",
    mango: "/images/ayra-mango-cup.png",
    lime: "/images/ayra-lime-cup.png",
  };
  return (
    <div className={`drink ayra-cup ${type}`} aria-hidden="true">
      <img
        className="ayra-cup-art"
        src={cupImages[type] || cupImages.orange}
        alt=""
        width="1128"
        height="1376"
        decoding="async"
        draggable="false"
      />
    </div>
  );
}
function ProductArt({ item }) {
  if (item.image)
    return <img src={assetUrl(item.image)} alt={item.name} loading="lazy" />;
  if (item.category === "Appam")
    return (
      <div className="appam" aria-hidden="true">
        <span className={item.type} />
      </div>
    );
  return <Cup type={item.type} />;
}
function Brand() {
  return (
    <a className="brand" href="#home" aria-label="Ayra Juice Shop home">
      Ayra<span>Juice Shop</span>
    </a>
  );
}

function StoreLocation() {
  const [search, setSearch] = useState("");
  const matches = "Ayra Juice Shop Pachchilapalli Sri Lanka".toLowerCase().includes(search.trim().toLowerCase());
  const mapsUrl = "https://maps.app.goo.gl/9i9CEYnRwp2E6jrr5";
  return (
    <section className="store-locations section" id="visit" aria-labelledby="locations-title">
      <div className="locations-heading">
        <h2 id="locations-title">Our juice bar <em>in Pallai, Jaffna</em></h2>
        <p>A fresh sip. A happy bite. Find your way to Ayra Juice Shop and make yourself at home.</p>
      </div>
      <div className="location-layout">
        <div className="location-sidebar">
          
          <div aria-live="polite">
            {matches ? <article className="location-card">
              <div className="location-card-title"><h3>Ayra Juice Shop</h3><span aria-label="Selected location">✓</span></div>
              <p>Pachchilapalli, Sri Lanka</p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
            </article> : <p className="location-empty">No matching location. Try “Ayra” or “Pachchilapalli”.</p>}
          </div>
          <p className="location-note">Drop in for a quick refresh or stay for the good food.</p>
          <div className="location-hours">
            <div className="location-hours-main">
              <span>Monday – Sunday</span>
              <strong>9:00 AM – 10:00 PM</strong>
            </div>
            <dl>
              <div><dt>Daytime service</dt><dd>From 9:00 AM</dd></div>
              <div><dt>Night BBQ</dt><dd>Evening serving hours to be confirmed</dd></div>
            </dl>
            <p>Planning a late stop or a group visit? Get in touch before you travel.</p>
            <a href="https://wa.me/94769400150" target="_blank" rel="noopener noreferrer">Message us <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="location-map">
          <iframe title="Google map of Pachchilapalli — the location shared for Ayra Juice Shop" src="https://www.google.com/maps?cid=17931908155513015662&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          <a className="location-map-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">View on Google Maps <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const [reviewsPaused, setReviewsPaused] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    request('/reviews?public=true').then(setReviews).catch((error) => setReviewError(error.message));
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!rating) { setStatus("Please choose a star rating."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const review = { name: data.get("name").trim(), message: data.get("message").trim(), rating };
    if (!review.name || review.message.length < 5) { setStatus("Please add your name and a review of at least 5 characters."); return; }
    setSubmitting(true);
    try {
      await request('/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) });
      setStatus("Thanks! Your review has been saved and will appear after cafe approval.");
      form.reset();
      setRating(0);
    } catch (error) { setStatus(error.message + " Your review was not saved. Please try again."); }
    finally { setSubmitting(false); }
  }
  return (
    <section className="reviews section" id="reviews">
      <div className="reviews-heading">
        <span className="eyebrow">A LITTLE LOVE GOES A LONG WAY</span>
        <h2>
          Good food.
          <br />
          Honest <em>feedback.</em>
        </h2>
        <p className="intro-copy">
          Had a sip, a bite, or a whole feast? Tell us how it made your day.
        </p>
        {reviewError && <p role="alert">{reviewError}</p>}
        {!reviewError && reviews.length === 0 && <p>Be the first to share your experience.</p>}
      </div>
      {reviews.length > 0 && <div className="reviews-showcase">
        <div className={`reviews-marquee${reviewsPaused ? " is-paused" : ""}${reviews.length === 1 ? " single-review" : ""}`} tabIndex={0} role="region" aria-label="Customer reviews. Hover or focus to pause scrolling.">
          <div className="reviews-track" style={{ "--review-duration": `${Math.max(30, reviews.length * 9)}s` }}>
            {[0, ...(reviews.length > 1 ? [1] : [])].map((copy) => <div className="reviews-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {reviews.map((review) => <blockquote className="customer-review-card" key={review._id}>
                <span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                <b className="review-quote" aria-hidden="true">”</b>
                <p>“{review.message}”</p>
                <div className="review-author"><span aria-hidden="true">{review.name.trim().charAt(0).toUpperCase()}</span><cite><strong>{review.name}</strong><small>Ayra customer</small></cite></div>
              </blockquote>)}
            </div>)}
          </div>
        </div>
        {reviews.length > 1 && <button type="button" className="reviews-pause" onClick={() => setReviewsPaused(!reviewsPaused)} aria-pressed={reviewsPaused}>{reviewsPaused ? "Resume reviews ▶" : "Pause reviews Ⅱ"}</button>}
      </div>}
      <form className="review-form" onSubmit={submit}>
        <h3>How was your moment?</h3>
        <fieldset>
          <legend>Your rating</legend>
          <div className="rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="rating"
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                />
                <span
                  aria-hidden="true"
                  className={value <= rating ? "selected" : ""}
                >
                  ★
                </span>
                <span className="sr-only">
                  {value} {value === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="review-name">Your name</label>
        <input
          id="review-name"
          name="name"
          required
          maxLength={70}
          placeholder="What should we call you?"
        />
        <label htmlFor="review-message">Your review</label>
        <textarea
          id="review-message"
          name="message"
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          placeholder="The juice, the food, the feeling…"
        />
        <button className="button dark" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit review"} <span>↗</span>
        </button>
        <p className="form-status" role="status">
          {status || "Reviews are published after cafe approval."}
        </p>
      </form>
    </section>
  );
}
const heroSlides = [
  { image: "/images/orange-juice.jpg", label: "Fresh juices" },
  { image: "/images/grilled-chicken.jpg", label: "Smoky BBQ" },
  { image: "/images/appam.jpg", label: "Fresh Appam" },
  { image: "/images/loaded-fries.jpg", label: "Happy bites" },
];

function HeroBackdrop() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((slide) => (slide + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);
  return <>
    <div className="hero-backdrops" aria-hidden="true">
      {heroSlides.map((slide, index) => <img key={slide.image} src={slide.image} alt="" className={index === active ? "active" : ""} fetchPriority={index === 0 ? "high" : "auto"} />)}
    </div>
    <div className="hero-slide-controls" role="group" aria-label="Hero background slideshow">
      {heroSlides.map((slide, index) => <button key={slide.image} className={index === active ? "active" : ""} aria-label={`Show ${slide.label}`} aria-pressed={index === active} onClick={() => setActive(index)}><span /></button>)}
      <button className="hero-pause" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>{paused ? "▶" : "Ⅱ"}</button>
    </div>
  </>;
}

function CustomerApp() {
  const [items, setItems] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [contentError, setContentError] = useState("");
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [category, setCategory] = useState("Everything");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cafeContent, setCafeContent] = useState(defaultCafeContent);
  const dialog = useRef(null);
  const hero = useRef(null);
  const menuGrid = useRef(null);
  const galleryGrid = useRef(null);
  const aboutSection = useRef(null);
  useEffect(() => {
    Promise.all([request('/products'), request('/cafe-content'), request('/cafe-photos')])
      .then(([products, content, gallery]) => { setItems(products); setCafeContent(content); setPhotos(gallery); })
      .catch((error) => setContentError(error.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;
    const elements = [...aboutSection.current.querySelectorAll(".about-heading, .story-grid > *")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("about-awaiting-reveal");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${(index % 3) * 150}ms`);
      element.classList.add("about-awaiting-reveal");
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("about-awaiting-reveal"));
    };
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;
    const photos = [...galleryGrid.current.querySelectorAll("figure")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("gallery-awaiting-reveal");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    photos.forEach((photo, index) => {
      photo.style.setProperty("--reveal-delay", `${(index % 4) * 150}ms`);
      photo.classList.add("gallery-awaiting-reveal");
      observer.observe(photo);
    });
    return () => {
      observer.disconnect();
      photos.forEach((photo) => photo.classList.remove("gallery-awaiting-reveal"));
    };
  }, [photos]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;
    const cards = [...menuGrid.current.querySelectorAll(".product-card")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("product-awaiting-reveal");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${(index % 4) * 150}ms`);
      card.classList.add("product-awaiting-reveal");
      observer.observe(card);
    });
    return () => {
      observer.disconnect();
      cards.forEach((card) => card.classList.remove("product-awaiting-reveal"));
    };
  }, [category, items]);
  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal();
  }, [selected]);
  function move(event) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)")
        .matches
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    hero.current.style.setProperty(
      "--rx",
      `${(event.clientX - rect.left - rect.width / 2) / 60}deg`,
    );
    hero.current.style.setProperty(
      "--ry",
      `${-(event.clientY - rect.top - rect.height / 2) / 70}deg`,
    );
  }

  return (
    <>
      <a className="skip" href="#menu">
        Skip to menu
      </a>
      <section
        className="hero photo-hero"
        id="home"
        ref={hero}
        onPointerMove={move}
        onPointerLeave={() => {
          hero.current.style.setProperty("--rx", "0deg");
          hero.current.style.setProperty("--ry", "0deg");
        }}
      >
        <HeroBackdrop />
        <header>
          <a className="header-logo" href="#home" aria-label="Ayra Juice Shop home">
            <img src="/images/logo1-transparent.png" alt="Ayra Juice Bar" width="80" height="80" />
          </a>
          <nav className={open ? "open" : ""} aria-label="Main navigation">
            {[
              ["Home", "home"],
              ["Our menu", "menu"],
              ["Our story", "about"],
              ["Reviews", "reviews"],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <a className="visit-button" href="#visit">
            Come say hello <span>↗</span>
          </a>
          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "✕" : "☰"}
          </button>
        </header>
        <div className="photo-hero-content">
          <span className="hero-location"><i /> FRESH FLAVOURS. LOCAL SOUL.</span>
          <h1>Juice shop bar<br />in <span>Pallai.</span></h1>
          <p>Fresh juices, warm Appam and smoky BBQ.<br className="desktop-break" /> A little fresh. A little fire. A whole lot of good times.</p>
          <div className="hero-actions">
            <a className="hero-primary" href="#menu">Explore our menu <span>↗</span></a>
            <a className="hero-secondary" href="#visit">Find us in Pallai <span>↗</span></a>
          </div>
        </div>
        <div className="hero-highlights">
          {[["01", "Fresh juices", "Fruit-filled refreshment"], ["02", "Warm Appam", "Comfort in every bite"], ["03", "Smoky BBQ", "Good food from the flame"], ["04", "Good company", "Your local spot in Pallai"]].map(([number, title, subtitle]) => <div key={number}><span>{number}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>)}
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div>
          {[1, 2, 3, 4].map((i) => (
            <span key={i}>
              {items.length ? items.map((item) => <span key={item._id}>{item.name.toUpperCase()} <b>✳</b></span>) : <>FRESH FLAVOURS <b>✳</b> GOOD FOOD <b>✳</b> GOOD MOOD <b>✳</b></>}
            </span>
          ))}
        </div>
      </div>
      <main>
        <section className="menu-section section" id="menu">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MEET YOUR NEXT CRAVING</span>
              <h2>
                Big on flavour.
                <br />
                <em>Made for you.</em>
              </h2>
            </div>
            
          </div>
          <div className="menu-toolbar">
            <div className="tabs" role="group" aria-label="Filter menu">
              {["Everything", "Juices", "Food", "Appam", "BBQ"].map((tab) => (
                <button
                  key={tab}
                  aria-pressed={category === tab}
                  className={category === tab ? "active" : ""}
                  onClick={() => setCategory(tab)}
                >
                  {tab}
                  {category === tab && <span> ↗</span>}
                </button>
              ))}
            </div>
            <span className="small-note">
              OUR MENU · LKR
            </span>
          </div>
          {loading && <p role="status">Loading café content…</p>}
          {contentError && <p role="alert">{contentError}</p>}
          {!loading && !contentError && items.filter((item) => category === "Everything" || item.category === category).length === 0 && <p>No products available in this category yet.</p>}
          <div className="product-grid" aria-live="polite" ref={menuGrid}>
            {items
              .filter(
                (item) =>
                  category === "Everything" || item.category === category,
              )
              .map((item) => (
                <button
                  className="product-card"
                  key={item._id}
                  onClick={() => setSelected(item)}
                >
                  <div
                    className="product-art"
                    style={{ background: item.color }}
                  >
                    <span className="product-badge">{item.badge}</span>
                    <ProductArt item={item} />
                    <span className="product-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <div className="product-title">
                    <h3>{item.name}</h3>
                    <span>Rs. {item.price.toLocaleString()}</span>
                  </div>
                  <p>{item.flavor}</p>
                </button>
              ))}
          </div>
          <p className="small-note menu-note">
            Ask our team about ingredients and availability.
          </p>
        </section>
        <section className="flavour-banner">
          <div className="banner-word">
            Sip. Bite.
            <br />
            <em>Repeat.</em>
          </div>
          <div className="banner-cup">
            <Cup type="lime" />
          </div>
          <div className="banner-copy">
            <span className="eyebrow">YOUR EVERYDAY HAPPY PLACE</span>
            <p>
              Juice in hand.
              <br />
              Good company.
              <br />
              Nothing else needed.
            </p>
            <a href="#visit" className="text-link">
              Make it a happy day ↗
            </a>
          </div>
          <div className="ribbon" aria-hidden="true">
            <div className="ribbon-track">
              {[0, 1].map((copy) => (
                <span key={copy}>
                  {"ayra juice shop ✳ good food, good mood ✳ ".repeat(4)}
                </span>
              ))}
            </div>
          </div>
        </section>
        <section className="about section" id="about" ref={aboutSection}>
          <div className="about-heading">
            <span className="about-label">{cafeContent.label}</span>
            <span className="eyebrow">{cafeContent.eyebrow}</span>
            <h2>
              {cafeContent.titleLineOne}
              <br /><em>{cafeContent.titleLineTwo}</em>
            </h2>
            <p>{cafeContent.description}</p>
          </div>
          <div className="story-grid">
            <article className="story-note"><span>{cafeContent.stories[0].label}</span><h3>{cafeContent.stories[0].title.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h3><p>{cafeContent.stories[0].description}</p></article>
            <div
              className="fruit-composition about-fruit-composition"
              aria-hidden="true"
            >
              <img
                src="/images/about-fresh-fruits.png"
                alt=""
                width="1024"
                height="1536"
                loading="lazy"
              />
              <i>a little taste of sunshine</i>
            </div>
            {[1, 2, 3].map((storyIndex) => <article className={`story-note ${["second-note", "third-note", "fourth-note"][storyIndex - 1]}`} key={storyIndex}><span>{cafeContent.stories[storyIndex].label}</span><h3>{cafeContent.stories[storyIndex].title.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h3><p>{cafeContent.stories[storyIndex].description}</p></article>)}
          </div>
        </section>
        <section className="gallery section" id="gallery">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE LOOK AROUND</span>
              <h2>
                Our Little <em>Cafe</em>
              </h2>
            </div>
            <span className="small-note">
              MOMENTS AT OUR CAFE
            </span>
          </div>
          <div className="gallery-grid" ref={galleryGrid}>
            {photos.map(({ _id, image, title, alt }) => (
              <figure key={_id}>
                <img
                  src={assetUrl(image)}
                  alt={alt || title}
                  width="900"
                  height="700"
                  loading="lazy"
                />
                <figcaption>{title}</figcaption>
              </figure>
            ))}
          </div>
          <p className="small-note gallery-note">
            {!loading && !contentError && photos.length === 0 ? "Cafe photos coming soon." : "A little glimpse of life at our cafe."}
          </p>
        </section>
        <Reviews />
        <StoreLocation />
      </main>
      <footer className="cafe-footer">
        <div className="footer-columns">
          <div className="footer-intro">
            <Brand />
            <p>Fresh juices, comforting Appam, and smoky BBQ. Crafted with love, served with a smile.</p>

          </div>
          <div className="footer-column footer-contact">
            <h3>Contact Us</h3>
            <a href="https://maps.app.goo.gl/9i9CEYnRwp2E6jrr5" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">⌖</span>Pachchilapalli, Sri Lanka</a>
            <a href="tel:+94769400150"><span aria-hidden="true">☎</span>076 940 0150</a>
            <div className="footer-socials" aria-label="Social media">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook (temporary link)">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8H17V2.4c-.6-.1-1.6-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.5h-3V13h3v9z" /></svg>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram (temporary link)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" aria-label="TikTok (temporary link)">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2h3a5.5 5.5 0 0 0 5 5v3a8.5 8.5 0 0 1-5-1.7V16a6 6 0 1 1-6-6h1v3.1a3 3 0 1 0 2 2.9V2z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal-links">
            <button type="button" onClick={() => setPolicy("privacy")}>Privacy Policy</button>
            <button type="button" onClick={() => setPolicy("terms")}>Terms &amp; Conditions</button>
          </div>
          <span>© {new Date().getFullYear()} Ayra Juice Shop All Rights Reserved.</span>
          <span>A LITTLE FRESHNESS GOES A LONG WAY.</span>
        </div>
      </footer>
      <LegalDialog policy={policy} onClose={() => setPolicy(null)} />
      <dialog
        ref={dialog}
        className="product-dialog"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        {selected && (
          <>
            <button
              className="dialog-close"
              aria-label="Close product details"
              onClick={() => dialog.current.close()}
            >
              ✕
            </button>
            <div className="dialog-art" style={{ background: selected.color }}>
              <ProductArt item={selected} />
            </div>
            <div className="dialog-copy">
              <span className="eyebrow">{selected.category}</span>
              <h2>{selected.name}</h2>
              <p>{selected.flavor}</p>
              <strong>Rs. {selected.price.toLocaleString()}</strong>
              <p className="small-note">
                Prices in LKR. Please check ingredients and allergens with the cafe
                before ordering.
              </p>
              <button
                className="button dark"
                onClick={() => dialog.current.close()}
              >
                Back to the menu <span>↗</span>
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

export default function App() {
  return /^\/admin(?:\/|$)/.test(window.location.pathname) ? <AdminAuth /> : <CustomerApp />;
}
