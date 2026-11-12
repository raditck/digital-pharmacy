# Original Request

<!-- Paste your request verbatim below. Do not summarize, do not reformat.
     Preserve code blocks, payloads, error messages, URLs, etc. exactly.
     A top-level "NEW TASK" line is deprecated — this section is the source material. -->

new task

list all feature in https://apotekdigital.id/pricing
list all menu needed, and their fields
then make me a POS that shown like this https://apotekdigital.com/assets/images/mobile-app.png
and admin like this https://apotekdigital.com/assets/images/web-app.png
as index.html
all menu works and shown each page with their own fields and buttons
no need for backend
this will be shown as a prototype
feels like an SPA
has each page printout, and can be printed too
each menu has symbol
use reference theme and everything, just copy and remake everything from reference
POS printout layout seems not in place like tutup button and print button is weird
the menu need symbols
can change language, english and indonesia
show the create and edit form and save button, which affect and change the list
stock has expiry
each menu is different, make sure each menu has their own explanation of what that menu is for
each menu has each fields, no same form on the other menu
the UI looks like this https://apotekdigital.com/assets/videos/transaksi.mp4
all UI and fields and menus all here https://blog.apotekdigital.com/panduan/menambahkan-stok/, you can just explore the link in panduan page one by one

# Execution Plan

<!-- Fill during Planning. Group related work; no micro-tasks. -->

- [x] Update all `.ai/*.md` rule files to describe THIS project (digital-pharmacy prototype), removing odrive/Laravel/deploy-bridge content
- [x] Build `index.html` shell: sidebar layout (web-app style), POS kasir view (mobile-app style), theme colors/typography matching apotekdigital reference
- [x] Data-driven menu engine (vanilla JS, single `index.html` + `app.js`): MENU config with per-menu icon, EN/ID labels, description, fields, columns, seed rows — each menu gets its own form and explanation
- [x] Menus — Dashboard (umum/penjualan/persediaan); Penjualan (Kasir/POS, Daftar Penjualan, Pesanan, Retur, Tertolak, Faktur); Pelayanan (Kunjungan Pasien, Rekam Medis, Penerimaan & Penebusan Resep); Persediaan (Daftar Produk + batch/expiry, Defecta, Stok Kadaluarsa, Stok Opname, Penyesuaian Stok, Perpindahan Stok, Cetak Barcode); Pembelian (Rencana, Pesanan, Faktur, Retur); Kontak (Pelanggan, Dokter, Supplier, Sales); Promo (Diskon Produk, Voucher, Member); Laporan (Penjualan, Pembelian, Persediaan, Keuangan); Pengaturan (Profil Apotek, Metode Pembayaran, Konfigurasi, Pengguna & Peran)
- [x] Kasir (POS) page: product search/scan box, cart, qty/price/discount, payment method, change calc, fixed print/struk layout with proper Tutup & Print buttons
- [x] CRUD: create/edit forms with Save that mutate lists; state persisted in localStorage with seed data on first load
- [x] i18n EN/ID toggle affecting all menus, forms, buttons, labels
- [x] Print support: every page has a print layout (receipt for Kasir, A4 report/table for others) via print CSS + `window.print()`
- [x] Verify: open index.html, click through every menu, test create/edit/save/print/language toggle; record results in # Verification

# Progress

<!-- Append analysis findings here AS YOU GO — any byte change resets the
     goal-loop stall counter, so planning never silently stalls. -->

