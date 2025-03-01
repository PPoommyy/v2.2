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

const addSetButton = document.getElementById('add-set-button');
const saveButton = document.getElementById('save-button');
addSetButton.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('data-tbody');
    const tableRow = document.createElement('tr');
    const itemsTableRow = document.createElement('tr');
    tableRow.classList.add('new-set')
    tableRow.appendChild(Cell.createInputCell("order_product_sku", "Enter Set SKU"));
    tableRow.appendChild(Cell.createInputCell("report_product_name", "Enter Set Name"));
    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger');
    removeButton.innerHTML = '<i class="fa fa-xmark"></i>';
    removeButton.addEventListener('click', () => {
        tableRow.remove();
        itemsTableRow.remove();
        const newRow = document.querySelectorAll('.new-set');
        if (newRow.length === 0){
            saveButton.setAttribute('disabled', '');
        }
    });
    
    const itemColumn = document.createElement('td');
    itemColumn.colSpan = 3;
    const itemTableElement = document.createElement('table');
    itemTableElement.classList.add('table', 'table-light', 'table-bordered', 'table-striped', 'table-hover');
    const itemHeader = document.createElement('thead');
    const itemHeaderRow = document.createElement('tr');
    itemHeaderRow.innerHTML =
    `<th>Item SKU</th>
     <th>Item Quantity</th>
     <th>Remove Item?</th>`;
    itemHeader.appendChild(itemHeaderRow);
    itemTableElement.appendChild(itemHeader);
    const itemTableBody = document.createElement('tbody');
    const addSetItemsButton = document.createElement('button');
    addSetItemsButton.classList.add('btn', 'btn-warning');
    addSetItemsButton.innerHTML = '<i class="fa fa-plus"></i>';
    addSetItemsButton.addEventListener('click', function (event) {
        event.preventDefault();
        const trow = document.createElement('tr');
        trow.classList.add('item');
        trow.setAttribute('product-set-id', "");
        const skuInput = createInput('text', 'order-product-sku', '', false);
        const skuDiv = createSkuDiv(skuInput)
        trow.appendChild(Cell.createElementCell(skuDiv));
        const quantityInput = createInput('number', 'quantity', 1, false);
        trow.appendChild(Cell.createElementCell(quantityInput));
        const removeButton = document.createElement('button');
        removeButton.classList.add('btn', 'btn-danger');
        removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeButton.addEventListener('click', () =>{
            trow.remove();
        });
        trow.appendChild(Cell.createElementCell(removeButton, 2, false, ['text-center']));
        itemTableBody.appendChild(trow);
    });
    itemTableElement.appendChild(itemTableBody);
    itemColumn.appendChild(itemTableElement);

    itemsTableRow.appendChild(itemColumn);
    tableRow.appendChild(Cell.createElementCell([removeButton, addSetItemsButton], 2, false, ['text-center']));
    tbody.insertBefore(itemsTableRow, tbody.firstChild);
    tbody.insertBefore(tableRow, tbody.firstChild);
    saveButton.removeAttribute('disabled');
});

saveButton.addEventListener('click', async () => {
    const confirmAlert = await Alert.showConfirmModal("Are you sure you want to insert the rows?");

    if (!confirmAlert.isConfirmed) {
        return;
    }

    const tbody = document.getElementById('data-tbody');
    const newSetRows = tbody.querySelectorAll('.new-set');
    const to_insert_items = [];

    if (newSetRows.length > 0) {
        for (const newSetRow of newSetRows) {
            const inputs = newSetRow.querySelectorAll('input');
            const newSetItemRows = newSetRow.nextSibling;
            const items = newSetItemRows.querySelectorAll('.item');
            const insertedData = {
                date_created: new Date().toISOString().slice(0, 19).replace('T', ' '),
            };

            let hasEmptyValue = false;

            inputs.forEach((input) => {
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
                    title: `Set input has empty values`,
                    text: 'Please fill in all fields for each row.',
                    icon: 'error',
                });
                break;
            }

            const res = await DataController.insert("sku_settings", insertedData);
            items.forEach(item => {
                item.setAttribute("product-set-id", res.status);
            });
        }
    }

    const newItemRows = tbody.querySelectorAll('.item');

    if (newItemRows.length > 0) {
        for (const newItemRow of newItemRows) {
            const skuInput = newItemRow.querySelector('input.order-product-sku');
            const quantityInput = newItemRow.querySelector('input.quantity');
            let id = parseInt(skuInput.getAttribute('product_set_item_id'));
            const productSetId = parseInt(newItemRow.getAttribute('product-set-id'));
    
            const sku = skuInput.value;
            const quantity = parseInt(quantityInput.value);
            if (sku) {
                if (!id) {
                    const result = await get_sku_by_name(sku);
                    if (result.status === 200) {
                        id = parseInt(result.data[0].id);
                    } else {
                        Alert.showErrorMessage(`Couldn't find Product "${sku}" in database`);
                    }
                }
    
                const existingItem = to_insert_items.find((item) => item.product_set_item_id === id && item.product_set_id === productSetId);
    
                if (existingItem) {
                    existingItem.quantity = parseInt(existingItem.quantity) + parseInt(quantity);
                } else {
                    const newItem = {
                        product_set_id: productSetId,
                        product_set_item_id: id,
                        quantity: quantity
                    };
                    to_insert_items.push(newItem);
                }
            }
        }
    }

    if (to_insert_items && to_insert_items.length > 0) {
        for (const to_insert_item of to_insert_items) {
            const res = await DataController.insert("product_set_items", to_insert_item);
        };
    }
    //Alert.showSuccessMessage("Product set saved successfully!");
    generateTable(100, 1);
});



