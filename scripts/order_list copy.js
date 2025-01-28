import { updatePagination } from "../components/pagination.js";
import { generateOrderExcel, generateInvoiceExcel } from "../components/Downloader.js";

let checkboxStates = [];

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

const filterButton = document.getElementById('filter-button');
filterButton.addEventListener('click', function () {
    generateTable(limitDropdown.innerText, 1);
});

//on enter the web page
generateTable(20, 1);

async function get_order_count() {
    try {
        const response = await axios.get('../backend/get_order_count.php');
        return response.data[0].count;
    } catch (error) {
        throw error;
    }
}

async function get_order_list(limit, page, filters) {
    try {
        let url = `../backend/get_order_list.php?limit=${limit}&page=${page}`;

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

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const filterValues = getFilterValues();
        const result = await get_order_list(limit, page, filterValues);
        const orders = result.data1;
        const data = result.data2;
        generateDropdown(data);
        const totalCount = await get_order_count();
        const totalPages = Math.ceil(totalCount / limit);

        const orderDataContainer = document.getElementById('order-data-container');
        orderDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `<th>
            <input id="allItems" type="checkbox" data-index="-1" name="Allitems" value="-1" data-toggle="tooltip" data-placement="top" title="Select All"/>
         </th>
         <th>TIME SORT</th>
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
                `<th rowspan=${order.items.length}>
                    <input type="checkbox" name="items" value=${order.details.timesort} />
                 </th>
                 <td rowspan=${order.items.length}>${order.details.timesort}</td>
                 <td rowspan=${order.items.length}><a href="order_details.php?order_id=${order.details.order_id}">View Detail</a></td>
                 <td rowspan=${order.items.length}>${order.details.buyer_name}</td>
                 <td>${order.items[0].report_product_name}</td>
                 <td rowspan=${order.items.length}>${order.all_total}</td>
                 <td rowspan=${order.items.length}>${order.details.website_name}</td>
                 <td rowspan=${order.items.length}>${order.details.currency_code}</td>
                 <td rowspan=${order.items.length}>${order.details.order_status_id}</td>
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
        dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${limit*page} of ${totalCount} rows`;
        updatePagination(page, totalPages, 'pagination1', generateTable);
        updatePagination(page, totalPages, 'pagination2', generateTable);
        
        const selectedAllCheckbox = document.getElementById('allItems');
        const inputCheckbox = document.querySelectorAll('input[name="items"]');
        selectedAllCheckbox.addEventListener('change', function () {
            inputCheckbox.forEach(checkbox => {
                const timesort = checkbox.value;
                updateCheckBoxList(timesort);
                checkbox.checked = this.checked;
            });
        });
        
        inputCheckbox.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const timesort = this.value;
                updateCheckBoxList(timesort);
            });
        });
        const downloadOrdersButton = document.getElementById('downloadOrders');
        const createInvoiceButton = document.getElementById('createInvoices');
        downloadOrdersButton.addEventListener('click', () =>{
            generateOrderExcel(orders, toggleSpinner, checkboxStates);
        })
        createInvoiceButton.addEventListener('click', () =>{
            generateInvoiceExcel(orders, toggleSpinner, checkboxStates);
        })
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
}

async function generateDropdown(data) {
    try {
        const websiteDropdown = document.getElementById('website-dropdown');
        const orderStatusDropdown = document.getElementById('order-status-dropdown');
        const fulfillmentStatusDropdown = document.getElementById('fulfillment-status-dropdown');
        const paymentDropdown = document.getElementById('payment-dropdown');
        const selectedWebsite = document.getElementById('selected-website');
        const selectedOrderStatus = document.getElementById('selected-order-status');
        const selectedFulfillmentStatus = document.getElementById('selected-fulfillment-status');
        const selectedPayment = document.getElementById('selected-payment');
        websiteDropdown.innerHTML='';
        orderStatusDropdown.innerHTML='';
        fulfillmentStatusDropdown.innerHTML='';
        paymentDropdown.innerHTML='';
        appendDropdownList(selectedWebsite, websiteDropdown, "All", 'website-filter');
        appendDropdownList(selectedOrderStatus, orderStatusDropdown, "All", 'order-filter');
        appendDropdownList(selectedFulfillmentStatus, fulfillmentStatusDropdown, "All", 'fulfillment-filter');
        appendDropdownList(selectedPayment, paymentDropdown, "All", 'payment-filter');
        data.websites.forEach(websiteName => {
            appendDropdownList(selectedWebsite, websiteDropdown, websiteName.name, 'website-filter');
        });
        data.order_status_id.forEach(orderStatusName => {
            appendDropdownList(selectedOrderStatus, orderStatusDropdown, orderStatusName.name, 'order-filter');
        });
        data.fulfillment_status.forEach(fulfillmentStatusName => {
            appendDropdownList(selectedFulfillmentStatus, fulfillmentStatusDropdown, fulfillmentStatusName.name, 'fulfillment-filter');
        });
        data.payment_methods.forEach(paymentMethodName => {
            appendDropdownList(selectedPayment, paymentDropdown, paymentMethodName.name, 'payment-filter');
        });
    } catch (error) {
        console.error(error);
    }
}

function appendDropdownList(button, dropdown, name, checkboxId) {
    const list = document.createElement('li');
    const option = document.createElement('a');
    option.classList.add('dropdown-item');
    option.setAttribute('data-value', name);
    option.textContent = name;
    option.addEventListener('click', function (event) {
        event.preventDefault();
        const selectedValue = this.getAttribute('data-value');
        button.textContent = selectedValue;
        const checkbox = document.getElementById(checkboxId);
        checkbox.checked = true;
    });
    list.appendChild(option);
    dropdown.appendChild(list);
}


function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

function getFilterValues() {
    const filters = {
        website: {
            value: document.getElementById('selected-website').textContent,
            include: document.getElementById('website-filter').checked,
        },
        order_status_id: {
            value: document.getElementById('selected-order-status').textContent,
            include: document.getElementById('order-filter').checked,
        },
        fulfillment_status: {
            value: document.getElementById('selected-fulfillment-status').textContent,
            include: document.getElementById('fulfillment-filter').checked,
        },
        payment_method: {
            value: document.getElementById('selected-payment').textContent,
            include: document.getElementById('payment-filter').checked,
        },
    };

    return filters;
}

function updateCheckBoxList(key) {
    const index = checkboxStates.indexOf(key);

    if (index === -1) {
        checkboxStates.push(key);
    } else {
        checkboxStates.splice(index, 1);
    }
    checkboxStates.sort(function(a, b) {return a-b});
}