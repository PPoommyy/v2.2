import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js";

const updateButton = document.getElementById("updateButton");
updateButton.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const key = document.getElementById("editKey").value;
  const value = document.getElementById("editValue").value;
  if (key === "password") {
    Alert.showErrorMessage("You cannot edit the password directly.");
    return;
  }
  if (value) {
    const result = await DataController.updateByKey(
      "users",
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

const get_user_list = async () => {
  try {
    const column = [
      "*",
      "users.id as user_id",
      "roles.name as role_name",
      "roles.id as role_id",
    ];
    const join = [["roles", "roles.id", "users.role_id"]];
    const response = await DataController.select(
      "users",
      column,
      "user_id",
      100,
      0,
      join
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const get_role = async () => {
  try {
    const response = DataController.select("roles", ["*"], "id", 100, 0);
    return response;
  } catch (error) {
    throw error;
  }
};

async function generateTable(limit, page) {
  try {
    const userData = await get_user_list();
    const users = userData.status;
    const roles = await get_role();
    const userDataContainer = document.getElementById("user-container");
    userDataContainer.innerHTML = "";
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
        <th>Username</th>
        <th>Email</th>
        <th>Password</th>
        <th>Fullname</th>
        <th>Role Name</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    const tableBody = document.createElement("tbody");
    tableBody.id = "user-data-tbody";
    users.forEach((user) => {
      const { user_id, username, email, full_name, is_active, role_name } =
        user;
      const tableRow = document.createElement("tr");
      tableRow.appendChild(
        Cell.createInputOnModalCell("Username", user_id, "username", username)
      );
      tableRow.appendChild(
        Cell.createInputOnModalCell("Email", user_id, "email", email)
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

        const result = await DataController._delete("users", "id", user_id);
        if (result && result.status) {
          Alert.showSuccessMessage("Delete successful");
        } else {
          Alert.showErrorMessage("Delete failed");
        }
        Cell.closeEditModal();
        generateTable(100, 1);
      });
      const resetButton = document.createElement("button");
      resetButton.classList.add("btn", "btn-warning", "btn-sm");
      resetButton.innerText = "Reset Password";
      resetButton.addEventListener("click", () => resetPassword(user_id));
      tableRow.appendChild(
        Cell.createElementCell(resetButton, false, false, ["text-center"])
      );
      tableRow.appendChild(
        Cell.createInputOnModalCell(
          "Full Name",
          user_id,
          "full_name",
          full_name
        )
      );
      tableRow.appendChild(
        Cell.createSelectOnModalCell(
          "Role Name",
          roles.status,
          user_id,
          "role_id",
          role_name
        )
      );
      tableRow.appendChild(deleteButtonCell);
      tableBody.appendChild(tableRow);
    });
    tableElement.appendChild(tableBody);
    userDataContainer.appendChild(tableElement);
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

async function resetPassword(userId) {
  const { value: password } = await Swal.fire({
    title: "Reset Password",
    input: "password",
    inputLabel: "Enter new password",
    inputPlaceholder: "Type your new password",
    inputAttributes: {
      maxlength: 20,
      autocapitalize: "off",
      autocorrect: "off",
    },
    showCancelButton: true,
    confirmButtonText: "Reset",
    preConfirm: (password) => {
      if (!password) {
        Swal.showValidationMessage("Password cannot be empty!");
      }
      return password;
    },
  });

  if (password) {
    const result = await DataController.updateByKey(
      "users",
      "id",
      userId,
      "password_hash",
      password
    );
    if (result && result.status) {
      Swal.fire("Success", "Password has been reset successfully!", "success");
    } else {
      Swal.fire("Error", "Failed to reset password!", "error");
    }
  }
}

const addButton = document.getElementById("add-button");
const saveButton = document.getElementById("save-button");

addButton.addEventListener("click", async function (event) {
  event.preventDefault();
  const roles = await get_role();
  const tbody = document.getElementById("user-data-tbody");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("new-row");
  tableRow.appendChild(Cell.createInputCell("username"));
  tableRow.appendChild(Cell.createInputCell("email"));
  tableRow.appendChild(Cell.createInputCell("password_hash", "", "password"));
  tableRow.appendChild(Cell.createInputCell("full_name"));
  tableRow.appendChild(Cell.createSelectCell(roles.status, "role_id"));
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
      const selects = row.querySelectorAll("select");

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
      selects.forEach((select, selectIndex) => {
        const key = select.getAttribute("for");
        const value = select.value;
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
        const result = await DataController.insert("users", insertedData);
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
