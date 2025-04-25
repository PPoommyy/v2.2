import { Pagination } from "../../components/Pagination.js";
import { Downloader } from "../../components/Downloader.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Cell } from "../../components/Cell.js";
import { Modal } from "../../components/Modal.js";
import { ThaiPostAPIController } from "../../components/ThaiPostAPIController.js";
import { AftershipAPIController } from "../../components/AftershipAPIController.js";
import { PODataController } from "../../components/PODataController.js";

let checkboxStates = [];
let po_orders = {};

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
      "po_orders",
      "po_order_id",
      id,
      key,
      value
    );
    if (result.status) {
      Cell.closeEditModal();
      Alert.showSuccessMessage("Update successful");
      generateTable(100, 1);
    } else {
      Alert.showErrorMessage("Update failed");
    }
  } else {
    Alert.showErrorMessage("Update failed");
  }
});

dropdownItems.forEach((item) => {
  item.addEventListener("click", function (event) {
    event.preventDefault();
    const selectedLimit = this.getAttribute("data-limit");
    limitDropdown.innerText = selectedLimit;
    generateTable(selectedLimit, 1);
  });
});

const filterButton = document.getElementById("filter-button");
filterButton.addEventListener("click", function () {
  generateTable(limitDropdown.innerText, 1);
});

const modal = document.getElementById("editModal");

function handlePaperClipIconClick(files) {
  const modalContent = generateFileListContent(files, 0); // Initialize with first file
  const modalElement = createModalElement(modalContent); // Create modal element with content

  // Open the modal using your custom Modal module
  Modal.openModal(modalElement);
}

