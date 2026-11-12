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

## Future Rules

Append new rules below as sections; do not rewrite history.
