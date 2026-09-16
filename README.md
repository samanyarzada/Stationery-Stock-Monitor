# Stationery Stock Monitor

A simple and responsive stationery inventory management web application built with **HTML, CSS, and vanilla JavaScript**.

The application allows users to view and manage stationery products, monitor stock levels, search and filter inventory, add new products, restock items, record sales, and delete products.

## Features

- 📦 View stationery inventory
- 🔎 Search products by name
- 🗂️ Filter products by category
- ⚠️ Filter low-stock and out-of-stock products
- ➕ Add new products
- 📈 Restock products
- 🛒 Sell products and automatically update stock
- 🗑️ Delete products
- 💰 Calculate total inventory value
- 📊 Display the number of low/out-of-stock products
- 🏷️ Show stock status:
  - **In stock:** 4 or more units
  - **Low stock:** 1–3 units
  - **Out of stock:** 0 units
- 📱 Responsive design for desktop and mobile devices
- ♿ Accessible form controls, labels, focus states, and status messages
- 🔄 Loading, error, retry, and success feedback states

## Technologies

- **HTML5** — page structure and semantic markup
- **CSS3** — responsive layout, custom properties, styling, and animations
- **JavaScript (ES6+)** — application logic and DOM manipulation
- **JSON** — initial inventory data
- **Google Fonts** — Inter and Fraunces

## Project Structure

```text
stationery-stock-monitor/
│
├── index.html       # Main application page
├── styles.css       # Application styling and responsive design
├── app.js           # Application logic and interactions
├── data.json        # Initial inventory data
└── README.md        # Project documentation
```

## How It Works

When the application starts, it loads the initial inventory from `data.json`.

JavaScript then uses the loaded data to:

1. Render the inventory table.
2. Calculate the total inventory value.
3. Count low-stock and out-of-stock products.
4. Enable the search and filtering controls.
5. Allow users to add, restock, sell, or delete products.

All inventory changes are currently stored **in memory only**. Therefore, changes will be lost when the page is refreshed.

## Inventory Data

The initial inventory contains products such as:

| Product | Category | Price | Stock |
|---|---|---:|---:|
| Notebook | Paper | 60 AFN | 10 |
| Blue pen | Writing | 15 AFN | 3 |
| Pencil | Writing | 10 AFN | 0 |
| Folder | Office | 40 AFN | 5 |
| Marker | Writing | 50 AFN | 2 |

## Validation

The application includes client-side validation for new products.

### Product name
- Minimum: 2 characters
- Maximum: 60 characters

### Price
- Must be a positive number

### Stock
- Must be a whole number
- Must be 0 or greater

### Quantity

Restock and sell quantities must be whole numbers greater than zero.

The application also prevents users from selling more items than are currently available in stock.

## Responsive Design

The interface is designed to work on both desktop and mobile screens.

On smaller screens, the inventory table changes into a stacked card-style layout so that users can manage inventory without requiring page-wide horizontal scrolling.

## Running the Project

Because the application loads `data.json` using `fetch()`, it should be run through a local web server rather than opened directly with `file://`.

### Using VS Code

If you use Visual Studio Code, you can run the project with the **Live Server** extension.

Open `index.html` through Live Server and the application should load automatically.

### Using Python

If Python is installed, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Important Note

This project does not currently have a backend or database.

Changes such as adding products, selling stock, restocking, and deleting products only modify the application's current JavaScript state. Reloading the page restores the original data from `data.json`.

A future version could use a backend API and database to permanently store inventory changes.

## Accessibility

The project includes several accessibility considerations, including:

- Semantic HTML elements
- Labels for form controls
- Screen-reader-friendly hidden labels
- Visible keyboard focus states
- ARIA labels and status messages
- Accessible loading and error feedback
- Responsive controls with touch-friendly sizing

## Future Improvements

Possible future improvements include:

- 💾 Persistent storage using `localStorage`
- 🗄️ Database integration
- 🔐 User authentication
- 👥 Multiple inventory users
- 📜 Transaction history
- 📊 Inventory reports and charts
- 🔔 Low-stock notifications
- ✏️ Edit existing products
- 💰 Sales and profit tracking
- 🌐 Backend API integration

## License

This project is intended for educational and demonstration purposes.