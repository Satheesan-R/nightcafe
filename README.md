# Nighi Cafe

A responsive React and Vite customer website inspired by the supplied drink-brand video: orange-red and cream sections, lime accents, dimensional CSS juice cups, floating motion, and pointer parallax.

## Project structure

- `frontend/`: React customer page, admin login, and admin dashboard.
- `backend/`: Express API, Mongoose schemas, authentication, and uploaded images.
- Root `package.json`: npm workspaces and commands for both applications.

The browser communicates with the backend API; only the backend connects to MongoDB. MongoDB collections are `products`, `cafecontents`, `cafephotos`, `reviews`, `admins`, `adminsessions`, and `loginattempts`. Mongoose creates these through the defined schemas when needed; manual SQL tables are not required.

## Local setup

1. Run `npm install` from the repository root.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` (including your database name).
3. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `backend/.env`.
4. Run `npm run create-admin` once. This creates an admin with a salted password hash in MongoDB; existing accounts are not overwritten. Remove `ADMIN_PASSWORD` from the file afterward. There is no public admin registration endpoint.
5. Run `npm run dev:full` from the root. Open the Vite URL for the customer page and `/admin/login` to sign in. Successful login opens `/admin`; visiting `/admin` without a valid session shows the login form.

The frontend uses `/api` by default. Vite proxies `/api` and `/uploads` to port 5000. For a different backend URL, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`; rebuild after changing it. Database and admin credentials belong only in `backend/.env`.

- `npm run dev`: frontend development server.
- `npm run server`: backend API.
- `npm run build`: frontend production build in `frontend/dist/`.
- `npm run preview`: frontend build preview (requires production API routing).
- `npm test`: API and authentication tests using mocked database operations.
- `npm run lint`: frontend and backend checks.

Work on `development` and submit pull requests into `main`.

## Content and login

The customer page loads products, cafe details, photos, and approved reviews from the API. The admin can add/edit/delete products and gallery photos, update the cafe story, and approve/hide/delete reviews. An empty database shows an empty menu and gallery until content is added. Reload the customer page to see saved changes.

Review submissions are stored as pending. Only approved reviews are public. Admin changes, uploads, and access to unapproved reviews require a valid session. Sessions last eight hours, are stored in MongoDB with a hashed token, and are revoked on sign out. The browser receives an HttpOnly cookie; passwords and session tokens are never stored in browser local storage. Expired sessions return the dashboard to login.

Image URLs, descriptions, and captions are stored in MongoDB. When Cloudinary is configured, admin uploads return full HTTPS URLs shared by every deployment. Otherwise, uploaded files live in `backend/uploads/`, served at `/uploads`; disk uploads require persistent storage in production.

Uploads require an admin session. The API accepts one JPEG, PNG, or WebP image of at most 5 MB and 16 megapixels, rejects animations, and decodes/re-encodes it to WebP (at most 2400 × 2400). Filenames are generated UUIDs; original extensions and embedded metadata are discarded. Existing uploads are not rewritten: review any files uploaded before these checks were added. Upload responses include `nosniff` and a restrictive sandbox policy.

## Deployment

The simplest production deployment is one Node service: build the frontend, then start the backend. The backend serves `frontend/dist`, `/api`, and `/uploads` from the same origin, so customer pages can read MongoDB data without a Vite proxy.

```bash
npm install
npm run build
npm run server
```

Set these variables on the hosting provider:

```env
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
FRONTEND_URL=https://your-production-domain.com
PORT=5000
COOKIE_SAME_SITE=lax
# Set only if behind a known reverse proxy, using its actual IPs/CIDRs:
TRUST_PROXY=
```

Open `https://your-production-domain.com` for customers and `https://your-production-domain.com/admin/login` for the admin. Customers can view products, submit ratings, and see approved reviews. Only an authenticated admin can edit products, cafe content/photos, or moderate reviews.

