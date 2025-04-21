import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

let globalCurrencies = [];
let globalPaymentMethods = [];

const updateButton = document.getElementById("updateButton");
const databaseSaveButton = document.getElementById("databaseSaveButton");
const databaseRemoveButton = document.getElementById("databaseRemoveButton");

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

databaseSaveButton.addEventListener("click", async () => {
  const updatedObject = (object, key, oldData, newData) => {
    if (newData != oldData) {
      Object.assign(object, { [key]: newData });
    }
    return object;
  };

  const websiteId = document.getElementById("databaseWebsiteId").value;
  const db_host = document.getElementById("db_host").value;
  const db_name = document.getElementById("db_name").value;
  const db_user = document.getElementById("db_user").value;
  const db_password = document.getElementById("db_password").value;
  const retreive_period = document.getElementById("retreive_period").value;
  const button = document.getElementById(`dbButton-${websiteId}`);
  const action = button?.dataset.mode || "add";
  if (!db_host || !db_name || !db_user || !db_password) {
    Alert.showErrorMessage("Please fill in all fields.");
    return;
  }
  if (!retreive_period) {
    Alert.showErrorMessage("Please fill in the retrieve period.");
    return;
  }

  try {
    let result;
    if (action === "add") {
      const payload = {
        website_id: websiteId,
        db_host,
        db_name,
        db_user,
        db_password,
        retreive_period,
      };
      result = await DataController.insert("website_database", payload);
    } else if (action === "edit") {
      let payload = {};
      const old_db_host = document.getElementById("db_host").dataset.dbHost;
      const old_db_name = document.getElementById("db_name").dataset.dbName;
      const old_db_user = document.getElementById("db_user").dataset.dbUser;
      const old_db_password =
        document.getElementById("db_password").dataset.dbPassword;
      const old_retreive_period =
        document.getElementById("retreive_period").dataset.retreivePeriod;
      payload = updatedObject(payload, "db_host", old_db_host, db_host);
      payload = updatedObject(payload, "db_name", old_db_name, db_name);
      payload = updatedObject(payload, "db_user", old_db_user, db_user);
      payload = updatedObject(
        payload,
        "db_password",
        old_db_password,
        db_password
      );
      payload = updatedObject(
        payload,
        "retreive_period",
        old_retreive_period,
        retreive_period
      );
      result = await DataController.update(
        "website_database",
        "website_id",
        websiteId,
        payload
      );
    }

    if (result && result.status) {
      Alert.showSuccessMessage("Saved database config successfully!");
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("databaseModal")
      );
      modal.hide();
      generateTable(100, 1);
    } else {
      Alert.showErrorMessage("Failed to save database config.");
    }
  } catch (error) {
    console.error(error);
    Alert.showErrorMessage("Error occurred while saving database config.");
  }
});

databaseRemoveButton.addEventListener("click", async () => {
  const id = databaseRemoveButton.dataset.id;
  if (!id) return;

  const confirmAlert = await Alert.showConfirmModal(
    "Are you sure you want to delete this database config?"
  );

  if (!confirmAlert.isConfirmed) return;

  try {
    const result = await DataController._delete("website_database", "id", id);
    if (result && result.status) {
      Alert.showSuccessMessage("Delete successful!");
    } else {
      Alert.showErrorMessage("Delete failed.");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("databaseModal")
    );
    modal.hide();
    generateTable(100, 1);
  } catch (error) {
    console.error(error);
    Alert.showErrorMessage("Error occurred while deleting database config.");
  }
});

async function get_websites() {
  try {
    const column1 = [
      "w.id as website_id",
      "w.name as website_name",
      "c.name as currency_name",
      "w.shipping_fee",
      "p.name as payment_method_name",
    ];
    const join1 = [
      ["LEFT JOIN", "currencies c", "w.currency_id", "c.id"],
      ["LEFT JOIN", "payment_methods p", "w.payment_method_id", "p.id"],
    ];
    const where1 = [["w.group_id", "=", 2]];
    const nestedKey = "website_id";
    const nestedTables = [
      {
        table: "website_database wd",
        columns: ["*"],
        order_by: "wd.id",
        response_key: "databases",
      },
    ];
    const response = await DataController.selectNested(
      "websites w",
      column1,
      "website_name",
      null,
      100,
      1,
      join1,
      where1,
      null,
      nestedKey,
      nestedTables
    );
    return response.status;
  } catch (error) {
    throw error;
  }
}