async function generateTable(limit, page) {
  try {
    toggleSpinner(true);
    const filterValues = getFilterValues();
    po_orders = await PODataController.get_po_list(filterValues, limit, page);
    const factories = await PODataController.get_factory_list();
    const po_orders_status = await PODataController.get_po_order_status();
    generateDropdown(factories, po_orders_status);
    /* const totalCount = result.count;
    const totalPages = Math.ceil(totalCount / limit);
 */
    const poOrdersDataContainer = document.getElementById(
      "po-orders-data-container"
    );
    poOrdersDataContainer.innerHTML = "";
    checkboxStates = [];

    const tableElement = document.createElement("table");
    tableElement.classList.add(
      "table",
      "table-bordered",
      "table-striped",
      "table-hover",
      "table-condensed"
    );

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `
            <th>
                <input id="allItems" type="checkbox" name="Allitems" value="-1" data-toggle="tooltip" title="Select All"/>
            </th>
            <th>Detail</th>
            <th>Timesort</th>
            <th>Factory Name</th>
            <th>Report Product Name</th>
            <th>Order Status</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");

    po_orders.forEach((order) => {
      const { data, nested } = order;
      const { items, files } = nested;
      if (items.length === 0) return;

      const {
        po_order_id,
        po_order_date,
        timesort,
        total_amount,
        notes,
        factory_name,
        order_status,
      } = data;

      const tableRow = document.createElement("tr");

      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.name = "items";
      checkboxInput.value = timesort;

      const linkDetails = document.createElement("a");
      linkDetails.href = `po_order_details.php?po_order_id=${po_order_id}`;
      linkDetails.innerText = "View Detail";
      const timesortDiv = document.createElement("div");
      const timesortText = document.createElement("p");
      timesortText.innerHTML = timesort;
      timesortDiv.appendChild(timesortText);
      if (files && files.length > 0) {
        const paperClipIcon = document.createElement("button");
        paperClipIcon.classList.add(
          "btn",
          "btn-outline-primary",
          "btn-sm",
          "fa-solid",
          "fa-paperclip",
          "me-1"
        );
        timesortDiv.appendChild(paperClipIcon);

        // Add click event listener to paperClipIcon button
        paperClipIcon.addEventListener("click", () =>
          handlePaperClipIconClick(files)
        );
      }
      tableRow.appendChild(
        Cell.createElementCell(checkboxInput, false, items.length, ["th"])
      );
      tableRow.appendChild(
        Cell.createElementCell(linkDetails, false, items.length, false)
      );
      tableRow.appendChild(
        Cell.createElementCell(timesortDiv, false, items.length)
      );
      tableRow.appendChild(
        Cell.createSpanCell(factory_name, false, items.length, false)
      );
      tableRow.appendChild(
        Cell.createSpanCell(items[0].report_product_name, false, false, [
          "d-flex",
          "align-items-center",
          "gap-3",
        ])
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Order Status",
          po_orders_status,
          po_order_id,
          "po_order_status_id",
          order_status
        )
      );

      tableBody.appendChild(tableRow);

      items.slice(1).forEach((item) => {
        const { report_product_name } = item;

        const itemRow = document.createElement("tr");

        const productNameSpan = document.createElement("span");
        productNameSpan.innerText = report_product_name;

        itemRow.appendChild(
          Cell.createSpanCell(report_product_name, false, false, [
            "d-flex",
            "align-items-center",
            "gap-3",
          ])
        );
        tableBody.appendChild(itemRow);
      });
    });

    tableElement.appendChild(tableBody);
    poOrdersDataContainer.appendChild(tableElement);

    const selectedAllCheckbox = document.getElementById("allItems");
    const inputCheckbox = document.querySelectorAll('input[name="items"]');
    selectedAllCheckbox.addEventListener("change", function () {
      inputCheckbox.forEach((checkbox) => {
        const timesort = checkbox.value;
        updateCheckBoxList(timesort);
        checkbox.checked = this.checked;
      });
    });

    inputCheckbox.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const timesort = this.value;
        updateCheckBoxList(timesort);
      });
    });
  } catch (error) {
    console.error(error);
  } finally {
    toggleSpinner(false);
  }
}

async function generateDropdown(factories, po_orders_status) {
  try {
    const factoryDropdown = document.getElementById("factory-dropdown");
    const orderStatusDropdown = document.getElementById(
      "order-status-dropdown"
    );
    const paymentStatusDropdown = document.getElementById(
      "payment-status-dropdown"
    );
    const selectedFactory = document.getElementById("selected-factory");
    const selectedOrderStatus = document.getElementById(
      "selected-order-status"
    );
    const selectedPaymentStatus = document.getElementById(
      "selected-payment-status"
    );
    const dateInputStart = document.getElementById("order-date-input-start");
    const dateInputEnd = document.getElementById("order-date-input-end");

    factoryDropdown.innerHTML = "";
    orderStatusDropdown.innerHTML = "";
    paymentStatusDropdown.innerHTML = "";
    appendDropdownList(
      selectedFactory,
      factoryDropdown,
      "All",
      "factory-filter"
    );
    appendDropdownList(
      selectedOrderStatus,
      orderStatusDropdown,
      "All",
      "order-filter"
    );
    appendDropdownList(
      selectedPaymentStatus,
      paymentStatusDropdown,
      "All",
      "payment-filter"
    );
    factories.forEach((factoryName) => {
      appendDropdownList(
        selectedFactory,
        factoryDropdown,
        factoryName,
        "factory-filter"
      );
    });
    po_orders_status.forEach((orderStatusName) => {
      appendDropdownList(
        selectedOrderStatus,
        orderStatusDropdown,
        orderStatusName,
        "order-filter"
      );
    });

    dateInputStart.addEventListener("change", () => {
      const checkbox = document.getElementById("daterange-filter");
      checkbox.checked = true;
    });
    dateInputEnd.addEventListener("change", () => {
      const checkbox = document.getElementById("daterange-filter");
      checkbox.checked = true;
    });
  } catch (error) {
    console.error(error);
  }
}

function appendDropdownList(button, dropdown, data, checkboxId) {
  const list = document.createElement("li");
  const option = document.createElement("a");
  option.classList.add("dropdown-item");
  option.setAttribute(
    "data-value",
    data.id ? data.id : data.name ? data.name : data
  );
  option.textContent = data.name;
  option.addEventListener("click", function (event) {
    event.preventDefault();
    const selectedValue = this.getAttribute("data-value");
    const selectedContent = this.textContent;
    button.textContent = selectedContent;
    button.setAttribute("data-value", selectedValue);
    const checkbox = document.getElementById(checkboxId);
    checkbox.checked = true;
  });
  list.appendChild(option);
  dropdown.appendChild(list);
}

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

function toggleDatePicker(inputId) {
  var inputElement = document.getElementById(inputId);
  inputElement.click();
}

function generateFileListContent(files) {
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("file-list-container", "container"); // Add Bootstrap container class

  const fileListContainer = document.createElement("div");
  fileListContainer.classList.add(
    "file-list-scroll",
    "d-flex",
    "overflow-auto"
  ); // Add Bootstrap flexbox and wrap

  files.forEach((file) => {
    const fileItem = document.createElement("div");
    fileItem.classList.add("file-item", "p-2", "text-center"); // Add padding and centering
    if (isImageFile(file.file_name)) {
      const imageElement = document.createElement("img");
      imageElement.src = file.file_pathname;
      imageElement.alt = file.file_name;
      imageElement.classList.add("img-fluid", "mb-2"); // Use Bootstrap img-fluid class for responsive images
      fileItem.appendChild(imageElement);
    } else if (isTxtFile(file.file_name)) {
      const iframeElement = document.createElement("iframe");
      iframeElement.src = file.file_pathname;
      iframeElement.width = "100%"; // Use Bootstrap width class for responsiveness
      iframeElement.classList.add("border", "p-2", "mb-2"); // Add border, padding, and margin
      fileItem.appendChild(iframeElement);
    }

    const fileNameElement = document.createElement("p");
    fileNameElement.textContent = file.file_name;
    fileNameElement.classList.add("mb-2"); // Add margin-bottom
    fileItem.appendChild(fileNameElement);

    const downloadButton = document.createElement("button");
    downloadButton.classList.add("btn", "btn-primary");
    downloadButton.innerText = "Download";
    downloadButton.type = "button";
    downloadButton.id = file.file_name.toLowerCase();
    downloadButton.for = file.file_name.toLowerCase();
    downloadButton.addEventListener("click", async () => {
      try {
        const result = await DataController.download(file.file_pathname);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = file.file_name;
        link.click();
        Alert.showSuccessMessage("Download file successfully!");
      } catch (error) {
        Alert.showErrorMessage("File Downloaded failed!");
      }
    });

    fileItem.appendChild(downloadButton);

    fileListContainer.appendChild(fileItem);
  });

  contentContainer.appendChild(fileListContainer);

  return contentContainer;
}

function createModalElement(content) {
  const modalElement = document.createElement("div");
  modalElement.classList.add("modal", "fade"); // Add modal classes
  modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg"> <!-- Use modal-lg for large modal -->
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">File List</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;"> <!-- Inline style for scrolling -->
                    ${content.innerHTML} <!-- Insert content into modal body -->
                </div>
            </div>
        </div>
    `;
  return modalElement;
}

function isImageFile(filename) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
  const ext = filename.split(".").pop().toLowerCase();

  return imageExtensions.includes("." + ext);
}

