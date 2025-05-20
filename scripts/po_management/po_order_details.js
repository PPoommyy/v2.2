// po_order_details.js
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { PODataController } from "../../components/PODataController.js"; // Assuming this exists and works

// --- Global Variables & DOM Elements ---
const poOrderIdValue = document.getElementById("poOrderId").value;
const factoryIdHiddenInput = document.getElementById("factoryId"); // To store/retrieve factory ID
let currentFactoryId = null; // Will be set on load or if new PO from specific factory
let poDetailsData = null; // To store fetched PO details
let pendingPoFileToUpload = null;

const factoryNameInput = document.getElementById("factory-name");
const factoryNumberInput = document.getElementById("factory-number");
const factoryEmailInput = document.getElementById("factory-email");

const togglePoOrderNoteCheckbox = document.getElementById("togglePoOrderNote");
const poOrderNoteContainer = document.getElementById("poOrderNoteContainer");
const poOrderNoteInput = document.getElementById("po-order-note-input");
const poOrderNoteDisplay = document.getElementById("poOrderNoteDisplay");

const poFilePreviewContainer = document.getElementById("po-file-preview-container");
const selectPoFileButton = document.getElementById("selectPoFileButton");
const hiddenPoFileInput = document.getElementById("hiddenPoFileInput");
const selectedPoFileNameSpan = document.getElementById("selectedPoFileName");
const uploadSelectedPoFileButton = document.getElementById("uploadSelectedPoFileButton");

const addPoProductButton = document.getElementById("add-po-product");
const poItemDataContainer = document.getElementById("po-item-data-container");

const updatePoButton = document.getElementById("update-po-button");
const sendPoEmailButton = document.getElementById("send-po-email-button");
const loadingSpinner = document.getElementById("loading-spinner");

// Helper to toggle spinner
function toggleSpinner(isLoading) {
    loadingSpinner.classList.toggle('d-none', !isLoading);
}

