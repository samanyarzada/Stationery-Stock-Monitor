 
// ---- Config / constants -------------------------------------
 
// Where we fetch the product data from
const DATA_URL = "data.json";
 
// The only categories a product is allowed to belong to
const CATEGORIES = ["Paper", "Writing", "Office","Saman"];
 
// Allowed length range for a product name
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;
 
// A product counts as "low stock" when its stock is between these two numbers (inclusive)
const LOW_STOCK_MIN = 1;
const LOW_STOCK_MAX = 3;
 
// ---- App state -------------------------------------------------
 
// The full list of products. Starts empty, gets filled after data.json loads.
let inventory = [];
 
// Tracks whether the initial load succeeded. (Note: set to true on success,
// but never actually read/checked anywhere else in this file.)
let hasLoadedSuccessfully = false;
 
// ---- Grab references to HTML elements we'll need to read/update -----
 
// Loading / error / retry / feedback message elements
const loadStatusEl = document.getElementById("load-status");
const loadErrorEl = document.getElementById("load-error");
const retryBtn = document.getElementById("retry-btn");
const actionMessageEl = document.getElementById("action-message");
 
// Summary numbers at the top of the page
const statValueEl = document.getElementById("stat-value");
const statLowEl = document.getElementById("stat-low");
 
// Filter/search controls
const filterForm = document.getElementById("filter-form");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const lowStockOnlyCheckbox = document.getElementById("low-stock-only");
 
// Table body and "no results" message
const inventoryBody = document.getElementById("inventory-body");
const emptyStateEl = document.getElementById("empty-state");
 
// "Add product" form fields
const addForm = document.getElementById("add-form");
const newNameInput = document.getElementById("new-name");
const newCategorySelect = document.getElementById("new-category");
const newPriceInput = document.getElementById("new-price");
const newStockInput = document.getElementById("new-stock");
const addFormErrorEl = document.getElementById("add-form-error");
const addSubmitBtn = document.getElementById("add-submit-btn");
 
// ---- Loading data from data.json -----------------------------------
 
// async = this function does something that takes time (fetching a file),
// so we can use "await" inside it to pause until that work is done.
async function loadInventory() {
  // Hide any previous error message and show the "loading" message
  loadErrorEl.hidden = true;
  loadStatusEl.hidden = false;
  loadStatusEl.textContent = "Loading inventory...";
 
  try {
    // Go fetch the JSON file; wait for the response before continuing
    const response = await fetch(DATA_URL);
 
    // response.ok is false if something went wrong (e.g. file not found)
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
 
    // Parse the response body as JSON (this also takes time, so we await it)
    const data = await response.json();
 
    // Store the freshly loaded data as our working inventory
    inventory = data;
    hasLoadedSuccessfully = true;
 
    // Hide the loading message, since loading is done
    loadStatusEl.hidden = true;
 
    // Enable all the controls that were disabled until data was ready
    toggleControlsEnabled(true);
 
    // Draw the summary + table now that we have data
    renderAll();
  } catch (error) {
    // If fetching or parsing failed anywhere above, we land here.
    // Hide the loading message and show the error message + Retry button instead.
    loadStatusEl.hidden = true;
    loadErrorEl.hidden = false;
  }
}
 
// ---- Rendering: summary stats ----------------------------------------
 
function renderSummary() {
  let totalValue = 0; // sum of price * stock across all products
  let lowCount = 0; // how many products are low stock or out of stock
 
  inventory.forEach(function (item) {
    // Add this product's total value (price * quantity) to the running total
    totalValue += item.price * item.stock;
 
    // Count this product if its stock is at or below the low-stock threshold.
    // (This correctly includes 0 — "out of stock" — as well as 1-3.)
    if (item.stock <= LOW_STOCK_MAX) {
      lowCount++;
    }
  });
 
  // Push the calculated numbers into the page
  statValueEl.textContent = totalValue + " AFN";
  statLowEl.textContent = lowCount + " products";
}
 
// ---- Filtering: search + category + low-stock-only --------------------
 
function getFilteredItems() {
  // Read current values from the filter controls
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const lowStockOnly = lowStockOnlyCheckbox.checked;
 
  // Keep only the products that satisfy ALL active filters
  return inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      selectedCategory === "" || item.category === selectedCategory;
    const matchesLowStock = !lowStockOnly || item.stock <= LOW_STOCK_MAX;
    return matchesSearch && matchesCategory && matchesLowStock;
  });
}
 
// ---- Figuring out a product's stock status/badge -----------------------
 
function getStockStatus(stock) {
  if (stock === 0) {
    return { label: "Out of stock", badgeClass: "error" };
  } else if (stock >= LOW_STOCK_MIN && stock <= LOW_STOCK_MAX) {
    return { label: "Low stock", badgeClass: "warning" };
  } else {
    return { label: "In stock", badgeClass: "success" };
  }
}
 
// ---- Building one table row for one product -----------------------------
 
