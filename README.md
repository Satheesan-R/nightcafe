# Nighi Cafe

A responsive React and Vite customer website inspired by the supplied drink-brand video: orange-red and cream sections, lime accents, dimensional CSS juice cups, floating motion, and pointer parallax.

## Development

- `npm install`
- `npm run dev`
- `npm run build` creates the production output in `dist/`.
- `npm run preview` serves the production build.

Work on `development` and submit pull requests into `main`.

## Current features

Homepage, cafe introduction, juice/food/Appam/BBQ menu filters, product detail dialogs, gallery, an accessible 1–5 star review form, and a location/contact section. Responsive navigation and reduced-motion support are included.

## Content and integration status

Menu items and LKR prices are samples. Replace them with the cafe's confirmed menu in `src/App.jsx`. The address, phone number, opening hours and map are deliberately awaiting real shop information.

Reviews are a browser-local demo stored under `nighi-review-draft` in localStorage. They are not submitted to a server or published to other visitors. Shared review storage, moderation and the admin dashboard still need backend integration.

The menu drink and fruit illustrations are CSS artwork. The hero keeps the three original cups centered, with AI-generated oranges and juice cascading down the right edge; see [the asset and prompt notes](docs/orange-cascade-artwork.md). The three locally stored gallery photos are illustrative Unsplash photos, not actual Nighi Cafe product photographs:

- Orange juice: image ID photo-1613478223719-2ab802602423
- Loaded fries: image ID photo-1573080496219-bb080dd4f877
- Grilled chicken: image ID photo-1532550907401-a500c9a57435

Typography uses DM Sans and Barlow Condensed from Google Fonts, with system fallbacks. Replace illustrative photographs with cafe photos before launch.