const get_factory_sku_search = async (searchTerm, factory_id) => {
  try {
    const response = await axios.get(
      `../../backend/get/factory/get_factory_sku_search.php?factory_id=${factory_id}&searchTerm=${searchTerm}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// --- SKU Search Logic (similar to order_details.js) ---
function createPoSkuDiv(skuInput, factoryIdForSearch) {
    const skuDiv = document.createElement("div");
    skuDiv.classList.add("dropdown", "sku-search-dropdown-container", "position-relative");

    const skuDropdown = document.createElement("ul");
    skuDropdown.classList.add("dropdown-menu", "w-100");
    skuDropdown.style.position = 'absolute';
    skuDropdown.style.zIndex = '1051'; // Ensure it's above other elements
    skuDropdown.style.width = 'auto';
    skuDropdown.style.minWidth = '100%';
    
    const inputId = skuInput.id || `po-sku-input-${Math.random().toString(36).substring(7)}`;
    if (!skuInput.id) skuInput.id = inputId;
    skuDropdown.setAttribute("aria-labelledby", inputId);
    skuInput.setAttribute("autocomplete", "off");

    const loadingLi = document.createElement("li");
    loadingLi.classList.add("dropdown-item", "text-muted", "d-none");
    loadingLi.textContent = "Loading...";
    skuDropdown.appendChild(loadingLi);

    let debounceTimer;
    skuInput.addEventListener("input", () => {
        skuInput.removeAttribute("data-sku-settings-id"); // Use data attributes
        skuInput.removeAttribute("data-report-product-name");
        skuInput.removeAttribute("data-item-price"); // Factory specific price

        const searchTerm = skuInput.value.trim();
        skuDropdown.innerHTML = ""; 
        skuDropdown.appendChild(loadingLi);

        clearTimeout(debounceTimer);
        if (searchTerm.length < 2) {
            skuDropdown.classList.remove("show");
            loadingLi.classList.add("d-none");
            return;
        }
        loadingLi.classList.remove("d-none");
        skuDropdown.classList.add("show");

        debounceTimer = setTimeout(async () => {
            try {
                // Use get_factory_sku_search (from pre_po_details.js or similar)
                // This function needs to exist and accept factory_id
                const response = await get_factory_sku_search(searchTerm, factoryIdForSearch || currentFactoryId);
                loadingLi.classList.add("d-none");
                if (response && response.success && Array.isArray(response.data)) {
                    updatePoSkuDropdown(response.data, skuInput, skuDropdown);
                } else {
                    skuDropdown.innerHTML = `<li class="dropdown-item text-danger">${response.error || 'Could not load SKUs'}</li>`;
                }
            } catch (error) {
                console.error("Factory SKU Search error:", error);
                loadingLi.classList.add("d-none");
                skuDropdown.innerHTML = '<li class="dropdown-item text-danger">Search failed.</li>';
            }
        }, 400);
    });
    // Add keydown and document click listeners similar to order_details.js for dropdown control
    document.addEventListener("click", (event) => {
        if (!skuDiv.contains(event.target)) skuDropdown.classList.remove("show");
    });
    skuDropdown.addEventListener("click", (e) => e.stopPropagation());

    skuDiv.appendChild(skuInput);
    skuDiv.appendChild(skuDropdown);
    return skuDiv;
}

function updatePoSkuDropdown(skuOptions, skuInput, skuDropdown) {
    skuDropdown.innerHTML = "";
    if (!skuOptions || skuOptions.length === 0) {
        skuDropdown.innerHTML = '<li class="dropdown-item text-muted">No SKUs found for this factory.</li>';
        return;
    }
    skuOptions.forEach(skuData => {
        const listItem = document.createElement("li");
        const optionLink = document.createElement("a");
        optionLink.classList.add("dropdown-item", "cursor-pointer");
        optionLink.textContent = `${skuData.order_product_sku} (${skuData.report_product_name || 'N/A'}) - Price: ${skuData.item_price || 'N/A'}`;
        
        optionLink.addEventListener("click", (e) => {
            e.preventDefault();
            skuInput.value = skuData.order_product_sku;
            skuInput.setAttribute("data-sku-settings-id", skuData.sku_settings_id); // This is the general sku_settings.id
            skuInput.setAttribute("data-report-product-name", skuData.report_product_name || skuData.order_product_sku);
            skuInput.setAttribute("data-item-price", skuData.item_price || "0.00"); // Factory specific price

            skuDropdown.classList.remove("show");
            // Auto-fill price in the row
            const row = skuInput.closest("tr");
            if (row) {
                const priceField = row.querySelector("input.po-item-price");
                if (priceField) priceField.value = parseFloat(skuData.item_price || 0).toFixed(2);
                updatePoItemTotal(row);
            }
        });
        listItem.appendChild(optionLink);
        skuDropdown.appendChild(listItem);
    });
}

// --- Order Note Toggle (Requirement 3) ---
function setupPoOrderNoteToggle() {
    if (togglePoOrderNoteCheckbox && poOrderNoteContainer && poOrderNoteInput && poOrderNoteDisplay) {
        const initialNote = poOrderNoteInput.value.trim();
        if (initialNote !== "") {
            togglePoOrderNoteCheckbox.checked = true;
            poOrderNoteContainer.classList.remove('d-none');
            poOrderNoteDisplay.textContent = initialNote;
            poOrderNoteDisplay.classList.remove('fst-italic', 'text-muted');
        } else {
            poOrderNoteDisplay.textContent = "No notes added.";
            poOrderNoteDisplay.classList.add('fst-italic', 'text-muted');
        }

        togglePoOrderNoteCheckbox.addEventListener('change', function() {
            poOrderNoteContainer.classList.toggle('d-none', !this.checked);
            poOrderNoteDisplay.classList.toggle('d-none', this.checked);
            if (!this.checked) {
                // poOrderNoteInput.value = ""; // Don't clear, just hide
                poOrderNoteDisplay.textContent = poOrderNoteInput.value.trim() || "No notes added.";
                poOrderNoteDisplay.classList.toggle('fst-italic', !poOrderNoteInput.value.trim());
                poOrderNoteDisplay.classList.toggle('text-muted', !poOrderNoteInput.value.trim());

            } else {
                poOrderNoteInput.focus();
            }
        });
    }
}

// --- File Display and Upload (Requirement 2) - Similar to order_details.js ---
function displayPoOrderFiles(filesArray) {
    // This function will be very similar to displayOrderFiles in order_details.js
    // but will target 'po-file-preview-container'
    // And DataController._delete will target "po_orders_files" table
    const container = poFilePreviewContainer;
    if (!container) return;
    container.innerHTML = ""; 

    if (!filesArray || filesArray.length === 0) {
        container.innerHTML = '<p class="text-muted small fst-italic">No files attached to this PO.</p>';
        return;
    }
    // ... (Loop through filesArray, create cards with previews, download, delete buttons)
    // ... (Ensure delete button calls DataController._delete("po_orders_files", "id", file.id))
    // ... (This logic can be copied and adapted from displayOrderFiles in order_details.js)
    // For brevity, I'll skip re-writing the full preview card logic here.
    // Key changes: target "po_orders_files" for delete.
    filesArray.forEach(file => {
        const card = document.createElement("div");
        card.classList.add("file-preview-item", "card", "mb-2"); // Use card for consistent styling

        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "p-2", "d-flex", "align-items-center");

        // Thumbnail (icon or image preview)
        const previewWrapper = document.createElement("div");
        previewWrapper.classList.add("me-2", "file-thumbnail-po"); // Use a distinct class if needed
        // ... (logic for img, iframe, or icon based on file.file_name extension) ...
        // Example for icon:
        previewWrapper.innerHTML = '<i class="fas fa-file fa-2x text-secondary"></i>';
        cardBody.appendChild(previewWrapper);

        // File Info
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("flex-grow-1");
        const fileNameP = document.createElement("p");
        fileNameP.classList.add("mb-0", "fw-bold", "small", "text-truncate");
        fileNameP.textContent = file.file_name;
        infoDiv.appendChild(fileNameP);
        cardBody.appendChild(infoDiv);

        // Actions
        const actionsDiv = document.createElement("div");
        const downloadBtn = document.createElement("a");
        downloadBtn.href = `../../${file.file_pathname}`;
        downloadBtn.download = file.file_name;
        downloadBtn.classList.add("btn", "btn-sm", "btn-outline-primary", "me-1");
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        actionsDiv.appendChild(downloadBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("btn", "btn-sm", "btn-outline-danger");
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.onclick = async () => {
            // ... delete logic for po_orders_files ...
            const confirmDel = await Alert.showConfirmModal("Delete this file?");
            if(confirmDel.isConfirmed){
                // await DataController._delete("po_orders_files", "id", file.id);
                // refresh PO files
            }
        };
        actionsDiv.appendChild(deleteBtn);
        cardBody.appendChild(actionsDiv);

        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

function setupPoFileUpload() {
    // This function will be very similar to setupFileUpload in order_details.js
    // but will target 'selectPoFileButton', 'hiddenPoFileInput', 'selectedPoFileName', 'uploadSelectedPoFileButton'
    // And for Edit Mode, will use poOrderIdValue and "po_orders_files" table.
    // pendingPoFileToUpload will be used for new POs.
    if (selectPoFileButton && hiddenPoFileInput && selectedPoFileNameSpan && uploadSelectedPoFileButton) {
        selectPoFileButton.addEventListener('click', () => hiddenPoFileInput.click());
        hiddenPoFileInput.addEventListener('change', function() { /* ... show selected file name, show upload button ... */ });
        uploadSelectedPoFileButton.addEventListener('click', async function() {
            // ... if poOrderIdValue exists (Edit PO) -> upload and insert to "po_orders_files"
            // ... else (New PO) -> store in pendingPoFileToUpload
        });
    }
}

// --- PO Item Table Logic ---
function addPoItemRow(item = {}) {
    const tbody = document.getElementById("po-item-data-container")?.querySelector("tbody");
    if (!tbody) {
        // Create table and tbody if they don't exist
        const itemDataContainer = document.getElementById("po-item-data-container");
        if (!itemDataContainer) return;
        const table = document.createElement("table");
        table.classList.add("table", "table-sm", "table-bordered");
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        ["Order SKU ID", "Product SKU (Factory)", "Qty", "Unit Price", "Actions"].forEach((text, index) => {
            const th = document.createElement("th");
            th.textContent = text;
            // Add classes for width styling based on CSS
            if(index === 0) th.classList.add('col-sku-po');
            if(index === 1) th.classList.add('col-product-po');
            if(index === 2) th.classList.add('col-qty-po', 'text-center');
            if(index === 3) th.classList.add('col-price-po', 'text-end');
            if(index === 4) th.classList.add('col-actions-po');
            headerRow.appendChild(th);
        });
        const newTbody = table.createTBody();
        newTbody.id = "po-item-list-body"; // Ensure this ID matches
        itemDataContainer.appendChild(table);
        return addPoItemRow(item); // Call again with created tbody
    }


    const tr = tbody.insertRow();
    tr.classList.add("po-item-row");

    // 1. Order SKU ID (from Sales Order, if applicable, otherwise can be blank or input)
    let cell = tr.insertCell();
    const orderSkuIdInput = document.createElement("input");
    orderSkuIdInput.type = "text";
    orderSkuIdInput.classList.add("form-control", "form-control-sm", "po-order-sku-id");
    orderSkuIdInput.value = item.orders_skus_id || ""; // From pre-PO or existing PO item
    orderSkuIdInput.placeholder = "SO Item ID";
    orderSkuIdInput.dataset.originalOrdersSkusId = item.orders_skus_id || "";
    cell.appendChild(orderSkuIdInput);

    // 2. Product SKU (Factory SKU search)
    cell = tr.insertCell();
    const factorySkuInput = document.createElement("input");
    factorySkuInput.type = "text";
    factorySkuInput.classList.add("form-control", "form-control-sm", "po-factory-sku");
    factorySkuInput.value = item.order_product_sku || ""; // Factory's SKU for the product
    factorySkuInput.placeholder = "Search Factory SKU";
    factorySkuInput.setAttribute("data-sku-settings-id", item.sku_settings_id || ""); // general sku_settings_id
    factorySkuInput.setAttribute("data-report-product-name", item.report_product_name || "");
    factorySkuInput.setAttribute("data-item-price", item.item_price || "0.00"); // Initial price from factory SKU
    const skuDiv = createPoSkuDiv(factorySkuInput, item.factory_id || currentFactoryId); // Pass factory ID for search
    cell.appendChild(skuDiv);

    // 3. Quantity
    cell = tr.insertCell();
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.classList.add("form-control", "form-control-sm", "po-item-quantity", "text-center");
    quantityInput.value = item.quantity || 1;
    quantityInput.addEventListener("change", () => updatePoItemTotal(tr));
    cell.appendChild(quantityInput);

    // 4. Unit Price (Factory Price)
    cell = tr.insertCell();
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "0.01";
    priceInput.min = "0";
    priceInput.classList.add("form-control", "form-control-sm", "po-item-price", "text-end");
    priceInput.value = parseFloat(item.item_price || 0).toFixed(2);
    priceInput.addEventListener("change", () => updatePoItemTotal(tr));
    cell.appendChild(priceInput);

    // Hidden total for calculation, not displayed as input usually
    // const totalInput = createInput("number", "total", parseFloat(item.total || 0).toFixed(2), true);
    // totalInput.classList.add("d-none"); 
    // cell.appendChild(totalInput); // Or just calculate on the fly

    // 5. Actions (Remove)
    cell = tr.insertCell();
    cell.classList.add("text-center");
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("btn", "btn-sm", "btn-outline-danger");
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    removeBtn.title = "Remove Item";
    new bootstrap.Tooltip(removeBtn);
    removeBtn.onclick = () => {
        tr.remove();
        // updatePOTotals(); // A function to sum up all item totals if displayed
    };
    cell.appendChild(removeBtn);
}

function updatePoItemTotal(tableRow) {
    const qtyInput = tableRow.querySelector(".po-item-quantity");
    const priceInput = tableRow.querySelector(".po-item-price");
    // const totalDisplay = tableRow.querySelector(".po-item-line-total-display"); // If you add a display cell

    const qty = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const lineTotal = qty * price;

    // If you have a cell to display line total:
    // if (totalDisplay) totalDisplay.textContent = lineTotal.toFixed(2);
    
    // updateOverallPOTotal(); // Update the grand total of PO
}


// --- Load PO Details ---
async function loadPoOrderDetails(poId) {
    if (!poId) {
        // This is a new PO, potentially pre-filled from pre_po_details.js
        // Check URL params for factory_id and pre-selected items data
        const urlParams = new URLSearchParams(window.location.search);
        currentFactoryId = urlParams.get("factory_id") || null; // Get factory_id if creating new from pre_po
        const preSelectedDataEncoded = urlParams.get("data");

        if (currentFactoryId) {
            factoryIdHiddenInput.value = currentFactoryId;
            const factoryDetailsResult = await PODataController.get_factory_details(currentFactoryId);
            if (factoryDetailsResult && factoryDetailsResult.length > 0) {
                updateFactoryFields(factoryDetailsResult[0]);
            }
        }
        if (preSelectedDataEncoded) {
            try {
                const preSelectedItems = JSON.parse(decodeURIComponent(preSelectedDataEncoded));
                preSelectedItems.forEach(order => { // It's an array of orders
                    order.items.forEach(item => {
                        addPoItemRow({
                            orders_skus_id: item.orders_skus_id,
                            order_product_sku: item.order_product_sku, // This is the SO SKU, factory SKU will be searched
                            report_product_name: item.report_product_name,
                            quantity: item.quantity_purchased,
                            item_price: item.item_price, // This is SO item price, factory price might differ
                            sku_settings_id: item.sku_settings_id,
                            factory_id: currentFactoryId // For SKU search context
                        });
                    });
                });
            } catch (e) { console.error("Error parsing pre-selected items data:", e); }
        } else if (!currentFactoryId) {
             Alert.showWarningMessage("No Factory ID specified for new PO. Please select a factory first (feature to be added).");
             // Disable form or redirect
        } else {
            addPoItemRow({ factory_id: currentFactoryId }); // Add one empty row for new PO
        }
        updatePoButton.innerHTML = '<i class="fas fa-plus-circle me-2"></i> Create PO & PDF';

    } else { // Editing existing PO
        toggleSpinner(true);
        try {
            const result = await PODataController.get_po_details(poId);
            if (result && result.length > 0) {
                poDetailsData = result[0]; // Store globally
                const { data, nested } = poDetailsData;
                currentFactoryId = data.factory_id;
                factoryIdHiddenInput.value = currentFactoryId;

                updateFactoryFields(data);
                poOrderNoteInput.value = data.notes || "";
                setupPoOrderNoteToggle(); // Call after value is set
                
                if (nested && nested.items && nested.items.length > 0) {
                    nested.items.forEach(item => addPoItemRow(item));
                } else {
                    addPoItemRow({ factory_id: currentFactoryId }); // Add empty row if no items
                }
                if (nested && nested.files) {
                    displayPoOrderFiles(nested.files);
                }
                 updatePoButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Update PO & PDF';
            } else {
                Alert.showErrorMessage(`Could not load PO details for ID: ${poId}`);
            }
        } catch (error) {
            console.error("Error loading PO Details:", error);
            Alert.showErrorMessage("Failed to load PO details.");
        } finally {
            toggleSpinner(false);
        }
    }
}

function updateFactoryFields(factoryData){
    if(factoryNameInput) factoryNameInput.value = factoryData.factory_name || factoryData.name || "";
    if(factoryNumberInput) factoryNumberInput.value = factoryData.contact_number || "";
    if(factoryEmailInput) factoryEmailInput.value = factoryData.email_address || "";
}

// --- PDF Generation (Adapted from pre_po_details.js) ---
async function createPOAsPDFWrapper(poData, itemsForPdf) {
    // This will call the createPOAsPDF function (which should be defined in this file or imported)
    // Ensure newPOOrder parameter in createPOAsPDF matches the structure of poData
    // and itemsList parameter matches itemsForPdf.
    
    // Map poData to the structure expected by createPOAsPDF if different
    const poDocumentData = {
        po_order_id: poData.po_order_id || poData.id, // Adjust based on your data structure
        factory_name: poData.factory_name,
        contact_number: poData.contact_number,
        email_address: poData.email_address,
        po_order_date: poData.po_order_date || new Date().toISOString().split("T")[0], // Default to today if not present
        notes: poData.notes,
        // ... any other fields createPOAsPDF needs for the header/footer
    };
    
    // Map itemsForPdf if needed
    const pdfItems = itemsForPdf.map(item => ({
        order_product_sku: item.factory_sku || item.order_product_sku, // Prefer factory SKU if available
        report_product_name: item.report_product_name,
        quantity: item.quantity,
        item_price: item.item_price,
        total: parseFloat(item.quantity) * parseFloat(item.item_price),
        // ... any other item fields for the PDF table
    }));

    try {
        // Ensure pdfMake and NotoSansThai font are loaded
        if (typeof pdfMake === 'undefined' || !pdfMake.fonts || !pdfMake.fonts.NotoSansThai) {
            Alert.showErrorMessage("PDF generation library or font not loaded.");
            console.error("pdfMake or NotoSansThai font not available. Ensure they are included and loaded before this call.");
            // Dynamically load if necessary (advanced)
            // Example: await loadScript('path/to/pdfmake.min.js'); await loadScript('path/to/vfs_fonts.js');
            // And then setup pdfMake.fonts = { NotoSansThai: { ... } };
            return null;
        }

        // The createPOAsPDF function from pre_po_details.js needs to be available here.
        // For now, assuming it's copied or imported into this file.
        // If it's in pre_po_details.js, you might need to export it and import here.
        // Or, more simply, copy the relevant parts of createPOAsPDF here.
        // For this example, let's assume a simplified version or direct call to your existing one.
        
        // This is a placeholder for where you'd call your actual PDF generation logic
        // that was in pre_po_details.js (function createPOAsPDF).
        // You need to ensure that function is accessible here.
        // const pdfFile = await ActualPdfCreationFunction(poDocumentData, pdfItems);
        
        // --- Simplified PDF generation for demonstration (replace with your full logic) ---
        if (typeof createPOAsPDF !== 'function') { // Check if your specific function exists
            Alert.showErrorMessage("PDF Creation function (createPOAsPDF) is not available.");
            return null;
        }
        const pdfFile = await createPOAsPDF(poDocumentData, pdfItems); // Call your existing function
        // --- End simplified PDF generation ---

        if (pdfFile) { // pdfFile should be a File object
            const formData = new FormData();
            formData.append("file", pdfFile, pdfFile.name); // pdfFile.name should be like 'PO-XYZ.pdf'
            
            const uploadResponse = await DataController.upload(formData, `../../files/po_orders/${poDocumentData.po_order_id}`);
            if (uploadResponse && uploadResponse.status && uploadResponse.filePath) {
                const fileDataToSave = {
                    po_order_id: poDocumentData.po_order_id,
                    file_name: uploadResponse.fileName,
                    file_pathname: uploadResponse.filePath,
                    file_type: 'po_document' // Add a type
                };
                await DataController.insert("po_orders_files", fileDataToSave);
                return pdfFile; // Return the file object for potential email attachment
            } else {
                Alert.showErrorMessage("Generated PDF, but failed to upload it. " + (uploadResponse?.message || ""));
            }
        }
        return null;

    } catch (error) {
        console.error("Error in createPOAsPDFWrapper:", error);
        Alert.showErrorMessage("Failed to create or upload PO PDF.");
        return null;
    }
}


// --- Event Listeners ---
if (addPoProductButton) {
    addPoProductButton.addEventListener("click", () => addPoItemRow({ factory_id: currentFactoryId }));
}

if (updatePoButton) {
    updatePoButton.addEventListener("click", async () => {
        toggleSpinner(true);
        const poNote = poOrderNoteInput.value.trim();
        const items = [];
        document.querySelectorAll("#po-item-data-container tbody tr.po-item-row").forEach(row => {
            const orderSkuIdEl = row.querySelector(".po-order-sku-id");
            const factorySkuInputEl = row.querySelector(".po-factory-sku");
            const quantityEl = row.querySelector(".po-item-quantity");
            const priceEl = row.querySelector(".po-item-price");

            if (factorySkuInputEl && quantityEl && priceEl && factorySkuInputEl.value.trim()) {
                items.push({
                    orders_skus_id: orderSkuIdEl ? orderSkuIdEl.value.trim() : null, // ID from original SO item
                    sku_settings_id: factorySkuInputEl.dataset.skuSettingsId, // General SKU ID
                    order_product_sku: factorySkuInputEl.value.trim(), // This is the factory SKU
                    report_product_name: factorySkuInputEl.dataset.reportProductName,
                    quantity: parseFloat(quantityEl.value) || 0,
                    item_price: parseFloat(priceEl.value) || 0,
                    total: (parseFloat(quantityEl.value) || 0) * (parseFloat(priceEl.value) || 0),
                    // po_order_item_id might be needed if updating existing items
                    po_order_item_id: row.dataset.poOrderItemId || null 
                });
            }
        });

        if (items.length === 0) {
            Alert.showWarningMessage("Please add at least one item to the PO.");
            toggleSpinner(false);
            return;
        }

        let result;
        let poIdToUse = poOrderIdValue;

        if (poOrderIdValue) { // Update existing PO
            const poDataToUpdate = {
                notes: poNote,
                po_order_status_id: poDetailsData?.data?.po_order_status_id === 1 ? 1 : 5, // Keep 'Sent' if already sent, else 'Draft'
                // total_amount: calculate total from items (optional, can be done in backend)
            };
            result = await PODataController.update_po_order_and_items(poOrderIdValue, poDataToUpdate, items);
        } else { // Create new PO
            const newPoData = {
                factory_id: currentFactoryId,
                notes: poNote,
                po_order_status_id: 5, // Draft
                po_order_date: new Date().toISOString().split("T")[0],
                // timesort: await generateNewTimeSort(...), // If you have a timesort logic for POs
            };
            result = await PODataController.create_po_order_with_items(newPoData, items);
            if(result && result.status && result.po_order_id) {
                poIdToUse = result.po_order_id;
                 // Update the hidden input and global var if a new PO was created
                document.getElementById("poOrderId").value = poIdToUse;
                // orderIdValue = poIdToUse; // This is const, can't reassign. Need a different approach or reload.
                history.replaceState(null, '', `?po_order_id=${poIdToUse}`); // Update URL
                 Alert.showInfoMessage(`New PO Draft ${poIdToUse} created. You can now update or send it.`);
            }
        }

        if (result && result.status) {
            Alert.showSuccessMessage(`PO ${poOrderIdValue ? 'updated' : 'draft created'} successfully! Generating PDF...`);
            
            // Fetch fresh PO data for PDF generation (especially if it was a new PO)
            const freshPoDetails = await PODataController.get_po_details(poIdToUse);
            if (freshPoDetails && freshPoDetails.length > 0) {
                const pdfFile = await createPOAsPDFWrapper(freshPoDetails[0].data, freshPoDetails[0].nested.items);
                if (pdfFile) {
                    Alert.showSuccessMessage("PO PDF generated and saved!");
                    // Provide download link
                    const pdfLink = document.getElementById("generatedPoPdfLink");
                    pdfLink.href = URL.createObjectURL(pdfFile);
                    pdfLink.download = pdfFile.name;
                    // pdfLink.click(); // Optional: auto-download
                    pdfLink.textContent = `Download ${pdfFile.name}`;
                    pdfLink.style.display = 'inline-block';
                    
                    // Refresh file list
                    displayPoOrderFiles(freshPoDetails[0].nested.files);
                }
            } else {
                 Alert.showWarningMessage("Could not fetch complete PO details for PDF generation after save.");
            }
            // Optionally reload the whole page or just item/file lists
            // await loadPoOrderDetails(poIdToUse); // Reload data
             if (!poOrderIdValue && poIdToUse) { // If it was a new PO and successfully created
                // Change button text to "Update PO"
                updatePoButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Update PO & PDF';
                // Update page title if it was "Create New PO"
                 const titleEl = document.querySelector('.container > .d-flex > h1.h2');
                 if(titleEl) titleEl.innerHTML = `PO Order Details <small class="text-muted fs-6 d-block d-md-inline">(PO ID: ${poIdToUse})</small>`;

            }


        } else {
            Alert.showErrorMessage(`Failed to ${poOrderIdValue ? 'update' : 'create'} PO. ` + (result?.message || ""));
        }
        toggleSpinner(false);
    });
}

if(sendPoEmailButton){
    sendPoEmailButton.addEventListener("click", async () => {
        if(!poOrderIdValue){
            Alert.showWarningMessage("Please save or create the PO first before sending an email.");
            return;
        }

        Alert.showInfoMessage("Ensuring PO and PDF are up-to-date before sending...");
        updatePoButton.click();

        toggleSpinner(true);
        try {
            const currentPoDetails = await PODataController.get_po_details(poOrderIdValue);
            if (!currentPoDetails || currentPoDetails.length === 0) {
                Alert.showErrorMessage("Cannot find PO details to send email.");
                toggleSpinner(false);
                return;
            }
            const poData = currentPoDetails[0].data;
            const poItems = currentPoDetails[0].nested.items;
            const poFiles = currentPoDetails[0].nested.files;

            // Find the latest PO PDF document
            const poPdfDocument = poFiles.find(f => f.file_name.startsWith(`PO-${poOrderIdValue}`) && f.file_name.endsWith('.pdf'));

            if (!poPdfDocument) {
                Alert.showWarningMessage("PO PDF not found. Please 'Update PO & PDF' first.");
                toggleSpinner(false);
                return;

            }
            
            const pdfFileForEmail = { 
                name: poPdfDocument.file_name, 
            };

             const factoryInfo = await DataController.selectByKey("factories", "id", poData.factory_id);
             const factoryEmail = factoryInfo?.status?.[0]?.email_address || null;

            if(!factoryEmail){
                Alert.showErrorMessage("Factory email not found.");
                toggleSpinner(false);
                return;
            }

            const pdfFileObject = await createPOAsPDFWrapper(poData, poItems); 

            if(!pdfFileObject){
                 Alert.showErrorMessage("Could not prepare PDF for email.");
                 toggleSpinner(false);
                 return;
            }

            const emailSent = await sendEmail(pdfFileObject, poData, factoryEmail); 

            if (emailSent) {
                Alert.showSuccessMessage("PO Email sent successfully!");
                await DataController.update("po_orders", "po_order_id", poOrderIdValue, { po_order_status_id: 1 });
                if (poDetailsData && poDetailsData.data) poDetailsData.data.po_order_status_id = 1; 
            } else {
                Alert.showErrorMessage("Failed to send PO email.");
            }

        } catch (error) {
            console.error("Error sending PO email:", error);
            Alert.showErrorMessage("An error occurred while sending email.");
        } finally {
            toggleSpinner(false);
        }
    });
}


// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', async () => {
    const staticTooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    staticTooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    await loadPoOrderDetails(poOrderIdValue); // Load main PO data and items
    setupPoOrderNoteToggle();
    setupPoFileUpload();
});


async function createPOAsPDF(poDocumentData, itemsForPdf) {
     try {
        const fontBaseUrl = '../../assets/webfonts/'; 

        pdfMake.fonts = {
          NotoSansThai: {
            normal: fontBaseUrl + "NotoSansThai-Regular.ttf",
            bold: fontBaseUrl + "NotoSansThai-Bold.ttf",
            italics: fontBaseUrl + "NotoSansThai-Regular.ttf",
            bolditalics: fontBaseUrl + "NotoSansThai-Bold.ttf",
          }
        };

        const mergedItemsList = mergeSimilarItems(itemsForPdf); // Ensure mergeSimilarItems is defined

        const totalAmount = mergedItemsList.reduce(
          (sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.item_price)),0);

        const tableBody = [
          [ /* ... headers ... */ { text: "No.", style:'tableHeader'}, { text: "SKU", style:'tableHeader'}, /* ... */ ],
          ...mergedItemsList.map((item, index) => [
            index + 1,
            item.order_product_sku || item.sku_settings_id, // Display SKU
            item.report_product_name || 'N/A',
            item.quantity,
            parseFloat(item.item_price).toFixed(2),
            (parseFloat(item.quantity) * parseFloat(item.item_price)).toFixed(2),
          ]),
        ];

        const docDefinition = {
          content: [/* ... your full document definition from pre_po_details.js ... */],
          styles: { /* ... */ },
          defaultStyle: { font: "NotoSansThai", fontSize: 10 }
        };
        
        // console.log("PDF Doc Definition:", JSON.stringify(docDefinition, null, 2));


        return new Promise((resolve, reject) => {
            pdfMake.createPdf(docDefinition).getBlob((blob) => {
                if (blob) {
                    const pdfFile = new File([blob], `PO-${poDocumentData.po_order_id}.pdf`, { type: "application/pdf" });
                    resolve(pdfFile);
                } else {
                    reject(new Error("pdfMake failed to generate PDF blob."));
                }
            }, (error) => {
                console.error("pdfMake error:", error);
                reject(error);
            });
        });

    } catch (error) {
        console.error("Error in createPOAsPDF function:", error);
        Alert.showErrorMessage("PDF Generation failed: " + error.message);
        throw error; // Re-throw to be caught by caller
    }
}

async function toBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mergeSimilarItems(items) {
  const merged = [];

  items.forEach((item) => {
    const existing = merged.find(
      (i) =>
        i.sku_settings_id === item.sku_settings_id &&
        parseFloat(i.item_price) === parseFloat(item.item_price)
    );

    console.log("mergeSimilarItems", item);
    console.log("item_price = ", parseFloat(item.item_price));
    console.log("total = ", parseFloat(item.total));
    if (existing) {
      existing.quantity += parseFloat(item.quantity);
      existing.total += parseFloat(item.total);
    } else {
      // Clone object เพื่อกันข้อมูลต้นฉบับเสีย
      merged.push({
        sku_settings_id: item.sku_settings_id,
        order_product_sku: item.order_product_sku,
        report_product_name: item.report_product_name,
        quantity: parseFloat(item.quantity),
        item_price: parseFloat(item.item_price),
        total: parseFloat(item.total),
      });
    }
  });

  return merged;
}
const sendEmail = async (pdfFile, newPOOrder, factoryEmail) => {
  try {
    const recipientEmail = factoryEmail || "s6404062630554@email.kmutnb.ac.th";
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);

    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
      intent: "print",
    }).promise;

    const pngBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png", 1.0); // คุณภาพสูงสุด
    });

    const pngFileName = pdfFile.name.replace(/\.pdf$/, ".png");
    const pngFile = new File([pngBlob], pngFileName, { type: "image/png" });

    const pngFormData = new FormData();
    pngFormData.append("file", pngFile, pngFileName);
    const uploadResponse = await DataController.upload(
      pngFormData,
      "../../files/"
    );

    if (!uploadResponse?.fileName) {
      throw new Error("Failed to upload PNG preview image.");
    }

    const pngFileData = {
      po_order_id: newPOOrder.po_order_id,
      file_name: uploadResponse.fileName,
      file_pathname: uploadResponse.filePath,
      file_type: "preview",
    };
    await DataController.insert("po_orders_files", pngFileData);

    const baseUrl = `${host}/files/`;
    const pdfUrl = baseUrl + encodeURIComponent(pdfFile.name);
    const pngUrl = baseUrl + encodeURIComponent(uploadResponse.fileName);

    const factory = await DataController.selectByKey(
      "factories",
      "id",
      newPOOrder.factory_id
    );

    const factoryData = factory?.status?.[0] || {};

    const poItems = await DataController.selectByKey(
      "po_orders_items",
      "po_order_id",
      newPOOrder.po_order_id
    );

    const emailContent = generateEnhancedEmailContent(
      newPOOrder,
      factoryData,
      poItems?.status || []
    );

    const emailFormData = new FormData();
    emailFormData.append("title", emailContent.title);
    emailFormData.append("email", recipientEmail);
    emailFormData.append(
      "accept_url",
      `${host}/pages/view_only/po_order_details.php?po_order_id=${newPOOrder.po_order_id}`
    );
    emailFormData.append(
      "cancel_url",
      `${host}/pages/view_only/po_order_details.php?po_order_id=${newPOOrder.po_order_id}`
    );
    emailFormData.append("pdf_url", pdfUrl);
    emailFormData.append("png_url", pngUrl);

    emailFormData.append("po_number", newPOOrder.po_order_id);
    emailFormData.append("factory_name", factoryData.name || "");

    const response = await axios.post(
      "../../backend/api/thaibulksms/send_email.php",
      emailFormData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    await DataController.insert("po_orders_email_log", {
      po_order_id: newPOOrder.po_order_id,
      recipient_email: recipientEmail,
      sent_date: new Date().toISOString().split("T")[0],
      status: response.data.success ? "success" : "failed",
    });

    return response.data.success;
  } catch (error) {
    console.error("Error sending email:", error);
    Alert.showErrorMessage("ไม่สามารถส่งอีเมลได้: " + error.message);
    return false;
  }
};