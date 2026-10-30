import { useEffect, useRef, useState } from "react";
import "./App.css";
import CitrusCascade from "./CitrusCascade.jsx";
import LegalDialog from "./LegalDialog.jsx";

const items = [
  {
    name: "Orange sunshine",
    category: "Juices",
    price: 450,
    flavor: "Orange · freshly squeezed",
    type: "orange",
    color: "#ffe2a3",
    badge: "THE CLASSIC",
  },
  {
    name: "Watermelon wave",
    category: "Juices",
    price: 400,
    flavor: "Watermelon · a little lime",
    type: "melon",
    color: "#f5ccd0",
    badge: "SUMMER IN A CUP",
  },
  {
    name: "Mango mood",
    category: "Juices",
    price: 550,
    flavor: "Mango · tropical goodness",
    type: "mango",
    color: "#f7e6a1",
    badge: "TROPICAL PICK",
  },
  {
    name: "Lime & easy",
    category: "Juices",
    price: 350,
    flavor: "Lime · mint · cool refreshment",
    type: "lime",
    color: "#dbe5ba",
    badge: "KEEP IT COOL",
  },
  {
    name: "Loaded crispy fries",
    category: "Food",
    price: 650,
    flavor: "Fries · cheese · house topping",
    image: "photo-1573080496219-bb080dd4f877",
    color: "#f6dfba",
    badge: "SNACK TIME",
  },
  {
    name: "Classic egg Appam",
    category: "Appam",
    price: 250,
    flavor: "Lacy edges · soft centre · egg",
    type: "appam",
    color: "#eee1c7",
    badge: "LOCAL LOVE",
  },
  {
    name: "Coconut milk Appam",
    category: "Appam",
    price: 200,
    flavor: "Coconut milk · a touch of sweetness",
    type: "milk",
    color: "#e8e6d1",
    badge: "COMFORT FOOD",
  },
  {
    name: "Flame grilled chicken",
    category: "BBQ",
    price: 1200,
    flavor: "Smoky chicken · house marinade",
    image: "photo-1532550907401-a500c9a57435",
    color: "#ebc8b3",
    badge: "OFF THE GRILL",
  },
];
const photo = (id) =>
  ({
    "photo-1613478223719-2ab802602423": "/images/orange-juice.jpg",
    "photo-1573080496219-bb080dd4f877": "/images/loaded-fries.jpg",
    "photo-1532550907401-a500c9a57435": "/images/grilled-chicken.jpg",
  })[id];