function isTxtFile(fileName) {
  const txtExtensions = [".txt", ".pdf"];
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return txtExtensions.includes(ext);
}

function getFilterValues() {
  const filters = {
    date_start: {
      value: document.getElementById("order-date-input-start").value,
      include: document.getElementById("daterange-filter").checked,
    },
    date_end: {
      value: document.getElementById("order-date-input-end").value,
      include: document.getElementById("daterange-filter").checked,
    },
    factory: {
      value: document
        .getElementById("selected-factory")
        .getAttribute("data-value"),
      include: document.getElementById("factory-filter").checked,
    },
    order_status: {
      value: document
        .getElementById("selected-order-status")
        .getAttribute("data-value"),
      include: document.getElementById("order-filter").checked,
    },
    payment_status: {
      value: document.getElementById("selected-payment-status").textContent,
      include: document.getElementById("payment-filter").checked,
    },
  };

  return filters;
}

function updateCheckBoxList(key) {
  const index = checkboxStates.indexOf(key);
  const deleteOrdersButton = document.getElementById("deleteOrders");

  if (index === -1) {
    checkboxStates.push(key);
  } else {
    checkboxStates.splice(index, 1);
  }

  checkboxStates.sort((a, b) => a - b);
  if (checkboxStates.length > 0) {
    // downloadOrdersButton.removeAttribute('disabled');
    deleteOrdersButton.removeAttribute("disabled");
  } else {
    // downloadOrdersButton.setAttribute('disabled', '');
    deleteOrdersButton.setAttribute("disabled", "");
  }
}

