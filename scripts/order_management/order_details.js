import { AddressController } from "../../components/AddressController.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

const order_id = document.getElementById('orderId').value;
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

const discountField = document.getElementById('discount');
const shippingFeeField = document.getElementById('shippingFee');
discountField.addEventListener('change', () => updateSubtotal());
shippingFeeField.addEventListener('change', () => updateSubtotal());

const hasDeposit = document.getElementById('hasDeposit');
hasDeposit.addEventListener('change', (event) => {
    event.preventDefault();
    const deposit = document.getElementById('deposit');
    const isChecked = hasDeposit.checked;
    if (isChecked) {
        deposit.removeAttribute('disabled');
    } else {
        deposit.setAttribute('disabled', '');
        deposit.value = 0;
    }
});

const insertOrderButton = document.getElementById('insert-order');
const saveOrderButton = document.getElementById('save-order');

if (insertOrderButton) {
    insertOrderButton.addEventListener('click', async() => {
        try {
            const tbody = document.getElementById('item-list-body');
            const discount = document.getElementById('discount').value;
            const shippingFee = document.getElementById('shippingFee').value;
            const orderDate = document.getElementById('order-date-input').value;
            const website_id = document.getElementById('selected-website').getAttribute('data-id');
            const payment_method_id = document.getElementById('selected-payment').getAttribute('data-id');
            const currency_id = document.getElementById('selected-currency').getAttribute('data-id');
            const order_status_id = document.getElementById('selected-order-status').getAttribute('data-id');
            const order_type_id = document.getElementById('selected-order-type').getAttribute('data-id');
            const shipAddressInput = document.getElementById('ship-address-input').value;
            const overrideAddressInput = document.getElementById('override-address-input').value;
            const orderNoteInput = document.getElementById('order-note-input').value;
            const fileInput = document.getElementById('file-input');
            const hasDeposit = document.getElementById('hasDeposit');
            const deposit = document.getElementById('deposit').value;

            if (!discount || !shippingFee || !orderDate || !website_id || !payment_method_id || !currency_id || !shipAddressInput) {
                Alert.showErrorMessage('Please input data');
                return;
            }

            const addressSplit = AddressController.splitAddressData(shipAddressInput);
            const addressLineCount = addressSplit.length;
            let haveEmail = false;
            let buyer_email = null;

            if (addressLineCount > 0 && AddressController.isValidEmail(addressSplit[addressLineCount - 1][0])) {
                haveEmail = true;
                buyer_email = addressSplit[addressLineCount - 1][0];
            }
            let country_code_data, buyer_phone_number, ship_city, ship_postal_code, ship_state;

            if (haveEmail && addressLineCount >= 4) {
                country_code_data = await get_country_code_by_name(AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true));
                buyer_phone_number = addressSplit[addressLineCount-2][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
            } else if (addressLineCount >= 4) {
                country_code_data = await get_country_code_by_name(AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, true));
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, false);
            } else {
                country_code_data = null;
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = null;
                ship_postal_code = null;
                ship_state = null;
            }

            const isThai = AddressController.checkThaiProvince(addressSplit);

            const orderId = await generateUniqueOrderId();
            const odate = orderDate.split("-").join("/");
            const idate = new Date(odate);
            const idateYear = String(idate.getFullYear()).slice(-2);
            const idateMonth = (idate.getMonth()+1).toString().padStart(2, '0');
            const insertedDate = formatDate(idate);
            const lastTimeSort = await get_last_timesort(idateYear+""+idateMonth);
            const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

            const formData = new FormData();
            const file = fileInput.files[0];
            if (file) {
                const filename = `file-${Date.now()}.${getFileExtension(file.name)}`;
                formData.append('file', file, filename);
                const response = await DataController.upload(formData, "../files/");
                
                const to_insert_file = {
                    order_id: orderId,
                    file_name: response.fileName,
                    file_pathname: response.filePath,
                }
    
                const res = await DataController.insert("order_files", to_insert_file);
            }

            const newOrder = {
                order_id: orderId,
                payments_date: insertedDate,
                date_created: insertedDate,
                buyer_name: addressSplit[0][0],
                buyer_phone_number: buyer_phone_number,
                recipient_name: addressSplit[0][0],
                ship_phone_number: buyer_phone_number,
                ship_promotion_discount: discount,
                shipping_fee: shippingFee,
                deposit: hasDeposit.checked ? deposit : null,
                ship_address_1: addressLineCount > 4 ? addressSplit[1][0] : null,
                ship_address_2: addressLineCount > 4 ? addressSplit[2][0] : null,
                ship_address_3: addressLineCount > 4 ? addressSplit[3][0] : null,
                ship_city: ship_city,
                ship_state: ship_state,
                ship_postal_code: ship_postal_code,
                ship_country:  isThai ? "TH" : country_code_data ? country_code_data.data : null,
                timesort: newTimeSort,
                website_id: website_id,
                currency_id: currency_id,
                payment_method_id: payment_method_id,
                order_status_id: order_status_id ? order_status_id : 1,
                order_type_id: order_type_id ? order_type_id : country_code_data && country_code_data.data !== "TH" ? 1 : 2,
                raw_address: shipAddressInput,
                override_address: overrideAddressInput || null,
                buyer_email: buyer_email,
                order_note: orderNoteInput
            };
    
            const items = tbody.querySelectorAll('.item');
            const itemsList = [];
            for (const item of items) {
                const skuInput = item.querySelector('input.order-product-sku');
                const priceInput = item.querySelector('input.item-price');
                const quantityInput = item.querySelector('input.quantity-purchased');
    
                let id = parseInt(skuInput.getAttribute('order_product_id'));
    
                const sku = skuInput.value;
                const price = parseFloat(priceInput.value);
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
        
                    const uniqueId = `${orderId},${id}`;
        
                    const existingItem = itemsList.find((item) => item.sku_settings_id === id);
                    
                    if (existingItem && existingItem.item_price === price) {
                        existingItem.quantity_purchased = parseInt(existingItem.quantity_purchased) + parseInt(quantity);
                        existingItem.total = existingItem.quantity_purchased * existingItem.item_price;
                    } else {
                        const newItem = {
                            unique_id: uniqueId,
                            order_item_id: id,
                            order_id: orderId,
                            sku_settings_id: id,
                            item_price: price,
                            shipping_price: 0,
                            quantity_purchased: quantity,
                            total: quantity * price,
                            date_created: insertedDate
                        };
                        itemsList.push(newItem);
                    }
                }
            }
            if (itemsList.length==0) {
                Alert.showErrorMessage("Order item is empty!");
                return;
            }
            const result = await insert_order(newOrder, itemsList);
            if (result && result.res1 && result.res2) {
                Alert.showSuccessMessage("Order Inserted Successfully");

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (result.res1) {
                Alert.showErrorMessage("Order Inserted Failed! Failed to insert order item!");
            } else {
                Alert.showErrorMessage("Order Inserted Failed!");
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });   
}

