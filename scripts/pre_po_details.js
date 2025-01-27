import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Pagination } from "../components/Pagination.js";
import { Cell } from "../components/Cell.js";

// get factoryId from url
const factoryId = new URLSearchParams(window.location.search).get('factory_id');
const get_factory_list = async (limit, page) => {
    try {
        const url = `../datasets/get_factory_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const get_factory_details = async (factoryId) => {
    try {
        const response = await DataController.selectByKey("factories", "id", parseInt(factoryId));
        return response;
    } catch (error) {
        throw error;
    }
};

const get_factory_skus = async (factory_id, page) => {
    try {
        const url = `../datasets/get_factory_skus.php?factory_id=${factory_id}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
};


const get_pre_po_order = async (factory_id) => {
    try {
        let url = `../datasets/get_pre_po_orders.php?factory_id=${factory_id}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
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

const generateDropdown = async () => {
    const dropdownMenu = document.getElementById('dropdown-menu'); // Using getElementById
    dropdownMenu.innerHTML = ''; // Clear existing options

    try {
        const factoryData = await get_factory_list(100, 1);
        const factories = factoryData.data1;

        factories.forEach(factory => {
            const { details } = factory;
            const { id, name } = details;

            const option = document.createElement('a');
            option.classList.add('dropdown-item');
            option.href = '#';
            option.textContent = name;
            option.dataset.factoryId = id; // Add a data attribute for factory ID

            // Add event listener for selecting a factory
            option.addEventListener('click', (event) => {
                event.preventDefault();
                handleFactorySelection(option);
            });

            dropdownMenu.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching factory list:", error);
        Alert.showErrorMessage("Failed to load factory list.");
    }
};

const handleFactorySelection = (selectedOption) => {
    const selectButton = document.getElementById('select-factory');
    selectButton.textContent = selectedOption.textContent;
    selectButton.dataset.factoryId = selectedOption.dataset.factoryId;
    loadFactorySkus(selectedOption.dataset.factoryId);
};

let checkboxStates = [];

const loadFactorySkus = async (factoryId) => {
    try {
        /* 
            1. show order table with items more than 1

            example data:
            [
        {
            "details": {
                "order_id": "67402461ertto",
                "payments_date": "2024-11-22 00:00:00",
                "buyer_name": "Krzysztof Pietraszek",
                "ship_phone_number": "T. 503985431",
                "ship_promotion_discount": 0,
                "shipping_fee": 10,
                "deposit": null,
                "ship_address_1": "Wojska Polskiego",
                "ship_address_2": "46/9",
                "ship_address_3": "Elk",
                "ship_city": "Elk",
                "ship_state": "Warminsko-Mazurskie",
                "ship_postal_code": "19-300",
                "ship_country": "PL",
                "timesort": "24110002",
                "raw_address": "Krzysztof Pietraszek\nWojska Polskiego\n46/9 · Wojska Polskiego\nElk · 19-300\nWarminsko-Mazurskie · Poland\nT. 503985431",
                "override_address": null,
                "order_note": "",
                "fulfillment_status": "Processing",
                "website_name": "boxsensegear.com",
                "website_id": 19,
                "currency_code": "USD",
                "currency_id": 146,
                "payment_methods": "Paypal",
                "payment_method_id": 1,
                "order_status": "Processing",
                "order_status_id": 1
            },
            "items": [
                {
                    "unique_id": "67402461ertto,2205",
                    "order_item_id": "2205",
                    "sku_settings_id": 2205,
                    "item_price": 123,
                    "quantity_purchased": 1,
                    "shipping_price": 0,
                    "total": 123,
                    "order_product_sku": "BXHW-BORAN",
                    "report_product_name": "เชือกพันมือมวยโบราณ ผู้ใหญ่",
                    "factory_sku_settings_id": 73
                }
            ]
        },
        {
            "details": {
                "order_id": "674023e9o595w",
                "payments_date": "2024-11-22 00:00:00",
                "buyer_name": "Joseph Rennie",
                "ship_phone_number": "T. +44 7359 191184",
                "ship_promotion_discount": 0,
                "shipping_fee": 9.9900000000000002131628207280300557613372802734375,
                "deposit": null,
                "ship_address_1": "14 Cupar crescent",
                "ship_address_2": "Corby",
                "ship_address_3": "Northamptonshire",
                "ship_city": "Corby",
                "ship_state": "Northamptonshire",
                "ship_postal_code": "NN17 1RG",
                "ship_country": "UK",
                "timesort": "24110001",
                "raw_address": "Joseph Rennie\n14 Cupar crescent·\nCorby · NN17 1RG\nNorthamptonshire · United Kingdom\nT. +44 7359 191184\nJosephrennie2000@gmail.com",
                "override_address": "",
                "order_note": "",
                "fulfillment_status": "Processing",
                "website_name": "deboxe.com",
                "website_id": 13,
                "currency_code": "EUR",
                "currency_id": 44,
                "payment_methods": "Stripe Credit Card",
                "payment_method_id": 17,
                "order_status": "Processing",
                "order_status_id": 1
            },
            "items": []
        }]
        */
        toggleSpinner(true);
        const pre_po_order = await get_pre_po_order(factoryId);
        const orders = pre_po_order.data1;

        const orderDataContainer = document.getElementById('order-skus');
        orderDataContainer.innerHTML = '';
        checkboxStates = [];

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');

        // Checkbox เลือกทั้งหมด
        tableHeaderRow.innerHTML = `
            <th>
                <input id="allItems" type="checkbox" name="Allitems" value="-1" data-toggle="tooltip" title="Select All"/>
            </th>
            <th>Detail</th>
            <th>TIME SORT</th>
            <th>Buyer Name</th>
            <th>Report Product Name</th>
            <th>Channel</th>
            <th>Currency</th>
            <th>Product Status</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');

        orders.forEach(order => {
            const { details, items } = order;
            
            if (items.length === 0) return;
            
            const { timesort, order_id, buyer_name, website_name, currency_code, order_status, fulfillment_status, order_note } = details;
        
            // **สร้างแถวหลักของ Order**
            const tableRow = document.createElement('tr');
        
            // **สร้าง Order Checkbox (เลือกทั้ง order)**
            const orderCheckbox = document.createElement('input');
            orderCheckbox.type = 'checkbox';
            orderCheckbox.name = 'orderCheckbox';
            orderCheckbox.value = timesort;
            orderCheckbox.dataset.orderId = order_id;  // เพิ่ม order_id เป็น data attribute
        
            orderCheckbox.addEventListener('change', function () {
                const itemCheckboxes = document.querySelectorAll(`input[name="itemCheckbox"][data-order-id="${order_id}"]`);
                itemCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                    updateCheckBoxList(checkbox.value, order_id, this.checked);
                });
            });            
        
            // **สร้าง Checkbox สำหรับ Item ตัวแรก**
            const firstItemCheckbox = document.createElement('input');
            firstItemCheckbox.type = 'checkbox';
            firstItemCheckbox.name = 'itemCheckbox';
            firstItemCheckbox.value = items[0].orders_skus_id;
            firstItemCheckbox.dataset.orderId = order_id;  // เพิ่ม order_id เป็น data attribute
        
            // **อัปเดต Order Checkbox เมื่อกด item ตัวแรก**
            firstItemCheckbox.addEventListener('change', function () {
                updateCheckBoxList(this.value, order_id, this.checked);
                updateOrderCheckboxState(order_id);
            });
            
            const productName = document.createElement('span');
            productName.innerText = items[0].report_product_name;
        
            const linkDetails = document.createElement('a');
            linkDetails.href = `order_details.php?order_id=${order_id}`;
            linkDetails.innerText = 'View Detail';
            const isCancel = buyer_name.split(' ')[0] == 'ยกเลิก';
            const buyerNameSpan = document.createElement('span');
            if (isCancel) {
                buyerNameSpan.classList.add('text-danger');
                buyerNameSpan.innerHTML = `(ยกเลิก แก้ไขเป็น ${buyer_name.split(' ')[1]})`;
            } else {
                buyerNameSpan.innerHTML = buyer_name;
            }
            
            const timesortDiv = document.createElement('div');
            const timesortText = document.createElement('p');
            timesortText.innerHTML = timesort;
            timesortDiv.appendChild(timesortText);

            tableRow.appendChild(Cell.createElementCell(orderCheckbox, false, items.length, ['th']));
            tableRow.appendChild(Cell.createElementCell(linkDetails, false, items.length, false));
            tableRow.appendChild(Cell.createElementCell(timesortDiv, false, items.length));
            tableRow.appendChild(Cell.createSpanCell(buyer_name, false, items.length, false));
            tableRow.appendChild(Cell.createElementCell([firstItemCheckbox, productName], false, false, ['d-flex', 'align-items-center', 'gap-3']));
            tableRow.appendChild(Cell.createSpanCell(website_name, false, items.length));
            tableRow.appendChild(Cell.createSpanCell(currency_code, false, items.length));
            tableRow.appendChild(Cell.createSpanCell(fulfillment_status, false, items.length));
        
            tableBody.appendChild(tableRow);
        
            // **สร้างแถวของ Item ที่เหลือ**
            items.slice(1).forEach(item => {
                const itemRow = document.createElement('tr');
        
                // **Checkbox ของ Item**
                const itemCheckbox = document.createElement('input');
                itemCheckbox.type = 'checkbox';
                itemCheckbox.name = 'itemCheckbox';
                itemCheckbox.value = item.orders_skus_id;
                itemCheckbox.dataset.orderId = order_id;  // เพิ่ม order_id เป็น data attribute
        
                itemCheckbox.addEventListener('change', function () {
                    updateCheckBoxList(this.value, order_id, this.checked);
                    updateOrderCheckboxState(order_id);
                });
        
                const productNameSpan = document.createElement('span');
                productNameSpan.innerText = item.report_product_name;
        
                itemRow.appendChild(Cell.createElementCell([itemCheckbox, productNameSpan], false, false, ['d-flex', 'align-items-center', 'gap-3']));
                tableBody.appendChild(itemRow);
            });
        });

        tableElement.appendChild(tableBody);
        orderDataContainer.appendChild(tableElement);

        // ฟังก์ชันอัปเดต state ของ Order Checkbox
        function updateOrderCheckboxState(order_id) {
            const itemCheckboxes = document.querySelectorAll(`input[name="itemCheckbox"][data-order-id="${order_id}"]`);
            const orderCheckbox = document.querySelector('input[name="orderCheckbox"]');
        
            orderCheckbox.checked = [...itemCheckboxes].every(checkbox => checkbox.checked);
        }

        // ฟังก์ชัน Select All
        const allItemsCheckbox = document.getElementById('allItems');
        allItemsCheckbox.addEventListener('change', function () {
            const orderCheckboxes = document.querySelectorAll('input[name="orderCheckbox"]');
            const itemCheckboxes = document.querySelectorAll('input[name="itemCheckbox"]');

            orderCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                checkbox.dispatchEvent(new Event('change'));
            });

            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateCheckBoxList(checkbox.value, this.checked);
            });
        });
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
};

