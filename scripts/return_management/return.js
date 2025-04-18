import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";

const eventListenersMap = new Map();

const get_requests = async (table, limit, page) => {
  try {
    const column = [
      "*",
      "requests.id as request_id",
      "request_status.name as request_status",
      "request_type.name as request_type",
    ];
    const join = [
      ["request_status", "request_status.id", "requests.request_status_id"],
      ["request_type", "request_type.id", "requests.request_type_id"],
    ];
    const filterValues = getFilterValues();
    const where = [];

    // order_date BETWEEN order_date_start AND order_date_end
    if (
      filterValues.order_date_start.include &&
      filterValues.order_date_end.include
    ) {
      where.push([
        "order_date",
        "BETWEEN",
        [
          filterValues.order_date_start.value,
          filterValues.order_date_end.value,
        ],
      ]);
    }

    // request_date BETWEEN request_date_start AND request_date_end
    if (
      filterValues.request_date_start.include &&
      filterValues.request_date_end.include
    ) {
      where.push([
        "request_date",
        "BETWEEN",
        [
          filterValues.request_date_start.value,
          filterValues.request_date_end.value,
        ],
      ]);
    }

    // request_status_id = request_status_id
    if (filterValues.request_status_id.include) {
      where.push([
        "request_status_id",
        "=",
        parseInt(filterValues.request_status_id.value),
      ]);
    }

    // request_type_id = request_type_id
    if (filterValues.request_type_id.include) {
      where.push([
        "request_type_id",
        "=",
        parseInt(filterValues.request_type_id.value),
      ]);
    }

    const response = await DataController.select(
      table,
      column,
      "request_date",
      limit,
      page,
      join,
      where
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const get_request_status = async () => {
  try {
    const response = DataController.select(
      "request_status",
      ["*"],
      "id",
      100,
      0
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const get_request_type = async () => {
  try {
    const response = DataController.select("request_type", ["*"], "id", 100, 0);
    return response;
  } catch (error) {
    throw error;
  }
};

const get_request_products_by_request_id = async (request_id) => {
  try {
    const column = ["sku_settings_id", "quantity_purchased"];
    const join = [
      ["orders", "requests.order_number", "orders.timesort"],
      ["orders_skus", "orders.order_id", "orders_skus.order_id"],
    ];
    const where = [["requests.id", "=", request_id]];
    const response = DataController.select(
      "requests",
      column,
      "id",
      100,
      0,
      join,
      where
    );
    return response;
  } catch (error) {
    throw error;
  }
};

function formatDateTimeWithSeconds(dateString) {
  if (!dateString) return "";
  return dateString.replace("T", " ") + ":00";
}

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

const handleDeleteRequest = async (e, requests, checkboxStates) => {
  e.preventDefault();
  const confirmAlert = await Alert.showConfirmModal(
    "Are you sure you want to delete request?"
  );

  const swalQueue = Alert.createQueue();
  const results = [];

  if (!confirmAlert.isConfirmed) {
    return;
  }

  const selectedRequests = [];

  requests.forEach((request) => {
    const { request_id } = request;
    if (checkboxStates.includes(request_id)) {
      selectedRequests.push(request);
    }
  });

  for (let index = 0; index < selectedRequests.length; index++) {
    const request = selectedRequests[index];
    const { request_id } = request;
    try {
      const result1 = await DataController._delete(
        "requests",
        "id",
        request_id
      );
      const requestResult = {
        requests: result1.status,
      };
      results.push(requestResult);
      if (result1.status) {
        const confirmed = await swalQueue.fire({
          title: `Request ${request_id} deleted successfully!`,
          icon: "success",
          timer: 1500,
          showCancelButton: false,
        });
      } else {
        const confirmed = await swalQueue.fire({
          title: `Failed to delete request ${request_id}`,
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
        title: `Failed to delete request ${request_id}`,
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
  generateTable("requests", 100, 0);
};

const handleUpdateRequestStatus = async (
  e,
  requests,
  checkboxStates,
  status
) => {
  e.preventDefault();

  const confirmAlert = await Alert.showConfirmModal(
    "Are you sure you item accepted?"
  );
  if (!confirmAlert.isConfirmed) return;

  const swalQueue = Alert.createQueue();
  const selectedRequests = requests.filter((req) =>
    checkboxStates.includes(req.request_id)
  );
  const results = [];

  for (const request of selectedRequests) {
    const { request_id } = request;
    try {
      const request_products = await get_request_products_by_request_id(
        request_id
      );

      if (status === "accepted") {
        for (const item of request_products.status) {
          const to_insert = {
            sku_settings_id: item.sku_settings_id,
            quantity: item.quantity_purchased,
            remaining_quantity: item.quantity_purchased,
          };
          await DataController.insert("stock", to_insert);
        }
      } else if (status === "damaged") {
        await DataController.updateByKey(
          "requests",
          "id",
          request_id,
          "note",
          "item damaged"
        );
      }

      const updateResult = await DataController.updateByKey(
        "requests",
        "id",
        request_id,
        "request_status_id",
        2
      );
      results.push({ requests: updateResult.status });

      const alertConfig = updateResult.status
        ? {
            title: `Request ${request_id} update stock successfully!`,
            icon: "success",
            timer: 1500,
          }
        : {
            title: `Failed to update stock for request ${request_id}`,
            icon: "error",
            showConfirmButton: true,
            confirmButtonText: "Next →",
          };

      const confirmed = await swalQueue.fire(alertConfig);
      if (!updateResult.status && !confirmed.isConfirmed) break;
    } catch (error) {
      const confirmed = await swalQueue.fire({
        title: `Failed to update stock for request ${request_id}`,
        icon: "error",
        showConfirmButton: true,
        confirmButtonText: "Next →",
      });
      if (!confirmed.isConfirmed) break;
    }
  }

  generateTable("requests", 100, 0);
};

function updateCheckBoxList(key, checkboxStates) {
  const index = checkboxStates.indexOf(key);
  const acceptItemButton = document.getElementById("itemAccepted");
  const damagedItemButton = document.getElementById("itemDamaged");
  const deleteRequestedButton = document.getElementById("deleteRequest");
  if (index === -1) {
    checkboxStates.push(key);
  } else {
    checkboxStates.splice(index, 1);
  }
  checkboxStates.sort(function (a, b) {
    return a - b;
  });
  if (checkboxStates.length > 0) {
    acceptItemButton.removeAttribute("disabled");
    damagedItemButton.removeAttribute("disabled");
    deleteRequestedButton.removeAttribute("disabled");
  } else {
    acceptItemButton.setAttribute("disabled", "");
    damagedItemButton.setAttribute("disabled", "");
    deleteRequestedButton.setAttribute("disabled", "");
  }
}

const removeAllEventListeners = async (eventListenersMap) => {
  const eventListeners = eventListenersMap.get("buttons");
  if (eventListeners) {
    eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
  }
  eventListenersMap.set("buttons", []);
};

const addAllEventListeners = async (
  eventListenersMap,
  requests,
  checkboxStates
) => {
  const acceptItemButton = document.getElementById("itemAccepted");
  const damagedItemButton = document.getElementById("itemDamaged");
  const deleteRequestedButton = document.getElementById("deleteRequest");
  const eventListeners = [
    {
      element: acceptItemButton,
      type: "click",
      listener: (e) =>
        handleUpdateRequestStatus(e, requests, checkboxStates, "accepted"),
    },
    {
      element: damagedItemButton,
      type: "click",
      listener: (e) =>
        handleUpdateRequestStatus(e, requests, checkboxStates, "damaged"),
    },
    {
      element: deleteRequestedButton,
      type: "click",
      listener: (e) => handleDeleteRequest(e, requests, checkboxStates),
    },
  ];

  eventListeners.forEach(({ element, type, listener }) => {
    element.addEventListener(type, listener, false);
  });

  eventListenersMap.set("buttons", eventListeners);
};

const generateTable = async (table, limit, page) => {
  try {
    toggleSpinner(true);
    const requests = await get_requests(table, limit, page);
    const requestStatus = await get_request_status();
    const requestType = await get_request_type();
    const requestContainer = document.getElementById("request-container");
    generateDropdown(requestStatus, requestType);
    requestContainer.innerHTML = "";
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

    const tableBody = document.createElement("tbody");
    toggleSpinner(true);
    let tableHeaders = [];
    var checkboxStates = [];
    tableHeaders = [
      "",
      "Request ID",
      "Buyer Name",
      "Phone Number",
      "Tracking Number",
      "Order Number",
      // "Order Date",
      "Request Date",
      "Request Reason",
      "Request Type",
      "Request Status",
    ];
    tableHeaders.forEach((header) => {
      tableHeaderRow.appendChild(Cell.createHeaderCell(header, false, false));
    });
    requests.status.forEach((data, index) => {
      const {
        request_id,
        buyer_name,
        phone_number,
        tracking_number,
        order_number,
        request_date,
        request_reason,
        request_type,
        request_status,
        request_status_id,
        note,
      } = data;
      const tableRow = document.createElement("tr");
      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.name = "items";
      checkboxInput.value = request_id;

      const idDiv = document.createElement("div");
      const idText = document.createElement("p");
      idText.innerHTML = request_id;
      idDiv.appendChild(idText);
      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("btn-group");

      if (request_status_id === 2) {
        const createOrderBtn = document.createElement("button");
        createOrderBtn.classList.add(
          "btn",
          "btn-outline-success",
          "btn-sm",
          "fa-solid",
          "fa-plus"
        );
        createOrderBtn.type = "button";
        createOrderBtn.setAttribute("title", "Add Returned Order");

        new bootstrap.Tooltip(createOrderBtn);

        createOrderBtn.addEventListener("click", () => {
          window.location.href = `../order_management/order_details.php?request_id=${request_id}`;
        });

        buttonGroup.appendChild(createOrderBtn);
      }

      if (note) {
        const notesIcon = document.createElement("button");
        notesIcon.classList.add(
          "btn",
          "btn-outline-primary",
          "btn-sm",
          "fa-solid",
          "fa-note-sticky"
        );
        notesIcon.type = "button";
        notesIcon.setAttribute("data-bs-toggle", "popover");
        notesIcon.setAttribute("data-bs-content", note);

        new bootstrap.Popover(notesIcon, {
          container: "body",
          placement: "right",
          trigger: "hover focus",
          tapindex: "0",
        });

        notesIcon.addEventListener("click", () => {
          copyTextToClipboard(note);
        });

        buttonGroup.appendChild(notesIcon);
      }

      if (buttonGroup.children.length > 0) {
        idDiv.appendChild(buttonGroup);
      }

      tableRow.appendChild(
        Cell.createElementCell(checkboxInput, false, false, [
          "th",
          "w-auto",
          "text-center",
          "d-flex",
          "justify-content-center",
        ])
      );
      tableRow.appendChild(Cell.createElementCell(idDiv, false, false));
      tableRow.appendChild(Cell.createSpanCell(buyer_name, false, false));
      tableRow.appendChild(Cell.createSpanCell(phone_number, false, false));
      tableRow.appendChild(Cell.createSpanCell(tracking_number, false, false));
      tableRow.appendChild(Cell.createSpanCell(order_number, false, false));
      // tableRow.appendChild(Cell.createSpanCell(order_date, false, false));
      tableRow.appendChild(Cell.createSpanCell(request_date, false, false));
      tableRow.appendChild(Cell.createSpanCell(request_reason, false, false));
      tableRow.appendChild(
        Cell.createSpanCell(request_type, false, false, ["text-danger"])
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Request Status",
          requestStatus.status,
          request_id,
          "request_status_id",
          request_status
        )
      );
      tableBody.appendChild(tableRow);
    });
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    tableElement.appendChild(tableBody);
    requestContainer.appendChild(tableElement);
    const inputCheckbox = document.querySelectorAll('input[name="items"]');
    inputCheckbox.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const request_id = parseInt(this.value);
        updateCheckBoxList(request_id, checkboxStates);
      });
    });

    await removeAllEventListeners(eventListenersMap);
    await addAllEventListeners(
      eventListenersMap,
      requests.status,
      checkboxStates
    );
  } catch (error) {
    console.error(error);
    Alert.render("Failed to fetch data", "error");
  } finally {
    toggleSpinner(false);
  }
};

const updateButton = document.getElementById("updateButton");
const filterButton = document.getElementById("filter-button");

updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (value) {
    const result = await DataController.updateByKey(
      "requests",
      "id",
      id,
      key,
      value
    );
    if (result.status) {
      Cell.closeEditModal();
      Alert.showSuccessMessage("Update successful");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      Alert.showErrorMessage("Update failed");
    }
  } else {
    Alert.showErrorMessage("Update failed");
  }
});

filterButton.addEventListener("click", function () {
  generateTable("requests", 100, 0);
});

async function generateDropdown(requestStatus, requestType) {
  try {
    const requestStatusDropdown = document.getElementById(
      "request-status-dropdown"
    );
    const requestTypeDropdown = document.getElementById(
      "request-type-dropdown"
    );

    const selectedRequestStatus = document.getElementById(
      "selected-request-status"
    );
    const selectedRequestType = document.getElementById(
      "selected-request-type"
    );

    const orderDateInputStart = document.getElementById(
      "order-date-input-start"
    );
    const orderDateInputEnd = document.getElementById("order-date-input-end");
    const requestDateInputStart = document.getElementById(
      "request-date-input-start"
    );
    const requestDateInputEnd = document.getElementById(
      "request-date-input-end"
    );

    requestStatusDropdown.innerHTML = "";
    requestTypeDropdown.innerHTML = "";
    appendDropdownList(
      selectedRequestStatus,
      requestStatusDropdown,
      "All",
      "request-status-filter"
    );
    appendDropdownList(
      selectedRequestType,
      requestTypeDropdown,
      "All",
      "request-type-filter"
    );

    requestStatus.status.forEach((requestStatusName) => {
      appendDropdownList(
        selectedRequestStatus,
        requestStatusDropdown,
        requestStatusName,
        "request-status-filter"
      );
    });
    requestType.status.forEach((requestTypeName) => {
      appendDropdownList(
        selectedRequestType,
        requestTypeDropdown,
        requestTypeName,
        "request-type-filter"
      );
    });
    orderDateInputStart.addEventListener("change", () => {
      const checkbox = document.getElementById("order-date-filter");
      checkbox.checked = true;
    });
    orderDateInputEnd.addEventListener("change", () => {
      const checkbox = document.getElementById("order-date-filter");
      checkbox.checked = true;
    });
    requestDateInputStart.addEventListener("change", () => {
      const checkbox = document.getElementById("request-date-filter");
      checkbox.checked = true;
    });
    requestDateInputEnd.addEventListener("change", () => {
      const checkbox = document.getElementById("request-date-filter");
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

function getFilterValues() {
  const filters = {
    order_date_start: {
      value: document.getElementById("order-date-input-start").value,
      include: document.getElementById("order-daterange-filter").checked,
    },
    order_date_end: {
      value: document.getElementById("order-date-input-end").value,
      include: document.getElementById("order-daterange-filter").checked,
    },
    request_date_start: {
      value: document.getElementById("request-date-input-start").value,
      include: document.getElementById("request-daterange-filter").checked,
    },
    request_date_end: {
      value: document.getElementById("request-date-input-end").value,
      include: document.getElementById("request-daterange-filter").checked,
    },
    request_status_id: {
      value: document
        .getElementById("selected-request-status")
        .getAttribute("data-value"),
      include: document.getElementById("request-status-filter").checked,
    },
    request_type_id: {
      value: document
        .getElementById("selected-request-type")
        .getAttribute("data-value"),
      include: document.getElementById("request-type-filter").checked,
    },
  };

  return filters;
}

function copyTextToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;

  textarea.style.position = "fixed";
  textarea.style.opacity = 0;

  document.body.appendChild(textarea);

  textarea.select();

  try {
    const success = document.execCommand("copy");
    if (success) {
      Alert.showSuccessMessage("Notes copied successfully.");
    } else {
      Alert.showSuccessMessage("Failed to copy notes.");
    }
  } catch (error) {
    Alert.showErrorMessage("Error copying text to clipboard:", error);
  }

  document.body.removeChild(textarea);
}

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".input-group-text").forEach((label) => {
    label.addEventListener("click", function () {
      let inputId = this.getAttribute("for");
      let inputField = document.getElementById(inputId);
      if (inputField) {
        inputField.showPicker();
      }
    });
  });
  generateTable("requests", 100, 0);
});
