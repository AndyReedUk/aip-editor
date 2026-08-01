# AIP Profile Editor

A web-based editor for AquaIllumination `.aip` lighting profiles (AI Hydra, Prime, and similar
fixtures). Import a profile, edit it graphically, and export a new `.aip` with a valid checksum -
including two things the mobile app can't do:

- **Shift the whole schedule** as a block (e.g. move everything 1 hour later), with points wrapping around midnight
- **Scale overall intensity** up or down across all channels (or a single channel) in one operation

Plus draggable curve points, per-point numeric editing, a time cursor showing live per-channel percentages,
undo, revert-to-imported, and checksum validation on import.

**Everything runs in your browser** - no file is ever uploaded to a server. The build is a single
self-contained `index.html` (all JS and CSS inlined), so you can **just double-click it to run offline**,
or upload it to any static host (GitHub Pages, cPanel, an S3 bucket) with nothing to run or maintain.

> This is an independent tool. It is not affiliated with, endorsed by, or supported by AquaIllumination.
> "AI", "AquaIllumination", "Hydra" and "Prime" are trademarks of their respective owner.

## Try it / host it

The app is a static single-page site. Any of these work:

- **Just open it** (simplest): run `npm install` then `npm run build`, and double-click the resulting
  `dist/index.html`. It's fully self-contained and runs offline from disk - no server needed. Note this
  only works with the built file in `dist/`, not the source `index.html` in the project root.
- **GitHub Pages** (free, shareable): push this repo to GitHub, then in the repo go to
  **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**. The included workflow
  (`.github/workflows/deploy-pages.yml`) builds and publishes it on every push to `main`. You'll get a
  URL like `https://<you>.github.io/<repo>/`.
- **Any cPanel / static host** (e.g. Stablepoint): upload `dist/index.html` into `public_html` (or a
  subdomain's folder). No PHP, Node, or database needed.

## Build

```
npm install
npm run build
```

The output is a single self-contained `dist/index.html` (all JS and CSS inlined). It runs by
double-clicking from disk, and works unchanged from a GitHub Pages sub-path or a domain root.

## Develop locally

```
npm install
npm run dev
```

Then open http://localhost:5173 (hot reload).

## Licence

MIT - see [LICENSE](LICENSE).