const handleDeleteOrders = async (e) => {
  e.preventDefault();
  const confirmAlert = await Alert.showConfirmModal(
    "Are you sure you want to delete po_orders?"
  );
  const swalQueue = Alert.createQueue();
  const results = [];

  if (!confirmAlert.isConfirmed) {
    return;
  }

  const selectedOrders = [];

  po_orders.forEach((po_order) => {
    const { timesort } = po_order.data;
    if (checkboxStates.includes(timesort)) {
      selectedOrders.push(po_order);
    }
  });

  for (let index = 0; index < selectedOrders.length; index++) {
    const po_order = selectedOrders[index];
    const { po_order_id } = po_order.data;
    try {
      const result1 = await DataController._delete(
        "po_orders",
        "po_order_id",
        po_order_id
      );
      const result2 = await DataController._delete(
        "po_orders_items",
        "po_order_id",
        po_order_id
      );
      const orderResult = {
        po_orders: result1.status,
        po_orders_items: result2.status,
      };
      results.push(orderResult);
      if (result1.status && result2.status) {
        const confirmed = await swalQueue.fire({
          title: `Order ${po_order_id} deleted successfully!`,
          icon: "success",
          timer: 1500,
          showCancelButton: false,
        });
      } else {
        const confirmed = await swalQueue.fire({
          title: `Failed to delete order ${po_order_id}`,
          icon: "error",
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: "Next &rarr;",
        });

        if (!confirmed.isConfirmed) {
          break;
        }
      }
    } catch (error) {
      const confirmed = await swalQueue.fire({
        title: `Failed to delete order ${po_order_id}`,
        icon: "error",
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: "Next &rarr;",
      });

      if (!confirmed.isConfirmed) {
        break;
      }
    }
  }
  generateTable(100, 1);
};

const eventListenersMap = new Map();

const removeAllEventListeners = () => {
  const eventListeners = eventListenersMap.get("buttons");
  if (eventListeners) {
    eventListeners.forEach(({ element, type, listener }) => {
      if (element) {
        element.removeEventListener(type, listener);
      }
    });
  }
  eventListenersMap.set("buttons", []);
};

const addAllEventListeners = () => {
  const deleteOrders = document.getElementById("deleteOrders");
  const eventListeners = [
    { element: deleteOrders, type: "click", listener: handleDeleteOrders },
  ];
  const activeListeners = [];

  eventListeners.forEach(({ element, type, listener }) => {
    if (element) {
      element.addEventListener(type, listener, false);
      activeListeners.push({ element, type, listener });
    }
  });

  eventListenersMap.set("buttons", activeListeners);
};

const checkButtonPermission = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    fetch("../../backend/lokin/check_permission_buttons.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: user[0].permissions,
        page: "po_order_list",
      }),
    })
      .then((res) => res.text())
      .then((html) => {
        document.getElementById("permission-buttons-container").innerHTML =
          html;
        removeAllEventListeners();
        addAllEventListeners();
        generateTable(100, 1);
      });
  }
};

checkButtonPermission();
