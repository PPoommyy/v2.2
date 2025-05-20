import { Pagination } from "../../components/Pagination.js";
import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Downloader } from "../../components/Downloader.js";

// State variables for filters and pagination
let currentLimit = 100;
let currentPage = 1;
let currentFilters = {
    search_sku: "",
    warehouse_name: "",
    warehouse_sku_name: "",
    brand_name: ""
};
let appOptions = {
    warehouses: [],
    warehouseSkus: [],
    skuBrands: []
};


// DOM Elements
const limitDropdownElement = document.getElementById("limitDropdown");
const dropdownMenuElement = document.getElementById("dropdownMenu");
const dropdownItemsElements = dropdownMenuElement.querySelectorAll(".dropdown-item");
const skuSearchInputElement = document.getElementById("skuSearchInput");
const warehouseFilterSelectElement = document.getElementById("warehouseFilterSelect");
const warehouseSkuFilterSelectElement = document.getElementById("warehouseSkuFilterSelect");
const brandFilterSelectElement = document.getElementById("brandFilterSelect");
const applySkuFiltersButtonElement = document.getElementById("applySkuFiltersButton");
const updateButtonElement = document.getElementById("updateButton");
const addButtonElement = document.getElementById("add-button");
const saveButtonElement = document.getElementById("save-button");
const exportCSVButtonElement = document.getElementById("export-csv");
const dropdownTitleElement = document.getElementById("dropdown-title");


const get_sku_list = async (limit, page, filters) => {
  try {
    let url = `../../backend/get/sku/get_sku_list.php?limit=${limit}&page=${page}`;
    
    // Build query string from filters object
    for (const key in filters) {
        if (filters[key] && String(filters[key]).trim() !== "") { // Ensure value is string before trim
            url += `&filters[${encodeURIComponent(key)}]=${encodeURIComponent(String(filters[key]).trim())}`;
        }
    }
    // console.log("filters:", filters); // Debugging line
    // console.log("Fetching SKU list from URL:", url); // Debugging line
    const response = await axios.get(url);
    // console.log("Response data:", response.data); // Debugging line
    return response.data;
  } catch (error) {
    console.error("Error fetching SKU list:", error);
    Alert.showErrorMessage("Failed to fetch SKU list. " + (error.response?.data?.message || error.message));
    throw error;
  }
};

const get_options = async (optionTable) => {
  try {
    // Assuming DataController.select can fetch options for dropdowns if needed in the future
    // For now, using text filters, so this might be less critical for direct filtering
    // but still useful for the "Add New" and "Edit" modals.
    const column = ["*"]; // Fetch id and name for select options
    const response = await DataController.select(optionTable, column, "id", 100, 0); // Fetch more if needed
    return response.status ? response.status : []; // Return data array or empty array
  } catch (error) {
    console.error(`Error fetching options for ${optionTable}:`, error);
    Alert.showErrorMessage(`Failed to load options for ${optionTable}.`);
    return []; // Return empty on error
  }
};

const loadAndPopulateOptions = async (optionTable, selectElementId = null, prompt = "All") => {
  try {
    const column = ["id", "name"]; // We need id and name
    // Increased limit to fetch more options, adjust as needed or implement pagination for options
    const response = await DataController.select(optionTable, column, "id", 100, 0); 
    const options = response.status ? response.status : [];
    
    // Store in global cache
    if (optionTable === "warehouses") appOptions.warehouses = options;
    else if (optionTable === "warehouse_skus") appOptions.warehouseSkus = options;
    else if (optionTable === "sku_brands") appOptions.skuBrands = options;

    if (selectElementId) {
        const selectElement = document.getElementById(selectElementId);
        if (selectElement) {
            selectElement.innerHTML = `<option value="">${prompt} ${optionTable.charAt(0).toUpperCase() + optionTable.slice(1).replace('_', ' ')}</option>`;
            options.forEach(opt => {
                const optionEl = document.createElement("option");
                optionEl.value = opt.id;
                optionEl.textContent = opt.name;
                selectElement.appendChild(optionEl);
            });
        }
    }
    return options;
  } catch (error) {
    console.error(`Error fetching options for ${optionTable}:`, error);
    // Alert.showErrorMessage(`Failed to load options for ${optionTable}.`); // Might be too noisy if called often
    return [];
  }
};

