import { Pagination } from "../../components/Pagination.js";
import { Downloader } from "../../components/Downloader.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Cell } from "../../components/Cell.js";
import { Modal } from "../../components/Modal.js"; // Assuming Modal.js has an openModal for generic modals
import { ThaiPostAPIController } from "../../components/ThaiPostAPIController.js";
import { AftershipAPIController } from "../../components/AftershipAPIController.js";
// UserController is not used in the provided snippet, remove if not needed elsewhere
// import { UserController } from "../../components/UserController.js";

let checkboxStates = [];
let orders = {};

const thaiPostApiHost = "https://dpinterapi.thailandpost.com";
const aftershipApiHost = "https://api.aftership.com";
const limitDropdown = document.getElementById("limitDropdown");
const dropdownMenu = document.getElementById("dropdownMenu");
const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
const dropdownTitle = document.getElementById("dropdown-title");
const updateButton = document.getElementById("updateButton");

updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (value) {
    const result = await DataController.updateByKey(
      "orders",
      "order_id",
      id,
      key,
      value
    );
    if (result.status) {
      Cell.closeEditModal(); // Assuming Cell has this static method
      Alert.showSuccessMessage("Update successful");
      await generateTable(parseInt(limitDropdown.innerText, 10) || 200, 1); // Regenerate table
    } else {
      Alert.showErrorMessage("Update failed");
    }
  } else {
    Alert.showErrorMessage("Value cannot be empty for update."); // More specific error
  }
});

dropdownItems.forEach((item) => {
  item.addEventListener("click", async function (event) { // Make async
    event.preventDefault();
    const selectedLimit = this.getAttribute("data-limit");
    limitDropdown.innerText = selectedLimit;
    await generateTable(parseInt(selectedLimit, 10), 1); // Use await
  });
});

const filterButton = document.getElementById("filter-button");
filterButton.addEventListener("click", async function () { // Make async
  await generateTable(parseInt(limitDropdown.innerText, 10) || 200, 1); // Use await
});

// Removed const modal = document.getElementById("editModal"); as it's not directly used here. editModal is handled by Bootstrap.

async function get_order_count(filters) {
  try {
    let url = `../../backend/get/order/get_order_count.php?`;
    let params = [];

    Object.keys(filters).forEach((filterKey) => {
      const filterData = filters[filterKey];
      if (filterData.value && filterData.include && filterData.value !== "All") {
        // Special handling for date_start and date_end as they share one checkbox
        if (filterKey === 'date_start' || filterKey === 'date_end') {
            if (filters.date_range.include) { // Check the common date_range include
                 params.push(`${filterKey}=${encodeURIComponent(filterData.value)}`);
            }
        } else if (filterKey !== 'date_range') { // Exclude the helper date_range key
            params.push(`${filterKey}=${encodeURIComponent(filterData.value)}`);
        }
      }
    });
    if (params.length > 0) {
        url += params.join('&');
    }
    const response = await axios.get(url);
    return response.data[0].count;
  } catch (error) {
    console.error("Error in get_order_count:", error);
    Alert.showErrorMessage("Could not retrieve order count. " + (error.response?.data?.message || error.message));
    throw error;
  }
}

