import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

let globalCurrencies = [];
let globalPaymentMethods = [];

const updateButton = document.getElementById("updateButton");
updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (value) {
    const result = await DataController.updateByKey(
      "websites",
      "id",
      id,
      key,
      value
    );
    if (result && result.status) {
      Alert.showSuccessMessage("Update successful");
    } else {
      Alert.showErrorMessage("Update failed");
    }
    Cell.closeEditModal();
    generateTable(100, 1);
  } else {
    Alert.showErrorMessage("Update failed");
  }
});

async function get_websites() {
  try {
    let url = `../../backend/get/get_websites.php`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function generateTable() {
  try {
    const result = await get_websites();
    const websites = result.data;
    globalCurrencies = result.currencies;
    globalPaymentMethods = result.paymentMethods;
    const websiteList = document.getElementById("website-list");
    websiteList.innerHTML = "";
    const tableBody = document.createElement("tbody");
    tableBody.setAttribute("id", "website-data-tbody");
    const tableElement = document.createElement("table");
    tableElement.classList.add(
      "table",
      "table-bordered",
      "table-striped",
      "table-hover"
    );

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `<th>Website Name</th>
          <th>Currency</th>
          <th>Shipping Fee</th>
          <th>Payment Method</th>
          <th></th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    websites.forEach((website) => {
      const tableRow = document.createElement("tr");
      const deleteButtonCell = Cell.createDeleteButtonCell();
      const deleteButton = deleteButtonCell.firstChild;
      deleteButton.addEventListener("click", async () => {
        const confirmAlert = await Alert.showConfirmModal(
          "Are you sure you want to delete the rows?"
        );

        if (!confirmAlert.isConfirmed) {
          return;
        }

        const result = await DataController._delete(
          "websites",
          "id",
          website.website_id
        );
        if (result && result.status) {
          Alert.showSuccessMessage("Delete successful");
        } else {
          Alert.showErrorMessage("Delete failed");
        }
        Cell.closeEditModal();
        generateTable(100, 1);
      });
      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Website Name",
          website.website_id,
          "website_name",
          website.website_name
        )
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Currency",
          globalCurrencies,
          website.website_id,
          "currency_id",
          website.currency_name
        )
      );
      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Shipping Fee",
          website.website_id,
          "shipping_fee",
          website.shipping_fee
        )
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Payment Method",
          globalPaymentMethods,
          website.website_id,
          "payment_method_id",
          website.payment_method_name
        )
      );
      tableRow.appendChild(deleteButtonCell);
      tableBody.appendChild(tableRow);
    });

    tableElement.appendChild(tableBody);
    websiteList.appendChild(tableElement);
  } catch (error) {
    console.error(error);
  }
}

const addButton = document.getElementById("add-button");
const saveButton = document.getElementById("save-button");

addButton.addEventListener("click", function (event) {
  event.preventDefault();
  const tbody = document.getElementById("website-data-tbody");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("new-row");

  tableRow.appendChild(Cell.createInputCell("name"));
  tableRow.appendChild(
    Cell.createSelectInputCell(globalCurrencies, "currency_id")
  );
  tableRow.appendChild(Cell.createInputCell("shipping_fee"));
  tableRow.appendChild(
    Cell.createSelectInputCell(globalPaymentMethods, "payment_method_id")
  );

  const removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-danger");
  removeButton.innerHTML = '<i class="fa fa-xmark"></i>';
  removeButton.addEventListener("click", () => {
    tableRow.remove();
    const newRow = document.querySelectorAll(".new-row");
    if (newRow.length === 0) {
      saveButton.setAttribute("disabled", "");
    }
  });

  tableRow.appendChild(
    Cell.createElementCell(removeButton, 2, false, ["text-center"])
  );
  tbody.insertBefore(tableRow, tbody.firstChild);
  saveButton.removeAttribute("disabled");
});

saveButton.addEventListener("click", async () => {
  const confirmAlert = await Alert.showConfirmModal(
    "Are you sure you want to insert the rows?"
  );

  if (!confirmAlert.isConfirmed) {
    return;
  }

  const newRows = document.querySelectorAll(".new-row");

  const swalQueue = Alert.createQueue();

  const results = [];
  try {
    for (let index = 0; index < newRows.length; index++) {
      const row = newRows[index];
      const insertedData = {};

      let hasEmptyValue = false;

      const inputs = row.querySelectorAll("input, select");

      inputs.forEach((input) => {
        const key = input.getAttribute("for") || input.getAttribute("name");
        const value = input.value;
        if (!value && key !== "description") {
          hasEmptyValue = true;
          return;
        }
        insertedData[key] = value;
      });

      if (hasEmptyValue) {
        Alert.fire({
          title: `Row ${index + 1} has empty values`,
          text: "Please fill in all fields for each row.",
          icon: "error",
        });
        break;
      }

      insertedData["group_id"] = 2;
      insertedData["is_amazon"] = 0;
      try {
        const result = await DataController.insert("websites", insertedData);
        results.push(result);
        const confirmed = await swalQueue.fire({
          title: `Row ${index + 1} inserted successfully!`,
          icon: "success",
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: "Next &rarr;",
        });
        if (!confirmed.isConfirmed) {
          break;
        }
      } catch (error) {
        const confirmed = await swalQueue.fire({
          title: `Failed to insert Row ${index + 1}`,
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
  } catch (error) {
    console.error(error);
  }
  generateTable(100, 1);
});

generateTable();