async function initialDataLoad() {
    toggleSpinner(true);
    try {
        // Load all necessary dropdown options once
        await Promise.all([
            loadAndPopulateOptions("warehouses", "warehouseFilterSelect", "All"),
            loadAndPopulateOptions("warehouse_skus", "warehouseSkuFilterSelect", "All"),
            loadAndPopulateOptions("sku_brands", "brandFilterSelect", "All")
        ]);
        await generateTable(currentLimit, currentPage); // Load table after options are ready
    } catch (e) {
        console.error("Error during initial data load:", e);
        Alert.showErrorMessage("Failed to initialize page data.");
    } finally {
        toggleSpinner(false);
    }
}

async function generateTable(limit, page) {
  // Update global state if parameters are passed (e.g., from pagination or limit change)
  // This ensures currentLimit and currentPage are always up-to-date before fetching data
  if (typeof limit !== 'undefined') currentLimit = limit;
  if (typeof page !== 'undefined') currentPage = page;

  try {
    toggleSpinner(true);
    const result = await get_sku_list(
        currentLimit, currentPage, currentFilters
    );

    if (!result || result.error) {
        document.getElementById("sku-data-container").innerHTML = `<div class="alert alert-danger">Could not load SKU data. ${result?.error || ''}</div>`;
        toggleSpinner(false);
        return;
    }

    const skus = result.skus;
    const totalCount = result.count;
    const totalPages = Math.ceil(totalCount / currentLimit);

    // Fetch options for select dropdowns in modal and new rows
    // These are fetched once per table generation or can be cached
    const { warehouses, warehouseSkus, skuBrands } = appOptions;

    const skuDataContainer = document.getElementById("sku-data-container");
    skuDataContainer.innerHTML = "";

    if (!skus || skus.length === 0) {
        skuDataContainer.innerHTML = `<div class="alert alert-info text-center">No SKU settings found matching your criteria.</div>`;
        dropdownTitleElement.innerText = `Showing 0-0 of 0 rows`;
        Pagination.updatePagination(currentPage, totalPages, "pagination1", generateTable);
        Pagination.updatePagination(currentPage, totalPages, "pagination2", generateTable);
        toggleSpinner(false);
        return;
    }

    const tableElement = document.createElement("table");
    tableElement.classList.add("table", "table-bordered", "table-striped", "table-hover", "table-sm");

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = tableHeader.insertRow();
    const headers = ["Order Product SKU", "Report Product Name", "Warehouse", "Warehouse SKU", "Brand", "Actions"];
    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        tableHeaderRow.appendChild(th);
    });
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");
    tableBody.id = "sku-data-tbody";
    skus.forEach((sku) => {
      const tableRow = tableBody.insertRow();

      // Using Cell.createInputOnModalCell for editable text fields
      tableRow.appendChild(Cell.createInputOnModalCell("Order Product SKU", sku.id, "order_product_sku", sku.order_product_sku));
      tableRow.appendChild(Cell.createInputOnModalCell("Report Product Name", sku.id, "report_product_name", sku.report_product_name));

      // Using Cell.createSelectOnModalCell for editable select fields
      // Pass the fetched options to these cells
      tableRow.appendChild(Cell.createSelectOnModalCell("Warehouse", warehouses, sku.id, "warehouse_id", sku.warehouse_name));
      tableRow.appendChild(Cell.createSelectOnModalCell("Warehouse SKU", warehouseSkus, sku.id, "warehouse_sku_id", sku.warehouse_sku_name));
      tableRow.appendChild(Cell.createSelectOnModalCell("Brand", skuBrands, sku.id, "sku_brand_id", sku.sku_brand_name));

      const deleteButtonCell = Cell.createDeleteButtonCell();
      const deleteButton = deleteButtonCell.firstChild; // Assuming button is the first child
      deleteButton.addEventListener("click", async () => {
        const confirmAlert = await Alert.showConfirmModal("Are you sure you want to delete this SKU setting?");
        if (!confirmAlert.isConfirmed) return;

        const deleteResult = await DataController._delete("sku_settings", "id", sku.id);
        if (deleteResult && deleteResult.status) {
          Alert.showSuccessMessage("Delete successful");
          await generateTable(currentLimit, currentPage); // Refresh table
        } else {
          Alert.showErrorMessage("Delete failed. " + (deleteResult?.message || ""));
        }
      });
      tableRow.appendChild(deleteButtonCell);
    });
    tableElement.appendChild(tableBody);
    skuDataContainer.appendChild(tableElement);

    const startRecord = totalCount > 0 ? currentLimit * (currentPage - 1) + 1 : 0;
    const endRecord = Math.min(currentLimit * currentPage, totalCount);
    dropdownTitleElement.innerText = `Showing ${startRecord}-${endRecord} of ${totalCount} rows`;

    Pagination.updatePagination(currentPage, totalPages, "pagination1", generateTable);
    Pagination.updatePagination(currentPage, totalPages, "pagination2", generateTable);

  } catch (error) {
    console.error("Error in generateTable:", error);
    document.getElementById("sku-data-container").innerHTML = `<div class="alert alert-danger">Error generating table.</div>`;
  } finally {
    toggleSpinner(false);
  }
}