async function get_order_list(limit, page, filters) {
  try {
    let url = `../../backend/get/order/get_order_list.php?limit=${limit}&page=${page}`;
    let params = [];

    Object.keys(filters).forEach((filterKey) => {
        const filterData = filters[filterKey];
        if (filterData.value && filterData.include && filterData.value !== "All") {
            // Special handling for date_start and date_end
            if (filterKey === 'date_start' || filterKey === 'date_end') {
                if (filters.date_range.include) { // Check the common date_range include
                    params.push(`${filterKey}=${encodeURIComponent(filterData.value)}`);
                }
            } else if (filterKey !== 'date_range') { // Exclude the helper date_range key
                 params.push(`${filterKey}=${encodeURIComponent(filterData.value)}`);
            }
        }
    });
     if (params.length > 0) {
        url += '&' + params.join('&');
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error in get_order_list:", error);
    Alert.showErrorMessage("Could not retrieve order list. " + (error.response?.data?.message || error.message));
    throw error;
  }
}


async function generateTable(limit, page) {
  try {
    toggleSpinner(true);
    const filterValues = getFilterValues();
    const result = await get_order_list(limit, page, filterValues);

    if (!result || !result.data1 || !result.data2) {
        Alert.showErrorMessage("Failed to load order data. The response from server is malformed.");
        toggleSpinner(false);
        document.getElementById("order-data-container").innerHTML = `<div class="alert alert-warning">No orders found or error loading data.</div>`;
        return;
    }

    orders = result.data1;
    console.log("Orders:", orders); // Debugging line to check orders data
    const dropdownData = result.data2; // Renamed for clarity
    generateDropdown(dropdownData); // Pass data for dropdowns

    const totalCount = await get_order_count(filterValues);
    const totalPages = Math.ceil(totalCount / limit);

    const orderDataContainer = document.getElementById("order-data-container");
    orderDataContainer.innerHTML = ""; // Clear previous table
    checkboxStates = []; // Reset checkbox states

    if (!orders || orders.length === 0) {
        orderDataContainer.innerHTML = `<div class="alert alert-info text-center" role="alert">No orders found matching your criteria.</div>`;
        dropdownTitle.innerText = `Showing 0-0 of 0 rows`;
        Pagination.updatePagination(page, totalPages, "pagination1", generateTable);
        Pagination.updatePagination(page, totalPages, "pagination2", generateTable);
        toggleSpinner(false);
        updateButtonStates(); // Disable buttons if no orders
        return;
    }


    const tableElement = document.createElement("table");
    tableElement.classList.add(
      "table",
      "table-bordered",
      "table-striped",
      "table-hover",
      "table-sm" // Changed table-condensed to table-sm for BS5
    );

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `<th>
            <input id="allItems" type="checkbox" data-index="-1" name="Allitems" value="-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Select All"/>
         </th>
         <th>Detail</th>
         <th>TIME SORT</th>
         <th>Buyer Name</th>
         <th>Report Product Name</th>
         <th>Channel</th>
         <th>All Total</th>
         <th>Currency</th>
         <th>Order Status</th>
         <th>Tracking #</th>`; // ADDED Tracking # Header
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");
    orders.forEach((order) => {
      // Graceful error check for malformed order object
      if (!order || !order.details || !order.items) {
        console.warn("Skipping malformed order object:", order);
        return; // Skip this iteration
      }

      const { details, items, all_total, files, tracking } = order;
      const {
        timesort,
        order_id,
        buyer_name,
        buyer_email, // Added buyer_email for completeness, though not directly displayed in this version yet
        website_name,
        currency_code,
        order_status,
        order_note,
      } = details;

      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.classList.add("form-check-input");
      checkboxInput.name = "items";
      checkboxInput.value = timesort;

      const linkDetails = document.createElement("a");
      linkDetails.href = `order_details.php?order_id=${order_id}`;
      linkDetails.innerText = "View";
      linkDetails.classList.add("btn", "btn-sm", "btn-outline-primary");


      const isCancel = buyer_name && buyer_name.startsWith("ยกเลิก");
      const buyerNameSpan = document.createElement("span");

      if (isCancel) {
        buyerNameSpan.classList.add("text-danger");
        buyerNameSpan.innerHTML = `(ยกเลิก แก้ไขเป็น ${
          buyer_name.split(" ")[1] || ''
        })`;
      } else {
        buyerNameSpan.innerHTML = buyer_name || 'N/A';
      }

      const timesortDiv = document.createElement("div");
      timesortDiv.classList.add("d-flex", "flex-column", "align-items-start"); // For better icon stacking
      const timesortText = document.createElement("p");
      timesortText.classList.add("mb-1");
      timesortText.innerHTML = timesort || 'N/A';
      timesortDiv.appendChild(timesortText);

      const iconGroup = document.createElement("div"); // Group icons for better layout
      iconGroup.classList.add("mt-1");

      if (files && files.length > 0) {
        const paperClipIcon = document.createElement("button");
        paperClipIcon.classList.add(
          "btn",
          "btn-outline-primary",
          "btn-sm",
          "m-1" // Bootstrap 5 margin end
        );
        paperClipIcon.innerHTML = `<i class="fas fa-paperclip"></i>`;
        paperClipIcon.setAttribute('data-bs-toggle', 'tooltip');
        paperClipIcon.setAttribute('data-bs-placement', 'top');
        paperClipIcon.setAttribute('title', 'View Attachments');

        iconGroup.appendChild(paperClipIcon);
        new bootstrap.Tooltip(paperClipIcon); // Initialize tooltip

        paperClipIcon.addEventListener("click", () =>
          handlePaperClipIconClick(files)
        );
      }

      if (order_note) {
        const notesIcon = document.createElement("button");
        notesIcon.classList.add(
          "btn",
          "btn-outline-secondary", // Changed color for differentiation
          "btn-sm",
          "m-1"
        );
        notesIcon.innerHTML = `<i class="fas fa-sticky-note"></i>`;
        notesIcon.type = "button";
        notesIcon.setAttribute("data-bs-toggle", "popover");
        notesIcon.setAttribute("data-bs-placement", "right");
        notesIcon.setAttribute("data-bs-trigger", "hover focus");
        notesIcon.setAttribute("data-bs-content", order_note);
        iconGroup.appendChild(notesIcon);

        new bootstrap.Popover(notesIcon); // Initialize Popover

        notesIcon.addEventListener("click", () => {
          copyTextToClipboard(order_note);
        });
      }

      if (tracking && tracking.length > 0 && tracking[0]) { // Check tracking[0] exists
        const currentTracking = tracking[0];
        const trackingNumberVal = currentTracking.tracking_number || null;
        const trackingIDVal = currentTracking.tracking_id || null;
        const color = trackingNumberVal
          ? trackingIDVal
            ? "success"
            : "warning"
          : "danger";

        const envelopeIcon = document.createElement("button");
        envelopeIcon.classList.add(
          "btn",
          `btn-outline-${color}`,
          "btn-sm"
        );
        envelopeIcon.innerHTML = `<i class="fas fa-shipping-fast"></i>`; // Changed icon
        envelopeIcon.type = "button";
        envelopeIcon.setAttribute('data-bs-toggle', 'tooltip');
        envelopeIcon.setAttribute('data-bs-placement', 'top');
        envelopeIcon.setAttribute('title', 'Tracking Info');
        iconGroup.appendChild(envelopeIcon);
        new bootstrap.Tooltip(envelopeIcon);


        envelopeIcon.addEventListener("click", () => {
          const modalTitle = document.getElementById("trackingModalTitle");
          const modalBody = document.getElementById("trackingModalBody");
          const createTrackingBtn = document.getElementById("createTrackingBtn");
          const deleteTrackingBtn = document.getElementById("deleteTrackingBtn");

          modalTitle.textContent = `Tracking for Order ${order_id}`;
          modalBody.innerHTML = `
            <p><strong>Tracking Number:</strong> ${trackingNumberVal || "Not available"}</p>
            <p><strong>Internal Tracking ID:</strong> ${trackingIDVal || "Not set"}</p>
            <p><strong>DB Record ID:</strong> ${currentTracking.id || "N/A"}</p>
          `;

          createTrackingBtn.classList.toggle("d-none", !!trackingIDVal); // Show if trackingID is null/empty
          deleteTrackingBtn.classList.toggle("d-none", !currentTracking.id); // Show if there's a tracking record ID

          const trackingModal = new bootstrap.Modal(document.getElementById("trackingModal"));
          trackingModal.show();

          // Ensure event listeners are not duplicated if modal is reused
          createTrackingBtn.onclick = null; // Clear previous listener
          createTrackingBtn.onclick = async () => {
            if (!trackingNumberVal) {
                Alert.showErrorMessage("Cannot create tracking without a tracking number.");
                return;
            }
            try {
              toggleSpinner(true);
              const createTrackingResult = await AftershipAPIController.createTracking(
                order, // Pass the full order object
                aftershipApiHost,
                trackingNumberVal
              );
              toggleSpinner(false);

              if (createTrackingResult.success && createTrackingResult.data && createTrackingResult.data.id) {
                const updateResult = await DataController.updateByKey(
                  "tracking",
                  "id", // Assuming 'id' is the PK of your tracking table
                  currentTracking.id,
                  "tracking_id",
                  createTrackingResult.data.id
                );

                if (updateResult.status) {
                  trackingModal.hide();
                  Alert.showSuccessMessage("Tracking created and updated successfully!");
                  await generateTable(parseInt(limitDropdown.innerText, 10), page); // Refresh table
                } else {
                  Alert.showErrorMessage("Failed to update tracking ID in database. " + (updateResult.message || ""));
                }
              } else {
                 Alert.showErrorMessage("Aftership tracking creation failed. " + (createTrackingResult.message || "Unknown error from Aftership."));
              }
            } catch (error) {
              toggleSpinner(false);
              console.error("Error creating tracking:", error);
              Alert.showErrorMessage("An error occurred: " + (error.response?.data?.message || error.message));
            }
          };

          deleteTrackingBtn.onclick = null; // Clear previous listener
          deleteTrackingBtn.onclick = async () => {
            const confirmDelete = await Alert.showConfirmModal("Are you sure you want to delete this tracking record?");
            if (!confirmDelete.isConfirmed) return;
            try {
              toggleSpinner(true);
              const res = await DataController._delete("tracking", "id", currentTracking.id);
              toggleSpinner(false);
              if (res.status) {
                trackingModal.hide();
                Alert.showSuccessMessage("Tracking deleted successfully");
                await generateTable(parseInt(limitDropdown.innerText, 10), page); // Refresh table
              } else {
                Alert.showErrorMessage("Delete tracking failed. " + (res.message || ""));
              }
            } catch (error) {
              toggleSpinner(false);
              console.error("Error deleting tracking:", error);
              Alert.showErrorMessage("An error occurred during tracking deletion: " + (error.response?.data?.message || error.message));
            }
          };
        });
      }
      timesortDiv.appendChild(iconGroup);


      // ----- Row Assembly -----
      const row = tableBody.insertRow(); // Use insertRow for direct manipulation

      row.appendChild(Cell.createElementCell(checkboxInput, false, items.length, ["th"]));
      row.appendChild(Cell.createElementCell(linkDetails, false, items.length, false));
      row.appendChild(Cell.createElementCell(timesortDiv, false, items.length));
      row.appendChild(Cell.createElementCell(buyerNameSpan, false, items.length, false));
      row.appendChild(Cell.createSpanCell(items[0]?.report_product_name || 'N/A', false, false)); // Check items[0]
      row.appendChild(Cell.createSpanCell(website_name || 'N/A', false, items.length));
      row.appendChild(Cell.createSpanCell(all_total !== undefined ? all_total.toFixed(2) : 'N/A', false, items.length));
      row.appendChild(Cell.createSpanCell(currency_code || 'N/A', false, items.length));
      row.appendChild(
        Cell.createSelectOnModalCell(
          "Order Status",
          dropdownData.order_status, // Use the renamed variable
          order_id,
          "order_status_id",
          order_status,
          false,
          items.length
        )
      );
      // NEW: Add Tracking Number Cell
      const trackingDisplay = (tracking && tracking.length > 0 && tracking[0]?.tracking_number)
                              ? tracking[0].tracking_number
                              : 'N/A';
      row.appendChild(Cell.createSpanCell(trackingDisplay, false, items.length));

      // Handle additional items
      /* items.slice(1).forEach(item => {
        const itemRow = tableBody.insertRow();
        // Add empty cells for columns before "Report Product Name"
        for (let i = 0; i < 4; i++) { // Number of merged cells before product name
          itemRow.insertCell();
        }
        itemRow.appendChild(Cell.createSpanCell(item.report_product_name || 'N/A'));
        // Add empty cells for columns after "Report Product Name" up to the end
        for (let i = 0; i < 5; i++) { // Number of merged cells after product name (Channel to Tracking#)
            itemRow.insertCell();
        }
      }); */
      items.slice(1).forEach((item) => {
        const itemRow = document.createElement("tr");
        /* itemRow.innerHTML =
                    `<td>${item.report_product_name}</td>`; */
        itemRow.appendChild(Cell.createSpanCell(item.report_product_name));
        tableBody.appendChild(itemRow);
      });
    });

    tableElement.appendChild(tableBody);
    orderDataContainer.appendChild(tableElement);

    const startRecord = totalCount > 0 ? limit * (page - 1) + 1 : 0;
    const endRecord = Math.min(limit * page, totalCount);
    dropdownTitle.innerText = `Showing ${startRecord}-${endRecord} of ${totalCount} records`;

    Pagination.updatePagination(page, totalPages, "pagination1", generateTable);
    Pagination.updatePagination(page, totalPages, "pagination2", generateTable);

    const selectedAllCheckbox = document.getElementById("allItems");
    const inputCheckboxes = document.querySelectorAll('input[name="items"]'); // Corrected selector

    if (selectedAllCheckbox) {
        selectedAllCheckbox.addEventListener("change", function () {
          inputCheckboxes.forEach((checkbox) => {
            checkbox.checked = this.checked;
            // updateCheckBoxList should be called for each, or after loop if it processes all
          });
          updateCheckBoxList(); // Call once after all changes
        });
    }


    inputCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        // const timesort = this.value; // timesort is not directly used by updateCheckBoxList anymore
        updateCheckBoxList(); // Call after a single checkbox change
        if (selectedAllCheckbox) { // Update "Select All" checkbox state
            selectedAllCheckbox.checked = Array.from(inputCheckboxes).every(cb => cb.checked);
        }
      });
    });
    updateButtonStates(); // Enable/disable buttons based on selection

  } catch (error) {
    console.error("Error in generateTable:", error);
    Alert.showErrorMessage("An unexpected error occurred while generating the table. " + error.message);
    document.getElementById("order-data-container").innerHTML = `<div class="alert alert-danger">Error displaying orders. Please try again.</div>`;
  } finally {
    toggleSpinner(false);
    // Initialize any new tooltips if not done elsewhere
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  }
}

