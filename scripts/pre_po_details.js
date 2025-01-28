import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";

const factoryId = new URLSearchParams(window.location.search).get('factory_id');

const get_factory_details = async (factoryId) => {
    try {
        const response = await DataController.selectByKey("factories", "id", parseInt(factoryId));
        return response;
    } catch (error) {
        throw error;
    }
};

const get_factory_sku_search = async(searchTerm, factory_id) => {
    try {
        const response = await axios.get(`../backend/get_factory_sku_search.php?factory_id=${factory_id}&searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_po_order_details = async(po_orders_id) => {
    try {
        const response = await axios.get(`../backend/get_po_order_details.php?po_orders_id=${po_orders_id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_sku_by_name = async (name) => {
    try {
        const response = await axios.get(`../backend/get_sku_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_last_timesort = async(yearAndMonth) => {
    try {
        const response = await axios.get(`../backend/get_last_timesort.php?table=po_orders&year_and_month=${yearAndMonth}`);
        return response.data.last_timesort;
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

const loadFactoryDetails = async (factoryId) => {
    try {
        toggleSpinner(true);
        const result = await get_factory_details(factoryId);
        const factoryDetails = result.status[0];
        const factoryName = document.getElementById('factory-name');
        const factoryNumber = document.getElementById('factory-number');
        const factoryEmail = document.getElementById('factory-email');
        factoryName.value = factoryDetails.name;
        factoryNumber.value = factoryDetails.contact_number;
        factoryEmail.value = factoryDetails.email_address;
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
};

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
        const skuOptions = await get_factory_sku_search(searchTerm, factoryId);
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
        option.setAttribute('order_product_id', id);
        option.setAttribute('order_product_name', name);
        option.value = sku;
        option.textContent = sku;
        option.addEventListener('click', function (event) {
            event.preventDefault();
            const selectedValue = this.getAttribute('order_product_sku_option');
            skuInput.setAttribute('order_product_id', this.getAttribute('order_product_id'));
            skuInput.setAttribute('order_product_name', this.getAttribute('order_product_name'));
            skuInput.value = selectedValue;
        });
        list.appendChild(option);
        skuDropdown.appendChild(list);
    });
}

const generateItemListTable = async () => {
    try {
        toggleSpinner(true);

        const urlParams = new URLSearchParams(window.location.search);
        const factoryId = urlParams.get('factory_id');
        const encodedData = urlParams.get('data');

        if (!factoryId || !encodedData) {
            console.error("Missing required parameters.");
            return;
        }

        const selectedItems = JSON.parse(decodeURIComponent(encodedData));

        const itemDataContainer = document.getElementById('item-data-container');
        itemDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.classList.add('row');
        tableHeaderRow.innerHTML =
            `
             <th class="col-4">Order ID</th>
             <th class="col-4">Product SKU</th>
             <th class="col-3">Quantity</th>
             <th class="col-1"></th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'item-list-body';
        selectedItems.forEach((selectedItem, index) => {
            const { order_id, items } = selectedItem;
            items.forEach(item => {
                const tableRow = document.createElement('tr');
                tableRow.classList.add('item', 'row');
            
                const orderIdSpan = document.createElement('span');
                orderIdSpan.classList.add('order-id');
                orderIdSpan.textContent = order_id;
                tableRow.appendChild(createTableCell(orderIdSpan, 4));

                const skuInput = createInput('text', 'order-product-sku', item.order_product_sku, false);
                const skuDiv = createSkuDiv(skuInput)
                tableRow.appendChild(createTableCell(skuDiv, 4));
                const quantityInput = createInput('number', 'quantity-purchased', item.quantity_purchased, false);
                quantityInput.addEventListener('change', () => updateTotal(tableRow));
                tableRow.appendChild(createTableCell(quantityInput, 3));

                const removeButton = document.createElement('button');
                removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
                removeButton.addEventListener('click', () =>{
                    tableRow.remove();
                });
                tableRow.appendChild(createTableCell(removeButton, 1));

                tableBody.appendChild(tableRow);
            })
        });
        
        tableElement.appendChild(tableBody);
        itemDataContainer.appendChild(tableElement);
    } catch (error) {
        console.error("Error generating item list table:", error);
    } finally {
        toggleSpinner(false);
    }
};

const uniqid = () => {
    var timestamp = Math.floor(new Date().getTime() / 1000);
    var random = Math.random().toString(36).substr(2, 5);
    var uniqueId = timestamp.toString(16) + random;
    return uniqueId;
};

const generateUniqueOrderId = async () => {
    try {
      let newOrderId;
      do {
        newOrderId = uniqid();
  
        const poOrderDetails = await get_po_order_details(newOrderId);
  
        if (!poOrderDetails || !poOrderDetails.data1 || poOrderDetails.data1.items.length <= 0) {
          break;
        }
      } while (true);
  
      return newOrderId;
    } catch (error) {
      console.error(error);
      throw error;
    }
};


const formatDate = (date) => {
    var _date = date.getFullYear() + '-' + (date.getMonth()+1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    var _time = "00:00:00";
    var date_time = _date + ' ' + _time;
    return date_time;
}

const generateNewTimeSort = (date, lastTimeSort) => {
    const resultArray = lastTimeSort ? [lastTimeSort.toString().slice(0, 2), lastTimeSort.toString().slice(2, 4), lastTimeSort.toString().slice(4)] : [];
    const year = String(date.getFullYear()).slice(-2);
    const month = (date.getMonth()+1).toString().padStart(2, '0');
    const sortOrder = (Number(resultArray[2]) + 1).toString().padStart(4, '0');
    var newTimeSort = "";
    newTimeSort += year === resultArray[0] ? resultArray[0] : year;
    newTimeSort += year === resultArray[0] && month === resultArray[1] ? resultArray[1] : month;
    newTimeSort += year === resultArray[0] && month === resultArray[1] ? sortOrder : "0001";
    return newTimeSort;
}

const getFileExtension = (filename) => {
    return filename.split('.').pop();
} 

const addProductButton = document.getElementById('add-product');
const createDraftButton = document.getElementById('create-draft');

addProductButton.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('item-list-body');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('item', 'row');

    const orderIdSpan = document.createElement('span');
    orderIdSpan.classList.add('order-id');
    orderIdSpan.textContent = null;
    tableRow.appendChild(createTableCell(orderIdSpan, 4));

    const skuInput = createInput('text', 'order-product-sku', '', false);
    const skuDiv = createSkuDiv(skuInput)
    tableRow.appendChild(createTableCell(skuDiv, 4));

    const quantityInput = createInput('number', 'quantity-purchased', 1, false);
    quantityInput.addEventListener('change', () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(quantityInput, 3));

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
    removeButton.addEventListener('click', () =>{
        tableRow.remove();
    });
    tableRow.appendChild(createTableCell(removeButton, 1));
    tbody.appendChild(tableRow);
});


createDraftButton.addEventListener('click', async() => {
    try {
        const tbody = document.getElementById('item-list-body');
        const orderNoteInput = document.getElementById('order-note-input').value;
        const fileInput = document.getElementById('file-input');

        const po_orders_id = await generateUniqueOrderId();

        const currentDate = new Date().toISOString().split('T')[0];
        const odate = currentDate.split("-").join("/");
        const idate = new Date(odate);
        const idateYear = String(idate.getFullYear()).slice(-2);
        const idateMonth = (idate.getMonth()+1).toString().padStart(2, '0');
        const lastTimeSort = await get_last_timesort(idateYear+""+idateMonth);
        const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

        const formData = new FormData();
        const file = fileInput.files[0];
        if (file) {
            const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
            formData.append('file', file, filename);
            const response = await DataController.upload(formData, "../files/");
            
            const to_insert_file = {
                po_orders_id: factoryId,
                file_name: response.fileName,
                file_pathname: response.filePath,
            }

            const res = await DataController.insert("po_order_files", to_insert_file);
        }

        const newPOOrder = {
            po_orders_id: po_orders_id,
            timesort: newTimeSort,
            factory_id: factoryId,
            po_orders_status_id:1,
            notes: orderNoteInput
        };

        const items = tbody.querySelectorAll('.item');
        const itemsList = [];
        for (const item of items) {
            const orderID = item.querySelector('span.order-id').innerHTML;
            const skuInput = item.querySelector('input.order-product-sku');
            const quantityInput = item.querySelector('input.quantity-purchased');

            let id = parseInt(skuInput.getAttribute('order_product_id'));

            const sku = skuInput.value;
            const quantity = parseInt(quantityInput.value);
            if (sku) {
                if (!id) {
                    const result = await get_sku_by_name(sku);
                    if (result.status === 200) {
                        id = parseInt(result.data[0].id);
                    } else {
                        Alert.showErrorMessage(`Couldn't find Product "${sku}" in database`);
                        return;
                    }
                }
        
                const newItem = {
                    po_orders_id: po_orders_id,
                    order_id: orderID,
                    sku_settings_id: id,
                    quantity: quantity,
                    unit_price: 0,
                    po_orders_items_status_id: 1,
                };
                itemsList.push(newItem);
            }
        }
        if (itemsList.length==0) {
            Alert.showErrorMessage("PO Order item is empty!");
            return;
        }
        const result1 = await DataController.insert("po_orders", newPOOrder);
        itemsList.forEach(async (item) => {
            const result2 = await DataController.insert("po_orders_items", item);
        });
        if (result1.status) {
            Alert.showSuccessMessage("PO Order Inserted Successfully");
            setTimeout(() => {
                window.location.href = `po_order_list.php`;
            }, 2000);
        } else {
            Alert.showErrorMessage("PO Order Inserted Failed!");
        }
    } catch (error) {
        console.error('Error:', error);
    }
});   

document.addEventListener('DOMContentLoaded', () => {
    loadFactoryDetails(factoryId);
    generateItemListTable();
});