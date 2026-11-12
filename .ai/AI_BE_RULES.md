# AI BE Rules

**This project has no backend.** Original Request: "no need for backend — this will be
shown as a prototype."

---

## No-Backend Contract

- There is no server, no API, no database, no PHP, no Node server. Do not add one.
- Persistence = `localStorage`, keyspaced `pharmacy:<menuId>` (one JSON array per
  data menu), plus `pharmacy:lang` and `pharmacy:profile`.
- First load seeds every store with realistic sample data (Indonesian pharmacy
  context: obat names, supplier names, IDR prices). Seeding runs only when the key
  is absent, so user edits survive reloads. "Reset data" (Pengaturan → Konfigurasi)
  clears keys and reseeds.
- Derived pages read other stores at render time: Defecta and Stok Kadaluarsa read
  products; Laporan Penjualan reads sales; dashboard reads all. No copies of data.
- Kasir sale = append to `pharmacy:sales` + decrement matching product `stok` in
  `pharmacy:products`. No other cross-store writes.
- Validation lives in the form config (required fields, number/date types) — the
  trust boundary is the form itself; localStorage content is prototype data.

## Data Model (per store)

- `products`: kode, nama, kategori, satuan, rak, gudang, harga_beli, harga_jual,
  stok, min_stok, batch, expiry (YYYY-MM-DD), barcode
- `sales`: no, tanggal, pelanggan, items[{kode,nama,qty,harga,diskon}], subtotal,
  diskon, total, metode, bayar, kembali, kasir
- Other menus: exactly the fields declared in that menu's config in `prototype/app.js`.

## Deploy (Tantua Deploy Bridge — static files only)

```
BRIDGE_URL  = https://deployment.tantua.com
PROJECT_ID  = digital-pharmacy
DEPLOY_ROOT = /home/ratumara/farmasi.tantua.com   (docroot = public/)
LIVE        = https://farmasi.tantua.com/
SECRET      = owner-held (see AI_DEPLOYMENT_GUIDE.md; never commit)
```

- Upload with `PUT /api/v1/files`, `path=public/<file>`, `content_base64`, token per guide. No full-site zip swap needed (static).
- `index.html` is served DYNAMIC (not cached); `app.js` is Cloudflare-cached (`max-age=14400`). Bump the `?v=` query on the script tag in `index.html` on every `app.js` change, else the edge serves the old build.
- Secret is never written to the repo.

## Future Rules

Append new rules below as sections; do not rewrite history.