function generateDropdown(data) { // Renamed param to 'data'
  try {
    const websiteDropdown = document.getElementById("website-dropdown");
    const orderStatusDropdown = document.getElementById("order-status-dropdown");
    const paymentDropdown = document.getElementById("payment-dropdown");
    const selectedWebsite = document.getElementById("selected-website");
    const selectedOrderStatus = document.getElementById("selected-order-status");
    // const selectedFulfillmentStatus = document.getElementById("selected-fulfillment-status"); // Not in HTML
    const selectedPayment = document.getElementById("selected-payment");
    const dateInputStart = document.getElementById("order-date-input-start");
    const dateInputEnd = document.getElementById("order-date-input-end");

    // Clear existing options
    websiteDropdown.innerHTML = "";
    orderStatusDropdown.innerHTML = "";
    paymentDropdown.innerHTML = "";

    // Add "All" option first
    appendDropdownList(selectedWebsite, websiteDropdown, { name: "All", id: "All" }, "website-filter");
    appendDropdownList(selectedOrderStatus, orderStatusDropdown, { name: "All", id: "All" }, "order-filter");
    appendDropdownList(selectedPayment, paymentDropdown, { name: "All", id: "All" }, "payment-filter");

    if (data && data.websites) {
        data.websites.forEach((website) => { // Assuming website is an object {id: val, name: display} or just a name string
            appendDropdownList(selectedWebsite, websiteDropdown, website, "website-filter");
        });
    }
    if (data && data.order_status) {
        data.order_status.forEach((status) => { // Assuming status is an object {id: val, name: display}
            appendDropdownList(selectedOrderStatus, orderStatusDropdown, status, "order-filter");
        });
    }
    if (data && data.payment_methods) {
        data.payment_methods.forEach((method) => { // Assuming method is an object {id: val, name: display} or just a name string
            appendDropdownList(selectedPayment, paymentDropdown, method, "payment-filter");
        });
    }

    // Date change listeners
    const dateRangeCheckbox = document.getElementById("daterange-filter");
    if (dateInputStart && dateRangeCheckbox) {
        dateInputStart.addEventListener("change", () => {
            dateRangeCheckbox.checked = true;
        });
    }
    if (dateInputEnd && dateRangeCheckbox) {
        dateInputEnd.addEventListener("change", () => {
            dateRangeCheckbox.checked = true;
        });
    }
  } catch (error) {
    console.error("Error generating dropdowns:", error);
    Alert.showErrorMessage("Could not populate filter dropdowns.");
  }
}