async function generateTable() {
  try {
    const result = await get_websites();
    const websites = result;
    globalCurrencies = (await DataController.select("currencies", ["*"], "id"))
      .status;
    globalPaymentMethods = (
      await DataController.select("payment_methods", ["*"], "id")
    ).status;
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
    tableHeaderRow.innerHTML = `
      <th class="col-3">Website Name</th>
      <th class="col-1">Currency</th>
      <th class="col-3">Shipping Fee</th>
      <th class="col-3">Payment Method</th>
      <th class="col-1">DB</th>
      <th class="col-1"></th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    websites.forEach((website) => {
      const { data, nested } = website;
      const { databases } = nested;
      const {
        website_id,
        website_name,
        currency_name,
        shipping_fee,
        payment_method_name,
      } = data;
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
          website_id
        );
        if (result && result.status) {
          Alert.showSuccessMessage("Delete successful");
        } else {
          Alert.showErrorMessage("Delete failed");
        }
        Cell.closeEditModal();
        generateTable(100, 1);
      });

      const dbButtonCell = document.createElement("td");
      dbButtonCell.classList.add("text-center");

      const dbButton = document.createElement("button");
      dbButton.classList.add(
        "btn",
        "btn-sm",
        databases.length === 0 ? "btn-success" : "btn-warning"
      );
      dbButton.id = `dbButton-${website_id}`;
      dbButton.innerHTML = `<i class="fa ${
        databases.length === 0 ? "fa-plus" : "fa-pen-to-square"
      }"></i>`;

      dbButton.addEventListener("click", () => {
        document.getElementById("databaseWebsiteId").value = website_id;
        const databaseModalLabel =
          document.getElementById("databaseModalLabel");
        databaseModalLabel.innerHTML = `Database Config for ${website_name}`;
        const db_host = document.getElementById("db_host");
        const db_name = document.getElementById("db_name");
        const db_user = document.getElementById("db_user");
        const db_password = document.getElementById("db_password");
        const retreive_period = document.getElementById("retreive_period");
        const removeButton = document.getElementById("databaseRemoveButton");

        db_host.value = "";
        db_name.value = "";
        db_user.value = "";
        db_password.value = "";
        retreive_period.value = 0;

        if (databases.length > 0) {
          const db = databases[0];
          db_host.value = db.db_host;
          db_name.value = db.db_name;
          db_user.value = db.db_user;
          db_password.value = db.db_password;
          retreive_period.value = db.retreive_period;

          db_host.dataset.dbHost = db.db_host;
          db_name.dataset.dbName = db.db_name;
          db_user.dataset.dbUser = db.db_user;
          db_password.dataset.dbPassword = db.db_password;
          retreive_period.dataset.retreivePeriod = db.retreive_period;
          dbButton.dataset.mode = "edit";

          removeButton.classList.remove("d-none");
          removeButton.dataset.id = db.id;
        } else {
          dbButton.dataset.mode = "add";
          removeButton.classList.add("d-none");
          removeButton.removeAttribute("data-id");
        }
        dbButton.dataset.websiteId = website_id;
        const modal = new bootstrap.Modal(
          document.getElementById("databaseModal")
        );
        modal.show();
      });
      dbButtonCell.appendChild(dbButton);

      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Website Name",
          website_id,
          "website_name",
          website_name
        )
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Currency",
          globalCurrencies,
          website_id,
          "currency_id",
          currency_name
        )
      );
      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Shipping Fee",
          website_id,
          "shipping_fee",
          shipping_fee
        )
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Payment Method",
          globalPaymentMethods,
          website_id,
          "payment_method_id",
          payment_method_name
        )
      );
      tableRow.appendChild(dbButtonCell);
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
  tableRow.appendChild(Cell.createInputCell("shipping_fee", 0, "number"));
  tableRow.appendChild(
    Cell.createSelectInputCell(globalPaymentMethods, "payment_method_id")
  );
  tableRow.appendChild(Cell.createSpanCell(""));
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
