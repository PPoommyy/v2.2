import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

const get_stock_search = async(searchTerm) => {
    try {
        const response = await axios.get(`../../backend/get/stock/get_stock_search.php?searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_stock = async (table, limit, page) => {
    try {
        const response = await axios.get(`../../backend/get/stock/get_stock.php?table=${table}&limit=${limit}&page=${page}`);
        return response;
    } catch (error) {
        throw error;
    }
};

const update_stock = async(to_update) => {
    try {
        const response = await axios.post(`../../backend/update/update_stock.php`,
            {
                to_update
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
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

const createTableCell = (element, colspan) => {
    const cell = document.createElement('td');
    cell.classList.add(`col-${colspan}`);
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
        const skuOptions = await get_stock_search(searchTerm);
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
    skuOptions.forEach((skuOption, index) => {
        const list = document.createElement('li');
        const option = document.createElement('a');
        const sku = skuOption.order_product_sku;
        const id = skuOption.id;
        const name = skuOption.report_product_name;
        const total_remaining = skuOption.total_remaining;
        if (index === 0) {
            option.classList.add('dropdown-item', 'active');
        } else {
            option.classList.add('dropdown-item');
        }
        option.setAttribute('order_product_sku_option', sku);
        option.setAttribute('order_product_id', id);
        option.setAttribute('order_product_name', name);
        option.setAttribute('total_remaining', total_remaining);
        option.value = sku;
        option.textContent = sku;
        option.addEventListener('click', function (event) {
            event.preventDefault();
            const selectedValue = this.getAttribute('order_product_sku_option');
            skuInput.setAttribute('order_product_id', this.getAttribute('order_product_id'));
            skuInput.setAttribute('order_product_name', this.getAttribute('order_product_name'));
            skuInput.setAttribute('total_remaining', this.getAttribute('total_remaining'));
            skuInput.dispatchEvent(new Event('change'));
            const itemRow = skuInput.closest('.item');
            const remainingQuantityInput = itemRow.querySelector('.total-remaining');
            remainingQuantityInput.value = this.getAttribute('total_remaining');
            skuInput.value = selectedValue;
        });
        list.appendChild(option);
        skuDropdown.appendChild(list);
    });
}

const generateItemListTable = () => {
    const itemDataContainer = document.getElementById('item-data-container');
    itemDataContainer.innerHTML = '';
    
    const tableElement = document.createElement('table');
    tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');
    
    const tableHeader = document.createElement('thead');
    const tableHeaderRow = document.createElement('tr');
    tableHeaderRow.classList.add('row');
    tableHeaderRow.innerHTML =
        `
            <th class="col-6">Product SKU</th>
            <th class="col-2">Remaining Quantity</th>
            <th class="col-2">Quantity</th>
            <th class="col-2"></th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);
    
    const tableBody = document.createElement('tbody');
    tableBody.id = 'item-list-body';
    tableElement.appendChild(tableBody);
    itemDataContainer.appendChild(tableElement);
}
const addProductButton = document.getElementById('add-product');
const insertStockButton = document.getElementById('insert-stock');

addProductButton.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('item-list-body');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('item', 'row');

    const skuInput = createInput('text', 'order-product-sku', '', false);
    const skuDiv = createSkuDiv(skuInput)
    tableRow.appendChild(createTableCell(skuDiv, 6));

    const remainingQuantityInput = createInput('number', 'total-remaining', 1, false);
    tableRow.appendChild(createTableCell(remainingQuantityInput, 2));

    const quantityInput = createInput('number', 'quantity', 1, false);
    quantityInput.min = 1;
    tableRow.appendChild(createTableCell(quantityInput, 2));

    quantityInput.addEventListener('input', function () {
        const maxValue = parseInt(this.max, 10);
        const currentValue = parseInt(this.value, 10);
    
        if (currentValue > maxValue) {
            this.value = maxValue;
        }
    });

    skuInput.addEventListener('change', function () {
        const totalRemaining = parseInt(this.getAttribute('total_remaining'), 10);
        quantityInput.max = totalRemaining;
    
        // 🔹 รีเซ็ตค่าให้อยู่ในช่วงที่กำหนด
        if (parseInt(quantityInput.value, 10) > totalRemaining) {
            quantityInput.value = totalRemaining;
        }
    });

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
    removeButton.addEventListener('click', () =>{
        tableRow.remove();
    });
    tableRow.appendChild(createTableCell(removeButton, 2));
    tbody.appendChild(tableRow);
});

insertStockButton.addEventListener('click', async function (event) {
    event.preventDefault();
    const itemRows = document.querySelectorAll('.item');
    const items = Array.from(itemRows).map((itemRow) => {
        const skuInput = itemRow.querySelector('.order-product-sku');
        const quantityInput = itemRow.querySelector('.quantity-purchased');
        return {
            sku_settings_id: skuInput.getAttribute('order_product_id'),
            quantity: quantityInput.value,
            total_remaining: quantityInput.value
        }
    });
    // console.log(items);
    
    try {
        toggleSpinner(true);
        // const response = await DataController.insert("stock", items);
        items.forEach(async (item) => {
            const response = await DataController.insert("stock", item);
            console.log(response);
        });
        Alert.showSuccessMessage("Stock inserted successfully", "success");
        setTimeout(() => {
            // location.reload();
        }, 3000);
    } catch (error) {
        console.error(error);
        Alert.showErrorMessage("Failed to insert stock", "danger");
    } finally {
        toggleSpinner(false);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    toggleSpinner(false);
    generateItemListTable();
});