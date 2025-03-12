import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js";

const updateButton = document.getElementById("updateButton");
updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (value) {
    const result = await DataController.updateByKey(
      "roles",
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

const get_role_list = async () => {
  try {
    const column = ["*"];
    const response = await DataController.select("roles", column, "id", 100, 0);
    return response;
  } catch (error) {
    throw error;
  }
};

const get_permission = async () => {
  try {
    const response = DataController.select("permissions", ["*"], "id", 100, 0);
    return response;
  } catch (error) {
    throw error;
  }
};

const get_role_permission_by_id = async (role_id) => {
  try {
    const column = [
      "*",
      "permissions.name as permission_name",
      "roles.id as role_id",
    ];
    const join = [
      ["roles", "role_permissions.role_id", "roles.id"],
      ["permissions", "permission_id", "permissions.id"],
    ];
    const where = [["roles.id", "=", role_id]];
    const response = DataController.select(
      "role_permissions",
      column,
      "permission_name",
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

async function generateTable(limit, page) {
  try {
    const roleData = await get_role_list();
    const roles = roleData.status;
    const roleDataContainer = document.getElementById("role-container");
    roleDataContainer.innerHTML = "";
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
        <th>Role Name</th>
        <th>Description</th>
        <th>Permission</th>
        <th>Action</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    const tableBody = document.createElement("tbody");
    tableBody.id = "role-data-tbody";
    roles.forEach((role) => {
      const { id, name, description } = role;
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

        const result = await DataController._delete("roles", "id", id);
        if (result && result.status) {
          Alert.showSuccessMessage("Delete successful");
        } else {
          Alert.showErrorMessage("Delete failed");
        }
        Cell.closeEditModal();
        generateTable(100, 1);
      });

      const editPermissionButtonCell = Cell.createEditButtonCell();
      const editPermissionButton = editPermissionButtonCell.firstChild;
      editPermissionButton.addEventListener("click", async () => {
        const allPermissions = await get_permission();
        const rolePermissions = await get_role_permission_by_id(id);
        const rolePermissionIds = rolePermissions.status.map((rp) => rp.id);

        const permissionListContainer = document.getElementById(
          "permissionListContainer"
        );
        permissionListContainer.innerHTML = "";

        // ใช้ Grid Layout ที่ responsive และเป็นระเบียบ
        const gridContainer = document.createElement("div");
        gridContainer.classList.add("row", "g-3"); // ใช้ row และ gap 3

        allPermissions.status.forEach((permission) => {
          const { id: permissionId, name } = permission;

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = permissionId;
          checkbox.checked = rolePermissionIds.includes(permissionId);
          checkbox.classList.add("form-check-input", "me-2");

          const label = document.createElement("label");
          label.classList.add("form-check-label");
          label.textContent = name;

          const div = document.createElement("div");
          div.classList.add(
            "col-12",
            "col-sm-6",
            "col-md-4",
            "col-lg-3",
            "d-flex",
            "align-items-center"
          );
          div.appendChild(checkbox);
          div.appendChild(label);

          gridContainer.appendChild(div);
        });

        permissionListContainer.appendChild(gridContainer);

        document.getElementById("permissionRoleId").value = id;
        const permissionModal = new bootstrap.Modal(
          document.getElementById("permissionModal")
        );
        permissionModal.show();
      });

      tableRow.appendChild(
        Cell.createInputOnModalCell("Role Name", id, "name", name)
      );
      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Description",
          id,
          "description",
          description
        )
      );
      tableRow.appendChild(editPermissionButtonCell);
      tableRow.appendChild(deleteButtonCell);
      tableBody.appendChild(tableRow);
    });
    tableElement.appendChild(tableBody);
    roleDataContainer.appendChild(tableElement);
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
const updatePermissionButton = document.getElementById(
  "updatePermissionButton"
);

addButton.addEventListener("click", function (event) {
  event.preventDefault();
  const tbody = document.getElementById("role-data-tbody");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("new-row");
  tableRow.appendChild(Cell.createInputCell("name"));
  tableRow.appendChild(Cell.createInputCell("description"));
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
        const result = await DataController.insert("roles", insertedData);
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

updatePermissionButton.addEventListener("click", async () => {
  const roleId = document.getElementById("permissionRoleId").value;
  console.log(roleId);
  const checkboxes = document.querySelectorAll(
    "#permissionListContainer input[type='checkbox']"
  );

  const rolePermissions = await get_role_permission_by_id(roleId);
  const existingPermissions = new Set(
    rolePermissions.status.map((rp) => rp.id)
  );

  let to_insert = [];
  let to_delete = [];

  checkboxes.forEach((checkbox) => {
    const permissionId = parseInt(checkbox.value);
    const isChecked = checkbox.checked;

    if (isChecked && !existingPermissions.has(permissionId)) {
      to_insert.push({ role_id: roleId, permission_id: permissionId });
    }

    if (!isChecked && existingPermissions.has(permissionId)) {
      to_delete.push({ role_id: roleId, permission_id: permissionId });
    }
  });

  if (to_insert.length > 0) {
    for (const insert of to_insert) {
      await DataController.insert("role_permissions", insert);
    }
  }

  if (to_delete.length > 0) {
    for (const del of to_delete) {
      await DataController._delete(
        "role_permissions",
        "role_id",
        del.role_id,
        "permission_id",
        del.permission_id
      );
    }
  }

  Alert.showSuccessMessage("Permissions updated successfully!");

  const permissionModal = bootstrap.Modal.getInstance(
    document.getElementById("permissionModal")
  );
  permissionModal.hide();
});

async function main() {
  try {
    toggleSpinner(true);
    generateTable();
  } catch (e) {
    console.error(e);
  } finally {
    toggleSpinner(false);
  }
}

main();
