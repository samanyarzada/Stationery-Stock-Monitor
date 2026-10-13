"use strict";

// ---- Config ----------------------------------------------------
const DATA_URL = "data.json";
const CATEGORIES = ["Paper", "Writing", "Office", "Saman"];
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;
const LOW_STOCK_MAX = 3; // 1..3 = low, 0 = out
const HISTORY_LIMIT = 30;
// Built-in copy of data.json, used when the file can't be fetched
// (for example when index.html is opened directly with file://)
const FALLBACK_DATA = [
  { id: 1, name: "Notebook", category: "Paper", price: 60, stock: 10 },
  { id: 2, name: "Blue pen", category: "Writing", price: 15, stock: 3 },
  { id: 3, name: "Pencil", category: "Writing", price: 10, stock: 0 },
  { id: 4, name: "Folder", category: "Office", price: 40, stock: 5 },
  { id: 5, name: "Marker", category: "Writing", price: 50, stock: 2 },
];
const KEYS = { data: "ssm-inventory", log: "ssm-activity", theme: "ssm-theme", lang: "ssm-lang" };

// ---- State -----------------------------------------------------
let inventory = [];
let activity = [];
let pendingConfirm = null;
let usedFallback = false;
let editingId = null;

// ---- Elements --------------------------------------------------
const $ = (id) => document.getElementById(id);
const el = {
  loadStatus: $("load-status"), loadError: $("load-error"), retryBtn: $("retry-btn"),
  statValue: $("stat-value"), statCount: $("stat-count"), statLow: $("stat-low"), statOut: $("stat-out"),
  search: $("search-input"), category: $("category-select"), status: $("status-select"), sort: $("sort-select"),
  filterForm: $("filter-form"), body: $("inventory-body"), empty: $("empty-state"), meta: $("table-meta"),
  addForm: $("add-form"), newName: $("new-name"), newCategory: $("new-category"),
  newPrice: $("new-price"), newStock: $("new-stock"), addError: $("add-form-error"), addBtn: $("add-submit-btn"),
  breakdown: $("breakdown"), activity: $("activity"), clearLog: $("clear-log-btn"),
  exportBtn: $("export-btn"), langBtn: $("lang-btn"), resetBtn: $("reset-btn"), themeBtn: $("theme-btn"), toasts: $("toasts"),
  editDialog: $("edit-dialog"), editForm: $("edit-form"), editName: $("edit-name"),
  editCategory: $("edit-category"), editPrice: $("edit-price"), editStock: $("edit-stock"),
  editError: $("edit-error"), editCancel: $("edit-cancel"),
  confirmDialog: $("confirm-dialog"), confirmText: $("confirm-text"),
  confirmOk: $("confirm-ok"), confirmCancel: $("confirm-cancel"),
};

