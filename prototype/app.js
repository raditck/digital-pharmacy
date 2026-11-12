/* Farmasi Digital - POS prototype. Vanilla JS, no backend, state in localStorage. */
(function () {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const nf = (n) => (Number(n) || 0).toLocaleString('id-ID');
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = () => iso(new Date());
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const fmtDate = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '-');
const uid = () => Math.random().toString(36).slice(2, 9);
const daysLeft = (d) => Math.round((new Date(d) - new Date(today())) / 86400000);

let lang = localStorage.getItem('pharmacy:lang') || 'id';
const L = (x) => (x && typeof x === 'object' ? (x[lang] != null ? x[lang] : x.en) : x == null ? '' : String(x));
const UI = {
  save:{en:'Save',id:'Simpan'}, cancel:{en:'Cancel',id:'Batal'}, close:{en:'Close',id:'Tutup'},
  edit:{en:'Edit',id:'Ubah'}, del:{en:'Delete',id:'Hapus'}, delQ:{en:'Delete this row?',id:'Hapus baris ini?'},
  print:{en:'Print',id:'Cetak'}, search:{en:'Search...',id:'Cari...'}, add:{en:'New',id:'Tambah'},
  actions:{en:'Actions',id:'Aksi'}, empty:{en:'No data yet. Add one with the New button.',id:'Belum ada data. Tambah lewat tombol Tambah.'},
  required:{en:'Required',id:'Wajib diisi'}, receipt:{en:'Receipt',id:'Struk'}, pay:{en:'Pay',id:'Bayar'},
  subtotal:{en:'Subtotal',id:'Subtotal'}, discount:{en:'Discount',id:'Diskon'}, total:{en:'Total',id:'Total'},
  cash:{en:'Cash',id:'Tunai'}, change:{en:'Change',id:'Kembali'}, method:{en:'Payment',id:'Pembayaran'},
  qty:{en:'Qty',id:'Qty'}, product:{en:'Product',id:'Produk'}, price:{en:'Price',id:'Harga'},
  cartEmpty:{en:'Cart is empty. Click a product.',id:'Keranjang kosong. Klik produk.'}, cashShort:{en:'Cash is less than total',id:'Tunai kurang dari total'},
  noStock:{en:'Out of stock',id:'Stok habis'}, dateFrom:{en:'From',id:'Dari'}, dateTo:{en:'To',id:'Sampai'},
  apply:{en:'Apply',id:'Terapkan'}, footer:{en:'Thank you',id:'Terima kasih'},
  language:{en:'Language',id:'Bahasa'}, sum:{en:'Total',id:'Jumlah'}, reset:{en:'Reset data',id:'Reset data'},
  resetQ:{en:'Reset all data back to samples?',id:'Kembalikan semua data ke contoh?'}, saved:{en:'Saved',id:'Tersimpan'},
  login:{en:'Sign in',id:'Masuk'}, logout:{en:'Logout',id:'Keluar'},
  loginSub:{en:'Sign in to try the prototype',id:'Masuk untuk mencoba prototype'},
  loginErr:{en:'Wrong username or password',id:'Username atau password salah'}
};
const tr = (k) => L(UI[k]) || k;

const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  clipboard:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a6 6 0 0 1 0 12h-3"/>',
  xcircle:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  filetext:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  usercheck:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  pill:'<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/>',
  package:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  alert:'<path d="m10.29 3.86-8.18 14A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.72-3.14l-8.18-14a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  checksq:'<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  transfer:'<path d="M7 16V4M7 4 3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>',
  barcode:'<path d="M4 5v14M8 5v14M11 5v14M14 5v14M17 5v14M20 5v14"/>',
  truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  stetho:'<path d="M4 3v6a6 6 0 0 0 12 0V3"/><path d="M10 15v2a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',
  tag:'<path d="M20.59 13.41 12 22l-9-9V3h10l7.59 7.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
  barchart:'<path d="M12 20V10M18 20V4M6 20v-4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  card:'<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  flask:'<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 19L14 9V3"/>',
  warehouse:'<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  ticket:'<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  dot:'<circle cx="12" cy="12" r="3"/>'
};
const icon = (name, size = 16) => '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.dot) + '</svg>';

/* ---------------- store ---------------- */
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('pharmacy:' + k)); } catch (e) { return null; } },
  set(k, v) { localStorage.setItem('pharmacy:' + k, JSON.stringify(v)); }
};
const db = {};

const PROFILE_SEED = { nama: 'Farmasi Digital', alamat: 'Jl. Merdeka No. 12, Jakarta Pusat', telp: '021-5551234', apoteker: 'Apt. Rina Sari, S.Farm', sia: 'SIA 11/2/2024', npwp: '01.234.567.8-901.000' };
const CONFIG_SEED = { ppn: 11, printer: 80, struk_footer: 'Terima kasih, semoga lekas sembuh', low_stock_days: 90 };

const SALES_SEED = [
  { id: 's1', no: 'INV-0001', tanggal: addDays(0), pelanggan: 'Umum', items: [{ kode: 'P001', nama: 'Paracetamol 500mg', qty: 2, harga: 1200 }, { kode: 'P003', nama: 'Vitamin C 1000mg', qty: 1, harga: 2000 }], subtotal: 4400, diskon: 0, total: 4400, metode: 'Tunai', bayar: 5000, kembali: 600, kasir: 'Kasir 1' },
  { id: 's2', no: 'INV-0002', tanggal: addDays(-1), pelanggan: 'Budi Santoso', items: [{ kode: 'P005', nama: 'OBH Combi Batuk', qty: 1, harga: 14000 }, { kode: 'P006', nama: 'Ibuprofen 400mg', qty: 2, harga: 1500 }], subtotal: 17000, diskon: 1000, total: 16000, metode: 'QRIS', bayar: 16000, kembali: 0, kasir: 'Kasir 1' },
  { id: 's3', no: 'INV-0003', tanggal: addDays(-2), pelanggan: 'Siti Aminah', items: [{ kode: 'P008', nama: 'Betadine 30ml', qty: 1, harga: 18000 }], subtotal: 18000, diskon: 0, total: 18000, metode: 'Transfer', bayar: 18000, kembali: 0, kasir: 'Kasir 2' }
];

/* ---------------- field label dictionary ---------------- */
const F = {
  kode:{en:'Code',id:'Kode'}, nama:{en:'Name',id:'Nama'}, tanggal:{en:'Date',id:'Tanggal'},
  pelanggan:{en:'Customer',id:'Pelanggan'}, pasien:{en:'Patient',id:'Pasien'}, produk:{en:'Product',id:'Produk'},
  qty:{en:'Qty',id:'Jumlah'}, total:{en:'Total',id:'Total'}, status:{en:'Status',id:'Status'},
  alamat:{en:'Address',id:'Alamat'}, telepon:{en:'Phone',id:'Telepon'}, harga:{en:'Price',id:'Harga'},
  stok:{en:'Stock',id:'Stok'}, satuan:{en:'Unit',id:'Satuan'}, kategori:{en:'Category',id:'Kategori'},
  rak:{en:'Shelf',id:'Rak'}, gudang:{en:'Warehouse',id:'Gudang'}, batch:{en:'Batch',id:'Batch'},
  expiry:{en:'Expiry',id:'Kadaluarsa'}, dokter:{en:'Doctor',id:'Dokter'}, supplier:{en:'Supplier',id:'Supplier'},
  jenis:{en:'Type',id:'Jenis'}, mulai:{en:'Start',id:'Mulai'}, selesai:{en:'End',id:'Selesai'},
  catatan:{en:'Notes',id:'Catatan'}, petugas:{en:'Officer',id:'Petugas'}, tipe:{en:'Type',id:'Tipe'},
  nilai:{en:'Value',id:'Nilai'}, kode_produk:{en:'Product code',id:'Kode produk'}, masa:{en:'Period',id:'Masa'},
  percent:{en:'Percent (%)',id:'Persen (%)'}, nominal:{en:'Amount',id:'Nominal'}
};
const f = (k) => F[k] || k;

const GROUPS = [
  { id: 'overview', label: { en: 'Overview', id: 'Ringkasan' }, items: ['dashboard', 'kasir'] },
  { id: 'sales', label: { en: 'Sales', id: 'Penjualan' }, items: ['sales', 'orders', 'returns', 'rejected', 'invoices'] },
  { id: 'service', label: { en: 'Service', id: 'Pelayanan' }, items: ['visits', 'records', 'rxin', 'rxout'] },
  { id: 'inventory', label: { en: 'Inventory', id: 'Persediaan' }, items: ['products', 'defecta', 'expiry', 'opname', 'adjust', 'transfer', 'barcode'] },
  { id: 'purchase', label: { en: 'Purchasing', id: 'Pembelian' }, items: ['plan', 'porders', 'pinvoices', 'preturns'] },
  { id: 'contacts', label: { en: 'Contacts', id: 'Kontak' }, items: ['customers', 'doctors', 'suppliers', 'salespeople'] },
  { id: 'promo', label: { en: 'Promotions', id: 'Program Promo' }, items: ['discounts', 'vouchers', 'members'] },
  { id: 'reports', label: { en: 'Reports', id: 'Laporan' }, items: ['reportsales', 'reportstock', 'reportfinance'] },
  { id: 'settings', label: { en: 'Settings', id: 'Pengaturan' }, items: ['profile', 'payments', 'config', 'users'] }
];
const MENUS = {};

MENUS.dashboard = {
  icon: 'grid', type: 'dashboard',
  title: { en: 'Dashboard', id: 'Dashboard' },
  desc: { en: 'Today\'s sales, low-stock and near-expiry alerts, and top selling products at a glance.', id: 'Ringkasan penjualan hari ini, peringatan stok menipis & hampir kadaluarsa, serta produk terlaris.' },
  group: 'overview'
};
MENUS.kasir = {
  icon: 'cart', type: 'pos',
  title: { en: 'Cashier (POS)', id: 'Kasir' },
  desc: { en: 'Point of sale: pick products, adjust quantity, choose payment, then print the receipt.', id: 'Point of sale: pilih produk, atur jumlah, pilih pembayaran, lalu cetak struk.' },
  group: 'overview'
};