const loadFactoryDetails = async (factoryId) => {
    try {
        toggleSpinner(true);
        const result = await get_factory_details(factoryId);
        const factoryDetails = result.status[0];
        /* <div class="row mb-4">
                    <div class="col-3 text-end">Factory Name</div>
                    <div class="col-9">
                        <input type="text" id="factory-name" class="form-control" placeholder="Factory Name" aria-label="Factory Name" disabled>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Number</div>
                    <div class="col-9">
                        <input type="text" id="factory-number" class="form-control" placeholder="Factory Number" aria-label="Factory Number" disabled>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Email</div>
                    <div class="col-9">
                        <input type="text" id="factory-email" class="form-control" placeholder="Factory Email" aria-label="Factory Email" disabled>
                    </div>
                </div>
                factoryDetails = {
                    "id": 1,
                    "name": "Shanghai Electronics",
                    "location": "Shanghai, China",
                    "contact_person": "Li Wei",
                    "contact_number": "+86-21-12345678",
                    "email_address": "liwei@shanghai-electronics.com"
                }
            */
        const factoryName = document
        console.log(factoryDetails);
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
};

function updateCheckBoxList(sku_id, order_id, checked) {
    const createPoOrderButton = document.getElementById('createPoOrder');

    if (checked) {
        if (!checkboxStates[order_id]) {
            checkboxStates[order_id] = [];
        }
        if (!checkboxStates[order_id].includes(sku_id)) {
            checkboxStates[order_id].push(sku_id);
        }
    } else {
        if (checkboxStates[order_id]) {
            checkboxStates[order_id] = checkboxStates[order_id].filter(id => id !== sku_id);
            if (checkboxStates[order_id].length === 0) {
                delete checkboxStates[order_id];
            }
        }
    }
   //    check to enable createPoOrderButton
    if (Object.keys(checkboxStates).length > 0) {
        createPoOrderButton.removeAttribute('disabled');
    } else {
        createPoOrderButton.setAttribute('disabled', '');
    }
    console.log("Updated checkboxStates: ", checkboxStates);
}

// const createPoOrderButton = document.getElementById('createPoOrder');
// createPoOrderButton.addEventListener("click", function () {
//     const selectedFactory = document.getElementById('select-factory').dataset.factoryId;
//     console.log("selectedFactory", document.getElementById('select-factory').dataset);
    
//     if (!selectedFactory) {
//         Alert.showErrorMessage("กรุณาเลือกโรงงานก่อนสร้าง PO Order");
//         return;
//     }

//     // Create a list of order IDs and their associated SKU IDs
//     const selectedItems = [];
//     for (const orderId in checkboxStates) {
//         const orderSkuIds = checkboxStates[orderId];
//         orderSkuIds.forEach(skuId => {
//             selectedItems.push(`order_id=${orderId}&sku_id=${skuId}`);
//         });
//     }

//     if (selectedItems.length === 0) {
//         Alert.showErrorMessage("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
//         return;
//     }

//     const queryString = `pre_po_details.php?factory_id=${selectedFactory}&${selectedItems.join('&')}`;
//     window.location.href = queryString;
// });

document.addEventListener('DOMContentLoaded', () => {
    console.log("factoryId", factoryId);
    loadFactoryDetails(factoryId);
});