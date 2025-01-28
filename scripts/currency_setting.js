import { Pagination } from "../components/Pagination.js";
import { Cell } from "../components/Cell.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if (value) {
        const result = await DataController.updateByKey("currencies", "id", id, key, value);
        if (result.status) {
            Cell.closeEditModal();
            Alert.showSuccessMessage('Update successful');
            generateTable(100, 1);
        } else {
            Alert.showErrorMessage('Update failed');
        }
    }else {
        Alert.showErrorMessage('Update failed');
    }
});

generateTable(100, 1);

async function get_currency_list(limit, page) {
    try {
        let url = `../backend/get_currency_list.php?limit=${limit}&page=${page}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const result = await get_currency_list(limit, page);
        const currencies = result.data;
        const totalCount = result.count;
        const totalPages = Math.ceil(totalCount / limit);

        const currencyDataContainer = document.getElementById('currency-data-container');
        currencyDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
            `<th>Currency Code</th>
             <th>Description</th>
             <th>Show On Dropdown?</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        currencies.forEach(currency => {
            const tableRow = document.createElement('tr');

            const switchInputCell = Cell.createSwitchInputCell(currency.is_enabled);
            const switchInput = switchInputCell.querySelector('input');
            switchInput.addEventListener('click', async () => {
                const confirmAlert = await Alert.showConfirmModal(`Are you sure you want to ${switchInput.checked?"enable":"disable"} to show on dropdown?`);
                
                if (!confirmAlert.isConfirmed) {
                    return;
                }

                const result = await DataController.updateByKey("currencies", "id", currency.id, "is_enabled", switchInput.checked ? 1 : 0);
                if (result&&result.status) {
                    Alert.showSuccessMessage('Update successful');
                } else {
                    Alert.showErrorMessage('Update failed');
                }
                generateTable(limit, page);
                Cell.closeEditModal();
            });

            tableRow.appendChild(Cell.createInputOnModalCell('Name', currency.id, 'name', currency.name));
            tableRow.appendChild(Cell.createInputOnModalCell('Description', currency.id, 'description', currency.description));
            tableRow.appendChild(switchInputCell);
            tableBody.appendChild(tableRow);
        });
        tableElement.appendChild(tableBody);

        currencyDataContainer.appendChild(tableElement);

        Pagination.updatePagination(page, totalPages, 'pagination1', generateTable);
        Pagination.updatePagination(page, totalPages, 'pagination2', generateTable);
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
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