function appendDropdownList(button, dropdown, dataItem, checkboxId) {
  const list = document.createElement("li");
  const option = document.createElement("a");
  option.classList.add("dropdown-item");

  // Handle if dataItem is a string or an object
  const value = typeof dataItem === 'object' ? (dataItem.id || dataItem.name) : dataItem;
  const textContent = typeof dataItem === 'object' ? dataItem.name : dataItem;

  option.setAttribute("data-value", value);
  option.textContent = textContent;
  option.href = "#"; // Required for <a> to be clickable like a button

  option.addEventListener("click", function (event) {
    event.preventDefault();
    const selectedValue = this.getAttribute("data-value");
    const selectedContent = this.textContent;
    button.textContent = selectedContent;
    button.setAttribute("data-value", selectedValue); // Store actual value if different from text
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.checked = true;
  });
  list.appendChild(option);
  dropdown.appendChild(list);
}

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = loading ? "block" : "none"; // Use block for fixed-top
  }
}

// toggleDatePicker function is not used, can be removed if not planned
// function toggleDatePicker(inputId) { ... }

function generateFileListContent(files) {
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("file-list-container", "container-fluid"); // Use container-fluid for full width

  const fileListScrollContainer = document.createElement("div");
  fileListScrollContainer.classList.add(
    "file-list-scroll",
    "d-flex",
    "flex-wrap", // Allow wrapping for many files
    "overflow-auto"
  );
  fileListScrollContainer.style.gap = "1rem"; // Add some gap between items

  if (!files || files.length === 0) {
    contentContainer.innerHTML = "<p class='text-center text-muted'>No files attached.</p>";
    return contentContainer;
  }

  files.forEach((file) => {
    if (!file || !file.file_name || !file.file_pathname) {
        console.warn("Skipping malformed file object:", file);
        return;
    }
    const fileItem = document.createElement("div");
    fileItem.classList.add("file-item", "p-2", "text-center", "border", "rounded");
    fileItem.style.width = "180px"; // Fixed width for consistency

    if (isImageFile(file.file_name)) {
      const imageElement = document.createElement("img");
      imageElement.src = file.file_pathname;
      imageElement.alt = file.file_name;
      imageElement.classList.add("img-fluid", "mb-2", "rounded");
      imageElement.style.maxHeight = "100px"; // Limit image height
      imageElement.onerror = () => { // Basic error handling for images
        imageElement.alt = "Image not found";
      };
      fileItem.appendChild(imageElement);
    } else if (isViewableFile(file.file_name)) { // Changed to isViewableFile
      const iconElement = document.createElement("i");
      iconElement.classList.add("fas", getFileIcon(file.file_name), "fa-3x", "mb-2", "text-secondary");
      fileItem.appendChild(iconElement);
    } else {
      const iconElement = document.createElement("i");
      iconElement.classList.add("fas", "fa-file", "fa-3x", "mb-2", "text-secondary"); // Generic file icon
      fileItem.appendChild(iconElement);
    }


    const fileNameElement = document.createElement("p");
    fileNameElement.textContent = file.file_name.length > 20 ? file.file_name.substring(0, 17) + "..." : file.file_name;
    fileNameElement.classList.add("mb-2", "small", "text-truncate");
    fileNameElement.title = file.file_name; // Show full name on hover
    fileItem.appendChild(fileNameElement);

    const downloadButton = document.createElement("button");
    downloadButton.classList.add("btn", "btn-primary", "btn-sm");
    downloadButton.innerHTML = `<i class="fas fa-download m-1"></i> Download`;
    downloadButton.type = "button";
    // downloadButton.id = `download-${file.file_name.toLowerCase().replace(/[^a-z0-9]/gi, '')}`; // Create a safer ID

    downloadButton.addEventListener("click", async () => {
      try {
        toggleSpinner(true);
        const result = await DataController.download(file.file_pathname);
        toggleSpinner(false);

        if (!result) {
            Alert.showErrorMessage("Download failed: No data received.");
            return;
        }

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(new Blob([result]));
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(link.href); // Clean up
        link.remove();

        Alert.showSuccessMessage("File download started!");
      } catch (error) {
        toggleSpinner(false);
        console.error("Download error:", error);
        Alert.showErrorMessage("File download failed! " + (error.message || ""));
      }
    });

    fileItem.appendChild(downloadButton);
    fileListScrollContainer.appendChild(fileItem);
  });

  contentContainer.appendChild(fileListScrollContainer);
  return contentContainer;
}

