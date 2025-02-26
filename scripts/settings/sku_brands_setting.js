import { Pagination } from "../../components/Pagination.js";
import { Cell } from "../../components/Cell.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if (value) {
        const result = await DataController.updateByKey("sku_brands", "id", id, key, value);
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
    const tbody = document.getElementById('data-tbody');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('new-row')
    tableRow.appendChild(Cell.createInputCell("name"));
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

    const swalQueue = Alert.createQueue();

    const results = [];
    try {
        for (let index = 0; index < newRows.length; index++) {
            const row = newRows[index];
            const inputs = row.querySelectorAll('input');

            const insertedData = {};

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

            if (hasEmptyValue) {
                Alert.fire({
                    title: `Row ${index + 1} has empty values`,
                    text: 'Please fill in all fields for each row.',
                    icon: 'error',
                });
                break;
            }

            try {
                const result = await DataController.insert("sku_brands", insertedData);
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

async function get_sku_brands(limit, page) {
    try {
        let url = `../../backend/get_sku_brands.php?limit=${limit}&page=${page}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const result = await get_sku_brands(limit, page);
        const brands = result.data;
        const totalCount = result.count;
        const totalPages = Math.ceil(totalCount / limit);

        const brandDataContainer = document.getElementById('brand-data-container');
        brandDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
            `<th>Name</th>
             <th>Action</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'data-tbody';
        brands.forEach(brand => {
            const tableRow = document.createElement('tr');

            const deleteButtonCell = Cell.createDeleteButtonCell();
            const deleteButton = deleteButtonCell.firstChild;
            deleteButton.addEventListener('click', async () => {
                const confirmAlert = await Alert.showConfirmModal("Are you sure you want to delete the rows?");
                
                if (!confirmAlert.isConfirmed) {
                    return;
                }

                const result = await DataController._delete("sku_brands", "id", brand.id);
                if (result&&result.status) {
                    Alert.showSuccessMessage('Delete successful');
                } else {
                    Alert.showErrorMessage('Delete failed');
                }
                Cell.closeEditModal();
                generateTable(100, 1);
            });
            
            tableRow.appendChild(Cell.createInputOnModalCell('SKU Brand', brand.id, 'name', brand.name));
            tableRow.appendChild(deleteButtonCell);
            tableBody.appendChild(tableRow);
        });
        tableElement.appendChild(tableBody);

        brandDataContainer.appendChild(tableElement);

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