// ---- Helpers ---------------------------------------------------
// ---- Internationalisation (English / Persian) --------------------
const LOCALES = { en: "en-US", fa: "fa-AF" };
const I18N = {
  en: {
    brand: "Ledger & Loop Stationers", title: "Stationery Stock Monitor",
    export: "Export CSV", reset: "Reset data", langBtn: "فارسی", theme: "Toggle light/dark theme",
    loading: "Loading inventory…", retry: "Retry", afn: "AFN",
    loadError: "We couldn't load the inventory. Make sure data.json is available (run the project through a local server) and try again.",
    invValue: "Inventory value", prodUnits: "Products · units", lowStock: "Low stock", outStock: "Out of stock",
    inventory: "Inventory", search: "Search", searchPh: "e.g. pencil", category: "Category", allCats: "All categories",
    status: "Status", all: "All", st_in: "In stock", st_low: "Low stock", st_out: "Out of stock", st_attention: "Low & out",
    sortBy: "Sort by", "sort_name-asc": "Name A–Z", "sort_name-desc": "Name Z–A",
    "sort_price-desc": "Price high–low", "sort_price-asc": "Price low–high",
    "sort_stock-asc": "Stock low–high", "sort_stock-desc": "Stock high–low", "sort_value-desc": "Value high–low",
    caption: "Current stationery inventory, with quantity controls",
    name: "Name", price: "Price", stock: "Stock", adjust: "Adjust quantity", actionsHidden: "Edit or delete",
    empty: "No products match your filters. Clear them to see the full inventory.",
    addHeading: "Add a product", chooseCat: "Choose a category", priceAfn: "Price (AFN)", startStock: "Starting stock",
    addBtn: "Add product", valueByCat: "Value by category", keyHeading: "Stock status key",
    key_in: "4 units or more", key_low: "1–3 units", key_out: "0 units",
    recent: "Recent activity", clear: "Clear", noActivity: "No activity yet.",
    footer: "Changes are saved in this browser. Use “Reset data” to restore the original list.",
    editTitle: "Edit product", save: "Save changes", cancel: "Cancel",
    delTitle: "Delete product?", delText: "“{name}” will be removed from the inventory.", del: "Delete",
    resetTitle: "Reset all data?", resetText: "All changes will be lost and the original data restored.", resetOk: "Reset",
    restock: "Restock", sell: "Sell", edit: "Edit", editAria: "Edit {name}", delAria: "Delete {name}", qtyLabel: "Quantity for {name}",
    meta: "Showing {n} of {total} products", nProduct: "{n} product", nProducts: "{n} products",
    errName: "Name must be {min}-{max} characters.", errCat: "Please choose a category.",
    errPrice: "Price must be a positive number.", errStock: "Stock must be a whole number, zero or more.",
    errDup: "A product with this name already exists.", errQty: "Enter a whole number greater than zero.",
    log_add: "Added “{name}” ({stock} units).", log_edit: "Edited “{name}”.",
    log_restock: "Restocked {qty} × {name}. Stock: {stock}.",
    log_sell: "Sold {qty} × {name} ({totalMoney}). Stock: {stock}.", log_delete: "Deleted “{name}”.",
    toast_add: "Product added.", toast_edit: "Changes saved.", toast_restock: "{name} restocked.",
    toast_sell: "Sold {qty} {name}. Remaining: {stock}.", toast_delete: "{name} deleted.",
    toast_noStock: "Only {stock} {name} in stock.", toast_export: "Inventory exported.", toast_reset: "Original data restored.",
    toast_fallback: "data.json could not be loaded, so built-in sample data is shown. Run the project through a local server to use your own file.",
    csvHead: "ID|Name|Category|Price (AFN)|Stock|Status|Value (AFN)",
    cat_Paper: "Paper", cat_Writing: "Writing", cat_Office: "Office", cat_Saman: "Saman",
  },
  fa: {
    brand: "لوازم‌التحریر لجر و لوپ", title: "مانیتور موجودی لوازم‌التحریر",
    export: "خروجی CSV", reset: "بازنشانی داده‌ها", langBtn: "English", theme: "تغییر حالت روشن/تاریک",
    loading: "در حال بارگذاری موجودی…", retry: "تلاش دوباره", afn: "افغانی",
    loadError: "بارگذاری موجودی ناموفق بود. مطمئن شو فایل data.json در دسترس است (پروژه را با یک سرور محلی اجرا کن) و دوباره تلاش کن.",
    invValue: "ارزش موجودی", prodUnits: "محصولات · واحدها", lowStock: "موجودی کم", outStock: "تمام‌شده",
    inventory: "موجودی", search: "جستجو", searchPh: "مثلاً مداد", category: "دسته‌بندی", allCats: "همه دسته‌ها",
    status: "وضعیت", all: "همه", st_in: "موجود", st_low: "موجودی کم", st_out: "تمام‌شده", st_attention: "کم و تمام‌شده",
    sortBy: "مرتب‌سازی", "sort_name-asc": "نام (الف تا ی)", "sort_name-desc": "نام (ی تا الف)",
    "sort_price-desc": "قیمت (زیاد به کم)", "sort_price-asc": "قیمت (کم به زیاد)",
    "sort_stock-asc": "موجودی (کم به زیاد)", "sort_stock-desc": "موجودی (زیاد به کم)", "sort_value-desc": "ارزش (زیاد به کم)",
    caption: "موجودی فعلی لوازم‌التحریر همراه با کنترل تعداد",
    name: "نام", price: "قیمت", stock: "موجودی", adjust: "تعداد", actionsHidden: "ویرایش یا حذف",
    empty: "هیچ محصولی با فیلترهای شما پیدا نشد. فیلترها را پاک کن تا همه موجودی را ببینی.",
    addHeading: "افزودن محصول", chooseCat: "یک دسته انتخاب کن", priceAfn: "قیمت (افغانی)", startStock: "موجودی اولیه",
    addBtn: "افزودن محصول", valueByCat: "ارزش به تفکیک دسته", keyHeading: "راهنمای وضعیت موجودی",
    key_in: "۴ واحد یا بیشتر", key_low: "۱ تا ۳ واحد", key_out: "۰ واحد",
    recent: "فعالیت‌های اخیر", clear: "پاک کردن", noActivity: "هنوز فعالیتی ثبت نشده.",
    footer: "تغییرات در همین مرورگر ذخیره می‌شوند. برای برگرداندن فهرست اولیه از «بازنشانی داده‌ها» استفاده کن.",
    editTitle: "ویرایش محصول", save: "ذخیره تغییرات", cancel: "انصراف",
    delTitle: "محصول حذف شود؟", delText: "«{name}» از موجودی حذف می‌شود.", del: "حذف",
    resetTitle: "همه داده‌ها بازنشانی شود؟", resetText: "همه تغییرات از بین می‌رود و داده‌های اولیه برمی‌گردد.", resetOk: "بازنشانی",
    restock: "افزایش موجودی", sell: "فروش", edit: "ویرایش", editAria: "ویرایش {name}", delAria: "حذف {name}", qtyLabel: "تعداد برای {name}",
    meta: "نمایش {n} از {total} محصول", nProduct: "{n} محصول", nProducts: "{n} محصول",
    errName: "نام باید بین {min} تا {max} نویسه باشد.", errCat: "لطفاً یک دسته انتخاب کن.",
    errPrice: "قیمت باید عددی مثبت باشد.", errStock: "موجودی باید عدد صحیح و صفر یا بیشتر باشد.",
    errDup: "محصولی با این نام از قبل وجود دارد.", errQty: "یک عدد صحیح بزرگ‌تر از صفر وارد کن.",
    log_add: "«{name}» اضافه شد ({stock} واحد).", log_edit: "«{name}» ویرایش شد.",
    log_restock: "{qty} × {name} به موجودی اضافه شد. موجودی: {stock}.",
    log_sell: "{qty} × {name} فروخته شد ({totalMoney}). موجودی: {stock}.", log_delete: "«{name}» حذف شد.",
    toast_add: "محصول اضافه شد.", toast_edit: "تغییرات ذخیره شد.", toast_restock: "موجودی {name} افزایش یافت.",
    toast_sell: "{qty} {name} فروخته شد. باقی‌مانده: {stock}.", toast_delete: "{name} حذف شد.",
    toast_noStock: "فقط {stock} عدد {name} موجود است.", toast_export: "خروجی موجودی ساخته شد.", toast_reset: "داده‌های اولیه بازگردانده شد.",
    toast_fallback: "فایل data.json بارگذاری نشد، پس داده‌های نمونه‌ی داخلی نمایش داده شد. برای استفاده از فایل خودت، پروژه را با سرور محلی اجرا کن.",
    csvHead: "شناسه|نام|دسته|قیمت (افغانی)|موجودی|وضعیت|ارزش (افغانی)",
    cat_Paper: "کاغذ", cat_Writing: "نوشتاری", cat_Office: "اداری", cat_Saman: "سامان",
  },
};