function createInventoryRow(item) {
  // Create a new, empty <tr> element (not yet attached to the page)
  const row = document.createElement("tr");
 
  // Tag this row with the product's id, so we can identify it later
  row.dataset.id = item.id;
 
  // Work out the status label/color for this product's stock level
  const status = getStockStatus(item.stock);
 
  // Fill the row with its cells: name, category, price, stock, status badge,
  // a quantity input + Restock/Sell buttons, and a Delete button.
  row.innerHTML = `
  <td data-label="Name">${item.name}</td>
  <td data-label="Category">${item.category}</td>
  <td data-label="Price">${item.price} AFN</td>
  <td data-label="Stock">${item.stock}</td>
  <td data-label="Status"><span class = "badge ${status.badgeClass}">${status.label}</span></td>
  <td data-label="Adjust quantity">
    <div class="adjust-cell">
      <label for="qty-${item.id}" class="visually-hidden">Quantity for ${item.name}</label>
      <input type="number" id="qty-${item.id}" min="1" step="1" value="1"/>
      <div class="actions">
        <button type="button" data-action="restock" data-id="${item.id}">Restock</button>
        <button type="button" data-action="sell" data-id="${item.id}">Sell</button>
      </div>
    </div>
</td>
<td data-label="">
  <button type="button" class="btn-danger" data-action="delete" data-id="${item.id}">Delete</button>
</td>
  `;
  return row;
}
 
// ---- Rendering: the whole table ------------------------------------------
 
function renderTable(items) {
  // Clear whatever is currently in the table body
  inventoryBody.innerHTML = "";
 
  if (items.length === 0) {
    // Nothing to show — display the "no results" message instead
    emptyStateEl.hidden = false;
  } else {
    // We have results — hide the empty-state message and build one row per item
    emptyStateEl.hidden = true;
    items.forEach((item) => {
      const row = createInventoryRow(item);
      inventoryBody.appendChild(row);
    });
  }
}
 
// ---- Rendering: do everything (summary + table) at once -------------------
 
function renderAll() {
  renderSummary();
  renderTable(getFilteredItems());
}
 
// ---- Validation: the "Add product" form ------------------------------------
 
function validateProductForm({ name, category, price, stock }) {
  const errors = [];
 
  // Name must be 2-60 characters after trimming whitespace
  const trimmedName = name.trim();
  if (
    trimmedName.length < NAME_MIN_LENGTH ||
    trimmedName.length > NAME_MAX_LENGTH
  ) {
    errors.push("Name must be 2-60 characters.");
  }
 
  // Category must be one of the allowed categories
  if (!CATEGORIES.includes(category)) {
    errors.push("Please choose a category.");
  }
 
  // Price must be a finite number greater than 0
  const trimmedPrice = price.trim();
  const numericPrice = Number(trimmedPrice);
  if (
    trimmedPrice === "" ||
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0
  ) {
    errors.push("Price must be a positive number.");
  }
 
  // Stock must be a finite whole number that is 0 or greater
  const trimmedStock = stock.trim();
  const numericStock = Number(trimmedStock);
  if (
    trimmedStock === "" ||
    !Number.isFinite(numericStock) ||
    numericStock < 0 ||
    numericStock % 1 !== 0 // remainder check: rejects non-integer values
  ) {
    errors.push("Stock must be a whole number, zero or more.");
  }
 
  // If anything failed, report it and don't return usable data
  if (errors.length > 0) {
    return { valid: false, errors: errors, data: null };
  }
 
  // Everything passed — return the cleaned-up, converted values
  return {
    valid: true,
    errors: [],
    data: {
      name: trimmedName,
      category: category,
      price: numericPrice,
      stock: numericStock,
    },
  };
}
 
// ---- Validation: quantity typed into the Restock/Sell input -----------------
 
function validateQuantity(rawValue) {
  const trimmed = String(rawValue).trim();
  const numericValue = Number(trimmed);
 
  // Must be a finite whole number greater than 0
  if (
    trimmed === "" ||
    !Number.isFinite(numericValue) ||
    numericValue <= 0 ||
    numericValue % 1 !== 0
  ) {
    return {
      valid: false,
      error: "Enter a whole number greater than zero.",
      value: null,
    };
  }
  return { valid: true, error: "", value: numericValue };
}
 
// ---- Picking the next unique product id -------------------------------------
 
function getNextProductId() {
  // If there are no products yet, start at 1
  if (inventory.length === 0) {
    return 1;
  }
 
  // Collect all existing ids into a plain array of numbers
  const ids = inventory.map((item) => {
    return item.id;
  });
 
  // Find the largest existing id...
  const maxId = Math.max(...ids);
 
  // ...and use the next number after it
  return maxId + 1;
}
 
// ---- Actions: add / restock / sell / delete -----------------------------------
 
function addProduct(cleanData) {
  const newId = getNextProductId();
 
  const newItem = {
    id: newId,
    name: cleanData.name,
    category: cleanData.category,
    price: cleanData.price,
    stock: cleanData.stock,
  };
 
  // Add the new product to the working list
  inventory.push(newItem);
 
  // Refresh the page, tell the user it worked, and clear the form
  renderAll();
  showMessage("Product added.", "success");
  addForm.reset();
}
 