function Cup({ type = "orange" }) {
  return (
    <div className={`drink ${type}`} aria-hidden="true">
      <div className="straw" />
      <div className="lid" />
      <div className="cup">
        <span className="cup-top">GOOD THINGS INSIDE</span>
        <b>
          Ayra<span>Juice Shop</span>
        </b>
        <div className="cup-fruit">{type === "melon" ? "◒" : "✳"}</div>
        <strong>
          {
            {
              orange: "SWEET ORANGE",
              melon: "WATERMELON",
              mango: "MANGO MOOD",
              lime: "LIME & MINT",
            }[type]
          }
        </strong>
        <small>FRESHLY MADE. HAPPY DAYS.</small>
      </div>
    </div>
  );
}
function ProductArt({ item }) {
  if (item.image)
    return <img src={photo(item.image)} alt={item.name} loading="lazy" />;
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
        <h2 id="locations-title">Our store <em>location</em></h2>
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
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nighi-review-draft") || "null");
    } catch {
      return null;
    }
  });
  function submit(event) {
    event.preventDefault();
    if (!rating) {
      setStatus("Please choose a star rating.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const review = {
      name: data.get("name").trim(),
      message: data.get("message").trim(),
      rating,
    };
    if (!review.name || !review.message) {
      setStatus("Please add your name and a short review.");
      return;
    }
    try {
      localStorage.setItem("nighi-review-draft", JSON.stringify(review));
      setSaved(review);
      setStatus(
        "Saved on this device. Online submission will be available when the cafe launches.",
      );
      event.currentTarget.reset();
      setRating(0);
    } catch {
      setStatus(
        "Your browser could not save this review. Please enable browser storage and try again.",
      );
    }
  }
  return (
    <section className="reviews section" id="reviews">
      <div>
        <span className="eyebrow">A LITTLE LOVE GOES A LONG WAY</span>
        <h2>
          Good food.
          <br />
          Honest <em>feedback.</em>
        </h2>
        <p className="intro-copy">
          Had a sip, a bite, or a whole feast? Tell us how it made your day.
        </p>
        <div className="review-stars" aria-hidden="true">
          ✳ ✳ ✳
        </div>
        <span className="small-note">
          Review preview · saved on your device only
        </span>
        {saved && (
          <blockquote>
            <span aria-label={`${saved.rating} out of 5 stars`}>
              {"★".repeat(saved.rating)}
              {"☆".repeat(5 - saved.rating)}
            </span>
            <p>“{saved.message}”</p>
            <cite>— {saved.name} · Your saved review</cite>
          </blockquote>
        )}
      </div>
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
        <button className="button dark" type="submit">
          Save my review <span>↗</span>
        </button>
        <p className="form-status" role="status">
          {status || "Demo only. Reviews are not sent to the cafe yet."}
        </p>
      </form>
    </section>
  );
}
export default function App() {
  const [policy, setPolicy] = useState(null);
  const [category, setCategory] = useState("Everything");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const hero = useRef(null);
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
        className="hero citrus-hero"
        id="home"
        ref={hero}
        onPointerMove={move}
        onPointerLeave={() => {
          hero.current.style.setProperty("--rx", "0deg");
          hero.current.style.setProperty("--ry", "0deg");
        }}
      >
        <header>
          <Brand />
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
        <div className="hero-title">
          <span className="eyebrow">✳ &nbsp; FRESH SIPS. HAPPY BITES.</span>
          <h1>
            Squeeze <br className="mobile-break" />
            the <em>day.</em>
          </h1>
        </div>
        <div className="hero-scene citrus-scene">
          <div className="original-juice-cups" aria-hidden="true">
            <div className="hero-cup left-cup">
              <Cup type="orange" />
            </div>
            <div className="hero-cup right-cup">
              <Cup type="melon" />
            </div>
            <div className="hero-cup front-cup">
              <Cup type="mango" />
            </div>
          </div>
          <CitrusCascade />
          <span className="citrus-spark" aria-hidden="true">
            ✳
          </span>
        </div>
        <div className="hero-bottom">
          <div>
            <p>
              A little fresh. A little fire.
              <br />A whole lot of good times.
            </p>
            <a className="button lime-button" href="#menu">
              Explore our menu <span>↗</span>
            </a>
          </div>
          <div className="fresh-stamp">
            <span>MADE FRESH</span>
            <b>100%</b>
            <span>GOOD MOOD</span>
          </div>
          
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div>
          {[1, 2, 3, 4].map((i) => (
            <span key={i}>
              ORANGE SUNSHINE <b>✳</b>WATERMELON WAVE<b>✳</b>GRILLED CHICKEN<b>✳</b>LIME<b>✳</b>EGG APPAM<b>✳</b> MANGO MOOD{" "}
              <b>✳</b>
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
              SAMPLE MENU · LKR · PRICES TO BE CONFIRMED
            </span>
          </div>
          <div className="product-grid" aria-live="polite">
            {items
              .filter(
                (item) =>
                  category === "Everything" || item.category === category,
              )
              .map((item) => (
                <button
                  className="product-card"
                  key={item.name}
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
            A taste of what’s coming. Menu items, ingredients and prices are
            illustrative until confirmed by the cafe.
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
            ayra juice shop ✳ good food, good mood ✳ ayra juice shop ✳ good food, good
            mood ✳
          </div>
        </section>
        <section className="about section" id="about">
          <div className="about-heading">
            <span className="about-label">ABOUT AYRA JUICE SHOP</span>
            <span className="eyebrow">FRESH HEART. LOCAL SOUL.</span>
            <h2>
              A little cafe.
              <br />A lot to <em>love.</em>
            </h2>
            <p>
              Welcome to Ayra Juice Shop — a place for fresh juices, comforting
              bites, and time well spent. Start with something fruity, settle in
              with a delicious Appam, or bring your appetite for BBQ. Whatever
              you're craving, there's something waiting for you.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-note">
              <span>01 / THE FRESH SIDE</span>
              <h3>
                Fruit first.
                <br />
                Happy always.
              </h3>
              <p>
                Bright and refreshing juice flavours for slow afternoons, quick
                breaks, and every little moment in between.
              </p>
            </article>
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
            <article className="story-note second-note">
              <span>02 / THE COMFORT SIDE</span>
              <h3>
                From the pan.
                <br />
                From the flame.
              </h3>
              <p>
                Delicate Appam, satisfying snacks, and smoky BBQ. Different
                cravings. One happy table.
              </p>
            </article>
            <article className="story-note third-note">
              <span>03 / THE GOOD VIBES SIDE</span>
              <h3>
                Good food.
                <br />
                Better moments.
              </h3>
              <p>
                A welcoming little space to catch up with friends, share a
                laugh, and make every visit feel special.
              </p>
            </article>
            <article className="story-note fourth-note">
              <span>04 / THE LOCAL LOVE SIDE</span>
              <h3>
                Rooted here.
                <br />
                Made with love.
              </h3>
              <p>
                Bringing fresh flavours and warm hospitality to our local
                community, one happy visit at a time.
              </p>
            </article>
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
              CAFE MOODBOARD · PLACEHOLDER PHOTOS
            </span>
          </div>
          <div className="gallery-grid">
            {[
              ["cafe-interior", "Come on in", "A welcoming cafe interior"],
              ["cosy-corner", "Your cosy corner", "Comfortable cafe seating"],
              [
                "at-the-counter",
                "Behind the counter",
                "A cafe counter and service area",
              ],
              [
                "coffee-moments",
                "Little everyday moments",
                "Freshly prepared coffee",
              ],
              [
                "window-seat",
                "Stay a little longer",
                "A light-filled cafe space",
              ],
              [
                "around-the-table",
                "Meet you at the table",
                "Tables in a neighbourhood cafe",
              ],
              [
                "freshly-made",
                "Made for a slow afternoon",
                "A warm drink served in a cafe",
              ],
              [
                "evening-mood",
                "Time to unwind",
                "A relaxed coffee moment at a cafe",
              ],
              [
                "room-for-friends",
                "Room for good company",
                "A welcoming dining space",
              ],
            ].map(([id, title, alt]) => (
              <figure key={id}>
                <img
                  src={`/images/cafe/${id}.jpg`}
                  alt={`${alt} — placeholder, not a photo of Ayra Juice Shop`}
                  width="900"
                  height="700"
                  loading="lazy"
                />
                <figcaption>{title}</figcaption>
              </figure>
            ))}
          </div>
          <p className="small-note gallery-note">
            A glimpse of the atmosphere we love. These illustrative photos will
            be replaced with real moments from Ayra Juice Shop.
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
            <a className="footer-whatsapp" href="https://wa.me/94769400150" target="_blank" rel="noopener noreferrer">WhatsApp us ↗</a>
          </div>
          <nav className="footer-column" aria-label="Footer quick links">
            <h3>Quick Links</h3>
            {[["Home", "home"], ["Menu", "menu"], ["About", "about"], ["Gallery", "gallery"], ["Reviews", "reviews"], ["Visit us", "visit"]].map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>
          <div className="footer-column">
            <h3>Our Products</h3>
            {[["Fresh Juices", "Juices"], ["Food & Snacks", "Food"], ["Appam", "Appam"], ["BBQ", "BBQ"]].map(([label, tab]) => <a key={tab} href="#menu" onClick={() => setCategory(tab)}>{label}</a>)}
          </div>
          <div className="footer-column footer-contact">
            <h3>Contact Us</h3>
            <a href="https://maps.app.goo.gl/9i9CEYnRwp2E6jrr5" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">⌖</span>Pachchilapalli, Sri Lanka</a>
            <a href="tel:+94769400150"><span aria-hidden="true">☎</span>076 940 0150</a>
            <a href="https://wa.me/94769400150" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span>Message us on WhatsApp</a>
            <p><span aria-hidden="true">◷</span>Open Daily: 9 AM – 10 PM</p>
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
              <span className="eyebrow">{selected.category} · SAMPLE ITEM</span>
              <h2>{selected.name}</h2>
              <p>{selected.flavor}</p>
              <strong>Rs. {selected.price.toLocaleString()}</strong>
              <p className="small-note">
                Sample price in LKR. Final menu, portions and availability to be
                confirmed. Please check ingredients and allergens with the cafe
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
