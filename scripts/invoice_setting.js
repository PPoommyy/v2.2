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
        // console.log("id: " + id + " key: " + key + " value: " + value);
        const result = await DataController.updateByKey("country_currency", "id", id, key, value);
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

generateTable(100, 1);

async function get_country_list(limit, page) {
    try {
        let url = `../datasets/get_country_list.php?limit=${limit}&page=${page}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const result = await get_country_list(limit, page);
        const countries = result.data;
        const currencies = result.currencies;
        const serviceMethods = result.service_methods;
        const orderTypes = result.order_types;
        const totalCount = result.count;
        const totalPages = Math.ceil(totalCount / limit);

        const countryDataContainer = document.getElementById('invoice-data-container');
        countryDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
            `<th>Country</th>
             <th>Country Code</th>
             <th>Other Possible Name</th>
             <th>Currency</th>
             <th>Service Methods</th>
             <th>Order Type</th>
             <th>Tax Rate</th>
             <th>Make Invoice?</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        countries.forEach(country => {
            const tableRow = document.createElement('tr');

            const switchInputCell = Cell.createSwitchInputCell(country.enable_invoice);
            const switchInput = switchInputCell.querySelector('input');
            switchInput.addEventListener('click', async () => {
                const confirmAlert = await Alert.showConfirmModal(`Are you sure you want to ${switchInput.checked?"enable":"disable"} to make invoice?`);
                
                if (!confirmAlert.isConfirmed) {
                    return;
                }

                const result = await DataController.updateByKey("country_currency", "id", country.id, "enable_invoice", switchInput.checked ? 1 : 0);
                if (result&&result.status) {
                    Alert.showSuccessMessage('Update successful');
                } else {
                    Alert.showErrorMessage('Update failed');
                }
                
                generateTable(limit, page);
                Cell.closeEditModal();
            });

            tableRow.appendChild(Cell.createSpanCell(country.short_name, false, false));
            tableRow.appendChild(Cell.createSpanCell(country.country_code, false, false));
            tableRow.appendChild(Cell.createSpanCell(country.full_name, false, false));
            tableRow.appendChild(Cell.createSelectOnModalCell('Currency', currencies, country.id, 'currency_id', country.currency_name));
            tableRow.appendChild(Cell.createSelectOnModalCell('Service Methods', serviceMethods, country.id, 'service_id', country.service_name));
            tableRow.appendChild(Cell.createSelectOnModalCell('Order Types', orderTypes, country.id, 'order_type_id', country.order_type));
            tableRow.appendChild(Cell.createInputOnModalCell('Tax Rate (1.0000 = 100%)', country.id, 'tax_rate', country.tax_rate));
            tableRow.appendChild(switchInputCell);
            tableBody.appendChild(tableRow);
        });
        tableElement.appendChild(tableBody);

        countryDataContainer.appendChild(tableElement);
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