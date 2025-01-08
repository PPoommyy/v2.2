import { AddressController } from "../components/AddressController.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";

const po_order_id = document.getElementById('orderId').value;
const addProduct = document.getElementById('add-product');

addProduct.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('item-list-body');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('item', 'row');
    const skuInput = createInput('text', 'order-product-sku', '', false);
    const skuDiv = createSkuDiv(skuInput)
    tableRow.appendChild(createTableCell(skuDiv, 5));
    const priceInput = createInput('number', 'item-price', 0, false);
    priceInput.addEventListener('change', () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(priceInput, 2));
    const quantityInput = createInput('number', 'quantity-purchased', 1, false);
    quantityInput.addEventListener('change', () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(quantityInput, 2));
    const totalInput = createInput('number', 'total', 0, true);
    tableRow.appendChild(createTableCell(totalInput, 2));
    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
    removeButton.addEventListener('click', () =>{
        tableRow.remove();
        updateTotal(tableRow);
    });
    tableRow.appendChild(createTableCell(removeButton, 1));
    tbody.appendChild(tableRow);
});

const formattedDate = (date) => {
    if (date) {
        const formattedDate1 = date.split("-").join("/");
        var formattedDate2 = (formattedDate1.indexOf('T') != -1) ? formattedDate1.substring(0, formattedDate1.indexOf('T')) : formattedDate1;
        var newDate = new Date(formattedDate2);

        newDate = new Date((newDate.getMonth() + 1) + '/' + newDate.getDate() + '/' + newDate.getFullYear());
        formattedDate2 = newDate.toDateString();
        return formattedDate2;
    }
    return date;
}

const formatDate = (date) => {
    var _date = date.getFullYear() + '-' + (date.getMonth()+1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    //var _time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
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

const updatedObject = (object, key, oldData, newData) => {
    if ( newData != oldData ) {
        Object.assign(object, { [key]: newData });
    }
    return object;
}

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
  
        const orderDetails = await get_po_order_details(newOrderId);
  
        if (!orderDetails || !orderDetails.data1 || orderDetails.data1.items.length <= 0) {
          break;
        }
      } while (true);
  
      return newOrderId;
    } catch (error) {
      console.error(error);
      throw error;
    }
};

const getFileExtension = (filename) => {
    return filename.split('.').pop();
}

