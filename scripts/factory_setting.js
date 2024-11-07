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

        factories.forEach(factory => {
            const { details, factory_skus } = factory;
            const { id, name, location, contact_person, contact_number, email_address } = details;
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', 'mb-4');

            const cardHeader = document.createElement('div');
            cardHeader.classList.add('card-header');
            cardHeader.textContent = `Factory: ${name}`;

            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body');

            const tableElement = document.createElement('table');
            tableElement.classList.add('table', 'table-sm', 'table-bordered', 'table-striped', 'table-hover');

            const tableHeader = document.createElement('thead');
            const tableHeaderRow = document.createElement('tr');
            tableHeaderRow.innerHTML =
            `
            <th>
                <input id="select-all-${id}" type="checkbox" data-index="-1" name="Allitems" value="-1" data-toggle="tooltip" data-placement="top" title="Select All"/>
            </th>
            <th>Order Product SKU</th>
            <th>Report Product Name</th>`;
            tableHeader.appendChild(tableHeaderRow);
            tableElement.appendChild(tableHeader);

            const tableBody = document.createElement('tbody');
            tableBody.id = `sku-data-tbody-${id}`;
            skus.forEach((sku, index) => {
                const tableRow = document.createElement('tr');
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.name = 'items';
                checkboxInput.value = sku.id;

                tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th']));
                tableRow.appendChild(Cell.createSpanCell(sku.order_product_sku, false, false));
                tableRow.appendChild(Cell.createSpanCell(sku.report_product_name, false, false));
                tableBody.appendChild(tableRow);
            });
            tableElement.appendChild(tableBody);
            
            const skuPaginationDiv = document.createElement('div');
            skuPaginationDiv.classList.add("col", "mb-3" , "d-flex", "justify-content-end");
            const skuPagination = document.createElement('div');
            skuPagination.id = `sku-pagination-${id}`;
            const skuPaginationList = document.createElement('ul');
            skuPaginationList.classList.add("pagination", "m-0");
            skuPagination.appendChild(skuPaginationList);
            skuPaginationDiv.appendChild(skuPagination);

            cardBody.appendChild(skuPaginationDiv);
            cardBody.appendChild(tableElement);
            
            cardElement.appendChild(cardHeader);
            cardElement.appendChild(cardBody);

            factorySkuDataContainer.appendChild(cardElement);
            /* 
            <div class="row">
                <div class="col mb-3 d-flex align-items-center justify-content-start ">
                    <p id="dropdown-title" class="small p-0 m-0 mx-2">Showing</p>
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            20
                        </button>
                        <ul id="dropdownMenu" class="dropdown-menu" aria-labelledby="limitDropdown">
                            <li><a class="dropdown-item" data-limit="20">20</a></li>
                            <li><a class="dropdown-item" data-limit="50">50</a></li>
                            <li><a class="dropdown-item" data-limit="100">100</a></li>
                            <li><a class="dropdown-item" data-limit="150">150</a></li>
                            <li><a class="dropdown-item" data-limit="200">200</a></li>
                        </ul>
                    </div>
                    <p class="small p-0 m-0 mx-2">records per page</p>
                </div>
            </div>
            */

            Pagination.updatePagination(page, totalPages, `sku-pagination-${id}`, generateTable());
            const selectedAllCheckbox = document.getElementById(`select-all-${id}`);
            const inputCheckbox = tableElement.querySelectorAll('input[name="items"]');
            selectedAllCheckbox.addEventListener('change', function () {
                inputCheckbox.forEach(checkbox => {
                    const skuId = checkbox.value;
                    // updateCheckBoxList(skuId);
                    checkbox.checked = this.checked;
                });
            });
            
            inputCheckbox.forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const skuId = checkbox.value;
                    // updateCheckBoxList(skuId);
                });
            });
        });
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