const get_product_sets = async(limit, page) => {
    try {
        let url = `../../backend/get/get_product_sets.php?limit=${limit}&page=${page}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const get_sku_search = async(searchTerm) => {
    try {
        const response = await axios.get(`../../backend/get/sku/get_sku_search.php?searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_sku_by_name = async (name) => {
    try {
        const response = await axios.get(`../../backend/get/sku/get_sku_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const generateTable = async(limit, page) => {
    try {
        toggleSpinner(true);
        const result = await get_product_sets(limit, page);
        const product_sets = result.product_sets;
        const totalCount = result.count;
        const totalPages = Math.ceil(totalCount / limit);

        const dataContainer = document.getElementById('data-container');
        dataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-dark', 'table-bordered', 'table-striped');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
            `<th>Set SKU</th>
             <th>Set Name</th>
             <th>Add Item?</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        const tableBody = document.createElement('tbody');
        tableBody.id = 'data-tbody';
        product_sets.forEach(product_set => {
            const { details, items } = product_set;
            const tableRow = document.createElement('tr');
            const itemsTableRow = document.createElement('tr');
            const addSetItemsButton = document.createElement('button');
            addSetItemsButton.classList.add('btn', 'btn-warning');
            addSetItemsButton.innerHTML = '<i class="fa fa-plus"></i>';
            addSetItemsButton.addEventListener('click', function (event) {
                event.preventDefault();
                const tbody = document.getElementById(`set-${details.product_set_id}`);
                const trow = document.createElement('tr');
                trow.classList.add('item');
                trow.setAttribute('product-set-id', details.product_set_id);
                const skuInput = createInput('text', 'order-product-sku', '', false);
                const skuDiv = createSkuDiv(skuInput)
                trow.appendChild(Cell.createElementCell(skuDiv));
                const quantityInput = createInput('number', 'quantity', 1, false);
                trow.appendChild(Cell.createElementCell(quantityInput));
                const removeButton = document.createElement('button');
                removeButton.classList.add('btn', 'btn-danger');
                removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeButton.addEventListener('click', () =>{
                    trow.remove();
                });
                trow.appendChild(Cell.createElementCell(removeButton, 2, false, ['text-center']));
                tbody.appendChild(trow);
            });

            tableRow.appendChild(Cell.createInputOnModalCell('Set SKU', details.product_set_id, 'order_product_sku', details.order_product_sku));
            tableRow.appendChild(Cell.createInputOnModalCell('Set Name', details.product_set_id, 'report_product_name', details.report_product_name));
            tableRow.appendChild(Cell.createElementCell(addSetItemsButton, false, false, ['text-center']));
            tableBody.appendChild(tableRow);
            itemsTableRow.appendChild(createItemsTable(details, items));
            tableBody.appendChild(itemsTableRow);
        });
        tableElement.appendChild(tableBody);
        dataContainer.appendChild(tableElement);

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

const createInput = (type, key, value, isDisabled) => {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.setAttribute('for', key);
    input.classList.add('w-100', key);
    if (isDisabled) {
        input.disabled = true;
    }
    return input;
}

const createTableCell = (element) => {
    const cell = document.createElement('td');
    cell.appendChild(element);
    return cell;
}

const createSkuDiv = (skuInput) => {
    const skuDiv = document.createElement('div');
    skuDiv.classList.add('dropdown')
    const skuDropdown = document.createElement('ul');
    skuDropdown.classList.add('dropdown-menu');
    skuInput.classList.add('dropdown-toggle');
    skuInput.setAttribute('data-bs-toggle', 'dropdown');
    skuInput.addEventListener('input', async () => {
        skuInput.removeAttribute('order_product_id');
        skuInput.removeAttribute('order_product_name');
        const searchTerm = skuInput.value;
        const skuOptions = await get_sku_search(searchTerm);
        updateSkuDropdown(skuOptions.data, skuInput, skuDropdown);
    });

    skuInput.addEventListener('keyup', function (event) {
        const activeOption = skuDropdown.querySelector('.dropdown-item.active');
        const options = skuDropdown.querySelectorAll('.dropdown-item');
        const currentIndex = Array.from(options).indexOf(activeOption);
        if ((event.key === 'Enter' || event.keyCode === 13) && options.length > 0) {
            event.preventDefault();
            const selectedValue = activeOption.getAttribute('order_product_sku_option');
            skuInput.setAttribute('order_product_id', activeOption.getAttribute('order_product_id'));
            skuInput.setAttribute('order_product_name', activeOption.getAttribute('order_product_name'));
            skuInput.value = selectedValue;
        }
        if ((event.key === 'ArrowUp' || event.keyCode === 38 || event.key === 'Up') && currentIndex > 0) {
            event.preventDefault();
            options[currentIndex].classList.remove('active');
            options[currentIndex - 1].classList.add('active');
        }
    
        if ((event.key === 'ArrowDown' || event.keyCode === 40 || event.key === 'Down') && currentIndex < options.length - 1) {
            event.preventDefault();
            options[currentIndex].classList.remove('active');
            options[currentIndex + 1].classList.add('active');
        }
    });
    skuDiv.appendChild(skuInput);
    skuDiv.appendChild(skuDropdown);
    return skuDiv;
}

const updateSkuDropdown = (skuOptions, skuInput, skuDropdown) => {
    skuDropdown.innerHTML = '';
    if (skuOptions.length === 0) {
        skuDropdown.classList.add('d-none');
    } else{
        skuDropdown.classList.remove('d-none');
    }
    skuOptions.forEach((order_product_sku, index) => {
        const list = document.createElement('li');
        const option = document.createElement('a');
        const sku = order_product_sku.order_product_sku;
        const id = order_product_sku.id;
        const name = order_product_sku.report_product_name;
        if (index === 0) {
            option.classList.add('dropdown-item', 'active');
        } else {
            option.classList.add('dropdown-item');
        }
        option.setAttribute('order_product_sku_option', sku);
        option.setAttribute('product_set_item_id', id);
        option.setAttribute('report_product_name', name);
        option.value = sku;
        option.textContent = sku;
        option.addEventListener('click', function (event) {
            event.preventDefault();
            const selectedValue = this.getAttribute('order_product_sku_option');
            skuInput.setAttribute('product_set_item_id', this.getAttribute('product_set_item_id'));
            skuInput.setAttribute('report_product_name', this.getAttribute('report_product_name'));
            skuInput.value = selectedValue;
        });
        list.appendChild(option);
        skuDropdown.appendChild(list);
    });
}

const createItemsTable = (details, items) => {
    const itemColumn = document.createElement('td');
    itemColumn.colSpan = 3;
    const itemTableElement = document.createElement('table');
    itemTableElement.classList.add('table', 'table-light', 'table-bordered', 'table-striped', 'table-hover');
    const itemHeader = document.createElement('thead');
    const itemHeaderRow = document.createElement('tr');
    itemHeaderRow.innerHTML =
    `<th>Item SKU</th>
     <th>Item Quantity</th>
     <th>Remove Item?</th>`;
    itemHeader.appendChild(itemHeaderRow);
    itemTableElement.appendChild(itemHeader);
    const itemTableBody = document.createElement('tbody');
    itemTableBody.id = `set-${details.product_set_id}`;
    const addOptionButton = document.createElement('button');
    addOptionButton.classList.add('btn', 'btn-primary');
    addOptionButton.innerHTML = '<i class="fa fa-plus>'
    items.forEach(item => {
        const itemRow = document.createElement('tr');
        const deleteButtonCell = Cell.createDeleteButtonCell();
        const deleteButton = deleteButtonCell.firstChild;
        deleteButton.addEventListener('click', async () => {
            const confirmAlert = await Alert.showConfirmModal("Are you sure you want to remove this item?");
            
            if (!confirmAlert.isConfirmed) {
                return;
            }

            const result = await DataController._delete("product_set_items", "id", item.id);
            if (result&&result.status) {
                Alert.showSuccessMessage('Delete successful');
            } else {
                Alert.showErrorMessage('Delete failed');
            }
            Cell.closeEditModal();
            generateTable(100, 1);
        });
        itemRow.appendChild(Cell.createSpanCell(item.order_product_sku));
        itemRow.appendChild(Cell.createInputOnModalCell("Item Quantity", "quantity", item.id, item.quantity));
        itemRow.appendChild(deleteButtonCell);
        itemRow.appendChild(addOptionButton);
        itemTableBody.appendChild(itemRow);
    });
    itemTableBody.appendChild(addOptionButton);
    itemTableElement.appendChild(itemTableBody);
    itemColumn.appendChild(itemTableElement);
    return itemColumn;
}

generateTable(100, 1);