function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = loading ? "block" : "none";
  }
}

// --- Event Listeners ---
dropdownItemsElements.forEach((item) => {
  item.addEventListener("click", async function (event) {
    event.preventDefault();
    currentLimit = parseInt(this.getAttribute("data-limit"), 10);
    limitDropdownElement.innerText = currentLimit;
    currentPage = 1; // Reset to first page
    await generateTable(currentLimit, currentPage);
  });
});

updateButtonElement.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value; // This is the column name
  const valueElement = document.getElementById("editValueContainer").querySelector('input, select'); 

  if (!valueElement) {
      Alert.showErrorMessage("Editable field not found in modal.");
      return;
  }
  const value = valueElement.value;

  // Ensure value is not empty for select unless it's explicitly allowed (e.g. a "none" option with value="")
  if ( (valueElement.tagName === 'SELECT' && value) || (valueElement.tagName !== 'SELECT' && value.trim() !== "") ) {
    const result = await DataController.updateByKey("sku_settings", "id", id, key, value);
    if (result && result.status) {
      Alert.showSuccessMessage("Update successful");
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editModal'));
      if (modalInstance) modalInstance.hide();
      await generateTable(currentLimit, currentPage); // Refresh table
    } else {
      Alert.showErrorMessage("Update failed. " + (result?.message || ""));
    }
  } else {
    Alert.showWarningMessage("Value cannot be empty for this field.");
  }
});

addButtonElement.addEventListener("click", async (event) => {
  event.preventDefault();
  const tbody = document.getElementById("sku-data-tbody");
  if (!tbody) return;

  const tableRow = document.createElement("tr");
  tableRow.classList.add("new-row", "table-warning"); // Add a class to highlight new rows

  // Fetch options for select dropdowns
  const { warehouses, warehouseSkus, skuBrands } = appOptions;

  tableRow.appendChild(Cell.createInputCell("order_product_sku", "", "text", true));
  tableRow.appendChild(Cell.createInputCell("report_product_name", "", "text", false));
  tableRow.appendChild(Cell.createSelectCell(warehouses, "warehouse_id", null, true));
  tableRow.appendChild(Cell.createSelectCell(warehouseSkus, "warehouse_sku_id", null, true));
  tableRow.appendChild(Cell.createSelectCell(skuBrands, "sku_brand_id", null, true));

  const removeButtonCell = document.createElement("td");
  removeButtonCell.classList.add("text-center");
  const removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-sm", "btn-danger");
  removeButton.innerHTML = '<i class="fa fa-xmark"></i>';
  removeButton.title = "Remove this new row";
  new bootstrap.Tooltip(removeButton);
  removeButton.addEventListener("click", () => {
    tableRow.remove();
    const newRows = document.querySelectorAll(".new-row");
    saveButtonElement.disabled = newRows.length === 0;
  });
  removeButtonCell.appendChild(removeButton);
  tableRow.appendChild(removeButtonCell);

  tbody.insertBefore(tableRow, tbody.firstChild);
  saveButtonElement.disabled = false;
});