function getFileIcon(fileName) {
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (['.pdf'].includes(ext)) return 'fa-file-pdf';
    if (['.txt'].includes(ext)) return 'fa-file-alt';
    if (['.doc', '.docx'].includes(ext)) return 'fa-file-word';
    if (['.xls', '.xlsx'].includes(ext)) return 'fa-file-excel';
    return 'fa-file'; // Default icon
}


function handlePaperClipIconClick(files) {
  const modalContent = generateFileListContent(files);
  // Use the existing modal in HTML for file lists, if it exists.
  const fileListModalElement = document.getElementById('fileListModal');
  if (fileListModalElement) {
      const modalBody = fileListModalElement.querySelector('.modal-body');
      modalBody.innerHTML = ''; // Clear previous content
      modalBody.appendChild(modalContent);
      const bsModal = new bootstrap.Modal(fileListModalElement);
      bsModal.show();
  } else {
      // Fallback: create modal dynamically if not in HTML (though it is now)
      const modalElement = createModalElement("Attached Files", modalContent); // Pass title
      const bsModal = new bootstrap.Modal(modalElement);
      bsModal.show();
      modalElement.addEventListener('hidden.bs.modal', () => { // Clean up if dynamically created
          modalElement.remove();
      });
  }
}


function copyTextToClipboard(text) {
  if (!navigator.clipboard) { // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = 0;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const success = document.execCommand("copy");
      if (success) {
        Alert.showSuccessMessage("Note copied to clipboard (fallback).");
      } else {
        Alert.showErrorMessage("Failed to copy note (fallback).");
      }
    } catch (error) {
      console.error("Fallback copy error:", error);
      Alert.showErrorMessage("Error copying (fallback): " + error.message);
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    Alert.showSuccessMessage("Note copied to clipboard.");
  }).catch(err => {
    console.error("Clipboard API copy error:", err);
    Alert.showErrorMessage("Failed to copy note: " + err.message);
  });
}

