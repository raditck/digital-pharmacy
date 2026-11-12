/* DOM-shim smoke test: loads app.js, renders every page + form, prints every page. */
const fs = require('fs'), vm = require('vm');
function El() {
  const e = {
    innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, __fields: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, focus() {}, setSelectionRange() {}, appendChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
    querySelector() { return El(); }, querySelectorAll() { return []; }
  };
  return e;
}
const els = {};
const document = {
  querySelector(s) { return els[s] || (els[s] = El()); },
  querySelectorAll() { return []; },
  addEventListener() {}, createElement() { return El(); }
};
const store = {};
const sandbox = {
  console, setTimeout, clearTimeout, Math, Date, JSON, Object, Array, String, Number, URLSearchParams, RegExp,
  document,
  window: {},
  location: { hash: '' },
  localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  confirm: () => true, alert: (m) => { throw new Error('unexpected alert: ' + m); }, print: () => {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
/* migration test: stale stored profile name must become Farmasi Digital */
store['pharmacy:profile'] = JSON.stringify({ nama: 'Apotek Sehat Digital', alamat: 'x' });
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, 'app.js'), 'utf8'), sandbox, { filename: __dirname + '/app.js' });
const P = sandbox.window.Pharmacy;
['id', 'en'].forEach((lg) => P.setLang(lg));
let pages = 0, forms = 0, prints = 0;
['id', 'en'].forEach((lg) => P.setLang(lg));
P.GROUPS.forEach((g) => g.items.forEach((id) => {
  P.go(id); pages++;
  const m = P.MENUS[id];
  if (m.type === 'crud') { P.openForm(m, null); forms++; const row = P.db[m.key][0]; if (row) { P.openForm(m, row); forms++; } }
  P.printCurrent(); prints++;
}));
console.log('OK pages=' + pages + ' forms=' + forms + ' prints=' + prints);
console.log('products=' + P.db.products.length + ' sales=' + P.db.sales.length + ' salesMenu=' + P.db.sales.length);

/* transaction test: add product, pay, assert sale recorded + stock decremented */
P.go('kasir');
const before = P.db.sales.length;
const stockBefore = P.db.products.find((p) => p.kode === 'P001').stok;
P.addToCart('P001');
document.querySelector('#bayar').value = '999999';
document.querySelector('#metode').value = 'Tunai';
P.pay();
const sale = P.db.sales[P.db.sales.length - 1];
const stockAfter = P.db.products.find((p) => p.kode === 'P001').stok;
console.log('sale no=' + sale.no + ' total=' + sale.total + ' change=' + sale.kembali);
console.log('sales ' + before + '->' + P.db.sales.length + ' | P001 stock ' + stockBefore + '->' + stockAfter);
if (P.db.sales.length !== before + 1) throw new Error('sale not recorded');
if (stockAfter !== stockBefore - 1) throw new Error('stock not decremented');
console.log('TRANSACTION OK');
if (P.db.profile.nama !== 'Farmasi Digital') throw new Error('profile rename migration failed: ' + P.db.profile.nama);
console.log('RENAME OK -> ' + P.db.profile.nama + ' v1.0');