const get_website_datas = async() => {
    try {
        const response = await axios.get(`../datasets/get_website_datas.php`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
async function get_po_order_details(limit, page, filters) {
    try {
        let url = `../datasets/get_po_order_list.php?limit=${limit}&page=${page}`;

        Object.keys(filters).forEach((filter) => {
            const value = filters[filter].value;
            const include = filters[filter].include;

            if ((value && include) && (value!=="All")) {
                url += `&${filter}=${encodeURIComponent(value)}`;
            }
        });

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}
const get_po_order_list = async(po_order_id) => {
    try {
        const response = await axios.get(`../datasets/get_po_order_details.php?po_order_id=${po_order_id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


const get_order_list = async(limit, page) => {
    try {
        let url = `../datasets/get_order_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const get_order_search = async(searchTerm) => {
    try {
        const response = await axios.get(`../datasets/search_orders.php?searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_sku_by_name = async (name) => {
    try {
        const response = await axios.get(`../datasets/get_sku_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_country_code_by_name = async (name) => {
    try {
        const response = await axios.get(`../datasets/get_country_code_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_last_timesort = async(yearAndMonth) => {
    try {
        const response = await axios.get(`../datasets/get_last_timesort.php?year_and_month=${yearAndMonth}`);
        return response.data.last_timesort;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const insert_order = async(order, items) => {
    try {
        const response = await axios.post(
            `../datasets/insert_order.php`,
            {
                order: order,
                items: items
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        Alert.showErrorMessage(error);
        throw error;
    }
}

const update_order = async(key, value, toUpdate) => {
    try {
        const response = await axios.post(
            `../datasets/update_order.php`,
            {
                key,
                value,
                toUpdate
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        Alert.showErrorMessage(error);
        throw error;
    }
}

const update_order_item = async(key, value, toUpdate) => {
    try {
        const response = await axios.post(
            `../datasets/update_order_item.php`,
            {
                key,
                value,
                toUpdate
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        Alert.showErrorMessage(error);
        throw error;
    }
}

const generateItemsListTable = async (po_order_id) => {
    try {
        let orders = [];

        const itemDataContainer = document.getElementById('item-data-container');
        itemDataContainer.innerHTML = '';

        const currencyText = document.getElementById('currency');
        currencyText.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.classList.add('row');
        tableHeaderRow.innerHTML =
            `<th class="col-5">Product SKU</th>
             <th class="col-2">Price</th>
             <th class="col-2">Quantity</th>
             <th class="col-2">Total</th>
             <th class="col-1"></th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'item-list-body';

        // const timesortInput = document.getElementById("timesort-input");
        const timesortInput = createInput('number', 'timesort', "", false);
        const timesortDiv = createTimesortDiv(timesortInput)
        const timesortContainer = document.getElementById("timesort-container");
        timesortContainer.appendChild(timesortDiv);

        if (po_order_id) {
            const result = await get_po_order_details(po_order_id);
            orders = result.data1;
            const { items, details } = orders;
            currencyText.innerHTML = details.currency_code;
            items.forEach((item, index) => {
                const tableRow = document.createElement('tr');
                tableRow.classList.add('item', 'row');
            
                const skuInput = createInput('text', 'order-product-sku', item.order_product_sku, false);
                const skuDiv = createSkuDiv(skuInput)
                tableRow.appendChild(createTableCell(skuDiv, 5));
            
                const priceInput = createInput('number', 'item-price', item.item_price, false);
                priceInput.addEventListener('change', () => updateTotal(tableRow));
                tableRow.appendChild(createTableCell(priceInput, 2));
            
                const quantityInput = createInput('number', 'quantity-purchased', item.quantity_purchased, false);
                quantityInput.addEventListener('change', () => updateTotal(tableRow));
                tableRow.appendChild(createTableCell(quantityInput, 2));
            
                const totalInput = createInput('number', 'total', parseFloat(item.total).toFixed(2), true);
                tableRow.appendChild(createTableCell(totalInput, 2));

                const removeButton = document.createElement('button');
                removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
                removeButton.disabled = index === 0;
                removeButton.addEventListener('click', () =>{
                    tableRow.remove();
                    updateTotal(tableRow);
                });
                tableRow.appendChild(createTableCell(removeButton, 1));

                tableBody.appendChild(tableRow);
            });
            discountField.value = details.ship_promotion_discount;
            shippingFeeField.value = details.shipping_fee;
        } else {
            currencyText.innerHTML = 'BHT';
            const tableRow = document.createElement('tr');
            tableRow.classList.add('item', 'row');
            const skuInput = createInput('text', 'order-product-sku', '', false);
            const skuDiv = createSkuDiv(skuInput);
            tableRow.appendChild(createTableCell(skuDiv, 5));
        
            const priceInput = createInput('number', 'item-price', 0, false);
            priceInput.addEventListener('change', () => updateTotal(tableRow));
            tableRow.appendChild(createTableCell(priceInput, 2));
        
            const quantityInput = createInput('number', 'quantity-purchased', 1, false);
            quantityInput.addEventListener('change', () => updateTotal(tableRow));
            tableRow.appendChild(createTableCell(quantityInput, 2));
        
            const totalInput = createInput('number', 'total', 0, true);
            tableRow.appendChild(createTableCell(totalInput, 2));
        
            const removeButton = document.createElement('button');
            removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
            removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
            removeButton.disabled = true;
            removeButton.addEventListener('click', () =>{
                tableRow.remove();
                updateTotal(tableRow);
            });
            tableRow.appendChild(createTableCell(removeButton, 1));
            tableBody.appendChild(tableRow);
            // discountField.value = 0;
            // shippingFeeField.value = 0;
        }
        tableElement.appendChild(tableBody);
        itemDataContainer.appendChild(tableElement);
        updateSubtotal();
    } catch (error) {
        console.error(error);
    }
}

const generateTable = async(limit, page) => {
    try {
        const result = await get_order_list(limit, page);
        const orders = result.data1;

        const orderDataContainer = document.getElementById('order-data-container');
        orderDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `<th>TIME SORT</th>
         <th>Detail</th>
         <th>Buyer Name</th>
         <th>Report Product Name</th>
         <th>All Total</th>
         <th>Channel</th>
         <th>Currency</th>
         <th>Order Status</th>
         <th>Fulfillment Status</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        orders.forEach(order => {
            const tableRow = document.createElement('tr');
            tableRow.innerHTML =
                `<td rowspan=${order.items.length}>${order.details.timesort}</td>
                 <td rowspan=${order.items.length}><a href="order_details.php?po_order_id=${order.details.po_order_id}">View Detail</a></td>
                 <td rowspan=${order.items.length}>${order.details.buyer_name}</td>
                 <td>${order.items[0].report_product_name}</td>
                 <td rowspan=${order.items.length}>${order.all_total}</td>
                 <td rowspan=${order.items.length}>${order.details.website_name}</td>
                 <td rowspan=${order.items.length}>${order.details.currency_code}</td>
                 <td rowspan=${order.items.length}>${order.details.order_status}</td>
                 <td rowspan=${order.items.length}>${order.details.fulfillment_status}</td>`;
            tableBody.appendChild(tableRow);
            order.items.slice(1).forEach(item => {
                const itemRow = document.createElement('tr');
                itemRow.innerHTML =
                    `<td>${item.report_product_name}</td>`;
                tableBody.appendChild(itemRow);
            });
        });
        tableElement.appendChild(tableBody);
        orderDataContainer.appendChild(tableElement);
    } catch (error) {
        console.error(error);
    }
}


const generateDropdown = async (po_order_id) => {
    try {
        let data;
        if (po_order_id) {
            const result = await get_po_order_details(po_order_id);
            const data1 = result.data1;
            data = result.data2;

            const { 
                raw_address,
                override_address, 
                order_note, 
                payments_date, 
                website_name, 
                currency_code, 
                payment_methods, 
                order_status,
                order_type,
                deposit,
                website_id, 
                currency_id, 
                payment_method_id, 
                order_status_id,
                order_type_id
            } = data1.details;

            const files = data1.files;
            const shipAddressInput = document.getElementById('ship-address-input');
            shipAddressInput.value = raw_address;

            const overrideAddressInput = document.getElementById('override-address-input');
            overrideAddressInput.value = override_address;

            const orderNoteInput = document.getElementById('order-note-input');
            orderNoteInput.value = order_note;

            const orderDateInput = document.getElementById('order-date-input');
            const orderDate = payments_date.split(' ')[0];
            orderDateInput.value = orderDate;

            const hasDepositInput = document.getElementById('hasDeposit');

            const depositInput = document.getElementById('deposit');
            depositInput.value = deposit;
            if (deposit) {
                depositInput.removeAttribute('disabled');
                hasDepositInput.checked = true;
            }

            const websiteButton = document.getElementById('selected-website');
            const currencyButton = document.getElementById('selected-currency');
            const paymentButton = document.getElementById('selected-payment');
            const orderStatusButton = document.getElementById('selected-order-status');
            const orderTypeButton = document.getElementById('selected-order-type');
            const currencyText = document.getElementById('currency');

            websiteButton.textContent = website_name;
            websiteButton.setAttribute('data-id', website_id)
            currencyButton.textContent = currency_code;
            currencyButton.setAttribute('data-id', currency_id);
            paymentButton.textContent = payment_methods;
            paymentButton.setAttribute('data-id', payment_method_id);
            orderStatusButton.textContent = order_status;
            orderStatusButton.setAttribute('data-id', order_status_id);
            orderTypeButton.textContent = order_type;
            orderTypeButton.setAttribute('data-id', order_type_id);
            currencyText.innerText = currency_code;
            
            if(files.length > 0) {
                const fileListGroup = document.getElementById('file-list');
                fileListGroup.innerHTML='';

                files.forEach((file)=>{
                    const listItem = document.createElement('li');
                    listItem.classList.add('list-group-item', 'list-group-item-secondary', 'mb-2');

                    const fileList = document.createElement('span');
                    fileList.classList.add('me-2');
                    fileList.innerHTML = file.file_name;

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('btn', 'btn-danger', 'me-1');
                    deleteButton.innerHTML = 'Delete';

                    deleteButton.addEventListener('click', async ()=>{
                        const result = await DataController._delete("order_files", "id", file.id);
                        if (result.status) {
                            Alert.showSuccessMessage("Delete file successfully!");
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        } else {
                            Alert.showErrorMessage("File deleted failed!");
                        }
                    });

                    const downloadButton = document.createElement('button');
                    downloadButton.classList.add('btn', 'btn-primary');
                    downloadButton.innerHTML = 'Download';
                    downloadButton.addEventListener('click', async ()=>{
                        try {
                            const result = await DataController.download(file.file_pathname);
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(result);
                            link.download = file.file_name;
                            link.click();
                            Alert.showSuccessMessage("Download file successfully!");
                        } catch (error) {
                            Alert.showErrorMessage("File Downloaded failed!");
                        }
                    });
    
                    listItem.appendChild(fileList);
                    listItem.appendChild(deleteButton);
                    listItem.appendChild(downloadButton);
                    fileListGroup.appendChild(listItem);
                });
            }
        } else {
            const result = await get_website_datas();
            data = result;
        }
        
        const websiteDropdown = document.getElementById('website-dropdown');
        const currencyDropdown = document.getElementById('currency-dropdown');
        const paymentDropdown = document.getElementById('payment-dropdown');
        const orderStatusDropdown = document.getElementById('order-status-dropdown');
        const orderTypeDropdown = document.getElementById('order-type-dropdown');
        const selectedWebsite = document.getElementById('selected-website');
        const selectedCurrency = document.getElementById('selected-currency');
        const selectedPayment = document.getElementById('selected-payment');
        const selectedOrderStatus = document.getElementById('selected-order-status');
        const selectedOrderType = document.getElementById('selected-order-type');
        websiteDropdown.innerHTML='';
        currencyDropdown.innerHTML='';
        paymentDropdown.innerHTML='';
        orderStatusDropdown.innerHTML='';
        orderTypeDropdown.innerHTML='';

        data.websites.forEach(website => {
            appendDropdownList(selectedWebsite, websiteDropdown, website, false)
        });
        data.currencies.forEach(currency => {
            appendDropdownList(selectedCurrency, currencyDropdown, currency, currency.description)
        });
        data.payment_methods.forEach(paymentMethod => {
            appendDropdownList(selectedPayment, paymentDropdown, paymentMethod, false)
        });
        data.order_status.forEach(orderStatus => {
            appendDropdownList(selectedOrderStatus, orderStatusDropdown, orderStatus, false)
        });
        data.order_types.forEach(orderType => {
            appendDropdownList(selectedOrderType, orderTypeDropdown, orderType, false)
        });
        selectedCurrency.addEventListener('change', (e) => {
            const currencyText = document.getElementById('currency');
            currencyText.innerHTML = e.target.textContent;
        });
    } catch (error) {
        console.error(error);
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

const createTimesortDiv = (input) => {
    const div = document.createElement('div');
    div.classList.add('dropdown')
    const dropdown = document.createElement('ul');
    dropdown.classList.add('dropdown-menu');
    input.classList.add('dropdown-toggle');
    input.setAttribute('data-bs-toggle', 'dropdown');
    input.addEventListener('input', async () => {
        input.removeAttribute('timesort');
        const searchTerm = input.value;
        const orders = await get_order_search(searchTerm);
        updateTimesortDropdown(orders.data, input, dropdown);
    });

    input.addEventListener('keyup', function (event) {
        const activeOption = dropdown.querySelector('.dropdown-item.active');
        const options = dropdown.querySelectorAll('.dropdown-item');
        const currentIndex = Array.from(options).indexOf(activeOption);
        if ((event.key === 'Enter' || event.keyCode === 13) && options.length > 0) {
            event.preventDefault();
            const selectedValue = activeOption.getAttribute('timesort');
            input.setAttribute('timesort', activeOption.getAttribute('timesort'));
            input.value = selectedValue;
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
    div.appendChild(input);
    div.appendChild(dropdown);
    return div;
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

const updateTotal = async (tableRow) => {
    let item_price = parseFloat(tableRow.querySelector('.item-price').value);
    let quantity_purchased = parseInt(tableRow.querySelector('.quantity-purchased').value);

    if (quantity_purchased > 50) {
        const confirmAlert = await Alert.showConfirmModal(`Add ${quantity_purchased} items?`);
        if (!confirmAlert.isConfirmed) {
            // tableRow.querySelector('.quantity-purchased').value = 0;
            quantity_purchased = 0;
        }
    }

    if (!isNaN(item_price) && !isNaN(quantity_purchased)) {
        const total = (item_price * quantity_purchased).toFixed(2);
        tableRow.querySelector('.total').value = total;
        updateSubtotal();
    }
}

const updateSubtotal = () => {
    const allTotalInputs = document.querySelectorAll('.total');
    let subtotal = 0;

    allTotalInputs.forEach((totalInput) => {
        const totalValue = parseFloat(totalInput.value);
        if (!isNaN(totalValue)) {
            subtotal += totalValue;
        }
    });

    const subtotalField = document.getElementById('subtotal');
    subtotalField.value = subtotal.toFixed(2);

    updateAllTotal(subtotal);
}

const updateAllTotal = (subtotal) => {
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const shippingFee = parseFloat(document.getElementById('shippingFee').value) || 0;
    
    const allTotal = (subtotal - discount + shippingFee).toFixed(2);
    
    const allTotalField = document.getElementById('alltotal');
    allTotalField.innerHTML = allTotal;
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

const updateTimesortDropdown = (orders, input, dropdown) => {
    dropdown.innerHTML = '';
    if (orders.length === 0) {
        dropdown.classList.add('d-none');
    } else{
        dropdown.classList.remove('d-none');
    }
    orders.forEach((order, index) => {
        const list = document.createElement('li');
        const option = document.createElement('a');
        const timesort = order.timesort;
        if (index === 0) {
            option.classList.add('dropdown-item', 'active');
        } else {
            option.classList.add('dropdown-item');
        }
        option.setAttribute('timesort', timesort);
        option.value = timesort;
        option.textContent = timesort;
        option.addEventListener('click', function (event) {
            event.preventDefault();
            const selectedValue = this.getAttribute('timesort');
            input.setAttribute('timesort', this.getAttribute('timesort'));
            input.value = selectedValue;
        });
        list.appendChild(option);
        dropdown.appendChild(list);
    });
}

const appendDropdownList = (button, dropdown, data, description) => {
    const list = document.createElement('li');
    const option = document.createElement('a');
    option.classList.add('dropdown-item');
    option.setAttribute('data-id', data.id);
    option.setAttribute('data-name', data.name);
    option.textContent = description?`${data.name} (${description})`: data.name;
    option.addEventListener('click', function (event) {
        event.preventDefault();
        const selectedId = this.getAttribute('data-id');
        const selectedName = this.getAttribute('data-name');
        button.textContent = description?`${data.name} (${description})`: data.name;
        button.setAttribute('data-id', selectedId);
        if (button.getAttribute('for') == 'select-currency') {
            const currencyText = document.getElementById('currency');
            currencyText.innerHTML = selectedName;
        }
        if (button.getAttribute('for') == 'select-website') {
            const { shipping_fee, currency_name, payment_method, currency_id, payment_method_id } = data;
            const currencyButton = document.getElementById('selected-currency');
            const paymentButton = document.getElementById('selected-payment');
            const currencyText = document.getElementById('currency');
            const shippingFeeInput = document.getElementById('shippingFee');

            currencyButton.textContent = currency_name?currency_name:"BHT";
            currencyButton.setAttribute('data-id', currency_id);
            paymentButton.textContent = payment_method?payment_method:"";
            paymentButton.setAttribute('data-id', payment_method_id);
            currencyText.innerHTML = currency_name?currency_name:"BHT";
            shippingFeeInput.value = shipping_fee?shipping_fee:0;
        }
    });
    if (button.getAttribute('for') == 'select-currency' && data.is_enabled == 0) {
        return;
    }
    list.appendChild(option);
    dropdown.appendChild(list);
}

if (po_order_id){
    generateItemsListTable(po_order_id);
    generateDropdown(po_order_id);
    generateTable(10, 1);
} else {
    generateTable(10, 1);
    generateDropdown(false);
    generateItemsListTable(false);
}