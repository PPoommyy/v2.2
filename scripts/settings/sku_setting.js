import { Pagination } from "../../components/Pagination.js";
import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

let warehouses = [];
let warehouseSkus = [];
let skuBrands = [];

const limitDropdown = document.getElementById('limitDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
const dropdownTitle = document.getElementById('dropdown-title');

dropdownItems.forEach(item => {
    item.addEventListener('click', function (event) {
        event.preventDefault();
        const selectedLimit = this.getAttribute('data-limit');
        limitDropdown.innerText = selectedLimit;
        generateTable(selectedLimit, 1);
    });
});

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if(value) {
        const result = await DataController.updateByKey("sku_settings", "id", id, key, value);
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

const addButton = document.getElementById('add-button');
const saveButton = document.getElementById('save-button');
addButton.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('sku-data-tbody');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('new-row')
    tableRow.appendChild(Cell.createInputCell("order_product_sku"));
    tableRow.appendChild(Cell.createInputCell("report_product_name"));
    tableRow.appendChild(Cell.createSelectCell(warehouses, "warehouse_id"));
    tableRow.appendChild(Cell.createSelectCell(warehouseSkus, "warehouse_sku_id"));
    tableRow.appendChild(Cell.createSelectCell(skuBrands, "sku_brand_id"));
    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger');
    removeButton.innerHTML = '<i class="fa fa-xmark"></i>';
    removeButton.addEventListener('click', () => {
        tableRow.remove();
        const newRow = document.querySelectorAll('.new-row');
        if (newRow.length === 0){
            saveButton.setAttribute('disabled', '');
        }
    });
    tableRow.appendChild(Cell.createElementCell(removeButton, 2, false, ['text-center']));
    tbody.insertBefore(tableRow, tbody.firstChild);
    saveButton.removeAttribute('disabled');
});

saveButton.addEventListener('click', async () => {
    const confirmAlert = await Alert.showConfirmModal("Are you sure you want to insert the rows?");

    if (!confirmAlert.isConfirmed) {
        return;
    }

    const newRows = document.querySelectorAll('.new-row');

    const swalQueue = Alert.createQueue()

    const results = [];
    try {
        for (let index = 0; index < newRows.length; index++) {
            const row = newRows[index];
            const inputs = row.querySelectorAll('input');
            const selects = row.querySelectorAll('select');

            const insertedData = {
                date_created: new Date().toISOString().slice(0, 19).replace('T', ' '),
            };

            let hasEmptyValue = false;

            inputs.forEach((input, inputIndex) => {
                const key = input.getAttribute('for');
                const value = input.value;
                if (!value) {
                    hasEmptyValue = true;
                    return;
                }
                insertedData[key] = value;
            });

            selects.forEach((select, selectIndex) => {
                const key = select.getAttribute('for');
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
                    text: 'Please fill in all fields for each row.',
                    icon: 'error',
                });
                break;
            }

            try {
                const result = await DataController.insert("sku_settings", insertedData);
                results.push(result);
                const confirmed = await swalQueue.fire({
                    title: `Row ${index + 1} inserted successfully!`,
                    icon: 'success',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Next &rarr;',
                });
                if (!confirmed.isConfirmed) {
                    break;
                }
            } catch (error) {
                const confirmed = await swalQueue.fire({
                    title: `Failed to insert Row ${index + 1}`,
                    icon: 'error',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Next &rarr;',
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

generateTable(100, 1);

async function get_sku_list(limit, page) {
    try {
        const url = `../../backend/get/sku/get_sku_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const result = await get_sku_list(limit, page);
        const skus = result.skus;
        warehouses = result.warehouses;
        warehouseSkus = result.warehouseSkus;
        skuBrands = result.skuBrands;
        const totalCount = result.count;
        const totalPages = Math.ceil(totalCount / limit);

        const skuDataContainer = document.getElementById('sku-data-container');
        skuDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `<th>Order Product SKU</th>
         <th>Report Product Name</th>
         <th>Warehouse</th>
         <th>Warehouse SKU</th>
         <th>Brand</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'sku-data-tbody';
        skus.forEach((sku, index) => {
            const tableRow = document.createElement('tr');
            tableRow.appendChild(Cell.createInputOnModalCell('Order Product SKU', sku.id, 'order_product_sku', sku.order_product_sku));
            tableRow.appendChild(Cell.createInputOnModalCell('Report Product Name', sku.id, 'report_product_name', sku.report_product_name));
            tableRow.appendChild(Cell.createSelectOnModalCell('Warehouse', warehouses, sku.id, 'warehouse_id', sku.warehouse_name));
            tableRow.appendChild(Cell.createSelectOnModalCell('Warehouse SKU', warehouseSkus, sku.id, 'warehouse_sku_id', sku.warehouse_sku_name));
            tableRow.appendChild(Cell.createSelectOnModalCell('Brand', skuBrands, sku.id, 'sku_brand_id', sku.sku_brand_name));
        
            tableBody.appendChild(tableRow);
        });

        tableElement.appendChild(tableBody);

        skuDataContainer.appendChild(tableElement);

        dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${totalCount<limit?totalCount:limit*page} of ${totalCount} rows`;
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