If frontend and backend are deployed as separate services, set `VITE_API_URL=https://your-api-domain.com/api` before `npm run build`, configure the frontend host to rewrite `/admin` and `/admin/login` to `index.html`, and set `FRONTEND_URL` to the exact frontend origin without a trailing slash. Prefer HTTPS domains under the same site (such as `cafe.example.com` and `api.example.com`) with `COOKIE_SAME_SITE=lax`, or proxy `/api` and `/uploads` through the frontend domain.

For unrelated frontend/API sites, explicitly set `COOKIE_SAME_SITE=none` with `NODE_ENV=production` and HTTPS on both services. This enables cross-site admin requests only when their Origin exactly matches `FRONTEND_URL`; requests from other origins or without an Origin are rejected in production. Browsers that block third-party cookies may still prevent login; use same-site domains or a same-origin proxy for reliable access. Production cookies are always Secure and HttpOnly. Startup rejects missing/non-HTTPS production frontend origins and invalid cookie settings.

### Vercel frontend and Render backend images

In Vercel Project Settings > Environment Variables, set `VITE_API_URL=https://YOUR-SERVICE.onrender.com/api` for Production (and Preview if needed). Redeploy the frontend after changing it: Vite embeds this value during compilation. The repository's Vercel rewrite serves React pages; it does not proxy `/uploads` to Render. Public product images, gallery images, and admin thumbnails/previews share the same image URL helper, so `/uploads/file.webp` resolves to `https://YOUR-SERVICE.onrender.com/uploads/file.webp`. Frontend `/images/...` artwork and external image URLs keep their existing locations.

On Render, set `FRONTEND_URL=https://YOUR-FRONTEND.vercel.app` without a trailing slash, `NODE_ENV=production`, and `COOKIE_SAME_SITE=none` for these unrelated domains. Keep the existing database and trusted-proxy settings. Uploads still require a valid admin session; public image GET requests do not.

For durable local uploads, attach a Render persistent disk at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`. This setting controls both the upload destination and Express static directory. Without it, both default to `backend/uploads` relative to the backend module, regardless of the start command's working directory. Startup checks read/write access and logs the resolved directory. Render's default filesystem loses runtime files on restarts/deploys; persistent disks require a paid service. See [Render persistent disk documentation](https://render.com/docs/disks).

Before switching directories or redeploying a service containing uploads, back up all available image files. Copy existing files from local `backend/uploads` and any surviving deployed uploads into the persistent upload directory, retaining exact filenames and avoiding overwriting existing files. MongoDB stores paths, not these file bytes; no product records or image paths need changing. Files already lost on Render must be recovered from a backup or the original files. Re-uploading creates a new UUID `.webp` path, so it does not by itself repair a record referencing an older filename. Do not rename an existing `.webp` URL to `.jpg`.

### Shared images with Cloudinary

The admin upload endpoint supports Cloudinary without frontend changes. It validates and re-encodes images first, sends a signed upload from the backend, and returns the full `https://res.cloudinary.com/...` URL. Saving the product or cafe photo stores that URL in MongoDB. Cloud failures return an error instead of silently saving a temporary disk file.

1. Create a Cloudinary account and get the cloud name, API key, and API secret from its dashboard.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Render's environment and in local `backend/.env`. Never add the secret to Git, Vercel, or a `VITE_` variable. Restart/redeploy the backend.
3. Use the same MongoDB cluster **and database name** in local and Render `MONGODB_URI` if you want identical products, prices, and photo records everywhere. Changes from either admin then affect that same shop data.
4. Set Vercel `VITE_API_URL=https://YOUR-SERVICE.onrender.com/api` and redeploy the frontend. Keep the frontend origin/cookie settings described above.
5. For existing products and cafe photos, open **Edit**, upload the original image again, and **Save**. Recover originals from `backend/uploads/`, `backend/seed-uploads/`, or `frontend/public/images/` where available. Existing `/uploads/...` records are not automatically migrated. Alternatively, upload manually in Cloudinary and paste its HTTPS image URL into the admin Image URL field before saving.
6. Check a newly saved record: its image value should start with `https://res.cloudinary.com/`. Open it directly, then confirm public and admin images on localhost and Vercel, including after a Render redeploy.

