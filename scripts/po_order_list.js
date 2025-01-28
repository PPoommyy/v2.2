import { Pagination } from "../components/Pagination.js";
import { Downloader } from "../components/Downloader.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Cell } from "../components/Cell.js";
import { Modal } from "../components/Modal.js";
import { ThaiPostAPIController } from "../components/ThaiPostAPIController.js";
import { AftershipAPIController } from "../components/AftershipAPIController.js";

let checkboxStates = [];
let po_orders = {};

const limitDropdown = document.getElementById('limitDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
const dropdownTitle = document.getElementById('dropdown-title');
const updateButton = document.getElementById('updateButton');

updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if (value) {
        const result = await DataController.updateByKey("po_orders", "po_orders_id", id, key, value);
        if (result.status) {
            Cell.closeEditModal();
            Alert.showSuccessMessage('Update successful');
            generateTable(100, 1);
        } else {
            Alert.showErrorMessage('Update failed');
        }
    }else {
        Alert.showErrorMessage('Update failed');
    }
});

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

const modal = document.getElementById('editModal');

generateTable(100, 1);

async function get_order_count(filters) {
    try {
        let url = `../backend/get_order_count.php?`;

        Object.keys(filters).forEach((filter) => {
            const value = filters[filter].value;
            const include = filters[filter].include;

            if ((value && include) && (value!=="All")) {
                url += `&${filter}=${encodeURIComponent(value)}`;
            }
        });
        const response = await axios.get(url);
        return response.data[0].count;
    } catch (error) {
        throw error;
    }
}

