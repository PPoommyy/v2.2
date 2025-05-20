import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";

let currentStockView = "total";
let currentSkuSearchTerm = "";
let currentDateStart = "";
let currentDateEnd = "";
let currentPage = 1;
const limit = 100;

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date)) return 'Invalid Date';

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        console.warn("Could not format date:", dateTimeString, e);
        return dateTimeString; 
    }
}


const get_stock = async (table, limit, page, skuSearch, dateStart, dateEnd) => {
  try {
    let url = `../../backend/get/stock/get_stock.php?table=${table}&limit=${limit}&page=${page}`;
    if (skuSearch) {
      url += `&search_sku=${encodeURIComponent(skuSearch)}`;
    }
    if (dateStart && (table === 'stock_in' || table === 'stock_out')) { // Only apply date filters for IN/OUT views
      url += `&date_start=${encodeURIComponent(dateStart)}`;
    }
    if (dateEnd && (table === 'stock_in' || table === 'stock_out')) {
      url += `&date_end=${encodeURIComponent(dateEnd)}`;
    }
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    Alert.showErrorMessage("Failed to fetch stock data. " + (error.response?.data?.message || error.message));
    throw error;
  }
};

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = loading ? "block" : "none";
  }
}

const generateTable = async () => {
  try {
    toggleSpinner(true);
    const stockDataResponse = await get_stock(
        currentStockView, limit, currentPage,
        currentSkuSearchTerm, currentDateStart, currentDateEnd
    );

    const stockContainer = document.getElementById("stock-container");
    stockContainer.innerHTML = "";

    if (!stockDataResponse || (stockDataResponse.error && !stockDataResponse.stock && !stockDataResponse.stock_in && !stockDataResponse.stock_out) ) {
        stockContainer.innerHTML = `<div class="alert alert-danger">Could not load stock data. ${stockDataResponse.error || ''}</div>`;
        toggleSpinner(false);
        return;
    }

    let dataArray;
    let tableHeaders = [];

    if (currentStockView === "total" && stockDataResponse.stock) {
        dataArray = stockDataResponse.stock;
        // Headers: SKU, Product Name, Remaining, Min Qty, Max Qty, Alert Status, Actions
        tableHeaders = ["SKU", "Product Name", "Remaining Stock", "Min Qty", "Max Qty", "Alert?", "Actions"];
    } else if (currentStockView === "stock_in" && stockDataResponse.stock_in) {
        dataArray = stockDataResponse.stock_in;
        tableHeaders = ["SKU", "Product Name", "Received Qty", "Batch Remaining", "Received Datetime"];
    } else if (currentStockView === "stock_out" && stockDataResponse.stock_out) {
        dataArray = stockDataResponse.stock_out;
        tableHeaders = ["SKU", "Product Name", "Issued Qty", "Issued Datetime"];
    } else {
        stockContainer.innerHTML = `<div class="alert alert-warning">No data available for this view or filters.</div>`;
        if(stockDataResponse.message && !stockDataResponse.error) Alert.showInfoMessage(stockDataResponse.message);
        toggleSpinner(false);
        return;
    }

    if (!dataArray || dataArray.length === 0) {
        stockContainer.innerHTML = `<div class="alert alert-info text-center">No stock records found matching your criteria.</div>`;
        toggleSpinner(false);
        return;
    }

    const tableElement = document.createElement("table");
    tableElement.classList.add("table", "table-bordered", "table-striped", "table-hover", "table-sm");

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = tableHeader.insertRow();
    tableHeaders.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      tableHeaderRow.appendChild(th);
    });
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");
    dataArray.forEach((item) => {
      const tableRow = tableBody.insertRow();

      // Low stock visual indication for "total" view
      if (currentStockView === "total" && item.is_low_stock == 1) { // Check the flag from backend
        tableRow.classList.add("table-danger"); // Bootstrap class for danger/warning
      }

      if (currentStockView === "total") {
        const { sku_id, order_product_sku, report_product_name, total_remaining, 
                min_quantity, max_quantity, enable_low_stock_alert, is_low_stock } = item;
        
        const skuCell = tableRow.insertCell();
        skuCell.textContent = order_product_sku;
        if (is_low_stock == 1) { // This flag already considers enable_low_stock_alert
            const lowStockIcon = document.createElement('i');
            lowStockIcon.classList.add('fas', 'fa-exclamation-triangle', 'text-warning', 'ms-2');
            lowStockIcon.title = 'Stock is low!';
            new bootstrap.Tooltip(lowStockIcon);
            skuCell.appendChild(lowStockIcon);
        }

        tableRow.appendChild(Cell.createSpanCell(report_product_name || 'N/A'));
        tableRow.appendChild(Cell.createSpanCell(total_remaining !== null ? total_remaining : 'N/A'));
        tableRow.appendChild(Cell.createSpanCell(min_quantity !== null ? min_quantity : 'Not Set'));
        tableRow.appendChild(Cell.createSpanCell(max_quantity !== null ? max_quantity : 'Not Set'));
        
        // Display "Alert Active" status
        const alertStatusCell = tableRow.insertCell();
        alertStatusCell.classList.add('text-center');
        if (enable_low_stock_alert == 1) {
            alertStatusCell.innerHTML = '<i class="fas fa-bell text-success" title="Alert Enabled"></i>';
            new bootstrap.Tooltip(alertStatusCell.querySelector('i'));
        } else {
            alertStatusCell.innerHTML = '<i class="fas fa-bell-slash text-muted" title="Alert Disabled"></i>';
            new bootstrap.Tooltip(alertStatusCell.querySelector('i'));
        }


        const actionsCell = tableRow.insertCell();
        actionsCell.classList.add("text-center");
        const editLevelsBtn = document.createElement("button");
        editLevelsBtn.classList.add("btn", "btn-sm", "btn-outline-secondary");
        editLevelsBtn.innerHTML = `<i class="fas fa-cog"></i> Settings`; // Changed icon/text
        editLevelsBtn.setAttribute('data-bs-toggle', 'tooltip');
        editLevelsBtn.setAttribute('data-bs-placement', 'top');
        editLevelsBtn.setAttribute('title', 'Configure Stock Settings');
        new bootstrap.Tooltip(editLevelsBtn);
        editLevelsBtn.addEventListener("click", () => {
            document.getElementById("stockLevelSkuIdInput").value = sku_id;
            document.getElementById("stockLevelSkuNameLabel").textContent = order_product_sku;
            document.getElementById("minQuantityInput").value = min_quantity !== null ? min_quantity : "";
            document.getElementById("maxQuantityInput").value = max_quantity !== null ? max_quantity : "";
            document.getElementById("enableLowStockAlertCheckbox").checked = (enable_low_stock_alert == 1); // Set checkbox state
            const modal = new bootstrap.Modal(document.getElementById('setStockLevelsModal'));
            modal.show();
        });
        actionsCell.appendChild(editLevelsBtn);

      } else if (currentStockView === "stock_in") {
        const { order_product_sku, report_product_name, received_quantity, remaining_quantity, received_date } = item;
        tableRow.appendChild(Cell.createSpanCell(order_product_sku));
        tableRow.appendChild(Cell.createSpanCell(report_product_name || 'N/A'));
        tableRow.appendChild(Cell.createSpanCell(received_quantity));
        tableRow.appendChild(Cell.createSpanCell(remaining_quantity)); // Remaining of this specific batch
        tableRow.appendChild(Cell.createSpanCell(formatDateTime(received_date)));
      } else if (currentStockView === "stock_out") {
        const { order_product_sku, report_product_name, issued_quantity, issued_date } = item;
        tableRow.appendChild(Cell.createSpanCell(order_product_sku));
        tableRow.appendChild(Cell.createSpanCell(report_product_name || 'N/A'));
        tableRow.appendChild(Cell.createSpanCell(issued_quantity));
        tableRow.appendChild(Cell.createSpanCell(formatDateTime(issued_date)));
      }
    });
    tableElement.appendChild(tableBody);
    stockContainer.appendChild(tableElement);

  } catch (error) {
    console.error("Error in generateTable:", error);
    document.getElementById("stock-container").innerHTML = `<div class="alert alert-danger text-center">Could not display stock data. Please try again.</div>`;
  } finally {
    toggleSpinner(false);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const stockViewRadios = document.querySelectorAll('input[name="stockViewRadio"]');
  const applyFiltersButton = document.getElementById("applyFiltersButton");
  const skuSearchInput = document.getElementById("skuSearchInput");
  const dateStartInput = document.getElementById("dateStartInput");
  const dateEndInput = document.getElementById("dateEndInput");
  const saveStockLevelsButton = document.getElementById("saveStockLevelsButton");

  await checkButtonPermissionAndLoadStock();

  stockViewRadios.forEach(radio => {
    radio.addEventListener("change", async function() {
      if (this.checked) {
        currentStockView = this.value;
        currentPage = 1;
        const isTotalView = currentStockView === 'total';
        dateStartInput.disabled = isTotalView;
        dateEndInput.disabled = isTotalView;
        if (isTotalView) {
            currentDateStart = ""; dateStartInput.value = "";
            currentDateEnd = ""; dateEndInput.value = "";
        }
        await generateTable();
      }
    });
  });

  applyFiltersButton.addEventListener("click", async () => {
    currentSkuSearchTerm = skuSearchInput.value.trim();
    if (currentStockView !== 'total') { // Only get dates if not total view
        currentDateStart = dateStartInput.value;
        currentDateEnd = dateEndInput.value;
    } else {
        currentDateStart = ""; // Ensure dates are clear for total view
        currentDateEnd = "";
    }
    currentPage = 1;

    if (currentDateStart && currentDateEnd && currentDateStart > currentDateEnd) {
        Alert.showWarningMessage("Start date cannot be after end date.");
        return;
    }
    await generateTable();
  });

  skuSearchInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      applyFiltersButton.click();
    }
  });

  saveStockLevelsButton.addEventListener("click", async () => {
    const skuId = document.getElementById("stockLevelSkuIdInput").value;
    const minQuantity = document.getElementById("minQuantityInput").value;
    const maxQuantity = document.getElementById("maxQuantityInput").value;
    const enableAlert = document.getElementById("enableLowStockAlertCheckbox").checked; // Get checkbox value

    if (!skuId) {
        Alert.showErrorMessage("SKU ID is missing.");
        return;
    }
    if (minQuantity !== "" && parseInt(minQuantity) < 0) {
        Alert.showErrorMessage("Min Quantity must be 0 or greater.");
        return;
    }
     if (maxQuantity !== "" && parseInt(maxQuantity) < 0) {
        Alert.showErrorMessage("Max Quantity must be 0 or greater.");
        return;
    }
    if (minQuantity !== "" && maxQuantity !== "" && parseInt(minQuantity) > parseInt(maxQuantity)) {
        Alert.showErrorMessage("Min Quantity cannot be greater than Max Quantity.");
        return;
    }


     try {
        toggleSpinner(true);
        let allUpdatesSuccessful = true;
        let messages = [];

        // Create an array of updates to send if backend supports it, or call individually
        const updates = [];
        if (minQuantity !== "") {
            updates.push({ field: "min_quantity", value: parseInt(minQuantity, 10) });
        } else { // If field is cleared, send null or handle as needed in backend
            updates.push({ field: "min_quantity", value: null });
        }

        if (maxQuantity !== "") {
            updates.push({ field: "max_quantity", value: parseInt(maxQuantity, 10) });
        } else {
             updates.push({ field: "max_quantity", value: null });
        }
        
        // Always update enable_low_stock_alert
        updates.push({ field: "enable_low_stock_alert", value: enableAlert ? 1 : 0 });


        for (const update of updates) {
            if (!allUpdatesSuccessful) break; // Stop if a previous update failed

            const result = await DataController.updateByKey(
                "sku_settings", "id", skuId, update.field, update.value
            );
            if (!(result && result.status)) {
                allUpdatesSuccessful = false;
                messages.push(`Failed to update ${update.field}. ` + (result?.message || ""));
            }
        }
        
        toggleSpinner(false);

        if (allUpdatesSuccessful) {
            Alert.showSuccessMessage("Stock settings updated successfully!");
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('setStockLevelsModal'));
            if(modalInstance) modalInstance.hide();
            await generateTable();
        } else {
            Alert.showErrorMessage("Some settings failed to update: " + messages.join(" "));
        }
    } catch (error) {
        toggleSpinner(false);
        console.error("Error updating stock settings:", error);
        Alert.showErrorMessage("An error occurred. "  + (error.response?.data?.message || error.message));
    }
  });

  // ... (Initial disabling of date filters remains the same)
  if (document.getElementById('total-stock').checked) {
    dateStartInput.disabled = true;
    dateEndInput.disabled = true;
  }
});

async function checkButtonPermissionAndLoadStock() {
  const userString = localStorage.getItem("user");
  if (userString) {
    try {
      const userArray = JSON.parse(userString);
      const user = userArray && userArray[0];
      if (user && user.permissions) {
        const response = await fetch("../../backend/lokin/check_permission_buttons.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: user.permissions, page: "stock" }),
        });
        if(response.ok){
            const html = await response.text();
            document.getElementById("permission-buttons-container").innerHTML = html;
        } else {
            console.error("Failed to load permission buttons:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error processing user permissions:", error);
    }
  }
  await generateTable();
}