import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js";
import { PODataController } from "../../components/PODataController.js";

const updateButton = document.getElementById("updateButton");
updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (value) {
    const result = await DataController.updateByKey("", "id", id, key, value);
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

async function generateTable(limit, page) {
  try {
    const factories = await PODataController.get_factory_list();
    const factorySkuDataContainer = document.getElementById(
      "factory-sku-container"
    );
    factorySkuDataContainer.innerHTML = "";
    const tableElement = document.createElement("table");
    tableElement.classList.add(
      "table",
      "table-sm",
      "table-bordered",
      "table-striped",
      "table-hover"
    );
    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");
    tableHeaderRow.innerHTML = `
        <th>Details</th>
        <th>Name</th>
        <th>Location</th>
        <th>Contact</th>
        <th>Number</th>
        <th>Email</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    const tableBody = document.createElement("tbody");
    tableBody.id = "factory-data-tbody";
    factories.forEach((factory) => {
      const {
        id,
        name,
        location,
        contact_person,
        contact_number,
        email_address,
      } = factory;
      const tableRow = document.createElement("tr");
      const linkDetails = document.createElement("a");
      linkDetails.href = `../po_management/factory_details.php?factory_id=${id}`;
      linkDetails.innerText = "View Detail";
      tableRow.appendChild(
        Cell.createElementCell(linkDetails, false, false, false)
      );
      const deleteButtonCell = Cell.createDeleteButtonCell();
      const deleteButton = deleteButtonCell.firstChild;
      deleteButton.addEventListener("click", async () => {
        const confirmAlert = await Alert.showConfirmModal(
          "Are you sure you want to delete the rows?"
        );

        if (!confirmAlert.isConfirmed) {
          return;
        }

        const result = await DataController._delete("factories", "id", id);
        if (result && result.status) {
          Alert.showSuccessMessage("Delete successful");
        } else {
          Alert.showErrorMessage("Delete failed");
        }
        Cell.closeEditModal();
        generateTable(100, 1);
      });
      tableRow.appendChild(Cell.createSpanCell(name, false, false));
      tableRow.appendChild(Cell.createSpanCell(location, false, false));
      tableRow.appendChild(Cell.createSpanCell(contact_person, false, false));
      tableRow.appendChild(Cell.createSpanCell(contact_number, false, false));
      tableRow.appendChild(Cell.createSpanCell(email_address, false, false));
      tableRow.appendChild(deleteButtonCell);
      tableBody.appendChild(tableRow);
    });
    tableElement.appendChild(tableBody);
    factorySkuDataContainer.appendChild(tableElement);
  } catch (error) {
    console.error(error);
  }
}

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

const addButton = document.getElementById("add-button");
const saveButton = document.getElementById("save-button");

addButton.addEventListener("click", async function (event) {
  event.preventDefault();
  const tbody = document.getElementById("factory-data-tbody");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("new-row");
  tableRow.appendChild(Cell.createSpanCell(""));
  tableRow.appendChild(Cell.createInputCell("name"));
  tableRow.appendChild(Cell.createInputCell("location"));
  tableRow.appendChild(Cell.createInputCell("contact_person"));
  tableRow.appendChild(Cell.createInputCell("contact_number"));
  tableRow.appendChild(Cell.createInputCell("email_address"));
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
      const inputs = row.querySelectorAll("input");
      const insertedData = {};

      let hasEmptyValue = false;

      inputs.forEach((input, inputIndex) => {
        const key = input.getAttribute("for");
        const value = input.value;
        if (!value) {
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
      try {
        const result = await DataController.insert("factories", insertedData);
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

async function main(limit, page) {
  try {
    toggleSpinner(true);
    generateTable(5, 1);
  } catch (e) {
    console.error(e);
  } finally {
    toggleSpinner(false);
  }
}

main(100, 1);
