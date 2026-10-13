# Stationery Stock Monitor

A responsive stationery inventory manager built with **HTML, CSS and vanilla JavaScript** — no frameworks, no build step, no backend.

It lets you view and search products, track stock levels, add / edit / delete products, record sales and restocks, and see inventory value at a glance. The interface supports **light and dark themes** and **English and Persian (فارسی, right-to-left)**.

> Persian version of this document: [README.fa.md](README.fa.md)

## Features

**Inventory management**
- Add, edit and delete products (with confirmation before delete)
- Restock and sell with a quantity field; selling more than the available stock is blocked
- Duplicate product names are rejected

**Finding things**
- Search by name (debounced), filter by category and by status (in stock / low / out / low & out)
- Sort by name, price, stock or total value
- Press `/` anywhere to jump to the search box

**Insights**
- Summary cards: inventory value, number of products and units, low-stock count, out-of-stock count
- Value-by-category bar chart
- Recent activity log (last 30 actions)
- Per-row stock bar and colour-coded status badge

**Data**
- Changes are saved automatically in the browser (`localStorage`)
- Export the inventory to CSV (opens correctly in Excel, including Persian text)
- "Reset data" restores the original list

**Interface**
- Light / dark theme with a toggle; follows the system setting on first visit and remembers your choice
- English / Persian with full RTL layout (Vazirmatn font) and Persian digits
- Responsive: the table becomes stacked cards on phones
- Toast notifications, animated dialogs, `prefers-reduced-motion` respected, print stylesheet

## Stock status rules

| Status | Units | Badge |
|---|---|---|
| In stock | 4 or more | green |
| Low stock | 1–3 | amber |
| Out of stock | 0 | red |

The low-stock limit is the constant `LOW_STOCK_MAX` in `app.js`.

## Project structure

```text
stationery-stock-monitor/
├── index.html     # Page structure, dialogs, theme/language bootstrap script
├── styles.css     # Design tokens, light/dark themes, layout, RTL, responsive rules
├── app.js         # State, rendering, validation, actions, storage, i18n
├── data.json      # Initial inventory
├── README.md      # This file (English)
└── README.fa.md   # Persian documentation
```

## Running the project

Open `index.html` through a local web server, because the app loads `data.json` with `fetch()`.

**VS Code:** install the *Live Server* extension, right-click `index.html` and choose *Open with Live Server*.

**Python:**

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

If you open `index.html` directly (`file://`), the browser blocks `fetch`. The app then falls back to a built-in copy of the sample data (`FALLBACK_DATA` in `app.js`) and shows a notice, so it still works.

## How it works

1. On load, the app checks `localStorage` for saved inventory.
2. If none is saved, it fetches `data.json` (or uses `FALLBACK_DATA` if that fails) and saves it.
3. Every action (add, edit, restock, sell, delete) updates the in-memory array, writes it to `localStorage`, logs an activity entry and re-renders the page.
4. Because saved data takes priority, editing `data.json` later has no visible effect until you press **Reset data**.

### Browser storage keys

| Key | Content |
|---|---|
| `ssm-inventory` | Product list |
| `ssm-activity` | Activity log |
| `ssm-theme` | `light` or `dark` |
| `ssm-lang` | `en` or `fa` |

## Data format

`data.json` is an array of products:

```json
{ "id": 1, "name": "Notebook", "category": "Paper", "price": 60, "stock": 10 }
```

- `id`: unique number
- `name`: text
- `category`: one of the values in `CATEGORIES` (`app.js`)
- `price`: number (AFN)
- `stock`: whole number, 0 or more

Invalid files are rejected and the fallback data is used instead.

## Validation

| Field | Rule |
|---|---|
| Name | 2–60 characters, must be unique (case-insensitive) |
| Category | Must be one of `CATEGORIES` |
| Price | Positive number |
| Stock | Whole number, 0 or more |
| Restock / sell quantity | Whole number greater than 0; cannot exceed current stock when selling |

## Customising

| What | Where |
|---|---|
| Categories | `CATEGORIES` in `app.js` (dropdowns and chart update automatically) |
| Low-stock limit | `LOW_STOCK_MAX` in `app.js` |
| Name length limits | `NAME_MIN_LENGTH`, `NAME_MAX_LENGTH` |
| Activity log size | `HISTORY_LIMIT` |
| Currency label | key `afn` in the `I18N` dictionary |
| Colours | CSS variables at the top of `styles.css` (`:root` for light, `:root[data-theme="dark"]` for dark) |

### Adding or editing translations

All text lives in the `I18N` object in `app.js`. To add a language, copy the `en` block, translate the values, add its locale to `LOCALES`, and update `setLang` and the language button. Product names come from your data and are not translated automatically. If you add a new category, add a `cat_<Name>` entry to each language.

## Accessibility

- Semantic HTML, labelled form controls and visually hidden labels for icon-only or per-row controls
- Visible keyboard focus, native `<dialog>` elements, live regions for status messages and toasts
- Touch-friendly control sizes and colour contrast checked for both themes

## Security notes

- Product names are HTML-escaped before rendering
- CSV export neutralises cells starting with `=`, `+`, `-` or `@` to prevent spreadsheet formula injection
- Stored data is validated before use

## Limitations

- Data lives only in the current browser; there is no sync between devices or users
- Clearing site data erases the inventory (export a CSV for backups)
- No authentication or multi-user support

## Ideas for the future

- Import from CSV
- Editable low-stock threshold per product
- Sales history with charts and profit tracking
- Backend API and database
- User accounts and roles
- Low-stock notifications

## License

Intended for educational and demonstration purposes.