function restockProduct(id, qty) {
  // Find the matching product by id
  const item = inventory.find((product) => {
    return product.id === id;
  });
 
  // Safety check: if somehow no matching product exists, do nothing
  if (!item) {
    return;
  }
 
  // Increase stock and refresh the page
  item.stock += qty;
  renderAll();
  showMessage(item.name + " restocked.", "success");
}
 
function sellProduct(id, qty) {
  const item = inventory.find((product) => {
    return product.id === id;
  });
 
  if (!item) {
    return;
  }
 
  // Block selling more than what's currently in stock
  if (qty > item.stock) {
    showMessage(
      "Not enough stock to sell that many " + item.name + ".",
      "error",
    );
    return;
  }
 
  // Reduce stock and refresh the page
  item.stock -= qty;
  renderAll();
  showMessage(
    "Sold " + qty + " " + item.name + ". Remaining stock: " + item.stock + ".",
    "success",
  );
}
 
function deleteProduct(id) {
  const item = inventory.find((product) => {
    return product.id === id;
  });
 
  // Safety check: if no matching product exists, do nothing
  if (!item) {
    return;
  }
 
  // Rebuild the inventory array without this product
  inventory = inventory.filter((product) => {
    return product.id !== id;
  });
 
  renderAll();
  showMessage(item.name + " deleted.", "success");
}
 
// ---- Small helper functions for feedback/UI state -------------------------------
 
function showMessage(text, type) {
  // Put the text into the shared feedback banner
  actionMessageEl.textContent = text;
 
  // Remove any previous success/error styling, then apply the current one
  actionMessageEl.classList.remove("success", "error");
  actionMessageEl.classList.add(type);
 
  // Make sure the banner is visible
  actionMessageEl.hidden = false;
}
 
function setAddFormError(message) {
  if (!message) {
    // No message means "clear the error"
    addFormErrorEl.textContent = "";
    addFormErrorEl.hidden = true;
  } else {
    // Otherwise show the given error message
    addFormErrorEl.textContent = message;
    addFormErrorEl.hidden = false;
  }
}
 
function toggleControlsEnabled(enabled) {
  // Enable or disable every interactive control at once.
  // disabled = !enabled, so enabled=true -> disabled=false, and vice versa.
  searchInput.disabled = !enabled;
  categorySelect.disabled = !enabled;
  lowStockOnlyCheckbox.disabled = !enabled;
  newNameInput.disabled = !enabled;
  newCategorySelect.disabled = !enabled;
  newPriceInput.disabled = !enabled;
  newStockInput.disabled = !enabled;
  addSubmitBtn.disabled = !enabled;
}
 
// ---- Event listeners: wiring up user interaction --------------------------------
 
// Prevent the filter form from reloading the page on Enter/submit
filterForm.addEventListener("submit", function (event) {
  event.preventDefault();
});
 
// Re-filter the table every time the user types in the search box
searchInput.addEventListener("input", function () {
  renderTable(getFilteredItems());
});
 
// Re-filter the table when the category dropdown changes
categorySelect.addEventListener("change", function () {
  renderTable(getFilteredItems());
});
 
// Re-filter the table when the low-stock-only checkbox is toggled
lowStockOnlyCheckbox.addEventListener("change", function () {
  renderTable(getFilteredItems());
});
 
// Handle submitting the "Add product" form
addForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the default page reload
 
  // Validate whatever is currently in the form fields
  const result = validateProductForm({
    name: newNameInput.value,
    category: newCategorySelect.value,
    price: newPriceInput.value,
    stock: newStockInput.value,
  });
 
  if (!result.valid) {
    // Show only the first error message
    return setAddFormError(result.errors[0]);
  } else {
    // Clear any old error and add the new product
    setAddFormError(null);
    addProduct(result.data);
  }
});
 
// Retry button re-attempts the initial data load
retryBtn.addEventListener("click", function () {
  loadInventory();
});
 
// Single click listener on the whole table body (event delegation).
// This lets us handle clicks on Restock/Sell/Delete buttons for ANY row,
// even rows that get created and destroyed later, without adding a new
// listener to every single button.
inventoryBody.addEventListener("click", function (event) {
  // Find the nearest <button> to whatever was actually clicked
  const button = event.target.closest("button");
 
  // If the click wasn't on/inside a button, ignore it
  if (!button) {
    return;
  }
 
  // Read which product and which action this button represents
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
 console.log(button.dataset);
 
  if (action === "delete") {
    deleteProduct(id);
  } else if (action === "restock" || action === "sell") {
    // Restock/Sell both need a quantity from this row's number input
    const qtyInput = document.getElementById("qty-" + id);
    const result = validateQuantity(qtyInput.value);
 
    if (!result.valid) {
      showMessage(result.error, "error");
      return;
    } else if (action === "restock") {
      restockProduct(id, result.value);
      
    } else {
      sellProduct(id, result.value);
    }
  }
});
 
// ---- Kick off the app once the page's HTML is fully parsed ------------------------
 
document.addEventListener("DOMContentLoaded", function () {
  loadInventory();
});