let lang = document.documentElement.lang === "fa" ? "fa" : "en";
let nf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 2 });
const money = (n) => nf.format(n) + " " + L("afn");
const catLabel = (c) => I18N[lang]["cat_" + c] || c;

// Translate a key; {placeholders} are filled from params
function L(key, params = {}) {
  const s = I18N[lang][key] ?? I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (v === undefined) return "";
    if (k.endsWith("Money")) return money(v);
    return typeof v === "number" ? nf.format(v) : v;
  });
}

const countLabel = (n) => L(n === 1 ? "nProduct" : "nProducts", { n });

// [CSS selector, translation key] for static text in index.html
const STATIC = [
  ["#load-status", "loading"], [".brand-mark", "brand"], [".app-header h1", "title"],
  ["#export-btn", "export"], ["#reset-btn", "reset"], ["#load-error p", "loadError"], ["#retry-btn", "retry"],
  [".summary .stat:nth-child(1) .stat-label", "invValue"], [".summary .stat:nth-child(2) .stat-label", "prodUnits"],
  [".summary .stat:nth-child(3) .stat-label", "lowStock"], [".summary .stat:nth-child(4) .stat-label", "outStock"],
  ["#inventory-heading", "inventory"], ["#search-label", "search"],
  ['label[for="category-select"]', "category"], ['label[for="status-select"]', "status"], ['label[for="sort-select"]', "sortBy"],
  ["caption", "caption"], ["thead th:nth-child(1)", "name"], ["thead th:nth-child(2)", "category"],
  ["thead th:nth-child(3)", "price"], ["thead th:nth-child(4)", "stock"], ["thead th:nth-child(5)", "status"],
  ["thead th:nth-child(6)", "adjust"], ["thead th:nth-child(7) span", "actionsHidden"],
  ["#empty-state", "empty"], ["#add-heading", "addHeading"], ['label[for="new-name"]', "name"],
  ['label[for="new-category"]', "category"], ['label[for="new-price"]', "priceAfn"], ['label[for="new-stock"]', "startStock"],
  ["#add-submit-btn", "addBtn"], ["#cat-heading", "valueByCat"], ["#key-heading", "keyHeading"],
  [".status-key li:nth-child(1) .badge", "st_in"], [".status-key li:nth-child(1) span:last-child", "key_in"],
  [".status-key li:nth-child(2) .badge", "st_low"], [".status-key li:nth-child(2) span:last-child", "key_low"],
  [".status-key li:nth-child(3) .badge", "st_out"], [".status-key li:nth-child(3) span:last-child", "key_out"],
  ["#act-heading .grow", "recent"], ["#clear-log-btn", "clear"], [".app-footer p", "footer"],
  ["#edit-title", "editTitle"], ['label[for="edit-name"]', "name"], ['label[for="edit-category"]', "category"],
  ['label[for="edit-price"]', "priceAfn"], ['label[for="edit-stock"]', "stock"], ["#edit-cancel", "cancel"],
  ['#edit-form button[type="submit"]', "save"], ["#confirm-cancel", "cancel"],
];