async function get_po_order_list(limit, page, filters) {
    try {
        let url = `../backend/get_po_order_list.php?limit=${limit}&page=${page}`;

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
        const result = await get_po_order_list(limit, page, filterValues);
        po_orders = result.data1;
        const data = result.data2;
        generateDropdown(data);
        const totalCount = result.data2.count;
        const totalPages = Math.ceil(totalCount / limit);

        const poOrdersDataContainer = document.getElementById('po-orders-data-container');
        poOrdersDataContainer.innerHTML = '';
        checkboxStates = [];

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML = `
            <th>
                <input id="allItems" type="checkbox" name="Allitems" value="-1" data-toggle="tooltip" title="Select All"/>
            </th>
            <th>Detail</th>
            <th>Timesort</th>
            <th>Factory Name</th>
            <th>Report Product Name</th>
            <th>Order Status</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');

        po_orders.forEach(order => {
            const { details, items } = order;
            
            if (items.length === 0) return;
            
            const { 
                po_orders_id,
                po_orders_date,
                timesort,
                total_amount,
                notes,
                factory_name,
                order_status
            } = details;
        
            
            const tableRow = document.createElement('tr');
        
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.name = 'items';
            checkboxInput.value = timesort;

            const linkDetails = document.createElement('a');
            linkDetails.href = `po_order_details.php?po_orders_id=${po_orders_id}`;
            linkDetails.innerText = 'View Detail';
            const timesortDiv = document.createElement('div');
            const timesortText = document.createElement('p');
            timesortText.innerHTML = timesort;
            timesortDiv.appendChild(timesortText);
            
            tableRow.appendChild(Cell.createElementCell(checkboxInput, false, items.length, ['th']));
            tableRow.appendChild(Cell.createElementCell(linkDetails, false, items.length, false));
            tableRow.appendChild(Cell.createElementCell(timesortDiv, false, items.length));
            tableRow.appendChild(Cell.createSpanCell(factory_name, false, items.length, false));
            tableRow.appendChild(Cell.createSpanCell(items[0].report_product_name, false, false, ['d-flex', 'align-items-center', 'gap-3']));
            tableRow.appendChild(Cell.createSpanCell(order_status, false, items.length));
        
            tableBody.appendChild(tableRow);
        
            items.slice(1).forEach(item => {
                const { report_product_name } = item;

                const itemRow = document.createElement('tr');
        
                const productNameSpan = document.createElement('span');
                productNameSpan.innerText = report_product_name;
        
                itemRow.appendChild(Cell.createSpanCell(report_product_name, false, false, ['d-flex', 'align-items-center', 'gap-3']));
                tableBody.appendChild(itemRow);
            });
        });

        tableElement.appendChild(tableBody);
        poOrdersDataContainer.appendChild(tableElement);

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
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
}

async function generateDropdown(data) {
    try {
        const factoryDropdown = document.getElementById('factory-dropdown');
        const orderStatusDropdown = document.getElementById('order-status-dropdown');
        const paymentStatusDropdown = document.getElementById('payment-status-dropdown');
        const selectedFactory = document.getElementById('selected-factory');
        const selectedOrderStatus = document.getElementById('selected-order-status');
        const selectedPaymentStatus = document.getElementById('selected-payment-status');
        const dateInputStart = document.getElementById('order-date-input-start');
        const dateInputEnd = document.getElementById('order-date-input-end');

        
        factoryDropdown.innerHTML='';
        orderStatusDropdown.innerHTML='';
        paymentStatusDropdown.innerHTML='';
        appendDropdownList(selectedFactory, factoryDropdown, "All", 'factory-filter');
        appendDropdownList(selectedOrderStatus, orderStatusDropdown, "All", 'order-filter');
        appendDropdownList(selectedPaymentStatus, paymentStatusDropdown, "All", 'payment-filter');
        data.factories.forEach(factoryName => {
            appendDropdownList(selectedFactory, factoryDropdown, factoryName, 'factory-filter');
        });
        data.po_orders_status.forEach(orderStatusName => {
            appendDropdownList(selectedOrderStatus, orderStatusDropdown, orderStatusName, 'order-filter');
        });
        data.payment_status.forEach(paymentStatusName => {
            appendDropdownList(selectedPaymentStatus, paymentStatusDropdown, paymentStatusName, 'payment-filter');
        });
        dateInputStart.addEventListener('change', () => {
            const checkbox = document.getElementById("daterange-filter");
            checkbox.checked = true;
        });
        dateInputEnd.addEventListener('change', () => {
            const checkbox = document.getElementById("daterange-filter");
            checkbox.checked = true;
        });
    } catch (error) {
        console.error(error);
    }
}

function appendDropdownList(button, dropdown, data, checkboxId) {
    const list = document.createElement('li');
    const option = document.createElement('a');
    option.classList.add('dropdown-item');
    option.setAttribute('data-value', data.id?data.id:data.name?data.name:data);
    option.textContent = data.name;
    option.addEventListener('click', function (event) {
        event.preventDefault();
        const selectedValue = this.getAttribute('data-value');
        const selectedContent = this.textContent;
        button.textContent = selectedContent;
        button.setAttribute('data-value', selectedValue);
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

function toggleDatePicker(inputId) {
    var inputElement = document.getElementById(inputId);
    inputElement.click();
}

function generateFileListContent(files) {
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('file-list-container', 'container'); // Add Bootstrap container class

    // File list container
    const fileListContainer = document.createElement('div');
    fileListContainer.classList.add('file-list-scroll', 'd-flex', 'overflow-auto'); // Add Bootstrap flexbox and wrap

    // Populate the file list container with file items
    files.forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item', 'p-2', 'text-center'); // Add padding and centering
        // console.log(file);
        if (isImageFile(file.file_name)) {
            // Display image if it's an image file
            const imageElement = document.createElement('img');
            imageElement.src = file.file_pathname;
            imageElement.alt = file.file_name;
            imageElement.classList.add('img-fluid', 'mb-2'); // Use Bootstrap img-fluid class for responsive images
            fileItem.appendChild(imageElement);
        } else if (isTxtFile(file.file_name)) {
            // Display .txt file using iframe
            const iframeElement = document.createElement('iframe');
            iframeElement.src = file.file_pathname;
            iframeElement.width = '100%'; // Use Bootstrap width class for responsiveness
            iframeElement.classList.add('border', 'p-2', 'mb-2'); // Add border, padding, and margin
            fileItem.appendChild(iframeElement);
        }

        // console.log(fileItem);
        // Display file name and download button
        const fileNameElement = document.createElement('p');
        fileNameElement.textContent = file.file_name;
        fileNameElement.classList.add('mb-2'); // Add margin-bottom
        fileItem.appendChild(fileNameElement);

        const downloadButton = document.createElement('button');
        downloadButton.classList.add('btn', 'btn-primary');
        downloadButton.innerText = 'Download';
        // console.log(downloadButton);
        downloadButton.type = 'button';
        downloadButton.id = file.file_name.toLowerCase();
        downloadButton.for = file.file_name.toLowerCase();
        // console.log('Event listener before adding:', downloadButton.onclick); // Log existing event listener
        downloadButton.addEventListener('click', async () => {
            // console.log('Download button clicked');
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
        // console.log('Event listener after adding:', downloadButton.onclick); // Log updated event listener

        fileItem.appendChild(downloadButton);

        fileListContainer.appendChild(fileItem);
    });
    

    // Append file list container to content container
    contentContainer.appendChild(fileListContainer);

    return contentContainer;
}

function createModalElement(content) {
    const modalElement = document.createElement('div');
    modalElement.classList.add('modal', 'fade'); // Add modal classes
    modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg"> <!-- Use modal-lg for large modal -->
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">File List</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;"> <!-- Inline style for scrolling -->
                    ${content.innerHTML} <!-- Insert content into modal body -->
                </div>
            </div>
        </div>
    `;
    return modalElement;
}

function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = filename.split('.').pop().toLowerCase();

    return imageExtensions.includes('.' + ext);
}

function isTxtFile(fileName) {
    const txtExtensions = ['.txt', '.pdf'];
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return txtExtensions.includes(ext);
}

function getFilterValues() {
    const filters = {
        date_start: {
            value: document.getElementById('order-date-input-start').value,
            include: document.getElementById('daterange-filter').checked,
        },
        date_end: {
            value: document.getElementById('order-date-input-end').value,
            include: document.getElementById('daterange-filter').checked,
        },
        factory: {
            value: document.getElementById('selected-factory').getAttribute('data-value'),
            include: document.getElementById('factory-filter').checked,
        },
        order_status: {
            value: document.getElementById('selected-order-status').getAttribute('data-value'),
            include: document.getElementById('order-filter').checked,
        },
        payment_status: {
            value: document.getElementById('selected-payment-status').textContent,
            include: document.getElementById('payment-filter').checked,
        },
    };

    return filters;
}

function updateCheckBoxList(key) {
    const index = checkboxStates.indexOf(key);
    // const downloadOrdersButton = document.getElementById('downloadOrders');

    if (index === -1) {
        checkboxStates.push(key);
    } else {
        checkboxStates.splice(index, 1);
    }
    checkboxStates.sort(function(a, b) {return a-b});
    if (checkboxStates.length > 0) {
        // downloadOrdersButton.removeAttribute('disabled');
    } else {
        // downloadOrdersButton.setAttribute('disabled', '');
    }
}