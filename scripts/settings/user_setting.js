import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js";

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if(value) {
        const result = await DataController.updateByKey("users", "id", id, key, value);
        console.log(result);
        if (result&&result.status) {
            Alert.showSuccessMessage('Update successful');
        } else {
            Alert.showErrorMessage('Update failed');
        }
        Cell.closeEditModal();
        generateTable(100, 1);
    }else {
        Alert.showErrorMessage('Update failed');
    }
});

const get_user_list = async () => {
    try {
        const column = [
            "*", "users.id as user_id", "roles.name as role_name"
        ]
        const join = [
            ["roles", "roles.id", "users.role_id"]
        ]
        const response = await DataController.select("users", column, "user_id", 100, 0, join);
        console.log(response);
        return response;
    } catch (error) {
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        const userData = await get_user_list();
        const users = userData.status;
        const userDataContainer = document.getElementById('user-container');
        userDataContainer.innerHTML = '';
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-sm', 'table-bordered', 'table-striped', 'table-hover');
        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `
        <th></th>
        <th>Username</th>
        <th>Email</th>
        <th>Password Hash</th>
        <th>Fullname</th>
        <th>Role Name</th>
        <th>Is Active?</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        const tableBody = document.createElement('tbody');
        users.forEach(user => {
            const { user_id, username, email, password_hash, full_name, is_active, role_name } = user
            console.log(`user_id`, user_id);
            const tableRow = document.createElement('tr');
            const linkDetails = document.createElement('a');
            linkDetails.href = `user_details.php?user_id=${user_id}`;
            linkDetails.innerText = 'View Detail';
            tableRow.appendChild(Cell.createElementCell(linkDetails, false, false, false));
            tableRow.appendChild(Cell.createInputOnModalCell("Username", user_id, "username", username));
            tableRow.appendChild(Cell.createInputOnModalCell("Email", user_id, "email", email));
            tableRow.appendChild(Cell.createInputOnModalCell("Password Hash", user_id, "password_hash", password_hash));
            tableRow.appendChild(Cell.createInputOnModalCell("Full Name", user_id, "full_name", full_name));
            tableRow.appendChild(Cell.createSpanCell(role_name, false, false));
            tableRow.appendChild(Cell.createSwitchInputCell(is_active));
            tableBody.appendChild(tableRow);
        });
        tableElement.appendChild(tableBody);
        userDataContainer.appendChild(tableElement);
    } catch (error) {
        console.error(error);
    }
}

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

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

main()