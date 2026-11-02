import "./config.js";
import { security } from "./config.js";
import { receiveImage, saveImage } from "./uploads.js";
import { authRouter, requireAdmin, protectWrites } from "./auth.js";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;
// Resolve relative settings against this module, never the process working directory.
export const uploadDirectory = path.resolve(__dirname, process.env.UPLOAD_DIR?.trim() || "uploads");
const frontendDirectory = path.join(__dirname, "..", "frontend", "dist");
const bundledUploadDirectory = path.join(__dirname, "seed-uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
fs.accessSync(uploadDirectory, fs.constants.R_OK | fs.constants.W_OK);

app.disable('x-powered-by');
app.set('trust proxy', security.trustProxy);
app.use((_request, response, next) => {
  response.set('X-Content-Type-Options', 'nosniff');
  next();
});
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://ayrajuicebar.com",
    "https://www.ayrajuicebar.com",
    security.frontendUrl,
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDirectory, { setHeaders: (response) => {
  response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
} }));
// Existing image backups ship with the app. Runtime/persistent uploads take
// precedence; missing legacy files can still be served without changing DB paths.
app.use("/uploads", express.static(bundledUploadDirectory, { setHeaders: (response) => {
  response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
} }));
app.use(express.static(frontendDirectory));
app.use("/api/auth", authRouter);
app.use("/api", protectWrites);
app.get("/api/health", (_request, response) => response.json({ ok: true }));

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, enum: ["Juices", "Food", "Appam", "BBQ"] },
  price: { type: Number, required: true, min: 0 },
  flavor: { type: String, required: true, trim: true, maxlength: 140 },
  image: { type: String, default: "" },
  badge: { type: String, default: "NEW", maxlength: 30 },
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 70 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  status: { type: String, enum: ["pending", "approved", "hidden", "deleted"], default: "pending" },
}, { timestamps: true });

const cafeContentSchema = new mongoose.Schema({
  label: { type: String, default: "ABOUT AYRA JUICE SHOP", maxlength: 80 },
  eyebrow: { type: String, default: "FRESH HEART. LOCAL SOUL.", maxlength: 80 },
  titleLineOne: { type: String, default: "A little cafe.", maxlength: 80 },
  titleLineTwo: { type: String, default: "A lot to love.", maxlength: 80 },
  description: { type: String, maxlength: 500 },
  stories: [{
    label: { type: String, maxlength: 80 },
    title: { type: String, maxlength: 120 },
    description: { type: String, maxlength: 300 },
  }],
}, { timestamps: true });

const cafePhotoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  alt: { type: String, trim: true, maxlength: 200, default: "" },
  image: { type: String, required: true, trim: true },
}, { timestamps: true });
const CafePhoto = mongoose.model("CafePhoto", cafePhotoSchema);

const Product = mongoose.model("Product", productSchema);
const Review = mongoose.model("Review", reviewSchema);
const CafeContent = mongoose.model("CafeContent", cafeContentSchema);
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

app.get("/api/products", async (_request, response, next) => {
  try { response.json(await Product.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
});
app.post("/api/products", async (request, response, next) => {
  try { response.status(201).json(await Product.create(request.body)); } catch (error) { next(error); }
});
app.put("/api/products/:id", async (request, response, next) => {
  try {
    const product = await Product.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true });
    if (!product) return response.status(404).json({ message: "Product not found." });
    response.json(product);
  } catch (error) { next(error); }
});
app.delete("/api/products/:id", async (request, response, next) => {
  try {
    const product = await Product.findByIdAndDelete(request.params.id);
    if (!product) return response.status(404).json({ message: "Product not found." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/cafe-content", async (_request, response, next) => {
  try {
    const content = await CafeContent.findOne();
    response.json(content || await CafeContent.create(defaultCafeContent));
  } catch (error) { next(error); }
});
app.put("/api/cafe-content", async (request, response, next) => {
  try {
    const content = await CafeContent.findOneAndUpdate({}, request.body, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    response.json(content);
  } catch (error) { next(error); }
});

app.get("/api/cafe-photos", async (_request, response, next) => {
  try { response.json(await CafePhoto.find().sort({ createdAt: 1 })); } catch (error) { next(error); }
});
app.post("/api/cafe-photos", async (request, response, next) => {
  try { response.status(201).json(await CafePhoto.create(request.body)); } catch (error) { next(error); }
});
app.put("/api/cafe-photos/:id", async (request, response, next) => {
  try {
    const photo = await CafePhoto.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true });
    if (!photo) return response.status(404).json({ message: "Photo not found." });
    response.json(photo);
  } catch (error) { next(error); }
});
app.delete("/api/cafe-photos/:id", async (request, response, next) => {
  try {
    const photo = await CafePhoto.findByIdAndDelete(request.params.id);
    if (!photo) return response.status(404).json({ message: "Photo not found." });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/reviews", (request, response, next) => request.query.public === "true" ? next() : requireAdmin(request, response, next), async (request, response, next) => {
  try {
    const filter = request.query.public === "true" ? { status: "approved" } : { status: { $ne: "deleted" } };
    response.json(await Review.find(filter).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});
app.post("/api/reviews", async (request, response, next) => {
  try { response.status(201).json(await Review.create({ name: request.body.name, message: request.body.message, rating: request.body.rating, status: "pending" })); } catch (error) { next(error); }
});
app.patch("/api/reviews/:id", async (request, response, next) => {
  try {
    const review = await Review.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true, runValidators: true });
    if (!review) return response.status(404).json({ message: "Review not found." });
    response.json(review);
  } catch (error) { next(error); }
});

app.post("/api/uploads", receiveImage, saveImage(uploadDirectory));

app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api") || request.path.startsWith("/uploads")) return next();
  response.sendFile(path.join(frontendDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _request, response, _next) => {
  if (error.name === 'MulterError') {
    return response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: 'Upload exactly one image, at most 5 MB, with no extra fields.' });
  }
  if (error.status === 400) return response.status(400).json({ message: error.message });
  if ([502, 503].includes(error.status)) return response.status(error.status).json({ message: error.message });
  console.error(error);
  response.status(error.name === "ValidationError" ? 400 : 500).json({ message: error.name === "ValidationError" ? error.message : "Server error." });
});

export { app };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is required. Add it to .env before starting the API.");
    process.exitCode = 1;
  } else {
    mongoose.connect(mongoUri)
      .then(async () => {
        if (!await CafeContent.exists({})) await CafeContent.create(defaultCafeContent);
        app.listen(port, () => {
          console.log(`Ayra API listening on http://localhost:${port}`);
          console.log(`Serving /uploads from ${uploadDirectory}`);
          if (security.production && !process.env.UPLOAD_DIR?.trim() && !process.env.CLOUDINARY_CLOUD_NAME?.trim()) {
            console.warn('Uploads use the local backend/uploads directory. Configure persistent storage to retain images across deploys.');
          }
        });
      })
      .catch((error) => {
        console.error("MongoDB connection failed.");
        console.error(error.message);
        console.error("For MongoDB Atlas, add this machine's public IP under Security > Network Access, then restart the backend.");
        process.exitCode = 1;
      });
  }
}
