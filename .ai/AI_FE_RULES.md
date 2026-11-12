# AI FE Rules

Frontend rules for all work on this prototype (`prototype/index.html`, `prototype/app.js`). Read before
writing code; append-only.

---

## Design DNA

Pharmacy POS prototype modeled on apotekdigital.com — clean SaaS admin look: white
sidebar with grouped menus, teal/green primary palette, dense data tables, rounded
cards, clear form modals. Mobile-style POS (Kasir) = product search/grid left, cart
right, sticky pay bar. Prototype quality: looks real, works fully client-side.

## Non-Negotiables

- **Vanilla JS (ES6), no framework, no npm, no build step, no backend.**
- Two files: `prototype/index.html` (shell + all CSS) and `prototype/app.js` (engine + menu config + i18n).
- Menus are **data-driven**: each menu = config object `{id, icon, group, title:{en,id},
  desc:{en,id}, type, fields[], columns[], seed[]}` rendered by one generic engine.
  Each menu MUST have its own field set, its own description, and its own icon —
  never reuse another menu's form.
- Custom views only where config can't express it: Dashboard, Kasir (POS), Laporan,
  Cetak Barcode.
- **Icons**: inline SVG (small path set defined once), one per menu/group.
- **i18n**: `t()` + dictionaries; every label/title/desc is `{en, id}`; toggle button in
  topbar; choice persisted in localStorage; full re-render on switch.
- **CRUD**: "+ New" opens a modal form → Save writes to the store → table re-renders.
  Rows have Edit/Delete; delete asks confirm (destructive). State per menu persisted
  in localStorage under `pharmacy:<key>`; seeded once with realistic Indonesian
  pharmacy data.
- **Stock expiry**: product rows carry `batch` + `expiry`; Stok Kadaluarsa page lists
  products expiring within 90 days or expired; Defecta lists stock below min.
- **Print**: every page printable. Tables → A4 printout (apothek profile header +
  table). Kasir → 80mm thermal receipt. Kasir sale modal has proper **Struk / Print**
  and **Tutup** buttons in the modal footer (not floating).
- Money formatted as `Rp 1.250.000` (IDR, no decimals); dates as `DD/MM/YYYY`.

## Kasir (POS) Spec

- Search box (name/code, live filter) + product grid cards; click adds to cart.
- Cart rows: name, price, qty stepper, line discount, remove.
- Totals: subtotal, discount, total; payment method select; cash paid input →
  change computed; Pay disabled when paid < total.
- On pay: create sale record (feeds Daftar Penjualan + Laporan Penjualan), decrement
  product stock, open receipt modal (Print / Tutup).

## Avoid

- Frameworks, bundlers, CDN dependencies, external fonts/icon packages
- Chart libraries — dashboard "charts" are styled bars/divs
- localStorage schemas beyond what a menu's fields define
- Client-side "sync" logic — nothing to sync to

## JS Conventions

- One IIFE in `prototype/app.js`; no globals beyond `window.Pharmacy` (for console debugging).
- `const`/`let`, arrow callbacks, event delegation on table/toolbar containers.
- Re-render = full section re-draw from state (prototype: fine, simple, no diffing).
- Escape user-entered strings before inserting HTML (`esc()` helper) — prototype or
  not, never build HTML from raw user input.

## Accessibility

- Semantic `<nav> <main> <table> <button>`; modals focus their first input; Escape
  closes modal; labels tied to inputs.

## Print CSS

- `@media print`: hide sidebar/topbar/toolbars/buttons; show `#print-area` only.
- Two print contexts: `.print-a4` (report) and `.print-receipt` (80mm thermal width).
- `window.print()` after populating `#print-area`.

## Future Rules

Append new rules below as sections; do not rewrite history.
