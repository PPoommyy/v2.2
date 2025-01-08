import { Cell } from "../components/Cell.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Pagination } from "../components/Pagination.js";

let factories = {};

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if(value) {
        const result = await DataController.updateByKey("", "id", id, key, value);
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

const get_factory_list = async (limit, page) => {
    try {
        let url = `../datasets/get_factory_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const get_sku_list = async (limit, page) => {
    try {
        const url = `../datasets/get_sku_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        const factoryData = await get_factory_list(limit, page);
        factories = factoryData.data1;
        const skusData = await get_sku_list(100, 1);
        const skus = skusData.skus;
        const totalCount = skusData.count;
        const totalPages = Math.ceil(totalCount / limit);
        const factorySkuDataContainer = document.getElementById('factory-sku-container');
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-sm', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `
        <th>Details</th>
        <th>ID</th>
        <th>Name</th>
        <th>Location</th>
        <th>Email</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        
        const tableBody = document.createElement('tbody');
        factories.forEach(factory => {
            const { details, factory_skus } = factory;
            const { id, name, location, contact_person, contact_number, email_address } = details;
            
            const tableRow = document.createElement('tr');
            
            const linkDetails = document.createElement('a');
            linkDetails.href = `factory_details.php?factory_id=${id}`;
            linkDetails.innerText = 'View Detail';

            tableRow.appendChild(Cell.createElementCell(linkDetails, false, false, false));
            tableRow.appendChild(Cell.createSpanCell(id, false, false));
            tableRow.appendChild(Cell.createSpanCell(name, false, false));
            tableRow.appendChild(Cell.createSpanCell(location, false, false));
            tableRow.appendChild(Cell.createSpanCell(email_address, false, false));
            tableBody.appendChild(tableRow);
        });
        tableElement.appendChild(tableBody);
        factorySkuDataContainer.appendChild(tableElement);
        Pagination.updatePagination(page, totalPages, 'pagination1', generateTable);
        Pagination.updatePagination(page, totalPages, 'pagination2', generateTable);
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

main(100, 1)