saveButtonElement.addEventListener("click", async () => {
  const newRows = document.querySelectorAll(".new-row");
  if (newRows.length === 0) {
    Alert.showInfoMessage("No new rows to save.");
    return;
  }

  const confirmAlert = await Alert.showConfirmModal(`Are you sure you want to insert ${newRows.length} new SKU(s)?`);
  if (!confirmAlert.isConfirmed) return;

  toggleSpinner(true);
  const swalQueue = Alert.createQueue();
  let allSuccessful = true;

  for (let i = 0; i < newRows.length; i++) {
    const row = newRows[i];
    const inputs = row.querySelectorAll("input[data-field-key]"); // Assuming Cell.createInputCell adds this
    const selects = row.querySelectorAll("select[data-field-key]"); // Assuming Cell.createSelectCell adds this

    const insertedData = {
      date_created: new Date().toISOString().slice(0, 19).replace("T", " "),
      // Default other necessary fields if any, e.g., min_quantity, enable_low_stock_alert
      min_quantity: 0, // Default example,
      max_quantity: 0,
      enable_low_stock_alert: 1 // Default example
    };
    let rowIsValid = true;

    inputs.forEach(input => {
      const key = input.dataset.fieldKey; // Get key from data attribute
      const value = input.value.trim();
      if (input.required && !value) {
        rowIsValid = false;
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
      }
      insertedData[key] = value;
    });

    selects.forEach(select => {
      const key = select.dataset.fieldKey; // Get key from data attribute
      const value = select.value;
      if (select.required && !value) {
        rowIsValid = false;
        select.classList.add('is-invalid');
      } else {
         select.classList.remove('is-invalid');
      }
      insertedData[key] = value;
    });

    if (!rowIsValid) {
      allSuccessful = false;
      await swalQueue.fire({
        title: `Row ${i + 1} has missing required fields.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      continue; // Skip this row, or break if you want to stop all saves
    }

    try {
      // console.log("Inserting data:", insertedData);
      const result = await DataController.insert("sku_settings", insertedData);
      if (result && result.status) {
        await swalQueue.fire({
          title: `Row ${i + 1} (SKU: ${insertedData.order_product_sku}) inserted!`,
          icon: "success", timer: 1500, showConfirmButton: false
        });
        row.classList.remove("new-row", "table-warning"); // Mark as saved
        row.classList.add("table-success", "saved-row"); // Optional: visual feedback
      } else {
        allSuccessful = false;
        await swalQueue.fire({
          title: `Failed to insert Row ${i + 1} (SKU: ${insertedData.order_product_sku})`,
          text: result?.message || "Unknown error.",
          icon: "error", confirmButtonText: "OK"
        });
      }
    } catch (error) {
      allSuccessful = false;
      await swalQueue.fire({
        title: `Error inserting Row ${i + 1} (SKU: ${insertedData.order_product_sku})`,
        text: error.message,
        icon: "error", confirmButtonText: "OK"
      });
    }
  }
  toggleSpinner(false);
  saveButtonElement.disabled = document.querySelectorAll(".new-row").length === 0; // Re-check if any new rows left
  if (allSuccessful && newRows.length > 0) {
      Alert.showSuccessMessage("All valid new SKUs saved successfully!");
  } else if (newRows.length > 0) {
      Alert.showWarningMessage("Some SKUs could not be saved. Please review.");
  }
  await generateTable(currentLimit, currentPage); // Refresh the main table
});


exportCSVButtonElement.addEventListener("click", async () => {
  toggleSpinner(true); // Show spinner before starting download generation
  const downloadResult = await Downloader.generateSKUDataCSV(); // Removed toggleSpinner from here, handled outside
  toggleSpinner(false); // Hide spinner after download process
  if (downloadResult) Alert.showSuccessMessage("SKU data CSV download started!");
  else Alert.showErrorMessage("Failed to generate SKU data CSV.");
});

applySkuFiltersButtonElement.addEventListener("click", async () => {
    currentFilters.search_sku = skuSearchInputElement.value.trim();
    currentFilters.warehouse_id = warehouseFilterSelectElement.value; // Get ID from select
    currentFilters.warehouse_sku_id = warehouseSkuFilterSelectElement.value; // Get ID
    currentFilters.sku_brand_id = brandFilterSelectElement.value; // Get ID
    
    currentPage = 1; 
    await generateTable(currentLimit, currentPage);
});

// Add event listeners for filter inputs to trigger search on Enter
skuSearchInputElement.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
        applySkuFiltersButtonElement.click();
    }
});


// Initial table load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize any static tooltips or components if needed
    await generateTable(currentLimit, currentPage);
    await initialDataLoad();
});