if (saveOrderButton) {
    saveOrderButton.addEventListener('click', async() => {
        try {
            const order_details = await get_order_details(order_id);
            const { details, items } = order_details.data1;
            const tbody = document.getElementById('item-list-body');
            const discount = document.getElementById('discount').value;
            const shippingFee = document.getElementById('shippingFee').value;
            const orderDate = document.getElementById('order-date-input').value;
            const website_id = document.getElementById('selected-website').getAttribute('data-id');
            const payment_method_id = document.getElementById('selected-payment').getAttribute('data-id');
            const currency_id = document.getElementById('selected-currency').getAttribute('data-id');
            const order_status_id = document.getElementById('selected-order-status').getAttribute('data-id');
            const order_type_id = document.getElementById('selected-order-type').getAttribute('data-id');
            const shipAddressInput = document.getElementById('ship-address-input').value;
            const overrideAddressInput = document.getElementById('override-address-input').value;
            const orderNoteInput = document.getElementById('order-note-input').value;
            const fileInput = document.getElementById('file-input');
            const hasDeposit = document.getElementById('hasDeposit').checked;
            const deposit = document.getElementById('deposit').value;

            if (!discount || !shippingFee || !orderDate || !website_id || !payment_method_id || !currency_id || !shipAddressInput) {
                Alert.showErrorMessage('Please input data');
                return;
            }

            const addressSplit = AddressController.splitAddressData(shipAddressInput);
            const addressLineCount = addressSplit.length;
            let haveEmail = false;
            let buyer_email = null;

            if (addressLineCount > 0 && AddressController.isValidEmail(addressSplit[addressLineCount - 1][0])) {
                haveEmail = true;
                buyer_email = addressSplit[addressLineCount - 1][0];
            }
            let country_code_data, buyer_phone_number, ship_city, ship_postal_code, ship_state;

            if (haveEmail && addressLineCount >= 4) {
                country_code_data = await get_country_code_by_name(AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true));
                buyer_phone_number = addressSplit[addressLineCount-2][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
            } else if (addressLineCount >= 4) {
                country_code_data = await get_country_code_by_name(AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, true));
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, false);
            } else {
                country_code_data = null;
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = null;
                ship_postal_code = null;
                ship_state = null;
            }
            /* const country_code_data = 
            haveEmail ? await get_country_code_by_name(AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true))
            : await get_country_code_by_name(AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, true));
            
            const buyer_email = haveEmail ? addressSplit[addressLineCount-1][0] : null;
            const buyer_phone_number = haveEmail ? addressSplit[addressLineCount-2][0] : addressSplit[addressLineCount - 1][0];
            const ship_city = haveEmail ? AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, false) : AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
            const ship_postal_code = haveEmail ? AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, true) : AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
            const ship_state = haveEmail ? AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false) : AddressController.AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, false); */

            const isThai = AddressController.checkThaiProvince(addressSplit);

            const orderId = details.order_id;

            const payments_date = details.payments_date ? details.payments_date.split(' ')[0] : null;
            const date_created = details.date_created ? details.date_created.split(' ')[0] : null;
            const date_updated = details.date_updated ? details.date_updated.split(' ')[0] : null;
            
            const odate = orderDate.split("-").join("/");
            const idate = new Date(odate);
            const idateYear = String(idate.getFullYear()).slice(-2);
            const idateMonth = (idate.getMonth()+1).toString().padStart(2, '0');
            const insertedDate = formatDate(idate);
            // const lastTimeSort = await get_last_timesort(idateYear+""+idateMonth);
            // const newTimeSort = insertedDate.toString().split(' ')[0] != payments_date.toString() ? generateNewTimeSort(idate, lastTimeSort) : details.timesort;

            var currentDate = new Date();
            currentDate = formatDate(currentDate);
            
            const formData = new FormData();
            const file = fileInput.files[0];
            if (file) {
                const filename = `file-${Date.now()}.${getFileExtension(file.name)}`;
                formData.append('file', file, filename);
                const response = await DataController.upload(formData, "../files/");
                const to_insert_file = {
                    order_id: orderId,
                    file_name: response.fileName,
                    file_pathname: response.filePath,
                }
    
                const res = await DataController.insert("order_files", to_insert_file);
            }
            

            let to_update_order = {};

            to_update_order = updatedObject(to_update_order, "payments_date", payments_date, insertedDate);
            to_update_order = updatedObject(to_update_order, "date_created", date_created, insertedDate);
            to_update_order = updatedObject(to_update_order, "date_updated", date_updated, currentDate);
            
            to_update_order = updatedObject(to_update_order, "buyer_email", details.buyer_email, buyer_email);
            to_update_order = updatedObject(to_update_order, "buyer_name", details.buyer_name, addressSplit[0][0]);
            to_update_order = updatedObject(to_update_order, "buyer_phone_number", details.buyer_phone_number, buyer_phone_number);
            to_update_order = updatedObject(to_update_order, "recipient_name", details.recipient_name, addressSplit[0][0]);

            to_update_order = updatedObject(to_update_order, "ship_phone_number", details.ship_phone_number, buyer_phone_number);
            to_update_order = updatedObject(to_update_order, "ship_promotion_discount", details.ship_promotion_discount, discount);
            to_update_order = updatedObject(to_update_order, "shipping_fee", details.shipping_fee, shippingFee);
            to_update_order = updatedObject(to_update_order, "deposit", details.deposit, hasDeposit ? deposit : null);
            to_update_order = updatedObject(to_update_order, "ship_address_1", details.ship_address_1, addressLineCount > 4 ? addressSplit[1][0] : null);
            to_update_order = updatedObject(to_update_order, "ship_address_2", details.ship_address_2, addressLineCount > 4 ? addressSplit[2][0] : null);
            to_update_order = updatedObject(to_update_order, "ship_address_3", details.ship_address_3, addressLineCount > 4 ? addressSplit[3][0] : null);
            to_update_order = updatedObject(to_update_order, "ship_city", details.ship_city, ship_city);
            to_update_order = updatedObject(to_update_order, "ship_state", details.ship_state, ship_state);
            to_update_order = updatedObject(to_update_order, "ship_postal_code", details.ship_postal_code, ship_postal_code);
            to_update_order = updatedObject(to_update_order, "ship_country", details.ship_country, isThai ? "TH" : country_code_data ? country_code_data.data : null);

            to_update_order = updatedObject(to_update_order, "website_id", details.website_id, website_id);
            to_update_order = updatedObject(to_update_order, "currency_id", details.currency_id, currency_id);
            to_update_order = updatedObject(to_update_order, "payment_method_id", details.payment_method_id, payment_method_id);
            to_update_order = updatedObject(to_update_order, "order_status_id", details.order_status_id, order_status_id);
            to_update_order = updatedObject(to_update_order, "order_type_id", details.order_type_id, order_type_id);
            to_update_order = updatedObject(to_update_order, "raw_address", details.raw_address, shipAddressInput);
            to_update_order = updatedObject(to_update_order, "override_address", details.override_address, overrideAddressInput || null);
            to_update_order = updatedObject(to_update_order, "order_note", details.order_note, orderNoteInput);
            // to_update_order = updatedObject(to_update_order, "timesort", details.timesort, newTimeSort);
    
            const itemsRows = tbody.querySelectorAll('.item');

            if (itemsRows.length==0) {
                Alert.showErrorMessage("Order item can not be empty!");
                return;
            }

            const itemsList = [];
            const to_insert_items = [];
            const to_update_items = [];
            const to_delete_items = items.map(item => item.unique_id);
            for (const itemRow of itemsRows) {
                const skuInput = itemRow.querySelector('input.order-product-sku');
                const priceInput = itemRow.querySelector('input.item-price');
                const quantityInput = itemRow.querySelector('input.quantity-purchased');
    
                let id = parseInt(skuInput.getAttribute('order_product_id'));
    
                const sku = skuInput.value;
                const price = parseFloat(priceInput.value);
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
        
                    const uniqueId = `${orderId},${id}`;
                    const existingItem = itemsList.find((item) => item.sku_settings_id === id);
    
                    if (existingItem && existingItem.item_price === price) {
                        existingItem.quantity_purchased = parseInt(existingItem.quantity_purchased) + parseInt(quantity);
                        existingItem.total = existingItem.quantity_purchased * existingItem.item_price;
                    } else {
                        const newItem = {
                            unique_id: uniqueId,
                            order_item_id: id,
                            order_id: orderId,
                            sku_settings_id: id,
                            item_price: price,
                            shipping_price: 0,
                            quantity_purchased: quantity,
                            total: quantity * price,
                            date_created: formatDate(new Date())
                        };
                        itemsList.push(newItem);
                    }
                }
            }

            for (const itemInList of itemsList) {
                const index = to_delete_items.indexOf(itemInList.unique_id);
                if (index !== -1) {
                    let to_update_items_object = {};
                    to_update_items_object = updatedObject(to_update_items_object, "item_price", items[index].item_price, itemInList.item_price);
                    to_update_items_object = updatedObject(to_update_items_object, "quantity_purchased", items[index].quantity_purchased, itemInList.quantity_purchased);
                    to_update_items_object = updatedObject(to_update_items_object, "total", items[index].total, itemInList.total);
                    if (Object.keys(to_update_items_object).length > 0) {
                        to_update_items_object = updatedObject(to_update_items_object, "unique_id", "", itemInList.unique_id);
                        to_update_items.push(to_update_items_object);
                    }
                    items.splice(index, 1);
                    to_delete_items.splice(index, 1);
                } else {
                    to_insert_items.push(itemInList);
                }
            }

            const swalQueue = Alert.createQueue();

            if (to_insert_items && to_insert_items.length > 0) {
                for (const to_insert_item of to_insert_items) {
                    const res = await DataController.insert("orders_skus", to_insert_item);
                    if (res.status) {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_insert_item.unique_id} inserted successfully!`,
                            icon: 'success',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    } else {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_insert_item.unique_id} inserted failed!`,
                            icon: 'error',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    }
                };
            }

            if (to_update_items && to_update_items.length > 0) {
                for (const to_update_item of to_update_items) {
                    const res = await update_order_item("unique_id", to_update_item.unique_id, to_update_item);
                    if (res.status) {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_update_item.unique_id} updated successfully!`,
                            icon: 'success',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    } else {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_update_item.unique_id} updated failed!`,
                            icon: 'error',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    }
                };
            }

            if (to_delete_items && to_delete_items.length > 0) {
                for (const to_delete_item of to_delete_items) {
                    const res = await DataController._delete("orders_skus", "unique_id", to_delete_item);
                    if (res.status) {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_delete_item} deleted successfully!`,
                            icon: 'success',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    } else {
                        const confirmed = await swalQueue.fire({
                            title: `Item ${to_delete_item} deleted failed!`,
                            icon: 'error',
                            timer: 1000,
                            showCancelButton: false,
                            showConfirmButton: true,
                            confirmButtonText: 'Next &rarr;',
                        });
                    }
                };
            }

            if (to_update_order && Object.keys(to_update_order).length > 0) {
                const res = await update_order("order_id", details.order_id, to_update_order);
                if (res.status) {
                    Alert.showSuccessMessage("Order updated successfully");
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    Alert.showErrorMessage("Order updated failed");
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } else {
                Alert.showSuccessMessage("Order updated successfully");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
            
            generateTable(10, 1);
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

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
  
        const orderDetails = await get_order_details(newOrderId);
  
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
        const response = await axios.get(`../../backend/get/get_website_datas.php`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_order_details = async(order_id) => {
    try {
        const response = await axios.get(`../../backend/get/order/get_order_details.php?order_id=${order_id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_order_list = async(limit, page) => {
    try {
        let url = `../../backend/get/order/get_order_list.php?limit=${limit}&page=${page}`;
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

const get_country_code_by_name = async (name) => {
    try {
        const response = await axios.get(`../../backend/get/get_country_code_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_last_timesort = async(yearAndMonth) => {
    try {
        const response = await axios.get(`../../backend/get/get_last_timesort.php?year_and_month=${yearAndMonth}`);
        return response.data.last_timesort;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const insert_order = async(order, items) => {
    try {
        const response = await axios.post(
            `../../backend/insert/insert_order.php`,
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
            `../../backend/update/update_order.php`,
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
            `../../backend/update/update_order_item.php`,
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

const generateItemsListTable = async (order_id) => {
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
        if (order_id) {
            const result = await get_order_details(order_id);
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
            currencyText.innerHTML = 'USD';
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
            discountField.value = 0;
            shippingFeeField.value = 0;
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
                 <td rowspan=${order.items.length}><a href="order_details.php?order_id=${order.details.order_id}">View Detail</a></td>
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


const generateDropdown = async (order_id) => {
    try {
        let data;
        if (order_id) {
            const result = await get_order_details(order_id);
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

            currencyButton.textContent = currency_name?currency_name:"USD";
            currencyButton.setAttribute('data-id', currency_id);
            paymentButton.textContent = payment_method?payment_method:"";
            paymentButton.setAttribute('data-id', payment_method_id);
            currencyText.innerHTML = currency_name?currency_name:"USD";
            shippingFeeInput.value = shipping_fee?shipping_fee:0;
        }
    });
    if (button.getAttribute('for') == 'select-currency' && data.is_enabled == 0) {
        return;
    }
    list.appendChild(option);
    dropdown.appendChild(list);
}

if (order_id){
    generateItemsListTable(order_id);
    generateDropdown(order_id);
    generateTable(10, 1);
} else {
    generateTable(10, 1);
    generateDropdown(false);
    generateItemsListTable(false);
}