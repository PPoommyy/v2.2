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
    console.log(result);
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
    console.log(response);
    return response;
  } catch (error) {
    throw error;
  }
};

const get_role_permission = async () => {
  try {
    const response = DataController.select("permissions", ["*"], "id", 100, 0);
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
        // ดึงข้อมูล permission ทั้งหมด
        const allPermissions = await get_permission();

        // ดึง permission ที่ role ปัจจุบันมีอยู่
        const rolePermissions = await get_role_permission(id);

        // แปลง rolePermissions ให้เป็น array ของ permission_id
        const rolePermissionIds = rolePermissions.status.map(
          (rp) => rp.permission_id
        );

        // แสดงรายการ permission ใน modal
        const permissionListContainer = document.getElementById(
          "permissionListContainer"
        );
        permissionListContainer.innerHTML = ""; // ล้างข้อมูลเก่า

        allPermissions.status.forEach((permission) => {
          const { id: permissionId, name } = permission;
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = permissionId;
          checkbox.checked = rolePermissionIds.includes(permissionId); // เช็คว่ามีสิทธิ์นี้หรือไม่
          checkbox.classList.add("form-check-input");

          const label = document.createElement("label");
          label.classList.add("form-check-label");
          label.textContent = name;
          label.appendChild(checkbox);

          const div = document.createElement("div");
          div.classList.add("form-check");
          div.appendChild(checkbox);
          div.appendChild(label);

          permissionListContainer.appendChild(div);
        });

        // เซ็ต role_id สำหรับอัปเดต
        document.getElementById("permissionRoleId").value = id;

        // เปิด modal
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

document
  .getElementById("updatePermissionButton")
  .addEventListener("click", async () => {
    const roleId = document.getElementById("permissionRoleId").value;
    const checkboxes = document.querySelectorAll(
      "#permissionListContainer input[type='checkbox']"
    );

    // รวบรวม permission_id ที่ถูกเลือก
    const selectedPermissions = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedPermissions.push({
          role_id: roleId,
          permission_id: checkbox.value,
        });
      }
    });

    console.log(selectedPermissions);
    console.log(checkboxes);
    // ลบ permission เดิมทั้งหมดก่อน
    // await DataController._delete("role_permission", "role_id", roleId);

    // เพิ่ม permission ใหม่
    /* if (selectedPermissions.length > 0) {
      await DataController.insertMultiple(
        "role_permission",
        selectedPermissions
      );
    } */

    Alert.showSuccessMessage("Permissions updated successfully!");

    // ปิด modal
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