/* ---------------- sales ---------------- */
MENUS.sales = {
  key: 'sales', icon: 'receipt', type: 'crud', group: 'sales',
  title: { en: 'Sales List', id: 'Daftar Penjualan' },
  desc: { en: 'All sales transactions from the cashier and manual entries. Print a report or edit a row.', id: 'Semua transaksi penjualan dari kasir dan entri manual. Cetak laporan atau ubah baris.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pelanggan', label: f('pelanggan'), type: 'text' },
    { k: 'total', label: f('total'), type: 'money', req: true },
    { k: 'metode', label: f('jenis'), type: 'select', opts: ['Tunai', 'QRIS', 'Transfer', 'Kartu'] },
    { k: 'status', label: f('status'), type: 'select', opts: ['Lunas', 'Menunggu', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pelanggan', label: f('pelanggan') }, { k: 'items', label: f('produk'), type: 'items' },
    { k: 'total', label: f('total'), type: 'money' }, { k: 'metode', label: f('jenis') },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: SALES_SEED
};
MENUS.orders = {
  key: 'orders', icon: 'clipboard', type: 'crud', group: 'sales',
  title: { en: 'Sales Orders', id: 'Pesanan Penjualan' },
  desc: { en: 'Customer orders reserved before pickup or delivery, with processing status.', id: 'Pesanan pelanggan sebelum diambil/dikirim, dengan status pemrosesan.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pelanggan', label: f('pelanggan'), type: 'text', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'total', label: f('total'), type: 'money', req: true },
    { k: 'status', label: f('status'), type: 'select', opts: ['Menunggu', 'Diproses', 'Selesai', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pelanggan', label: f('pelanggan') }, { k: 'produk', label: f('produk') },
    { k: 'qty', label: f('qty'), type: 'num' }, { k: 'total', label: f('total'), type: 'money' },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'o1', no: 'SO-0001', tanggal: addDays(-1), pelanggan: 'Budi Santoso', produk: 'OBH Combi Batuk', qty: 2, total: 28000, status: 'Menunggu' },
    { id: 'o2', no: 'SO-0002', tanggal: addDays(-3), pelanggan: 'Dewi Lestari', produk: 'Vitamin C 1000mg', qty: 3, total: 6000, status: 'Selesai' }
  ]
};
MENUS.returns = {
  key: 'returns', icon: 'undo', type: 'crud', group: 'sales',
  title: { en: 'Sales Returns', id: 'Retur Penjualan' },
  desc: { en: 'Products returned by customers. Each return references the original invoice and a reason.', id: 'Produk yang dikembalikan pelanggan. Setiap retur merujuk faktur asal dan alasan.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'ref', label: { en: 'Invoice ref', id: 'Ref faktur' }, type: 'text', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'alasan', label: { en: 'Reason', id: 'Alasan' }, type: 'text' },
    { k: 'total', label: f('total'), type: 'money' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Diproses', 'Selesai', 'Ditolak'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'ref', label: { en: 'Invoice', id: 'Faktur' } }, { k: 'produk', label: f('produk') },
    { k: 'qty', label: f('qty'), type: 'num' }, { k: 'alasan', label: { en: 'Reason', id: 'Alasan' } },
    { k: 'total', label: f('total'), type: 'money' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'r1', no: 'RT-0001', tanggal: addDays(-2), ref: 'INV-0002', produk: 'Ibuprofen 400mg', qty: 1, alasan: 'Kemasan rusak', total: 1500, status: 'Selesai' }
  ]
};
MENUS.rejected = {
  key: 'rejected', icon: 'xcircle', type: 'crud', group: 'sales',
  title: { en: 'Rejected Sales', id: 'Penjualan Tertolak' },
  desc: { en: 'Sales that were rejected (e.g. invalid prescription or refused payment) with the reason kept for audit.', id: 'Penjualan yang ditolak (mis. resep tidak valid atau pembayaran ditolak) beserta alasannya untuk audit.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pelanggan', label: f('pelanggan'), type: 'text', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number' },
    { k: 'alasan', label: { en: 'Reason', id: 'Alasan' }, type: 'select', opts: ['Resep tidak valid', 'Stok habis', 'Pembayaran ditolak', 'Lainnya'] },
    { k: 'status', label: f('status'), type: 'select', opts: ['Ditolak', 'Diproses'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pelanggan', label: f('pelanggan') }, { k: 'produk', label: f('produk') },
    { k: 'qty', label: f('qty'), type: 'num' }, { k: 'alasan', label: { en: 'Reason', id: 'Alasan' } },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'rj1', no: 'RJ-0001', tanggal: addDays(-4), pelanggan: 'Agus Salim', produk: 'Amoxicillin 500mg', qty: 1, alasan: 'Resep tidak valid', status: 'Ditolak' }
  ]
};
MENUS.invoices = {
  key: 'invoices', icon: 'filetext', type: 'crud', group: 'sales',
  title: { en: 'Sales Invoices', id: 'Faktur Penjualan' },
  desc: { en: 'Invoices issued to customers, their due date and payment status.', id: 'Faktur yang diterbitkan untuk pelanggan, jatuh tempo dan status pembayarannya.' },
  fields: [
    { k: 'no', label: { en: 'Invoice no', id: 'No faktur' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pelanggan', label: f('pelanggan'), type: 'text', req: true },
    { k: 'due', label: { en: 'Due date', id: 'Jatuh tempo' }, type: 'date' },
    { k: 'total', label: f('total'), type: 'money', req: true },
    { k: 'status', label: f('status'), type: 'select', opts: ['Belum Bayar', 'Lunas', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: { en: 'Invoice no', id: 'No faktur' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pelanggan', label: f('pelanggan') }, { k: 'due', label: { en: 'Due', id: 'Jatuh tempo' }, type: 'date' },
    { k: 'total', label: f('total'), type: 'money' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'inv1', no: 'FK-2024-001', tanggal: addDays(-5), pelanggan: 'Klinik Sehat', due: addDays(10), total: 450000, status: 'Belum Bayar' }
  ]
};

/* ---------------- service ---------------- */
MENUS.visits = {
  key: 'visits', icon: 'usercheck', type: 'crud', group: 'service',
  title: { en: 'Patient Visits', id: 'Kunjungan Pasien' },
  desc: { en: 'Front-desk registrations: who came, what service was requested and the queue status.', id: 'Pendaftaran pasien: siapa datang, layanan apa yang diminta, dan status antrean.' },
  fields: [
    { k: 'no', label: { en: 'Visit no', id: 'No kunjungan' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pasien', label: f('pasien'), type: 'text', req: true },
    { k: 'keluhan', label: { en: 'Complaint', id: 'Keluhan' }, type: 'text' },
    { k: 'layanan', label: { en: 'Service', id: 'Layanan' }, type: 'select', opts: ['Konsultasi', 'Pemeriksaan', 'Resep', 'Lab'] },
    { k: 'status', label: f('status'), type: 'select', opts: ['Menunggu', 'Diperiksa', 'Selesai'] }
  ],
  columns: [
    { k: 'no', label: { en: 'Visit no', id: 'No kunjungan' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pasien', label: f('pasien') }, { k: 'keluhan', label: { en: 'Complaint', id: 'Keluhan' } },
    { k: 'layanan', label: { en: 'Service', id: 'Layanan' } }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'v1', no: 'KJ-0001', tanggal: addDays(0), pasien: 'Siti Aminah', keluhan: 'Demam dan batuk', layanan: 'Pemeriksaan', status: 'Menunggu' },
    { id: 'v2', no: 'KJ-0002', tanggal: addDays(-1), pasien: 'Rudi Hartono', keluhan: 'Kontrol tekanan darah', layanan: 'Konsultasi', status: 'Selesai' }
  ]
};
MENUS.records = {
  key: 'records', icon: 'book', type: 'crud', group: 'service',
  title: { en: 'Medical Records (RME)', id: 'Rekam Medis' },
  desc: { en: 'Electronic medical record entries: diagnosis, treatment and attending doctor per patient visit.', id: 'Catatan rekam medis elektronik: diagnosa, tindakan, dan dokter per kunjungan pasien.' },
  fields: [
    { k: 'no', label: { en: 'Record no', id: 'No RM' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pasien', label: f('pasien'), type: 'text', req: true },
    { k: 'diagnosa', label: { en: 'Diagnosis', id: 'Diagnosa' }, type: 'text', req: true },
    { k: 'tindakan', label: { en: 'Treatment', id: 'Tindakan' }, type: 'textarea' },
    { k: 'dokter', label: f('dokter'), type: 'doctor' }
  ],
  columns: [
    { k: 'no', label: { en: 'Record no', id: 'No RM' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pasien', label: f('pasien') }, { k: 'diagnosa', label: { en: 'Diagnosis', id: 'Diagnosa' } },
    { k: 'dokter', label: f('dokter') }
  ],
  seed: [
    { id: 'm1', no: 'RM-0001', tanggal: addDays(-1), pasien: 'Siti Aminah', diagnosa: 'ISPA ringan', tindakan: 'Resep OBH dan paracetamol', dokter: 'dr. Andi Wijaya' }
  ]
};
MENUS.rxin = {
  key: 'rxin', icon: 'pill', type: 'crud', group: 'service',
  title: { en: 'Prescription Intake', id: 'Penerimaan Resep' },
  desc: { en: 'Log incoming prescriptions from doctors before they are dispensed, including the prescribing doctor.', id: 'Catat resep masuk dari dokter sebelum diserahkan, termasuk dokter penulis resep.' },
  fields: [
    { k: 'no', label: { en: 'Rx no', id: 'No resep' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'pasien', label: f('pasien'), type: 'text', req: true },
    { k: 'dokter', label: f('dokter'), type: 'doctor', req: true },
    { k: 'obat', label: { en: 'Prescribed drugs', id: 'Obat diresepkan' }, type: 'textarea', req: true },
    { k: 'status', label: f('status'), type: 'select', opts: ['Diterima', 'Dilayani', 'Ditolak'] }
  ],
  columns: [
    { k: 'no', label: { en: 'Rx no', id: 'No resep' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pasien', label: f('pasien') }, { k: 'dokter', label: f('dokter') },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'ri1', no: 'RS-0001', tanggal: addDays(0), pasien: 'Siti Aminah', dokter: 'dr. Andi Wijaya', obat: 'OBH Combi 1 botol, Paracetamol 500mg 1 strip', status: 'Diterima' }
  ]
};
MENUS.rxout = {
  key: 'rxout', icon: 'checksq', type: 'crud', group: 'service',
  title: { en: 'Prescription Dispensing', id: 'Penebusan Resep' },
  desc: { en: 'Prescriptions that have been dispensed to the patient, with the drugs handed over and the amount charged.', id: 'Resep yang telah diserahkan ke pasien, beserta obat dan biaya yang ditagihkan.' },
  fields: [
    { k: 'no', label: { en: 'Rx no', id: 'No resep' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'ref', label: { en: 'Intake ref', id: 'Ref penerimaan' }, type: 'text' },
    { k: 'pasien', label: f('pasien'), type: 'text', req: true },
    { k: 'obat', label: { en: 'Drugs dispensed', id: 'Obat diserahkan' }, type: 'textarea', req: true },
    { k: 'total', label: f('total'), type: 'money' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Selesai', 'Sebagian', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: { en: 'Rx no', id: 'No resep' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pasien', label: f('pasien') }, { k: 'obat', label: { en: 'Drugs', id: 'Obat' } },
    { k: 'total', label: f('total'), type: 'money' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'ro1', no: 'RS-0001', tanggal: addDays(0), ref: 'RS-0001', pasien: 'Siti Aminah', obat: 'OBH Combi 1 botol, Paracetamol 500mg 1 strip', total: 16800, status: 'Selesai' }
  ]
};

/* ---------------- inventory ---------------- */
MENUS.products = {
  key: 'products', icon: 'package', type: 'crud', group: 'inventory',
  title: { en: 'Product List', id: 'Daftar Produk' },
  desc: { en: 'Master product catalog with batch number, expiry date and minimum stock. Editing stock here drives the Defecta and Expiry pages.', id: 'Master produk dengan nomor batch, tanggal kadaluarsa, dan stok minimum. Stok di sini menggerakkan halaman Defecta dan Kadaluarsa.' },
  fields: [
    { k: 'kode', label: f('kode'), type: 'text', req: true },
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'kategori', label: f('kategori'), type: 'select', opts: ['Analgesik', 'Antibiotik', 'Vitamin', 'Saluran Cerna', 'Batuk & Flu', 'Antihistamin', 'Antiseptik', 'Alkes', 'Herbal'] },
    { k: 'satuan', label: f('satuan'), type: 'select', opts: ['Tablet', 'Kapsul', 'Sirup', 'Tube', 'Botol', 'Pcs', 'Box'] },
    { k: 'rak', label: f('rak'), type: 'text' },
    { k: 'gudang', label: f('gudang'), type: 'select', opts: ['Gudang Utama', 'Gudang Belakang', 'Etalase'] },
    { k: 'harga_beli', label: { en: 'Buy price', id: 'Harga beli' }, type: 'money', req: true },
    { k: 'harga_jual', label: { en: 'Sell price', id: 'Harga jual' }, type: 'money', req: true },
    { k: 'stok', label: f('stok'), type: 'number', req: true },
    { k: 'min_stok', label: { en: 'Min stock', id: 'Stok minimum' }, type: 'number' },
    { k: 'batch', label: f('batch'), type: 'text' },
    { k: 'expiry', label: f('expiry'), type: 'date' },
    { k: 'barcode', label: 'Barcode', type: 'text' }
  ],
  columns: [
    { k: 'kode', label: f('kode') }, { k: 'nama', label: f('nama') },
    { k: 'kategori', label: f('kategori') }, { k: 'harga_jual', label: { en: 'Sell', id: 'Jual' }, type: 'money' },
    { k: 'stok', label: f('stok'), type: 'num' }, { k: 'min_stok', label: { en: 'Min', id: 'Min' }, type: 'num' },
    { k: 'batch', label: f('batch') }, { k: 'expiry', label: f('expiry'), type: 'date' }
  ],
  seed: [
    { id: 'p1', kode: 'P001', nama: 'Paracetamol 500mg', kategori: 'Analgesik', satuan: 'Tablet', rak: 'A1', gudang: 'Etalase', harga_beli: 800, harga_jual: 1200, stok: 240, min_stok: 40, batch: 'B2401', expiry: addDays(400), barcode: '8991234000011' },
    { id: 'p2', kode: 'P002', nama: 'Amoxicillin 500mg', kategori: 'Antibiotik', satuan: 'Kapsul', rak: 'A2', gudang: 'Etalase', harga_beli: 1500, harga_jual: 2500, stok: 42, min_stok: 50, batch: 'B2312', expiry: addDays(60), barcode: '8991234000028' },
    { id: 'p3', kode: 'P003', nama: 'Vitamin C 1000mg', kategori: 'Vitamin', satuan: 'Tablet', rak: 'B1', gudang: 'Etalase', harga_beli: 1200, harga_jual: 2000, stok: 180, min_stok: 40, batch: 'B2402', expiry: addDays(75), barcode: '8991234000035' },
    { id: 'p4', kode: 'P004', nama: 'Antasida Suspensi', kategori: 'Saluran Cerna', satuan: 'Botol', rak: 'B2', gudang: 'Gudang Utama', harga_beli: 3500, harga_jual: 6000, stok: 24, min_stok: 20, batch: 'B2310', expiry: addDays(-12), barcode: '8991234000042' },
    { id: 'p5', kode: 'P005', nama: 'OBH Combi Batuk', kategori: 'Batuk & Flu', satuan: 'Botol', rak: 'B3', gudang: 'Etalase', harga_beli: 9000, harga_jual: 14000, stok: 60, min_stok: 24, batch: 'B2403', expiry: addDays(30), barcode: '8991234000059' },
    { id: 'p6', kode: 'P006', nama: 'Ibuprofen 400mg', kategori: 'Analgesik', satuan: 'Tablet', rak: 'A1', gudang: 'Etalase', harga_beli: 900, harga_jual: 1500, stok: 96, min_stok: 40, batch: 'B2401', expiry: addDays(500), barcode: '8991234000066' },
    { id: 'p7', kode: 'P007', nama: 'Cetirizine 10mg', kategori: 'Antihistamin', satuan: 'Tablet', rak: 'A3', gudang: 'Etalase', harga_beli: 700, harga_jual: 1200, stok: 18, min_stok: 30, batch: 'B2309', expiry: addDays(45), barcode: '8991234000073' },
    { id: 'p8', kode: 'P008', nama: 'Betadine 30ml', kategori: 'Antiseptik', satuan: 'Botol', rak: 'C1', gudang: 'Etalase', harga_beli: 12000, harga_jual: 18000, stok: 35, min_stok: 12, batch: 'B2402', expiry: addDays(650), barcode: '8991234000080' },
    { id: 'p9', kode: 'P009', nama: 'Masker Medis 3ply', kategori: 'Alkes', satuan: 'Box', rak: 'D1', gudang: 'Gudang Belakang', harga_beli: 22000, harga_jual: 30000, stok: 14, min_stok: 20, batch: 'B2311', expiry: addDays(120), barcode: '8991234000097' },
    { id: 'p10', kode: 'P010', nama: 'Tolak Angin Cair', kategori: 'Herbal', satuan: 'Pcs', rak: 'D2', gudang: 'Etalase', harga_beli: 2500, harga_jual: 4000, stok: 120, min_stok: 30, batch: 'B2404', expiry: addDays(240), barcode: '8991234000103' }
  ]
};
MENUS.defecta = {
  icon: 'alert', type: 'derived', group: 'inventory', source: 'products',
  title: { en: 'Defecta (Low Stock)', id: 'Defecta' },
  desc: { en: 'Products whose stock is at or below the minimum level and should be reordered.', id: 'Produk yang stoknya mencapai atau di bawah batas minimum dan perlu dipesan ulang.' },
  derive: () => db.products.filter((p) => Number(p.stok) <= Number(p.min_stok)),
  columns: [
    { k: 'kode', label: f('kode') }, { k: 'nama', label: f('nama') }, { k: 'kategori', label: f('kategori') },
    { k: 'stok', label: f('stok'), type: 'num' }, { k: 'min_stok', label: { en: 'Min', id: 'Min' }, type: 'num' },
    { k: 'rak', label: f('rak') }
  ]
};
MENUS.expiry = {
  icon: 'clock', type: 'derived', group: 'inventory', source: 'products',
  title: { en: 'Stock Expiry', id: 'Stok Kadaluarsa' },
  desc: { en: 'Batches that are expired or expiring within the alert window (see Configuration), so they can be pulled or returned.', id: 'Batch yang kadaluarsa atau hampir kadaluarsa dalam periode peringatan (lihat Konfigurasi), untuk ditarik atau diretur.' },
  derive: () => db.products.filter((p) => p.expiry && daysLeft(p.expiry) <= (db.config.low_stock_days || 90)).sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry)),
  columns: [
    { k: 'kode', label: f('kode') }, { k: 'nama', label: f('nama') }, { k: 'batch', label: f('batch') },
    { k: 'expiry', label: f('expiry'), type: 'date' }, { k: 'days', label: { en: 'Days left', id: 'Sisa hari' }, type: 'days' },
    { k: 'stok', label: f('stok'), type: 'num' }
  ]
};
MENUS.opname = {
  key: 'opname', icon: 'checksq', type: 'crud', group: 'inventory',
  title: { en: 'Stock Opname', id: 'Stok Opname' },
  desc: { en: 'Physical counting sessions per warehouse. Create a session, record it, then finish it.', id: 'Sesi penghitungan fisik per gudang. Buat sesi, catat, lalu selesaikan.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'gudang', label: f('gudang'), type: 'select', opts: ['Gudang Utama', 'Gudang Belakang', 'Etalase'], req: true },
    { k: 'petugas', label: f('petugas'), type: 'text', req: true },
    { k: 'catatan', label: f('catatan'), type: 'textarea' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Draft', 'Berjalan', 'Selesai'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'gudang', label: f('gudang') },
    { k: 'petugas', label: f('petugas') }, { k: 'catatan', label: f('catatan') }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'op1', no: 'SO-OP-01', tanggal: addDays(-7), gudang: 'Gudang Utama', petugas: 'Rina', catatan: 'Opname bulanan', status: 'Selesai' },
    { id: 'op2', no: 'SO-OP-02', tanggal: addDays(0), gudang: 'Etalase', petugas: 'Dedi', catatan: 'Hitung ulang fast moving', status: 'Berjalan' }
  ]
};
MENUS.adjust = {
  key: 'adjust', icon: 'sliders', type: 'crud', group: 'inventory',
  title: { en: 'Stock Adjustment', id: 'Penyesuaian Stok' },
  desc: { en: 'Correct the system stock when it differs from the physical count, recording the difference and reason.', id: 'Koreksi stok sistem bila berbeda dengan hitungan fisik, catat selisih dan alasannya.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'stok_sistem', label: { en: 'System stock', id: 'Stok sistem' }, type: 'number', req: true },
    { k: 'stok_fisik', label: { en: 'Physical stock', id: 'Stok fisik' }, type: 'number', req: true },
    { k: 'alasan', label: { en: 'Reason', id: 'Alasan' }, type: 'select', opts: ['Rusak', 'Hilang', 'Salah input', 'Kadaluarsa'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'produk', label: f('produk') },
    { k: 'stok_sistem', label: { en: 'System', id: 'Sistem' }, type: 'num' }, { k: 'stok_fisik', label: { en: 'Physical', id: 'Fisik' }, type: 'num' },
    { k: 'alasan', label: { en: 'Reason', id: 'Alasan' } }
  ],
  seed: [
    { id: 'ad1', no: 'ADJ-0001', tanggal: addDays(-6), produk: 'Antasida Suspensi', stok_sistem: 25, stok_fisik: 24, alasan: 'Rusak' }
  ]
};
MENUS.transfer = {
  key: 'transfer', icon: 'transfer', type: 'crud', group: 'inventory',
  title: { en: 'Stock Transfer', id: 'Perpindahan Stok' },
  desc: { en: 'Move stock between warehouses/outlets and track whether the receiving side has confirmed it.', id: 'Pindahkan stok antar gudang/outlet dan pantau apakah sisi penerima sudah konfirmasi.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'dari', label: { en: 'From', id: 'Dari' }, type: 'select', opts: ['Gudang Utama', 'Gudang Belakang', 'Etalase'] },
    { k: 'ke', label: { en: 'To', id: 'Ke' }, type: 'select', opts: ['Gudang Utama', 'Gudang Belakang', 'Etalase'] },
    { k: 'status', label: f('status'), type: 'select', opts: ['Dikirim', 'Diterima', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'produk', label: f('produk') },
    { k: 'qty', label: f('qty'), type: 'num' }, { k: 'dari', label: { en: 'From', id: 'Dari' } }, { k: 'ke', label: { en: 'To', id: 'Ke' } },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'tr1', no: 'TRF-0001', tanggal: addDays(-3), produk: 'Paracetamol 500mg', qty: 50, dari: 'Gudang Utama', ke: 'Etalase', status: 'Diterima' }
  ]
};
MENUS.barcode = {
  icon: 'barcode', type: 'derived', group: 'inventory', source: 'products',
  title: { en: 'Print Product Barcodes', id: 'Cetak Barcode Produk' },
  desc: { en: 'Preview barcode labels for products that have a barcode number, then print them as a sheet.', id: 'Pratinjau label barcode produk yang punya nomor barcode, lalu cetak sebagai lembaran.' },
  labels: true,
  derive: () => db.products.filter((p) => p.barcode),
  columns: [
    { k: 'kode', label: f('kode') }, { k: 'nama', label: f('nama') }, { k: 'barcode', label: 'Barcode' },
    { k: 'harga_jual', label: { en: 'Sell', id: 'Jual' }, type: 'money' }
  ]
};

/* ---------------- purchasing ---------------- */
MENUS.plan = {
  key: 'plan', icon: 'clipboard', type: 'crud', group: 'purchase',
  title: { en: 'Purchase Plan', id: 'Rencana Pembelian' },
  desc: { en: 'Planned monthly procurement per product with priority, before it becomes a purchase order.', id: 'Rencana pengadaan bulanan per produk dengan prioritas, sebelum menjadi pesanan pembelian.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: { en: 'Needed qty', id: 'Jumlah kebutuhan' }, type: 'number', req: true },
    { k: 'bulan', label: { en: 'For month', id: 'Bulan' }, type: 'text' },
    { k: 'prioritas', label: { en: 'Priority', id: 'Prioritas' }, type: 'select', opts: ['Tinggi', 'Sedang', 'Rendah'] },
    { k: 'status', label: f('status'), type: 'select', opts: ['Draft', 'Disetujui', 'Dipesan'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'produk', label: f('produk') },
    { k: 'qty', label: { en: 'Qty', id: 'Jumlah' }, type: 'num' }, { k: 'bulan', label: { en: 'Month', id: 'Bulan' } },
    { k: 'prioritas', label: { en: 'Priority', id: 'Prioritas' }, type: 'badge' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'pl1', no: 'RPP-0001', tanggal: addDays(-2), produk: 'Amoxicillin 500mg', qty: 200, bulan: 'Bulan ini', prioritas: 'Tinggi', status: 'Disetujui' }
  ]
};
MENUS.porders = {
  key: 'porders', icon: 'truck', type: 'crud', group: 'purchase',
  title: { en: 'Purchase Orders', id: 'Pesanan Pembelian' },
  desc: { en: 'Orders sent to suppliers. Track quantity ordered, price and delivery status.', id: 'Pesanan yang dikirim ke supplier. Pantau jumlah, harga, dan status pengiriman.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'supplier', label: f('supplier'), type: 'supplier', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'total', label: f('total'), type: 'money', req: true },
    { k: 'status', label: f('status'), type: 'select', opts: ['Draft', 'Dikirim', 'Diterima', 'Batal'] }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'supplier', label: f('supplier') },
    { k: 'produk', label: f('produk') }, { k: 'qty', label: f('qty'), type: 'num' }, { k: 'total', label: f('total'), type: 'money' },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'po1', no: 'PO-0001', tanggal: addDays(-3), supplier: 'PT Kimia Farma', produk: 'Amoxicillin 500mg', qty: 200, total: 300000, status: 'Dikirim' }
  ]
};
MENUS.pinvoices = {
  key: 'pinvoices', icon: 'filetext', type: 'crud', group: 'purchase',
  title: { en: 'Purchase Invoices', id: 'Faktur Pembelian' },
  desc: { en: 'Supplier invoices received. Saving an invoice adds the quantity to the product stock.', id: 'Faktur dari supplier. Menyimpan faktur menambah jumlah ke stok produk.' },
  onSave: (row) => { const p = db.products.find((x) => x.nama === row.produk); if (p) p.stok = Number(p.stok) + Number(row.qty || 0); store.set('products', db.products); },
  fields: [
    { k: 'no', label: { en: 'Invoice no', id: 'No faktur' }, type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'supplier', label: f('supplier'), type: 'supplier', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'harga', label: f('harga'), type: 'money', req: true },
    { k: 'total', label: f('total'), type: 'money', req: true },
    { k: 'status', label: f('status'), type: 'select', opts: ['Belum Bayar', 'Lunas'] }
  ],
  columns: [
    { k: 'no', label: { en: 'Invoice no', id: 'No faktur' } }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'supplier', label: f('supplier') }, { k: 'produk', label: f('produk') }, { k: 'qty', label: f('qty'), type: 'num' },
    { k: 'total', label: f('total'), type: 'money' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'pi1', no: 'PB-0001', tanggal: addDays(-5), supplier: 'PT Kimia Farma', produk: 'Paracetamol 500mg', qty: 100, harga: 800, total: 80000, status: 'Lunas' }
  ]
};
MENUS.preturns = {
  key: 'preturns', icon: 'undo', type: 'crud', group: 'purchase',
  title: { en: 'Purchase Returns', id: 'Retur Pembelian' },
  desc: { en: 'Goods returned to the supplier (damaged or wrong item) and the resulting credit.', id: 'Barang yang dikembalikan ke supplier (rusak/salah kirim) dan kredit yang dihasilkan.' },
  fields: [
    { k: 'no', label: f('kode'), type: 'text', req: true },
    { k: 'tanggal', label: f('tanggal'), type: 'date', req: true },
    { k: 'supplier', label: f('supplier'), type: 'supplier', req: true },
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'qty', label: f('qty'), type: 'number', req: true },
    { k: 'alasan', label: { en: 'Reason', id: 'Alasan' }, type: 'select', opts: ['Rusak', 'Salah kirim', 'Kadaluarsa'] },
    { k: 'total', label: f('total'), type: 'money' }
  ],
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'supplier', label: f('supplier') },
    { k: 'produk', label: f('produk') }, { k: 'qty', label: f('qty'), type: 'num' }, { k: 'alasan', label: { en: 'Reason', id: 'Alasan' } },
    { k: 'total', label: f('total'), type: 'money' }
  ],
  seed: []
};

/* ---------------- contacts ---------------- */
MENUS.customers = {
  key: 'customers', icon: 'users', type: 'crud', group: 'contacts',
  title: { en: 'Customers', id: 'Pelanggan' },
  desc: { en: 'Customer directory with contact details and membership points.', id: 'Direktori pelanggan dengan kontak dan poin keanggotaan.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'telepon', label: f('telepon'), type: 'text' },
    { k: 'alamat', label: f('alamat'), type: 'textarea' },
    { k: 'member', label: { en: 'Member?', id: 'Member?' }, type: 'select', opts: ['Ya', 'Tidak'] },
    { k: 'poin', label: { en: 'Points', id: 'Poin' }, type: 'number' }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'telepon', label: f('telepon') }, { k: 'alamat', label: f('alamat') },
    { k: 'member', label: { en: 'Member', id: 'Member' }, type: 'badge' }, { k: 'poin', label: { en: 'Points', id: 'Poin' }, type: 'num' }
  ],
  seed: [
    { id: 'c1', nama: 'Budi Santoso', telepon: '0812-1111-2222', alamat: 'Jl. Melati No. 3, Jakarta', member: 'Ya', poin: 120 },
    { id: 'c2', nama: 'Umum', telepon: '-', alamat: '-', member: 'Tidak', poin: 0 }
  ]
};
MENUS.doctors = {
  key: 'doctors', icon: 'stetho', type: 'crud', group: 'contacts',
  title: { en: 'Doctors', id: 'Dokter' },
  desc: { en: 'Referring and prescribing doctors, with their license (SIP) and specialty.', id: 'Dokter perujuk dan penulis resep, dengan nomor SIP dan spesialisasi.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'sip', label: { en: 'License (SIP)', id: 'No SIP' }, type: 'text' },
    { k: 'spesialis', label: { en: 'Specialty', id: 'Spesialis' }, type: 'text' },
    { k: 'telepon', label: f('telepon'), type: 'text' }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'sip', label: { en: 'License (SIP)', id: 'No SIP' } },
    { k: 'spesialis', label: { en: 'Specialty', id: 'Spesialis' } }, { k: 'telepon', label: f('telepon') }
  ],
  seed: [
    { id: 'd1', nama: 'dr. Andi Wijaya', sip: 'SIP 123/DU/2023', spesialis: 'Dokter Umum', telepon: '0813-3333-4444' }
  ]
};
MENUS.suppliers = {
  key: 'suppliers', icon: 'warehouse', type: 'crud', group: 'contacts',
  title: { en: 'Suppliers', id: 'Supplier' },
  desc: { en: 'Distributors and principals you buy from, with the contact person.', id: 'Distributor dan principal tempat membeli, dengan narahubung.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'kontak', label: { en: 'Contact person', id: 'Narahubung' }, type: 'text' },
    { k: 'telepon', label: f('telepon'), type: 'text' },
    { k: 'alamat', label: f('alamat'), type: 'textarea' }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'kontak', label: { en: 'Contact', id: 'Narahubung' } },
    { k: 'telepon', label: f('telepon') }, { k: 'alamat', label: f('alamat') }
  ],
  seed: [
    { id: 'sp1', nama: 'PT Kimia Farma', kontak: 'Bpk. Hadi', telepon: '021-4444-5555', alamat: 'Jl. Industri No. 8, Jakarta' }
  ]
};
MENUS.salespeople = {
  key: 'salespeople', icon: 'user', type: 'crud', group: 'contacts',
  title: { en: 'Sales / Field Officers', id: 'Sales / Pelayan' },
  desc: { en: 'Field sales and pharmacy assistants, with their coverage area.', id: 'Sales lapangan dan pelayan apotek, dengan wilayah cakupan.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'telepon', label: f('telepon'), type: 'text' },
    { k: 'wilayah', label: { en: 'Area', id: 'Wilayah' }, type: 'text' }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'telepon', label: f('telepon') }, { k: 'wilayah', label: { en: 'Area', id: 'Wilayah' } }
  ],
  seed: [
    { id: 'sl1', nama: 'Dedi Kurniawan', telepon: '0857-7777-8888', wilayah: 'Jakarta Pusat' }
  ]
};

/* ---------------- promotions ---------------- */
MENUS.discounts = {
  key: 'discounts', icon: 'percent', type: 'crud', group: 'promo',
  title: { en: 'Product Discounts', id: 'Diskon Produk' },
  desc: { en: 'Per-product discounts valid in a date range, applied by the cashier.', id: 'Diskon per produk yang berlaku dalam rentang tanggal, dipakai kasir.' },
  fields: [
    { k: 'produk', label: f('produk'), type: 'product', req: true },
    { k: 'tipe', label: f('tipe'), type: 'select', opts: ['Persen', 'Nominal'] },
    { k: 'nilai', label: f('nilai'), type: 'number', req: true },
    { k: 'mulai', label: f('mulai'), type: 'date', req: true },
    { k: 'selesai', label: f('selesai'), type: 'date' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Aktif', 'Berakhir', 'Ditutup'] }
  ],
  columns: [
    { k: 'produk', label: f('produk') }, { k: 'tipe', label: f('tipe') }, { k: 'nilai', label: f('nilai'), type: 'num' },
    { k: 'mulai', label: f('mulai'), type: 'date' }, { k: 'selesai', label: f('selesai'), type: 'date' }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'dc1', produk: 'Vitamin C 1000mg', tipe: 'Persen', nilai: 10, mulai: addDays(-5), selesai: addDays(20), status: 'Aktif' }
  ]
};
MENUS.vouchers = {
  key: 'vouchers', icon: 'ticket', type: 'crud', group: 'promo',
  title: { en: 'Discount Vouchers', id: 'Voucher Diskon' },
  desc: { en: 'Redeemable voucher codes with a minimum purchase and expiry date.', id: 'Kode voucher yang bisa ditukar dengan minimum belanja dan tanggal kadaluarsa.' },
  fields: [
    { k: 'kode', label: { en: 'Voucher code', id: 'Kode voucher' }, type: 'text', req: true },
    { k: 'tipe', label: f('tipe'), type: 'select', opts: ['Persen', 'Nominal'] },
    { k: 'nilai', label: f('nilai'), type: 'number', req: true },
    { k: 'minimum', label: { en: 'Min purchase', id: 'Min belanja' }, type: 'money' },
    { k: 'berlaku', label: { en: 'Valid until', id: 'Berlaku sampai' }, type: 'date' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Aktif', 'Berakhir', 'Ditutup'] }
  ],
  columns: [
    { k: 'kode', label: { en: 'Code', id: 'Kode' } }, { k: 'tipe', label: f('tipe') }, { k: 'nilai', label: f('nilai'), type: 'num' },
    { k: 'minimum', label: { en: 'Min', id: 'Min' }, type: 'money' }, { k: 'berlaku', label: { en: 'Valid until', id: 'Berlaku sampai' }, type: 'date' },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'vc1', kode: 'SEHAT10', tipe: 'Persen', nilai: 10, minimum: 50000, berlaku: addDays(30), status: 'Aktif' }
  ]
};
MENUS.members = {
  key: 'members', icon: 'award', type: 'crud', group: 'promo',
  title: { en: 'Member Program', id: 'Program Member' },
  desc: { en: 'Membership cards with point balance and join date.', id: 'Kartu keanggotaan dengan saldo poin dan tanggal bergabung.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'kartu', label: { en: 'Card no', id: 'No kartu' }, type: 'text', req: true },
    { k: 'poin', label: { en: 'Points', id: 'Poin' }, type: 'number' },
    { k: 'sejak', label: { en: 'Member since', id: 'Sejak' }, type: 'date' },
    { k: 'telepon', label: f('telepon'), type: 'text' }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'kartu', label: { en: 'Card', id: 'Kartu' } }, { k: 'poin', label: { en: 'Points', id: 'Poin' }, type: 'num' },
    { k: 'sejak', label: { en: 'Since', id: 'Sejak' }, type: 'date' }, { k: 'telepon', label: f('telepon') }
  ],
  seed: [
    { id: 'mb1', nama: 'Budi Santoso', kartu: 'MB-0001', poin: 120, sejak: addDays(-90), telepon: '0812-1111-2222' }
  ]
};

/* ---------------- reports ---------------- */
MENUS.reportsales = {
  icon: 'barchart', type: 'report', group: 'reports', rtype: 'sales',
  title: { en: 'Sales Report', id: 'Laporan Penjualan' },
  desc: { en: 'Sales within a date range with a grand total. Change the dates then print.', id: 'Penjualan dalam rentang tanggal dengan total keseluruhan. Ubah tanggal lalu cetak.' },
  columns: [
    { k: 'no', label: f('kode') }, { k: 'tanggal', label: f('tanggal'), type: 'date' },
    { k: 'pelanggan', label: f('pelanggan') }, { k: 'metode', label: f('jenis') },
    { k: 'total', label: f('total'), type: 'money' }
  ],
  compute: (from, to) => db.sales.filter((s) => (!from || s.tanggal >= from) && (!to || s.tanggal <= to)),
  summary: (rows) => ({ label: tr('sum'), value: rp(rows.reduce((a, r) => a + Number(r.total || 0), 0)), money: true })
};
MENUS.reportstock = {
  icon: 'barchart', type: 'report', group: 'reports', rtype: 'stock',
  title: { en: 'Stock Report', id: 'Laporan Persediaan' },
  desc: { en: 'Quantity and value of every product currently in stock.', id: 'Jumlah dan nilai setiap produk yang ada di stok saat ini.' },
  columns: [
    { k: 'kode', label: f('kode') }, { k: 'nama', label: f('nama') }, { k: 'kategori', label: f('kategori') },
    { k: 'stok', label: f('stok'), type: 'num' }, { k: 'harga_beli', label: { en: 'Cost', id: 'HPP' }, type: 'money' },
    { k: 'nilai', label: { en: 'Value', id: 'Nilai' }, type: 'money' }
  ],
  compute: () => db.products.map((p) => Object.assign({}, p, { nilai: Number(p.stok || 0) * Number(p.harga_beli || 0) })),
  summary: (rows) => ({ label: tr('sum'), value: rp(rows.reduce((a, r) => a + Number(r.nilai || 0), 0)), money: true })
};
MENUS.reportfinance = {
  icon: 'card', type: 'report', group: 'reports', rtype: 'finance',
  title: { en: 'Finance Report', id: 'Laporan Keuangan' },
  desc: { en: 'Cash in from sales versus cash out for purchases within a date range.', id: 'Kas masuk dari penjualan versus kas keluar untuk pembelian dalam rentang tanggal.' },
  columns: [
    { k: 'tanggal', label: f('tanggal'), type: 'date' }, { k: 'ket', label: { en: 'Description', id: 'Keterangan' } },
    { k: 'tipe', label: f('tipe'), type: 'badge' }, { k: 'masuk', label: { en: 'In', id: 'Masuk' }, type: 'money' },
    { k: 'keluar', label: { en: 'Out', id: 'Keluar' }, type: 'money' }
  ],
  compute: (from, to) => {
    const inc = db.sales.filter((s) => (!from || s.tanggal >= from) && (!to || s.tanggal <= to))
      .map((s) => ({ tanggal: s.tanggal, ket: 'Penjualan ' + s.no, tipe: 'Pemasukan', masuk: s.total, keluar: 0 }));
    const out = db.pinvoices.filter((s) => (!from || s.tanggal >= from) && (!to || s.tanggal <= to))
      .map((s) => ({ tanggal: s.tanggal, ket: 'Pembelian ' + s.no, tipe: 'Pengeluaran', masuk: 0, keluar: s.total }));
    return inc.concat(out).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  },
  summary: (rows) => ({ label: tr('sum'), value: rp(rows.reduce((a, r) => a + Number(r.masuk || 0) - Number(r.keluar || 0), 0)), money: true })
};

/* ---------------- settings ---------------- */
MENUS.profile = {
  icon: 'home', type: 'profile', group: 'settings',
  title: { en: 'Pharmacy Profile', id: 'Profil Apotek' },
  desc: { en: 'Business identity used on every printed document and receipt.', id: 'Identitas usaha yang dipakai di semua dokumen cetak dan struk.' },
  fields: [
    { k: 'nama', label: { en: 'Pharmacy name', id: 'Nama apotek' }, type: 'text', req: true },
    { k: 'alamat', label: f('alamat'), type: 'textarea', req: true },
    { k: 'telp', label: f('telepon'), type: 'text' },
    { k: 'apoteker', label: { en: 'Pharmacist in charge', id: 'Apoteker penanggung jawab' }, type: 'text' },
    { k: 'sia', label: { en: 'SIA license', id: 'No SIA' }, type: 'text' },
    { k: 'npwp', label: 'NPWP', type: 'text' }
  ]
};
MENUS.payments = {
  key: 'payments', icon: 'card', type: 'crud', group: 'settings',
  title: { en: 'Payment Methods', id: 'Metode Pembayaran' },
  desc: { en: 'Payment channels offered at the cashier and the extra fee each one adds.', id: 'Metode pembayaran yang tersedia di kasir dan biaya tambahan masing-masing.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'tipe', label: f('tipe'), type: 'select', opts: ['Tunai', 'QRIS', 'Transfer', 'Kartu'] },
    { k: 'biaya', label: { en: 'Fee (%)', id: 'Biaya (%)' }, type: 'number' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Aktif', 'Nonaktif'] }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'tipe', label: f('tipe') }, { k: 'biaya', label: { en: 'Fee %', id: 'Biaya %' }, type: 'num' },
    { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'pay1', nama: 'Tunai', tipe: 'Tunai', biaya: 0, status: 'Aktif' },
    { id: 'pay2', nama: 'QRIS', tipe: 'QRIS', biaya: 0.7, status: 'Aktif' },
    { id: 'pay3', nama: 'Transfer Bank', tipe: 'Transfer', biaya: 0, status: 'Aktif' }
  ]
};
MENUS.config = {
  icon: 'settings', type: 'config', group: 'settings',
  title: { en: 'Configuration', id: 'Konfigurasi' },
  desc: { en: 'Tax rate, receipt footer, expiry alert window. Reset data returns every page to the sample set.', id: 'Tarif pajak, footer struk, periode peringatan kadaluarsa. Reset data mengembalikan semua halaman ke contoh.' },
  fields: [
    { k: 'ppn', label: { en: 'Tax (PPN %)', id: 'PPN (%)' }, type: 'number' },
    { k: 'printer', label: { en: 'Printer width (mm)', id: 'Lebar printer (mm)' }, type: 'select', opts: ['58', '80'] },
    { k: 'low_stock_days', label: { en: 'Expiry alert (days)', id: 'Peringatan kadaluarsa (hari)' }, type: 'number' },
    { k: 'struk_footer', label: { en: 'Receipt footer', id: 'Footer struk' }, type: 'textarea' }
  ]
};
MENUS.users = {
  key: 'users', icon: 'users', type: 'crud', group: 'settings',
  title: { en: 'Users & Roles', id: 'Pengguna & Peran' },
  desc: { en: 'Staff accounts, their role and what they are allowed to access.', id: 'Akun staf, perannya, dan apa yang boleh diakses.' },
  fields: [
    { k: 'nama', label: f('nama'), type: 'text', req: true },
    { k: 'username', label: { en: 'Username', id: 'Username' }, type: 'text', req: true },
    { k: 'peran', label: { en: 'Role', id: 'Peran' }, type: 'select', opts: ['Admin', 'Kasir', 'Apoteker', 'Dokter'] },
    { k: 'hak', label: { en: 'Permissions', id: 'Hak akses' }, type: 'textarea' },
    { k: 'status', label: f('status'), type: 'select', opts: ['Aktif', 'Nonaktif'] }
  ],
  columns: [
    { k: 'nama', label: f('nama') }, { k: 'username', label: 'Username' }, { k: 'peran', label: { en: 'Role', id: 'Peran' }, type: 'badge' },
    { k: 'hak', label: { en: 'Permissions', id: 'Hak akses' } }, { k: 'status', label: f('status'), type: 'badge' }
  ],
  seed: [
    { id: 'u1', nama: 'Rina Sari', username: 'rina', peran: 'Apoteker', hak: 'Semua modul', status: 'Aktif' },
    { id: 'u2', nama: 'Dedi Kurniawan', username: 'dedi', peran: 'Kasir', hak: 'Kasir, Penjualan, Persediaan', status: 'Aktif' }
  ]
};

/* ---------------- state + boot ---------------- */
let current = 'dashboard';
let cart = [];
let reportFrom = addDays(-30);
let reportTo = today();

function boot() {
  GROUPS.forEach((g) => g.items.forEach((id) => {
    const m = MENUS[id];
    if (m && m.type === 'crud') {
      let v = store.get(m.key);
      if (!v) { v = m.seed ? JSON.parse(JSON.stringify(m.seed)) : []; store.set(m.key, v); }
      db[m.key] = v;
    }
  }));
  db.profile = store.get('profile') || JSON.parse(JSON.stringify(PROFILE_SEED));
  if (db.profile.nama === 'Apotek Sehat Digital') { db.profile.nama = PROFILE_SEED.nama; store.set('profile', db.profile); }
  if (!store.get('profile')) store.set('profile', db.profile);
  db.config = store.get('config') || JSON.parse(JSON.stringify(CONFIG_SEED));
  if (!store.get('config')) store.set('config', db.config);
}

function badgeClass(v) {
  const s = String(v || '').toLowerCase();
  if (/lunas|aktif|selesai|diterima|disetujui|diterima|ya|done/.test(s)) return 'ok';
  if (/draft|menunggu|diproses|dikirim|berjalan|sebagian|rendah|belum/.test(s)) return 'warn';
  if (/batal|ditolak|kadaluarsa|nonaktif|berakhir|tinggi|ditolak/.test(s)) return 'danger';
  return 'info';
}
function cellText(row, col) {
  const v = row[col.k];
  switch (col.type) {
    case 'money': return rp(v);
    case 'num': return nf(v);
    case 'date': return fmtDate(v);
    case 'items': return row.items ? row.items.length + ' item' : '-';
    case 'days': { const d = daysLeft(row.expiry); return (d < 0 ? Math.abs(d) + ' hr lalu' : d + ' hr'); }
    case 'badge': return '<span class="badge ' + badgeClass(v) + '">' + esc(v) + '</span>';
    default: return esc(v);
  }
}

/* ---------------- rendering helpers ---------------- */
let searchQ = '';
function head(m) {
  return '<div class="page-head"><div><h3 style="font-size:17px">' + esc(L(m.title)) + '</h3><div class="desc">' + esc(L(m.desc)) + '</div></div></div>';
}
function tableHTML(cols, rows, opts) {
  opts = opts || {};
  const isNum = (c) => c.type === 'money' || c.type === 'num' || c.type === 'days';
  let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr>';
  h += cols.map((c) => '<th class="' + (isNum(c) ? 'num' : '') + '">' + esc(L(c.label)) + '</th>').join('');
  if (opts.actions) h += '<th class="num">' + esc(tr('actions')) + '</th>';
  h += '</tr></thead><tbody>';
  if (!rows.length) {
    h += '<tr><td class="empty" colspan="' + (cols.length + (opts.actions ? 1 : 0)) + '">' + esc(tr('empty')) + '</td></tr>';
  } else {
    h += rows.map((r) => {
      let t = '<tr>' + cols.map((c) => '<td class="' + (isNum(c) ? 'num' : '') + '">' + cellText(r, c) + '</td>').join('');
      if (opts.actions) t += '<td class="num"><button class="btn btn-icon" data-edit="' + esc(r.id) + '" title="' + esc(tr('edit')) + '">' + icon('edit') + '</button><button class="btn btn-icon btn-danger" data-del="' + esc(r.id) + '" title="' + esc(tr('del')) + '">' + icon('trash') + '</button></td>';
      return t + '</tr>';
    }).join('');
  }
  return h + '</tbody></table></div>';
}
function filterRows(rows) {
  if (!searchQ) return rows;
  const q = searchQ.toLowerCase();
  return rows.filter((r) => Object.values(r).some((v) => String(v == null ? '' : v).toLowerCase().includes(q)));
}
function crudHTML(m) {
  return head(m) +
    '<div class="toolbar"><div class="search">' + icon('search') + '<input class="input" id="q" placeholder="' + esc(tr('search')) + '" value="' + esc(searchQ) + '"></div><div class="spacer"></div>' +
    '<button class="btn" data-print="page">' + icon('printer') + esc(tr('print')) + '</button>' +
    '<button class="btn btn-primary" data-new>' + icon('plus') + esc(tr('add')) + '</button></div>' +
    '<div id="table-host">' + tableHTML(m.columns, filterRows(db[m.key]), { actions: true }) + '</div>';
}
function derivedHTML(m) {
  return head(m) +
    '<div class="toolbar"><div class="spacer"></div><button class="btn" data-print="' + (m.labels ? 'labels' : 'page') + '">' + icon('printer') + esc(tr('print')) + '</button></div>' +
    (m.labels ? '<div class="card" style="padding:12px"><div class="label-grid">' + m.derive().map(barcodeLabel).join('') + '</div></div>' : '<div id="table-host">' + tableHTML(m.columns, m.derive()) + '</div>');
}
function barcodeLabel(p) {
  const bars = String(p.barcode || '').split('').map((ch, i) => '<rect x="' + (i * 2) + '" y="0" width="' + (1 + (Number(ch) % 2)) + '" height="28" fill="#000"/>').join('');
  return '<div class="barcode-label"><div>' + esc(p.nama) + '</div><svg width="' + (String(p.barcode).length * 2) + '" height="28" viewBox="0 0 ' + (String(p.barcode).length * 2) + ' 28">' + bars + '</svg><div>' + esc(p.barcode) + '</div><div>' + rp(p.harga_jual) + '</div></div>';
}

/* ---------------- reports + dashboard ---------------- */
function reportHTML(m) {
  const rows = m.compute(reportFrom, reportTo);
  const sum = m.summary(rows);
  return head(m) +
    '<div class="toolbar">' +
    '<label><span style="font-size:11px;color:var(--muted)">' + esc(tr('dateFrom')) + '</span><input type="date" class="input" id="from" value="' + reportFrom + '"></label>' +
    '<label><span style="font-size:11px;color:var(--muted)">' + esc(tr('dateTo')) + '</span><input type="date" class="input" id="to" value="' + reportTo + '"></label>' +
    '<button class="btn" data-apply>' + esc(tr('apply')) + '</button>' +
    '<div class="spacer"></div><button class="btn" data-print="page">' + icon('printer') + esc(tr('print')) + '</button></div>' +
    '<div id="table-host">' + tableHTML(m.columns, rows) + '</div>' +
    '<div class="card" style="padding:12px 14px;margin-top:12px;display:flex;justify-content:space-between;font-weight:700"><span>' + esc(sum.label) + '</span><span>' + esc(sum.value) + '</span></div>';
}
function statCard(label, value, ic) {
  return '<div class="stat"><div class="k">' + icon(ic, 14) + '<span>' + esc(label) + '</span></div><div class="v">' + value + '</div></div>';
}
function dashboardHTML() {
  const todays = db.sales.filter((s) => s.tanggal === today());
  const totalToday = todays.reduce((a, s) => a + Number(s.total || 0), 0);
  const low = db.products.filter((p) => Number(p.stok) <= Number(p.min_stok));
  const exp = db.products.filter((p) => p.expiry && daysLeft(p.expiry) <= 90).sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry)).slice(0, 5);
  const latest = db.sales.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 5);
  const top = {};
  db.sales.forEach((s) => (s.items || []).forEach((i) => { top[i.nama] = (top[i.nama] || 0) + Number(i.qty || 1); }));
  const topArr = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxQ = Math.max(1, topArr.length ? topArr[0][1] : 1);
  const bars = topArr.length ? topArr.map((x) => '<div class="bar-row"><span>' + esc(x[0]) + '</span><span class="bar-track"><span class="bar-fill" style="width:' + Math.round((x[1] / maxQ) * 100) + '%"></span></span><span class="num">' + x[1] + '</span></div>').join('') : '<div class="empty-cart">' + esc(tr('empty')) + '</div>';
  return '<div class="stats">' +
    statCard(L({en:'Sales today',id:'Penjualan hari ini'}), rp(totalToday), 'cart') +
    statCard(L({en:'Transactions',id:'Transaksi'}), String(todays.length), 'receipt') +
    statCard(L({en:'Active products',id:'Produk aktif'}), String(db.products.length), 'package') +
    statCard(L({en:'Low stock',id:'Stok kritis'}), String(low.length), 'alert') +
    statCard(L({en:'Near expiry',id:'Hampir ED'}), String(db.products.filter((p) => p.expiry && daysLeft(p.expiry) <= (db.config.low_stock_days || 90)).length), 'clock') +
    '</div>' +
    '<div class="grid-2"><div class="card"><div class="card-head"><h3>' + esc(L({en:'Latest sales',id:'Penjualan terbaru'})) + '</h3></div>' + tableHTML(MENUS.sales.columns.slice(0, 5), latest) + '</div>' +
    '<div class="card"><div class="card-head"><h3>' + esc(L({en:'Expiring soon',id:'Segera kadaluarsa'})) + '</h3></div>' + tableHTML(MENUS.expiry.columns.slice(0, 5), exp) + '</div></div>' +
    '<div class="card" style="margin-top:14px"><div class="card-head"><h3>' + esc(L({en:'Top products',id:'Produk terlaris'})) + '</h3></div><div class="bars">' + bars + '</div></div>';
}

/* ---------------- forms + modal ---------------- */
function selectHTML(label, value, opts) {
  return '<select class="input" data-key="' + label + '"><option value="">-</option>' +
    opts.map((o) => '<option' + (String(value) === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
}
function fieldHTML(fd, value) {
  const v = value == null ? '' : value;
  let input;
  if (fd.type === 'select') input = selectHTML(fd.k, v, fd.opts || []);
  else if (fd.type === 'product') input = selectHTML(fd.k, v, db.products.map((p) => p.nama));
  else if (fd.type === 'doctor') input = selectHTML(fd.k, v, db.doctors.map((p) => p.nama));
  else if (fd.type === 'supplier') input = selectHTML(fd.k, v, db.suppliers.map((p) => p.nama));
  else if (fd.type === 'textarea') input = '<textarea class="input" rows="2" data-key="' + fd.k + '">' + esc(v) + '</textarea>';
  else input = '<input class="input" type="' + (fd.type === 'number' || fd.type === 'money' ? 'number' : fd.type === 'date' ? 'date' : 'text') + '" data-key="' + fd.k + '" value="' + esc(v) + '">';
  return '<div class="field' + (fd.type === 'textarea' ? ' full' : '') + '"><label>' + esc(L(fd.label)) + (fd.req ? ' *' : '') + '</label>' + input + '<div class="err">' + esc(tr('required')) + '</div></div>';
}
function collect(scope) {
  const out = {};
  let ok = true;
  $$('[' + 'data-key]', scope).forEach((el) => {
    const map = scope.__fields || [];
    const fd = map.find((x) => x.k === el.dataset.key);
    const val = el.value;
    if (fd && fd.req && String(val).trim() === '') { el.closest('.field').classList.add('invalid'); ok = false; }
    else { el.closest('.field').classList.remove('invalid'); out[el.dataset.key] = (fd && (fd.type === 'number' || fd.type === 'money')) ? Number(val || 0) : val; }
  });
  return ok ? out : null;
}
function openModal(html) { const o = $('#overlay'); o.innerHTML = '<div class="modal' + (html.wide ? ' wide' : '') + '">' + html.body + '</div>'; o.classList.remove('hidden'); }
function closeModal() { $('#overlay').classList.add('hidden'); $('#overlay').innerHTML = ''; }
function openForm(m, row) {
  const isEdit = !!row;
  const data = row || {};
  const body = '<div class="modal-head"><h3>' + (isEdit ? esc(tr('edit')) : esc(tr('add'))) + ' - ' + esc(L(m.title)) + '</h3><button class="btn btn-ghost btn-icon" data-close>' + icon('x') + '</button></div>' +
    '<div class="modal-body"><div class="form-grid" id="form-grid">' + m.fields.map((fd) => fieldHTML(fd, data[fd.k])).join('') + '</div></div>' +
    '<div class="modal-foot"><button class="btn" data-close>' + esc(tr('cancel')) + '</button><button class="btn btn-primary" data-save>' + esc(tr('save')) + '</button></div>';
  openModal({ body: body });
  const grid = $('#form-grid');
  if (grid) grid.__fields = m.fields;
}

/* ---------------- POS ---------------- */
let posQ = '';
function posHTML(m) {
  const prods = db.products.filter((p) => !posQ || (p.nama + ' ' + p.kode + ' ' + p.barcode).toLowerCase().includes(posQ.toLowerCase()));
  const grid = prods.length ? prods.map((p) => {
    const out = Number(p.stok) <= 0;
    return '<button class="prod" data-add="' + esc(p.kode) + '"' + (out ? ' disabled style="opacity:.45;cursor:not-allowed"' : '') + '><b>' + esc(p.nama) + '</b><div class="sub">' + esc(p.kode) + ' &middot; ' + esc(p.kategori) + '</div><div class="price">' + rp(p.harga_jual) + '</div><div class="stk">' + (out ? esc(tr('noStock')) : 'Stok: ' + nf(p.stok)) + '</div></button>';
  }).join('') : '<div class="empty-cart">' + esc(tr('empty')) + '</div>';
  return head(m) + '<div class="pos"><div class="card pos-products"><div style="padding:12px;border-bottom:1px solid var(--line)"><div class="search">' + icon('search') + '<input class="input" id="posq" placeholder="' + esc(tr('search')) + '" value="' + esc(posQ) + '"></div></div><div class="grid">' + grid + '</div></div>' + cartHTML() + '</div>';
}
function cartHTML() {
  const ppn = Number(db.config.ppn || 0);
  const subtotal = cart.reduce((a, c) => a + c.qty * c.harga, 0);
  const disc = cart.reduce((a, c) => a + c.qty * c.harga * (Number(c.disc || 0) / 100), 0);
  const base = subtotal - disc;
  const tax = Math.round(base * ppn / 100);
  const total = base + tax;
  let items = cart.length ? cart.map((c, i) =>
    '<div class="crow"><div><b>' + esc(c.nama) + '</b><small>' + rp(c.harga) + ' &middot; disc <input class="input" style="width:44px;padding:1px 4px;font-size:11px" data-disc="' + i + '" value="' + (c.disc || 0) + '" type="number"> %</small></div>' +
    '<div class="qty"><button data-dec="' + i + '">-</button><span>' + c.qty + '</span><button data-inc="' + i + '">+</button></div>' +
    '<div class="num" style="text-align:right">' + rp(c.qty * c.harga) + '<br><button class="btn btn-ghost btn-icon" data-rm="' + i + '" title="' + esc(tr('del')) + '">' + icon('x', 12) + '</button></div></div>').join('') :
    '<div class="empty-cart">' + esc(tr('cartEmpty')) + '</div>';
  const payBtn = '<button class="btn btn-primary full" data-pay' + (cart.length ? '' : ' disabled style="opacity:.5"') + '>' + icon('cart') + esc(tr('pay')) + '</button>';
  const pay = '<div class="pay"><select class="input" id="metode"><option>Tunai</option><option>QRIS</option><option>Transfer</option><option>Kartu</option></select>' +
    '<input class="input" id="bayar" type="number" placeholder="' + esc(tr('cash')) + '" value="' + (cart.length ? total : '') + '">' + payBtn + '</div>';
  return '<div class="card cart"><div class="card-head"><h3>' + esc(tr('receipt')) + '</h3><span class="badge info">' + cart.reduce((a, c) => a + c.qty, 0) + ' item</span></div>' +
    '<div class="cart-list">' + items + '</div><div class="cart-sum">' +
    '<div class="line"><span>' + esc(tr('subtotal')) + '</span><span>' + rp(subtotal) + '</span></div>' +
    '<div class="line"><span>' + esc(tr('discount')) + '</span><span>' + rp(disc) + '</span></div>' +
    '<div class="line"><span>PPN ' + ppn + '%</span><span>' + rp(tax) + '</span></div>' +
    '<div class="line total"><span>' + esc(tr('total')) + '</span><span>' + rp(total) + '</span></div>' +
    '</div>' + pay + '</div>';
}
function addToCart(kode) {
  const p = db.products.find((x) => x.kode === kode);
  if (!p) return;
  const line = cart.find((c) => c.kode === kode);
  if (line) { if (line.qty < Number(p.stok)) line.qty += 1; }
  else cart.push({ kode: kode, nama: p.nama, harga: Number(p.harga_jual), qty: 1, disc: 0 });
  rerender();
}
function cartTotals() {
  const ppn = Number(db.config.ppn || 0);
  const subtotal = cart.reduce((a, c) => a + c.qty * c.harga, 0);
  const disc = cart.reduce((a, c) => a + c.qty * c.harga * (Number(c.disc || 0) / 100), 0);
  const base = subtotal - disc, tax = Math.round(base * ppn / 100);
  return { subtotal: subtotal, disc: disc, tax: tax, total: base + tax };
}

/* ---------------- pay + print ---------------- */
let lastReceipt = null;
function saleNo() {
  const n = db.sales.reduce((a, s) => Math.max(a, Number(String(s.no).replace(/\D/g, '')) || 0), 0) + 1;
  return 'INV-' + String(n).padStart(4, '0');
}
function pay() {
  if (!cart.length) return;
  const t = cartTotals();
  const bayar = Number(($('#bayar') || {}).value || 0);
  if (bayar < t.total) { alert(tr('cashShort') + ' (' + rp(t.total) + ')'); return; }
  const sale = {
    id: uid(), no: saleNo(), tanggal: today(), pelanggan: 'Umum',
    items: cart.map((c) => ({ kode: c.kode, nama: c.nama, qty: c.qty, harga: c.harga, diskon: c.disc })),
    subtotal: t.subtotal, diskon: t.disc, ppn: t.tax, total: t.total,
    metode: ($('#metode') || {}).value || 'Tunai', bayar: bayar, kembali: bayar - t.total, kasir: 'Kasir 1', status: 'Lunas'
  };
  db.sales.push(sale); store.set('sales', db.sales);
  sale.items.forEach((it) => { const p = db.products.find((x) => x.kode === it.kode); if (p) p.stok = Math.max(0, Number(p.stok) - it.qty); });
  store.set('products', db.products);
  lastReceipt = sale;
  cart = [];
  rerender();
  openModal({ body: '<div class="modal-head"><h3>' + esc(tr('receipt')) + ' ' + esc(sale.no) + '</h3><button class="btn btn-ghost btn-icon" data-close>' + icon('x') + '</button></div>' +
    '<div class="modal-body">' + receiptHTML(sale) + '</div>' +
    '<div class="modal-foot"><button class="btn" data-close>' + esc(tr('close')) + '</button><button class="btn btn-primary" data-print-receipt>' + icon('printer') + esc(tr('print')) + '</button></div>' });
}
function receiptHTML(sale) {
  const p = db.profile, c = db.config;
  return '<div class="receipt"><h4>' + esc(p.nama) + '</h4><div class="center">' + esc(p.alamat) + '<br>' + esc(p.telp) + '</div><hr>' +
    '<table><tr><td>No</td><td class="r">' + esc(sale.no) + '</td></tr><tr><td>Tanggal</td><td class="r">' + fmtDate(sale.tanggal) + '</td></tr><tr><td>Kasir</td><td class="r">' + esc(sale.kasir || '-') + '</td></tr></table><hr>' +
    '<table>' + (sale.items || []).map((i) => '<tr><td colspan="2">' + esc(i.nama) + '</td></tr><tr><td>' + i.qty + ' x ' + rp(i.harga) + '</td><td class="r">' + rp(i.qty * i.harga) + '</td></tr>').join('') + '</table><hr>' +
    '<table><tr><td>Subtotal</td><td class="r">' + rp(sale.subtotal) + '</td></tr><tr><td>Diskon</td><td class="r">' + rp(sale.diskon) + '</td></tr><tr><td>PPN</td><td class="r">' + rp(sale.ppn || 0) + '</td></tr><tr><td><b>Total</b></td><td class="r"><b>' + rp(sale.total) + '</b></td></tr><tr><td>' + esc(sale.metode) + '</td><td class="r">' + rp(sale.bayar) + '</td></tr><tr><td>Kembali</td><td class="r">' + rp(sale.kembali) + '</td></tr></table><hr>' +
    '<div class="center">' + esc(c.struk_footer || '') + '</div><div class="center" style="margin-top:4px">' + esc(p.apoteker) + '</div></div>';
}
function a4HTML(m, rows) {
  const p = db.profile;
  const cols = m.columns;
  const money = (c) => c.type === 'money' || c.type === 'num';
  return '<h2>' + esc(p.nama) + '</h2><div class="meta">' + esc(p.alamat) + ' &middot; ' + esc(p.telp) + '</div>' +
    '<h3 style="font-size:14px;margin:6px 0 2px">' + esc(L(m.title)) + '</h3><div class="meta">Dicetak ' + fmtDate(today()) + (m.type === 'report' ? ' &middot; ' + fmtDate(reportFrom) + ' s/d ' + fmtDate(reportTo) : '') + '</div>' +
    '<table><thead><tr>' + cols.map((c) => '<th' + (money(c) ? ' style="text-align:right"' : '') + '>' + esc(L(c.label)) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + cols.map((c) => '<td' + (money(c) ? ' class="num"' : '') + '>' + (c.type === 'badge' ? esc(r[c.k]) : cellText(r, c)) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table><div class="sig"><span>Petugas</span><span>' + esc(p.apoteker) + '</span></div>';
}
function printArea(html, mode) {
  const cls = mode === 'receipt' ? 'print-receipt' + (String(db.config.printer) === '58' ? ' w58' : '') : 'print-a4';
  const w = String(db.config.printer) === '58' ? '58mm' : '80mm';
  const area = $('#print-area');
  area.classList.add('measuring');
  area.innerHTML = '<div class="' + cls + '">' + html + '</div>';
  let pageCss;
  if (mode === 'receipt') {
    const box = area.firstElementChild;
    const px = box ? (box.offsetHeight || box.scrollHeight || 0) : 0;
    const hmm = px > 0 ? Math.ceil(px * 25.4 / 96) + 8 : 297;
    pageCss = '@page{size:' + w + ' ' + hmm + 'mm;margin:3mm}';
  } else {
    pageCss = '@page{size:A4;margin:12mm}';
  }
  area.classList.remove('measuring');
  let st = document.querySelector('#print-size');
  if (!st) { st = document.createElement('style'); st.id = 'print-size'; (document.head || document.body).appendChild(st); }
  st.textContent = pageCss;
  window.print();
  setTimeout(() => { $('#print-area').innerHTML = ''; }, 800);
}
function kvHTML(m, obj) {
  const p = db.profile;
  return '<h2>' + esc(p.nama) + '</h2><div class="meta">' + esc(p.alamat) + ' &middot; ' + esc(p.telp) + '</div>' +
    '<h3 style="font-size:14px;margin:6px 0 2px">' + esc(L(m.title)) + '</h3><div class="meta">Dicetak ' + fmtDate(today()) + '</div>' +
    '<table><tbody>' + m.fields.map((fd) => '<tr><th style="width:36%">' + esc(L(fd.label)) + '</th><td>' + esc(obj[fd.k] == null ? '' : obj[fd.k]) + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="sig"><span>Petugas</span><span>' + esc(p.apoteker) + '</span></div>';
}
function dashPrintHTML() {
  const p = db.profile;
  const todays = db.sales.filter((s) => s.tanggal === today());
  const low = db.products.filter((x) => Number(x.stok) <= Number(x.min_stok));
  const exp = db.products.filter((x) => x.expiry && daysLeft(x.expiry) <= (db.config.low_stock_days || 90));
  return '<h2>' + esc(p.nama) + '</h2><div class="meta">' + esc(p.alamat) + ' &middot; Dicetak ' + fmtDate(today()) + '</div>' +
    '<h3 style="font-size:14px;margin:6px 0 2px">' + esc(L(MENUS.dashboard.title)) + '</h3>' +
    '<table><tbody><tr><th>Penjualan hari ini</th><td>' + esc(rp(todays.reduce((a, s) => a + Number(s.total || 0), 0))) + '</td></tr>' +
    '<tr><th>Transaksi hari ini</th><td>' + todays.length + '</td></tr><tr><th>Jumlah produk</th><td>' + db.products.length + '</td></tr>' +
    '<tr><th>Stok kritis</th><td>' + low.length + '</td></tr><tr><th>Hampir kadaluarsa</th><td>' + exp.length + '</td></tr></tbody></table>' +
    '<h3 style="font-size:13px;margin:10px 0 2px">Stok kritis</h3>' +
    tableHTML(MENUS.defecta.columns, low).replace('class="tbl-wrap"', 'class="tbl-wrap" style="box-shadow:none"') +
    '<div class="sig"><span>Petugas</span><span>' + esc(p.apoteker) + '</span></div>';
}
function printCurrent() {
  const m = MENUS[current];
  if (!m || m.type === 'pos') return;
  if (!m.columns) {
    if (m.type === 'profile') return printArea(kvHTML(m, db.profile), 'a4');
    if (m.type === 'config') return printArea(kvHTML(m, db.config), 'a4');
    if (m.type === 'dashboard') return printArea(dashPrintHTML(), 'a4');
    return;
  }
  if (m.labels) {
    printArea('<h2>' + esc(db.profile.nama) + '</h2><div class="meta">Label barcode produk</div><div class="label-grid print-labels">' + m.derive().map(barcodeLabel).join('') + '</div>', 'a4');
    return;
  }
  const rows = m.type === 'report' ? m.compute(reportFrom, reportTo) : m.type === 'derived' ? m.derive() : (db[m.key] || []);
  printArea(a4HTML(m, rows), 'a4');
}
function printReceipt() { if (lastReceipt) printArea(receiptHTML(lastReceipt).replace('class="receipt"', ''), 'receipt'); }

/* ---------------- shell + events ---------------- */
function singleFormHTML(m, obj, isConfig) {
  return head(m) + '<div class="card" style="padding:18px;max-width:820px"><div class="form-grid" id="form-grid">' +
    m.fields.map((fd) => fieldHTML(fd, obj[fd.k])).join('') + '</div>' +
    '<div style="margin-top:16px;display:flex;gap:8px"><button class="btn btn-primary" data-save-single>' + esc(tr('save')) + '</button>' +
    (isConfig ? '<button class="btn btn-danger" data-reset>' + esc(tr('reset')) + '</button>' : '') + '</div></div>';
}
function renderView() {
  const m = MENUS[current];
  if (!m) return;
  const el = $('#view');
  if (m.type === 'crud') el.innerHTML = crudHTML(m);
  else if (m.type === 'derived') el.innerHTML = derivedHTML(m);
  else if (m.type === 'report') el.innerHTML = reportHTML(m);
  else if (m.type === 'dashboard') el.innerHTML = dashboardHTML();
  else if (m.type === 'pos') el.innerHTML = posHTML(m);
  else if (m.type === 'profile') el.innerHTML = singleFormHTML(m, db.profile, false);
  else if (m.type === 'config') el.innerHTML = singleFormHTML(m, db.config, true);
  const g = $('#form-grid');
  if (g) g.__fields = m.fields;
}
function renderTopbar() {
  const m = MENUS[current];
  $('#page-title').innerHTML = icon(m.icon, 18) + '<span>' + esc(L(m.title)) + '</span>';
  $('#print-page').innerHTML = icon('printer') + esc(tr('print'));
  const lo = $('#logout'); if (lo) lo.textContent = tr('logout');
  $('#lang-toggle').textContent = lang === 'id' ? 'EN' : 'ID';
  $('#brand-sub').textContent = lang === 'id' ? 'Prototype POS' : 'POS Prototype';
  $('#sidebar-foot').textContent = L(db.profile.nama) + ' v1.0';
}
function renderNav() {
  $('#nav').innerHTML = GROUPS.map((g) => '<div class="nav-group"><div class="nav-group-title">' + esc(L(g.label)) + '</div>' +
    g.items.map((id) => { const m = MENUS[id]; return '<button class="nav-item' + (id === current ? ' active' : '') + '" data-nav="' + id + '">' + icon(m.icon) + '<span>' + esc(L(m.title)) + '</span></button>'; }).join('') + '</div>').join('');
}
function rerender() { renderTopbar(); renderView(); }
function render() { renderNav(); rerender(); }
function go(id) { current = id; searchQ = ''; posQ = ''; render(); }

function saveModal() {
  const m = MENUS[current];
  const data = collect($('#form-grid'));
  if (!data) return;
  const editing = m.__editing;
  if (editing) { const i = db[m.key].findIndex((r) => r.id === editing); if (i >= 0) db[m.key][i] = Object.assign({}, db[m.key][i], data); }
  else { data.id = uid(); db[m.key].push(data); if (m.onSave) m.onSave(data, true); }
  store.set(m.key, db[m.key]);
  m.__editing = null;
  closeModal();
  rerender();
}
function saveSingle() {
  const m = MENUS[current];
  const data = collect($('#form-grid'));
  if (!data) return;
  if (m.type === 'profile') { db.profile = Object.assign({}, db.profile, data); store.set('profile', db.profile); }
  else { db.config = Object.assign({}, db.config, data); store.set('config', db.config); }
  rerender();
}
function resetData() {
  if (!confirm(tr('resetQ'))) return;
  GROUPS.forEach((g) => g.items.forEach((id) => { const m = MENUS[id]; if (m && m.type === 'crud') localStorage.removeItem('pharmacy:' + m.key); }));
  localStorage.removeItem('pharmacy:profile'); localStorage.removeItem('pharmacy:config');
  cart = []; boot(); current = 'dashboard'; render();
}
function findRow(id) { const m = MENUS[current]; return (db[m.key] || []).find((r) => String(r.id) === String(id)); }
function onClick(e) {
  const el = e.target.closest('[data-nav],[data-new],[data-edit],[data-del],[data-print],[data-print-receipt],[data-close],[data-add],[data-inc],[data-dec],[data-rm],[data-pay],[data-apply],[data-save],[data-save-single],[data-reset]');
  if (!el) return;
  const d = el.dataset;
  if (d.nav) return go(d.nav);
  if (d.new !== undefined) return openForm(MENUS[current], null);
  if (d.edit) { const r = findRow(d.edit); if (r) { MENUS[current].__editing = r.id; openForm(MENUS[current], r); } return; }
  if (d.del) {
    if (!confirm(tr('delQ'))) return;
    const m = MENUS[current]; db[m.key] = db[m.key].filter((r) => String(r.id) !== String(d.del)); store.set(m.key, db[m.key]); return rerender();
  }
  if (d.print) return printCurrent();
  if (d.printReceipt != null) return printReceipt();
  if (d.close != null) return closeModal();
  if (d.add) return addToCart(d.add);
  if (d.inc) { cart[Number(d.inc)].qty += 1; return rerender(); }
  if (d.dec) { const i = Number(d.dec); cart[i].qty -= 1; if (cart[i].qty <= 0) cart.splice(i, 1); return rerender(); }
  if (d.rm) { cart.splice(Number(d.rm), 1); return rerender(); }
  if (d.pay != null) return pay();
  if (d.apply != null) { reportFrom = $('#from').value; reportTo = $('#to').value; return rerender(); }
  if (d.save != null) return saveModal();
  if (d.saveSingle != null) return saveSingle();
  if (d.reset != null) return resetData();
}
function onInput(e) {
  if (e.target.id === 'q') {
    searchQ = e.target.value;
    const host = $('#table-host'); const m = MENUS[current];
    if (host && m && m.type === 'crud') host.innerHTML = tableHTML(m.columns, filterRows(db[m.key]), { actions: true });
  } else if (e.target.id === 'posq') {
    posQ = e.target.value;
    const v = posQ; renderView();
    const inp = $('#posq'); if (inp) { inp.focus(); inp.setSelectionRange(v.length, v.length); }
  }
}
function onChange(e) {
  if (e.target.dataset.disc != null) { const i = Number(e.target.dataset.disc); cart[i].disc = Number(e.target.value) || 0; rerender(); }
}
function renderLogin() {
  $('#login-title').textContent = 'Farmasi Digital';
  $('#login-sub').textContent = L(UI.loginSub);
  $('#login-user-label').textContent = 'Username';
  $('#login-pass-label').textContent = 'Password';
  $('#login-btn').textContent = tr('login');
  $('#login-err').textContent = L(UI.loginErr);
  $('#login-lang').textContent = lang === 'id' ? 'English' : 'Indonesia';
}
function showApp() { $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); }
function showLogin() { $('#login').classList.remove('hidden'); $('#app').classList.add('hidden'); renderLogin(); }
function tryLogin() {
  const u = ($('#login-user').value || '').trim();
  const pw = $('#login-pass').value || '';
  if (u === 'test' && pw === 'test') { localStorage.setItem('pharmacy:auth', '1'); $('#login-err').classList.add('hidden'); showApp(); }
  else { $('#login-err').classList.remove('hidden'); }
}
function init() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  $('#lang-toggle').addEventListener('click', () => { lang = lang === 'id' ? 'en' : 'id'; localStorage.setItem('pharmacy:lang', lang); render(); });
  $('#print-page').addEventListener('click', printCurrent);
  $('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') closeModal(); });
  $('#login-btn').addEventListener('click', tryLogin);
  $('#login-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  $('#login-lang').addEventListener('click', () => { lang = lang === 'id' ? 'en' : 'id'; localStorage.setItem('pharmacy:lang', lang); renderLogin(); });
  $('#logout').addEventListener('click', () => { localStorage.removeItem('pharmacy:auth'); location.reload(); });
  const p = new URLSearchParams(location.hash.replace('#', '?'));
  if (p.get('menu') && MENUS[p.get('menu')]) current = p.get('menu');
  if (localStorage.getItem('pharmacy:auth') === '1') showApp(); else showLogin();
}
boot();
init();
window.Pharmacy = { db: db, store: store, go: go, MENUS: MENUS, reset: resetData, openForm: openForm, printCurrent: printCurrent, GROUPS: GROUPS, addToCart: addToCart, pay: pay, receiptHTML: receiptHTML, setLang: (x) => { lang = x; render(); }, onClick: onClick, login: tryLogin };
})();