function applyStatic() {
  document.title = L("title");
  STATIC.forEach(([sel, key]) => { const n = document.querySelector(sel); if (n) n.textContent = L(key); });
  document.querySelectorAll("#status-select option").forEach((o) => { o.textContent = L(o.value ? "st_" + o.value : "all"); });
  document.querySelectorAll("#sort-select option").forEach((o) => { o.textContent = L("sort_" + o.value); });
  el.search.placeholder = L("searchPh");
  el.themeBtn.setAttribute("aria-label", L("theme"));
  el.themeBtn.title = L("theme");
  el.langBtn.textContent = L("langBtn");
}

function setLang(next) {
  lang = next;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
  try { localStorage.setItem(KEYS.lang, next); } catch (e) { /* ignore */ }
  nf = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 2 });
  applyStatic();
  if (!el.search.disabled) { populateCategories(); renderAll(); } // already loaded
}

// Escape text before putting it into innerHTML (prevents HTML injection)
function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function getStockStatus(stock) {
  if (stock === 0) return { key: "out", label: "Out of stock", badgeClass: "error" };
  if (stock <= LOW_STOCK_MAX) return { key: "low", label: "Low stock", badgeClass: "warning" };
  return { key: "in", label: "In stock", badgeClass: "success" };
}

// ---- Storage (safe wrappers) -----------------------------------
function save() {
  try {
    localStorage.setItem(KEYS.data, JSON.stringify(inventory));
    localStorage.setItem(KEYS.log, JSON.stringify(activity));
  } catch (e) { /* storage may be unavailable; app still works in memory */ }
}

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}

function isValidInventory(data) {
  return Array.isArray(data) && data.every((p) =>
    p && Number.isFinite(p.id) && typeof p.name === "string" &&
    Number.isFinite(p.price) && Number.isInteger(p.stock) && p.stock >= 0);
}

// ---- Theme -----------------------------------------------------
function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEYS.theme, next); } catch (e) { /* ignore */ }
}

// ---- Loading ---------------------------------------------------
async function loadInventory({ fresh = false } = {}) {
  el.loadError.hidden = true;
  el.loadStatus.hidden = false;
  el.loadStatus.textContent = L("loading");

  try {
    const stored = fresh ? null : readStored(KEYS.data);
    if (isValidInventory(stored)) {
      inventory = stored;
      activity = readStored(KEYS.log) || [];
    } else {
      let data;
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Could not load " + DATA_URL);
        data = await response.json();
        if (!isValidInventory(data)) throw new Error("Invalid data format");
      } catch (fetchError) {
        data = FALLBACK_DATA.map((p) => ({ ...p }));
        usedFallback = true;
      }
      inventory = data;
      if (fresh) activity = [];
      save();
    }
    el.loadStatus.hidden = true;
    populateCategories();
    toggleControlsEnabled(true);
    renderAll();
    if (usedFallback) { usedFallback = false; showToast(L("toast_fallback"), "info"); }
  } catch (error) {
    el.loadStatus.hidden = true;
    el.loadError.hidden = false;
  }
}