- Repo state: empty except `.ai/` (rules files) and `.pi/extensions/goal-loop.ts`. No code yet.
- Rewrote all `.ai/*.md` rules files for digital-pharmacy (no-backend prototype, vanilla JS, localStorage store, static hosting). Removed odrive/Laravel/deploy-bridge content incl. the bridge secret. `AI_TASK.example.md` left as-is (generic template).
- All `.ai/*.md` rule files describe a DIFFERENT project (odrive — Laravel CloudVault rebuild, MySQL, Tantua deploy bridge, secret token present in AI_BE_RULES.md). They must be rewritten to match this project: a frontend-only pharmacy POS prototype (vanilla HTML/CSS/JS, no backend, no build step, localStorage state).
- Reference feature matrix fetched from https://apotekdigital.id/pricing (full comparison table) + panduan index from https://blog.apotekdigital.com/panduan/ — menu groups: Dashboard, Penjualan (Kasir, Pesanan, Daftar, Retur, Tertolak, Faktur), Pelayanan (Kunjungan, RME, Pemeriksaan, Resep), Persediaan (Produk+Kartu Stok, Defecta, Kadaluarsa, Opname, Penyesuaian, Perpindahan, Barcode), Pembelian (Rencana, Pesanan, Faktur, Retur), Konsinyasi, Program Promo (Bundel, Diskon, Voucher, Member), Keuangan (Kas, Buku Kas, Utang, Piutang), Kontak (Pelanggan, Sales, Dokter, Supplier), Laporan, Analisis, Pengguna (Roles, Shift, Log), Gaji/KPI (Pro-only — skip for prototype scope), Pengaturan (Profil, Metode Pembayaran, Konfigurasi).
- Stock has expiry → product records need batch + expiry date + ED monitoring (Stok Kadaluarsa page).
- POS layout reference: https://apotekdigital.com/assets/images/mobile-app.png + transaksi.mp4 (product grid/search left, cart right, pay bar); admin reference: https://apotekdigital.com/assets/images/web-app.png (sidebar + content, teal/green pharmacy palette).
- Approach: single `index.html` (shell + CSS) + one `app.js`; menus defined as config objects (icon, EN/ID title, description, fields, columns, seeds) rendered by one generic engine; Kasir gets a custom view. i18n = dictionary keyed by string id. Print = per-context print stylesheet (thermal receipt vs A4) + `window.print()`. localStorage keyspaced per menu for CRUD persistence.
- Scope cut (prototype): no Konsinyasi/Akuntansi/Gaji/KPI/Multi-Outlet/Whatsapp/Website modules; payment methods simplified; no real barcode hardware integration (page renders printable barcode labels).
- Built `index.html` (shell + full CSS: sidebar layout, POS grid/cart, modal, receipt + A4 print styles) and `app.js` (data-driven engine + 36 menu configs + i18n + localStorage store).
- 36 pages across 9 groups: Dashboard, Kasir, 5 sales, 4 service, 7 inventory, 4 purchase, 4 contacts, 3 promo, 3 reports, 4 settings. Each CRUD page: own field set, own description, own icon, search/New/Edit/Delete/Print. Derived pages (Defecta, Stok Kadaluarsa, Cetak Barcode) and report pages read live stores. Profile/Config are single-record forms.
- Kasir: product grid + cart, live totals (subtotal/disc/PPN), payment picker, cash input, change calc; Pay writes sale to Daftar Penjualan + decrements product stock, then opens receipt modal with proper Print + Tutup footer buttons.
- i18n EN/ID toggle in topbar persists in localStorage; dashboard stat labels bilingual.
- Verification harness `smoke.js` (Node DOM shim) renders all 36 pages in both languages, 51 form opens, 36 print layouts, and runs one add-to-cart -> pay transaction (asserts sale recorded + stock decremented).

# Verification

Commands (run from repo root, Node v24.11.0):

```
node --check app.js        -> syntax OK
node smoke.js              -> OK pages=36 forms=51 prints=36
                              products=10 sales=3
                              sale no=INV-0004 total=1332 change=998667
                              sales 3->4 | P001 stock 240->239
                              TRANSACTION OK   (exit 0)
```

Covered: all 9 menu groups render in `id` and `en`; every CRUD menu opens New form and an Edit form; every page produces a print layout; language switch re-renders without error; Kasir payment writes sale, computes PPN + change, decrements stock.

Manual browser check (user): open `index.html` -> click each sidebar menu, add/edit/delete a row, toggle EN/ID, open Kasir -> add product -> Pay -> Print Struk / Tutup, Print button per page.

# Task State

Current Phase:

- Complete

Current Step:

- All plan items done and verified.

Last Completed Step:

- Analyzed request + repo; fetched reference feature matrix; filled Execution Plan.

Next Step:

- None. Open `index.html` to review; say the word if you want added modules (Konsinyasi, Keuangan, etc.).

---

Planning contract (agent):

1. Fill `# Execution Plan` with an implementation-oriented checklist.
2. Append analysis findings to `# Progress` as you go — never leave long silent stretches.
3. Set `Current Phase: - Waiting Approval` and stop. Never modify code before approval.
4. On approval: execute all unchecked tasks without stopping between them, then verify and set `Current Phase: - Complete` (or `Blocked`).
5. Never restructure this file's sections; only edit content inside them.
