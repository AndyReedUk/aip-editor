# AIP Profile Editor

A web-based editor for AquaIllumination `.aip` lighting profiles (AI Hydra, Prime, and similar
fixtures). Import a profile, edit it graphically, and export a new `.aip` with a valid checksum -
including two things the mobile app can't do:

- **Shift the whole schedule** as a block (e.g. move everything 1 hour later), with points wrapping around midnight
- **Scale overall intensity** up or down across all channels (or a single channel) in one operation

Plus draggable curve points, per-point numeric editing, a time cursor showing live per-channel percentages,
undo, revert-to-imported, and checksum validation on import.

**Everything runs in your browser** - no file is ever uploaded to a server. So it hosts as a plain
static site (GitHub Pages, any web host, an S3 bucket) with nothing to run or maintain.

> This is an independent tool. It is not affiliated with, endorsed by, or supported by AquaIllumination.
> "AI", "AquaIllumination", "Hydra" and "Prime" are trademarks of their respective owner.

> Prefer a full-stack version with a .NET backend (e.g. as a base for a future saved-profiles library)?
> See the separate **`aip-editor-docker`** edition.

## Try it / host it

The app is a static single-page site. Any of these work:

- **GitHub Pages** (recommended, free): push this repo to GitHub, then in the repo go to
  **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**. The included workflow
  (`.github/workflows/deploy-pages.yml`) builds and publishes it on every push to `main`. You'll get a
  URL like `https://<you>.github.io/<repo>/`.
- **Any cPanel / static host** (e.g. Stablepoint): run `npm run build` and upload the contents of
  `dist/` into `public_html` (or a subdomain's folder). No PHP, Node, or database needed.

## Build

```
npm install
npm run build
```

The output in `dist/` is the complete, self-contained site. Asset paths are relative, so it works from
a sub-path (GitHub Pages) or a domain root without configuration.

## Develop locally

```
npm install
npm run dev
```

Then open http://localhost:5173 (hot reload).

## The .aip format

`.aip` files are XML: a `<header>` (version + checksum) and a `<colors>` block with one element per
channel (`uv`, `violet`, `royal`, `blue`, `green`, `deep_red`, `moonlight`, `cool_white`), each holding
`<point>` pairs of `<intensity>` (per-mille of nominal: 1000 = 100%, up to 2000 = 200% HD overdrive)
and `<time>` (minutes since midnight, 0-1440).

The checksum (computed in `src/aipFile.ts`) covers the `<colors>...</colors>` text with all whitespace
stripped, hashed with the classic JavaScript 31x string hash as a signed 32-bit integer, bitwise-inverted
when negative. Credit to the reef community for the original reverse engineering:
[thereefuge.com](http://thereefuge.com/threads/reverse-engineering-a-hydra-26-hd.15524/),
[mdcollins05/ai_checksum](https://github.com/mdcollins05/ai_checksum),
[chriswhong/ai-hydra-time-offset](https://github.com/chriswhong/ai-hydra-time-offset).

Exports reproduce the native app file format byte-for-byte (verified by round-tripping app-exported
files unchanged, in-browser).

## Notes

- Import accepts both native app exports and hand-edited/tool-generated variants (any XML layout);
  a warning is shown when the stored checksum doesn't match the data. Exporting always writes a
  correct checksum in the native format.
- A block shift that pushes points past midnight wraps them to the start of the day and re-sorts;
  duplicate points created by a wrap (a 12AM/end-of-day pair landing on the same minute) are merged.
- Intensity scaling rounds to whole per-mille values and clamps at the 200% HD limit, so repeated
  up/down scaling can drift slightly; use Undo or Revert to imported to get back exactly.

## Licence

MIT - see [LICENSE](LICENSE).