Using the same Cloudinary account alone does not synchronize separate databases. Cloudinary stores image bytes; MongoDB stores which URL belongs to each product/photo. Frontend artwork in `public/images` stays bundled with each frontend deployment. See [Cloudinary upload documentation](https://cloudinary.com/documentation/upload_images).

Leaving all three Cloudinary variables empty keeps the disk option and existing `/uploads/...` paths. Partial configuration rejects uploads. Git tracks local upload files when added and committed, but runtime uploads made on Render never automatically become Git commits or appear on your computer.

Existing images recovered from local storage and Render are also backed up in `backend/seed-uploads/` with their original filenames. Express checks the writable upload directory first, then this deployed backup directory. This repairs the existing split between local-only and Render-only images without editing MongoDB records. Keep this directory in deployment artifacts. New admin uploads still need persistent storage: the backup is a snapshot, not automatic synchronization between servers.

To verify deployment, upload a small image while signed in, inspect the `POST /api/uploads` response (201 with `/uploads/<uuid>.webp`), and open that exact path on the Render domain. It should return 200 with `Content-Type: image/webp`. Save the product/photo to publish it, then check public and admin images. A 404 at the correct Render URL means the file is absent from the configured directory (or the running deployment is outdated); an image request to Vercel indicates the frontend API environment value needs checking. Verify the same URL again after a restart to confirm storage persistence.

Behind a reverse proxy, configure `TRUST_PROXY` with the actual proxy IP addresses/CIDRs from your hosting provider. For example, use `127.0.0.1,::1` only when a local proxy is the only entry point. Leave empty for direct access. Do not use `true`, hop counts, or arbitrary broad networks: forwarded client IP headers must only be accepted from trusted proxies, and the Node service should not be publicly reachable around the proxy. Login limits depend on this setting being correct. See [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies.html).

Login attempts use atomic MongoDB counters shared across instances and restarts: ten requests per client IP per fixed 15-minute window. Attempts beyond that receive 429 and Retry-After. MongoDB TTL indexes clean up old counters; expiration does not depend on timely cleanup. Database failures stop login rather than bypassing limits. Ensure the database user can create the Mongoose collections/indexes, including TTL indexes, or provision them before deployment.

New passwords use versioned scrypt hashes with N=131072, r=8, p=1. Existing password hashes continue to work and are upgraded after successful login. Budget at least 128 MiB of working memory per active hash operation, plus application overhead. The password hashing and cookie choices follow the [Node crypto documentation](https://nodejs.org/api/crypto.html), [OWASP password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), and [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/).

Before deploying, rotate the database password previously included in `backend/.env.example` in Atlas Database Access, then update `MONGODB_URI` in your local environment and hosting secrets. Removing the credential from the example does not revoke it or erase previous copies. Never commit real credentials. Allow only development or backend hosting outbound IPs in Atlas Network Access, and use persistent storage or object storage for uploaded images. HTTPS termination, real proxy addresses, database password rotation, and Atlas access lists must be configured in the hosting/Atlas accounts.

A live MongoDB connection is needed to verify persistence end to end; automated route tests mock database methods.

The menu drink and fruit illustrations are CSS artwork. The hero keeps the three original cups centered, with AI-generated oranges and juice cascading down the right edge; see [the asset and prompt notes](docs/orange-cascade-artwork.md). The three locally stored gallery photos are illustrative Unsplash photos, not actual Nighi Cafe product photographs:

- Orange juice: image ID photo-1613478223719-2ab802602423
- Loaded fries: image ID photo-1573080496219-bb080dd4f877
- Grilled chicken: image ID photo-1532550907401-a500c9a57435

Typography uses DM Sans and Barlow Condensed from Google Fonts, with system fallbacks. Replace illustrative photographs with cafe photos before launch.