function createModalElement(title, content) { // Added title parameter
  const modalId = `dynamicModal-${Date.now()}`; // Unique ID for multiple dynamic modals
  const modalElement = document.createElement("div");
  modalElement.classList.add("modal", "fade");
  modalElement.id = modalId;
  modalElement.tabIndex = -1;
  modalElement.setAttribute("aria-labelledby", `${modalId}Label`);
  modalElement.setAttribute("aria-hidden", "true");

  modalElement.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
            </div>
        </div>
    </div>
  `;

  const modalBody = modalElement.querySelector(".modal-body");
  modalBody.appendChild(content);
  document.body.appendChild(modalElement); // Append to body to make it work
  return modalElement;
}

function isImageFile(filename) {
  if (!filename) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"];
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return imageExtensions.includes(ext);
}

function isViewableFile(fileName) { // Renamed from isTxtFile for clarity
  if (!fileName) return false;
  const viewableExtensions = [".txt", ".pdf"]; // Add more as needed like .csv, .md
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return viewableExtensions.includes(ext);
}

function getFilterValues() {
  const searchInputValue = document.getElementById("search-order-input")?.value.trim() || "";
  const isSearchActive = document.getElementById("search-filter-active")?.checked && searchInputValue !== "";

  const filters = {
    search_term: { // NEW: Search term filter
      value: searchInputValue,
      include: isSearchActive
    },
    website: {
      value: document.getElementById("selected-website")?.textContent,
      include: document.getElementById("website-filter")?.checked || false,
    },
    date_start: { // date_start and date_end now only hold values
      value: document.getElementById("order-date-input-start")?.value,
      // include logic is handled by date_range
    },
    date_end: {
      value: document.getElementById("order-date-input-end")?.value,
      // include logic is handled by date_range
    },
    date_range: { // This holds the "include" for date range
        value: "daterange", // dummy value
        include: document.getElementById("daterange-filter")?.checked || false,
    },
    order_status: {
      value: document.getElementById("selected-order-status")?.getAttribute("data-value"),
      include: document.getElementById("order-filter")?.checked || false,
    },
    payment_method: {
      value: document.getElementById("selected-payment")?.textContent, // Or getAttribute('data-value') if it's more reliable
      include: document.getElementById("payment-filter")?.checked || false,
    },
  };
  return filters;
}


// Consolidated updateCheckBoxList and updateButtonStates
function updateCheckBoxList() {
    checkboxStates = [];
    const inputCheckboxes = document.querySelectorAll('input[name="items"]:checked');
    inputCheckboxes.forEach(checkbox => {
        checkboxStates.push(checkbox.value); // Assuming value is timesort
    });
    checkboxStates.sort((a, b) => a - b);
    updateButtonStates();
}

function updateButtonStates() {
    const hasSelection = checkboxStates.length > 0;
    const buttonsToToggle = [
        "downloadOrders", "createInvoices", "itemSummaries",
        "thpost", "downloadBarcodes", "deleteOrders",
        // "newDownloadOrders", "dhlPreAlerts", "dpost", "aftershipCSV" // Uncomment if these IDs exist
    ];

    buttonsToToggle.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !hasSelection;
        }
    });
}


// --- Event Handlers for Action Buttons (make them async) ---
const handleDownloadOrders = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders to download."); return; }
  await Downloader.generateOrderExcel2(orders, toggleSpinner, checkboxStates);
};

// const handleNewDownloadOrders = async (e) => { ... }; // If used

const handleCreateInvoice = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders to create invoices."); return; }
  const result = await Downloader.generateInvoiceExcel(orders, toggleSpinner, checkboxStates);
  if (result) {
    Alert.showSuccessMessage("Invoice generated successfully");
  } else {
    Alert.showErrorMessage("Invoice could not be generated");
  }
};

const handleItemSummary = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders for item summary."); return; }
  const result = await Downloader.generateItemSummaryExcel(orders, toggleSpinner, checkboxStates);
  if (result) {
    Alert.showSuccessMessage("Item summary generated successfully");
  } else {
    Alert.showErrorMessage("Item summary could not be generated");
  }
};

// const handleDhlPreAlert = async (e) => { ... }; // If used

// const handleDpost = async (e) => { ... }; // If used

const handleThpost = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders for TH Post processing."); return; }
  toggleSpinner(true);

  const results = [];
  let swalInstance;

  try {
    const selectedOrders = orders.filter((order) =>
      checkboxStates.includes(order.details.timesort.toString()) // Ensure comparison with string if values are strings
    );
    selectedOrders.sort((a, b) => a.details.timesort - b.details.timesort);

    if (selectedOrders.length === 0) {
        Alert.showWarningMessage("No valid orders selected for TH Post processing.");
        toggleSpinner(false);
        return;
    }

    const createTokenResultData = await ThaiPostAPIController.createToken(thaiPostApiHost);
    const createTokenResult = createTokenResultData.response; // Assuming response structure

    if (createTokenResult && createTokenResult.access_token) { // Check for access_token
      const filteredOrders = await filterOrdersWithBarcodes(selectedOrders);

      if (filteredOrders.length > 0) {
        swalInstance = Swal.fire({
          title: "Processing TH Post Orders",
          html: createResultsHTML(results), // Initial empty results
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          width: "800px",
        });

        for (const filteredOrder of filteredOrders) {
          const result = {
            timesort: filteredOrder.details.timesort,
            order_id: filteredOrder.details.order_id, // Add order_id for better tracking
            generateBarcodeResult: "pending",
            createTracking: "pending", // This seems to be Aftership tracking
            updateTracking: "pending", // This is DB update
            uploadResponse: "pending", // This is ThaiPost label PDF upload
          };
          results.push(result);
          if (swalInstance) Swal.update({ html: createResultsHTML(results) }); // Update Swal UI

          try {
            const generateBarcodeData = await ThaiPostAPIController.generateBarcode(
              filteredOrder,
              thaiPostApiHost,
              createTokenResult.access_token
            );
            const generateBarcodeResult = generateBarcodeData.response; // Assuming response structure

            if (generateBarcodeResult && generateBarcodeResult.fileUrl && generateBarcodeResult.listItemBarcode && generateBarcodeResult.listItemBarcode.length > 0) {
              result.generateBarcodeResult = "success";
              const barcodeNumber = generateBarcodeResult.listItemBarcode[0].barcode;

              // 1. Create Aftership Tracking (if applicable)
              const createAftershipTracking = await AftershipAPIController.createTracking(
                  filteredOrder,
                  aftershipApiHost,
                  barcodeNumber
              );
              result.createTracking = createAftershipTracking.success ? "success" : "failed";
              if (swalInstance) Swal.update({ html: createResultsHTML(results) });

              // 2. Insert/Update local tracking table
              const insertData = {
                  order_id: filteredOrder.details.order_id,
                  tracking_number: barcodeNumber,
                  tracking_id: createAftershipTracking.data?.id || null, // Aftership's ID
                  // Potentially add carrier info, etc.
              };
              // Check if tracking exists, then update, else insert
              const existingTracking = orders.find(o => o.details.order_id === filteredOrder.details.order_id)?.tracking[0];
              let dbTrackingUpdate;
              if(existingTracking && existingTracking.id) {
                dbTrackingUpdate = await DataController.update("tracking", "id", existingTracking.id, insertData);
              } else {
                dbTrackingUpdate = await DataController.insert("tracking", insertData);
              }

              result.updateTracking = dbTrackingUpdate.status ? "success" : "failed";
              if (swalInstance) Swal.update({ html: createResultsHTML(results) });

              // 3. Upload generated label PDF to our server
              const uploadResponse = await ThaiPostAPIController.uploadFile(
                generateBarcodeResult.fileUrl, // URL from ThaiPost
                filteredOrder.details.order_id // To name the file on our server
              );
              result.uploadResponse = uploadResponse.status ? "success" : "failed";

            } else {
              result.generateBarcodeResult = "failed";
              result.createTracking = "skipped";
              result.updateTracking = "skipped";
              result.uploadResponse = "skipped";
              console.error(`Barcode generation failed for ${filteredOrder.details.order_id}:`, generateBarcodeResult?.Message || 'No specific message');
            }
          } catch (innerError) {
            console.error(`Error processing order ${filteredOrder.details.order_id} in THPost loop:`, innerError.response?.data || innerError.message || innerError);
            result.generateBarcodeResult = result.generateBarcodeResult === 'pending' ? 'error' : result.generateBarcodeResult;
            result.createTracking = result.createTracking === 'pending' ? 'error' : result.createTracking;
            result.updateTracking = result.updateTracking === 'pending' ? 'error' : result.updateTracking;
            result.uploadResponse = result.uploadResponse === 'pending' ? 'error' : result.uploadResponse;
          } finally {
            if (swalInstance) Swal.update({ html: createResultsHTML(results) });
          }
        } // End of for loop

        await Swal.fire({
          title: "TH Post Processing Complete",
          html: createResultsHTML(results),
          icon: results.every(r => r.uploadResponse === 'success') ? "success" : "warning", // Adjust icon based on overall success
          showConfirmButton: true,
          confirmButtonText: "OK",
          width: "800px",
        }).then(async () => { // Added async here
          // Optionally download merged PDF of successfully generated labels
          const successfullyProcessedOrders = selectedOrders.filter(order =>
            results.find(r => r.order_id === order.details.order_id && r.uploadResponse === 'success')
          );
          if (successfullyProcessedOrders.length > 0) {
            await Downloader.generateMergedPDF(successfullyProcessedOrders); // Ensure this can handle the orders
          }
          await generateTable(parseInt(limitDropdown.innerText, 10), 1); // Refresh table
        });

      } else {
        Alert.showWarningMessage("No orders to process after filtering (barcodes might already exist or other pre-checks failed).");
      }
    } else {
      Alert.showErrorMessage("Failed to create ThaiPost API Token. " + (createTokenResultData?.message || createTokenResult?.Message || "Unknown token error."));
    }
  } catch (e) {
    console.error("Error in handleThpost:", e);
    Alert.showErrorMessage("An unexpected error occurred during TH Post processing. " + (e.response?.data?.Message || e.message));
    if (swalInstance) { // Ensure Swal is closed or updated on error
        Swal.update({ title: "Processing Error", html: "An error occurred. Please check console.", icon: "error", showConfirmButton: true });
    }
  } finally {
    toggleSpinner(false);
  }
};


// const handleAftershipCSV = async (e) => { ... }; // If used

const handleDownloadBarcodes = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders to download barcodes."); return; }

  const selectedOrders = orders.filter((order) =>
    checkboxStates.includes(order.details.timesort.toString())
  );

  if (selectedOrders.length === 0) {
    Alert.showErrorMessage("No orders selected or found for barcode download.");
    return;
  }
  // This assumes Downloader.generateMergedPDF looks for files already on the server based on order_id
  await Downloader.generateMergedPDF(selectedOrders);
};

const handleDeleteOrders = async (e) => {
  e.preventDefault();
  if (checkboxStates.length === 0) { Alert.showWarningMessage("Please select orders to delete."); return; }

  const confirmAlert = await Alert.showConfirmModal(
    `Are you sure you want to delete ${checkboxStates.length} selected order(s)? This action cannot be undone.`
  );

  if (!confirmAlert.isConfirmed) {
    return;
  }

  toggleSpinner(true);
  const swalQueue = Alert.createQueue(); // Assuming Alert.createQueue() returns a Swal mixin for queueing
  const results = []; // To track success/failure of deletions

  const selectedOrderIds = orders
    .filter(order => checkboxStates.includes(order.details.timesort.toString()))
    .map(order => order.details.order_id);

  if (selectedOrderIds.length === 0) {
    Alert.showWarningMessage("No matching orders found for deletion based on selection.");
    toggleSpinner(false);
    return;
  }

  for (const order_id of selectedOrderIds) {
    try {
      // It's usually better to delete related records (orders_skus, tracking, files) first or use DB cascades.
      // For simplicity here, just deleting from 'orders' and 'orders_skus'.
      const result1 = await DataController._delete("orders_skus", "order_id", order_id); // Delete children first
      const result2 = await DataController._delete("orders", "order_id", order_id);

      const orderResult = {
        order_id: order_id,
        status: result1.status && result2.status, // Overall success for this order
        message: result1.status && result2.status ? "Deleted successfully" : `Order SKUs: ${result1.message || result1.status}, Order: ${result2.message || result2.status}`
      };
      results.push(orderResult);

      await swalQueue.fire({ // Use await here to process one by one visually
        title: `Order ${order_id}: ${orderResult.status ? 'Deleted!' : 'Deletion Failed!'}`,
        text: orderResult.message,
        icon: orderResult.status ? "success" : "error",
        timer: orderResult.status ? 1500 : 3000, // Longer for errors
        showConfirmButton: !orderResult.status, // Show confirm only for errors to proceed
        confirmButtonText: "Next →",
        showCancelButton: false,
      });

    } catch (error) {
      console.error(`Failed to delete order ${order_id}:`, error);
      results.push({ order_id: order_id, status: false, message: error.message });
      await swalQueue.fire({
        title: `Error deleting order ${order_id}`,
        text: error.message,
        icon: "error",
        showConfirmButton: true,
        confirmButtonText: "Next →",
      });
    }
  }
  toggleSpinner(false);
  await generateTable(parseInt(limitDropdown.innerText, 10) || 200, 1); // Refresh table
  checkboxStates = []; // Clear selections
  updateButtonStates(); // Update button disabled states
};

// --- Event Listener Management ---
const eventListenersMap = new Map(); // Keep this as is

const removeAllEventListeners = () => { // Keep this as is
  const eventListeners = eventListenersMap.get("buttons");
  if (eventListeners) {
    eventListeners.forEach(({ element, type, listener }) => {
      if (element) {
        element.removeEventListener(type, listener);
      }
    });
  }
  eventListenersMap.set("buttons", []); // Clear the stored listeners
};

const addAllEventListeners = () => { // Keep this as is, ensure IDs match HTML
  removeAllEventListeners(); // Remove existing before adding new ones
  const buttonConfig = [
    { id: "downloadOrders", handler: handleDownloadOrders },
    // { id: "newDownloadOrders", handler: handleNewDownloadOrders },
    { id: "createInvoices", handler: handleCreateInvoice },
    { id: "itemSummaries", handler: handleItemSummary },
    // { id: "dhlPreAlerts", handler: handleDhlPreAlert },
    // { id: "dpost", handler: handleDpost },
    { id: "thpost", handler: handleThpost },
    // { id: "aftershipCSV", handler: handleAftershipCSV },
    { id: "downloadBarcodes", handler: handleDownloadBarcodes },
    { id: "deleteOrders", handler: handleDeleteOrders },
  ];

  const activeListeners = [];
  buttonConfig.forEach(config => {
    const element = document.getElementById(config.id);
    if (element) {
      element.addEventListener("click", config.handler);
      activeListeners.push({ element, type: "click", listener: config.handler });
    }
  });
  eventListenersMap.set("buttons", activeListeners);
};


const checkButtonPermission = async () => { // Make async
  const userString = localStorage.getItem("user");
  if (!userString) {
    console.warn("User data not found in localStorage.");
    // Potentially redirect to login or show limited UI
    await generateTable(200, 1); // Still generate table, but buttons might not appear
    return;
  }

  try {
    const userArray = JSON.parse(userString);
    // Assuming userArray is an array and the first element has permissions
    const user = userArray && userArray.length > 0 ? userArray[0] : null;

    if (user && user.permissions) {
      const response = await fetch("../../backend/lokin/check_permission_buttons.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: user.permissions }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const container = document.getElementById("permission-buttons-container");
      if (container) {
          container.innerHTML = html;
      } else {
          console.error("permission-buttons-container not found in DOM.");
      }
      addAllEventListeners(); // Add listeners AFTER buttons are in DOM
      updateButtonStates(); // Initial state for buttons (likely disabled)
    } else {
      console.warn("User permissions not found.");
      // Handle case where permissions are not available
      document.getElementById("permission-buttons-container").innerHTML = '<p class="text-danger">No permissions defined for user.</p>';
    }
  } catch (error) {
    console.error("Error checking button permissions or parsing user data:", error);
    document.getElementById("permission-buttons-container").innerHTML = '<p class="text-danger">Error loading action buttons.</p>';
  } finally {
    await generateTable(200, 1); // Generate table regardless of button permissions
  }
};


async function checkFileExists(fileUrl) {
  try {
    const response = await axios.head(fileUrl); // Use the passed fileUrl directly
    return response.status === 200; // True if 200 OK
  } catch (error) {
    // Axios throws error for non-2xx/3xx responses. 404 is an error.
    // console.warn(`File check for ${fileUrl}: ${error.message}`);
    return false;
  }
}

async function filterOrdersWithBarcodes(ordersToFilter) {
  const filteredOrders = [];
  const alertPromises = []; // To show alerts without blocking processing

  for (const order of ordersToFilter) {
    if (!order || !order.details || !order.details.order_id) {
        console.warn("Skipping order with missing details in filterOrdersWithBarcodes:", order);
        continue;
    }
    // Standardized file path. Ensure ThaiPostAPIController.uploadFile saves with this convention.
    const fileUrl = `../../files/labels/label-${order.details.order_id}.pdf`;
    const fileExists = await checkFileExists(fileUrl);

    if (!fileExists) {
      filteredOrders.push(order);
    } else {
      // Non-blocking alert.
      alertPromises.push(Alert.showInfoMessage(`Barcode PDF for order ${order.details.order_id} already exists. Skipped generation.`));
    }
  }
  await Promise.all(alertPromises); // Wait for all info alerts to be potentially shown (though they are fire-and-forget)
  return filteredOrders;
}

// updateSwalContent is not directly called, but integrated into handleThpost. Can be removed if not used elsewhere.
/*
const updateSwalContent = (swalInstance, results) => {
  if (swalInstance && swalInstance.isVisible()) { // Check if swal is visible
    Swal.update({ // Use Swal.update directly
      html: createResultsHTML(results),
    });
  }
};
*/

const createResultsHTML = (results) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "success": return '<i class="fas fa-check-circle text-success fa-fw"></i> Success';
      case "failed": return '<i class="fas fa-times-circle text-danger fa-fw"></i> Failed';
      case "pending": return '<i class="fas fa-spinner fa-spin text-primary fa-fw"></i> Pending';
      case "skipped": return '<i class="fas fa-minus-circle text-secondary fa-fw"></i> Skipped';
      case "error": return '<i class="fas fa-exclamation-triangle text-danger fa-fw"></i> Error';
      default: return '<i class="fas fa-question-circle text-warning fa-fw"></i> Unknown';
    }
  };

  let html = `
    <div class="table-responsive" style="max-height: 400px;">
        <table class="table table-striped table-bordered table-sm">
            <thead class="table-light sticky-top">
                <tr>
                    <th>Order ID</th>
                    <th>Timesort</th>
                    <th>Barcode Gen.</th>
                    <th>Aftership Track</th>
                    <th>DB Update</th>
                    <th>Label Upload</th>
                </tr>
            </thead>
            <tbody>
    `;

  if (results.length === 0) {
    html += `<tr><td colspan="6" class="text-center">No orders being processed yet...</td></tr>`;
  } else {
    results.forEach((result) => {
      html += `
          <tr>
              <td>${result.order_id || 'N/A'}</td>
              <td>${result.timesort || 'N/A'}</td>
              <td>${getStatusIcon(result.generateBarcodeResult)}</td>
              <td>${getStatusIcon(result.createTracking)}</td>
              <td>${getStatusIcon(result.updateTracking)}</td>
              <td>${getStatusIcon(result.uploadResponse)}</td>
          </tr>
          `;
    });
  }

  html += `
            </tbody>
        </table>
    </div>
    `;
  return html;
};

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    checkButtonPermission(); // This will also call generateTable
});