function populateCategories() {
  const keep = [el.category.value, el.newCategory.value, el.editCategory.value];
  const opts = CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(catLabel(c))}</option>`).join("");
  el.category.innerHTML = `<option value="">${esc(L("allCats"))}</option>` + opts;
  el.newCategory.innerHTML = `<option value="" disabled selected>${esc(L("chooseCat"))}</option>` + opts;
  el.editCategory.innerHTML = opts;
  el.category.value = keep[0];
  if (keep[1]) el.newCategory.value = keep[1];
  if (keep[2]) el.editCategory.value = keep[2];
}

// ---- Derived data ----------------------------------------------
function getFilteredItems() {
  const term = el.search.value.trim().toLowerCase();
  const cat = el.category.value;
  const status = el.status.value;

  const items = inventory.filter((item) => {
    const s = getStockStatus(item.stock).key;
    return item.name.toLowerCase().includes(term) &&
      (cat === "" || item.category === cat) &&
      (status === "" || s === status || (status === "attention" && s !== "in"));
  });

  const [field, dir] = el.sort.value.split("-");
  const factor = dir === "desc" ? -1 : 1;
  const val = (i) => field === "value" ? i.price * i.stock : i[field];
  return items.sort((a, b) => {
    const x = val(a), y = val(b);
    const cmp = typeof x === "string" ? x.localeCompare(y, undefined, { sensitivity: "base" }) : x - y;
    return cmp * factor;
  });
}

// ---- Rendering -------------------------------------------------
function renderSummary() {
  let value = 0, units = 0, low = 0, out = 0;
  inventory.forEach((i) => {
    value += i.price * i.stock;
    units += i.stock;
    if (i.stock === 0) out++; else if (i.stock <= LOW_STOCK_MAX) low++;
  });
  el.statValue.textContent = money(value);
  el.statCount.textContent = nf.format(inventory.length) + " · " + nf.format(units);
  el.statLow.textContent = countLabel(low);
  el.statOut.textContent = countLabel(out);
}

function renderBreakdown() {
  const totals = CATEGORIES.map((c) => ({
    name: c,
    value: inventory.filter((i) => i.category === c).reduce((s, i) => s + i.price * i.stock, 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.value));
  el.breakdown.innerHTML = totals.map((t) => `
    <li>
      <div class="row"><span>${esc(catLabel(t.name))}</span><span class="muted">${money(t.value)}</span></div>
      <div class="bar"><i style="width:${(t.value / max) * 100}%"></i></div>
    </li>`).join("");
}

function renderActivity() {
  if (activity.length === 0) {
    el.activity.innerHTML = `<li class="muted">${esc(L("noActivity"))}</li>`;
    return;
  }
  el.activity.innerHTML = activity.map((a) => {
    const text = a.key ? L("log_" + a.key, a.params) : a.text; // a.text = old saved entries
    return `<li>${esc(text)}<time datetime="${esc(a.time)}">${new Date(a.time).toLocaleString(LOCALES[lang])}</time></li>`;
  }).join("");
}

function createInventoryRow(item, isNew) {
  const row = document.createElement("tr");
  row.dataset.id = item.id;
  if (isNew) row.className = "row-new";
  const status = getStockStatus(item.stock);
  const pct = Math.min(100, (item.stock / 10) * 100); // bar full at 10+ units
  const name = esc(item.name);

  row.innerHTML = `
    <td data-label="${esc(L("name"))}"><span class="item-name">${name}</span></td>
    <td data-label="${esc(L("category"))}">${esc(catLabel(item.category))}</td>
    <td data-label="${esc(L("price"))}" class="num">${money(item.price)}</td>
    <td data-label="${esc(L("stock"))}" class="num">${nf.format(item.stock)}
      <span class="stock-bar ${status.badgeClass}"><i style="width:${pct}%"></i></span></td>
    <td data-label="${esc(L("status"))}"><span class="badge ${status.badgeClass}">${esc(L("st_" + status.key))}</span></td>
    <td data-label="${esc(L("adjust"))}">
      <div class="adjust-cell">
        <label for="qty-${item.id}" class="visually-hidden">${esc(L("qtyLabel", { name: item.name }))}</label>
        <input type="number" id="qty-${item.id}" min="1" step="1" value="1" inputmode="numeric" />
        <button type="button" class="btn btn-secondary btn-sm" data-action="restock" data-id="${item.id}">${esc(L("restock"))}</button>
        <button type="button" class="btn btn-sm" data-action="sell" data-id="${item.id}">${esc(L("sell"))}</button>
      </div>
    </td>
    <td data-label="">
      <div class="row-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-id="${item.id}" aria-label="${esc(L("editAria", { name: item.name }))}">${esc(L("edit"))}</button>
        <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}" aria-label="${esc(L("delAria", { name: item.name }))}">${esc(L("del"))}</button>
      </div>
    </td>`;
  return row;
}

let lastAddedId = null;

function renderTable() {
  const items = getFilteredItems();
  el.body.innerHTML = "";
  el.empty.hidden = items.length > 0;
  items.forEach((item) => el.body.appendChild(createInventoryRow(item, item.id === lastAddedId)));
  lastAddedId = null;
  el.meta.textContent = L("meta", { n: items.length, total: inventory.length });
}

function renderAll() {
  renderSummary();
  renderBreakdown();
  renderActivity();
  renderTable();
}

// ---- Validation ------------------------------------------------
function validateProductForm({ name, category, price, stock }) {
  const errors = [];
  const trimmedName = name.trim();
  if (trimmedName.length < NAME_MIN_LENGTH || trimmedName.length > NAME_MAX_LENGTH) {
    errors.push(L("errName", { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH }));
  }
  if (!CATEGORIES.includes(category)) errors.push(L("errCat"));

  const numericPrice = Number(price.trim());
  if (price.trim() === "" || !Number.isFinite(numericPrice) || numericPrice <= 0) errors.push(L("errPrice"));

  const numericStock = Number(stock.trim());
  if (stock.trim() === "" || !Number.isInteger(numericStock) || numericStock < 0) errors.push(L("errStock"));

  const duplicate = inventory.some((i) =>
    i.id !== editingId && i.name.toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) errors.push(L("errDup"));

  if (errors.length) return { valid: false, errors, data: null };
  return { valid: true, errors: [], data: { name: trimmedName, category, price: numericPrice, stock: numericStock } };
}

function validateQuantity(raw) {
  const n = Number(String(raw).trim());
  if (String(raw).trim() === "" || !Number.isInteger(n) || n <= 0) {
    return { valid: false, error: L("errQty"), value: null };
  }
  return { valid: true, error: "", value: n };
}

// ---- Actions ---------------------------------------------------
function getNextProductId() {
  return inventory.length ? Math.max(...inventory.map((i) => i.id)) + 1 : 1;
}

const findItem = (id) => inventory.find((p) => p.id === id);

// Activity is stored as {key, params} so it can be shown in either language
function logActivity(key, params) {
  activity.unshift({ key, params, time: new Date().toISOString() });
  activity = activity.slice(0, HISTORY_LIMIT);
}

function commit(key, params) {
  logActivity(key, params);
  save();
  renderAll();
  showToast(L("toast_" + key, params), "success");
}

function addProduct(data) {
  const item = { id: getNextProductId(), ...data };
  inventory.push(item);
  lastAddedId = item.id;
  commit("add", { name: item.name, stock: item.stock });
  el.addForm.reset();
}

function updateProduct(id, data) {
  const item = findItem(id);
  if (!item) return;
  Object.assign(item, data);
  commit("edit", { name: item.name });
}

function restockProduct(id, qty) {
  const item = findItem(id);
  if (!item) return;
  item.stock += qty;
  commit("restock", { qty, name: item.name, stock: item.stock });
}

function sellProduct(id, qty) {
  const item = findItem(id);
  if (!item) return;
  if (qty > item.stock) {
    showToast(L("toast_noStock", { stock: item.stock, name: item.name }), "error");
    return;
  }
  item.stock -= qty;
  commit("sell", { qty, name: item.name, totalMoney: qty * item.price, stock: item.stock });
}

function deleteProduct(id) {
  const item = findItem(id);
  if (!item) return;
  inventory = inventory.filter((p) => p.id !== id);
  commit("delete", { name: item.name });
}

function exportCsv() {
  const clean = (v) => {
    let s = String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // avoid spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const rows = [L("csvHead").split("|")];
  inventory.forEach((i) => rows.push([i.id, i.name, catLabel(i.category), i.price, i.stock,
    L("st_" + getStockStatus(i.stock).key), i.price * i.stock]));
  const csv = "\ufeff" + rows.map((r) => r.map(clean).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast(L("toast_export"), "info");
}

// ---- UI feedback -----------------------------------------------
function showToast(text, type = "success") {
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = text;
  el.toasts.appendChild(t);
  setTimeout(() => t.remove(), 3500);
  while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
}

function setError(target, message) {
  target.textContent = message || "";
  target.hidden = !message;
}

function toggleControlsEnabled(enabled) {
  [el.search, el.category, el.status, el.sort, el.newName, el.newCategory,
    el.newPrice, el.newStock, el.addBtn, el.exportBtn, el.resetBtn]
    .forEach((c) => { c.disabled = !enabled; });
}

function askConfirm(text, onOk, title = L("delTitle"), okLabel = L("del")) {
  $("confirm-title").textContent = title;
  el.confirmOk.textContent = okLabel;
  el.confirmText.textContent = text;
  pendingConfirm = onOk;
  el.confirmDialog.showModal();
}

function openEdit(id) {
  const item = findItem(id);
  if (!item) return;
  editingId = id;
  el.editName.value = item.name;
  el.editCategory.value = item.category;
  el.editPrice.value = item.price;
  el.editStock.value = item.stock;
  setError(el.editError, "");
  el.editDialog.showModal();
  el.editName.focus();
}

// ---- Events ----------------------------------------------------
el.filterForm.addEventListener("submit", (e) => e.preventDefault());
el.search.addEventListener("input", debounce(renderTable, 120));
[el.category, el.status, el.sort].forEach((c) => c.addEventListener("change", renderTable));

el.addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  editingId = null;
  const result = validateProductForm({
    name: el.newName.value, category: el.newCategory.value,
    price: el.newPrice.value, stock: el.newStock.value,
  });
  if (!result.valid) return setError(el.addError, result.errors[0]);
  setError(el.addError, "");
  addProduct(result.data);
});

el.editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const result = validateProductForm({
    name: el.editName.value, category: el.editCategory.value,
    price: el.editPrice.value, stock: el.editStock.value,
  });
  if (!result.valid) return setError(el.editError, result.errors[0]);
  el.editDialog.close();
  updateProduct(editingId, result.data);
  editingId = null;
});
el.editCancel.addEventListener("click", () => el.editDialog.close());

el.confirmCancel.addEventListener("click", () => el.confirmDialog.close());
el.confirmOk.addEventListener("click", () => {
  el.confirmDialog.close();
  if (pendingConfirm) pendingConfirm();
  pendingConfirm = null;
});

el.body.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "delete") {
    const item = findItem(id);
    if (item) askConfirm(L("delText", { name: item.name }), () => deleteProduct(id));
  } else if (action === "edit") {
    openEdit(id);
  } else {
    const qtyInput = document.getElementById("qty-" + id);
    const result = validateQuantity(qtyInput.value);
    if (!result.valid) return showToast(result.error, "error");
    if (action === "restock") restockProduct(id, result.value);
    else sellProduct(id, result.value);
  }
});

el.clearLog.addEventListener("click", () => { activity = []; save(); renderActivity(); });
el.exportBtn.addEventListener("click", exportCsv);
el.resetBtn.addEventListener("click", () =>
  askConfirm(L("resetText"), () => {
    loadInventory({ fresh: true }).then(() => showToast(L("toast_reset"), "info"));
  }, L("resetTitle"), L("resetOk")));
el.themeBtn.addEventListener("click", toggleTheme);
el.langBtn.addEventListener("click", () => setLang(lang === "fa" ? "en" : "fa"));
el.retryBtn.addEventListener("click", () => loadInventory());

// Press "/" to jump to search
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing && !el.search.disabled) {
    e.preventDefault();
    el.search.focus();
  }
});

document.addEventListener("DOMContentLoaded", () => { applyStatic(); loadInventory(); });