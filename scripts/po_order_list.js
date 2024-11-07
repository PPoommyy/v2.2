import { Pagination } from "../components/Pagination.js";
import { Downloader } from "../components/Downloader.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Cell } from "../components/Cell.js";
import { Modal } from "../components/Modal.js";
import { ThaiPostAPIController } from "../components/ThaiPostAPIController.js";
import { AftershipAPIController } from "../components/AftershipAPIController.js";

let checkboxStates = [];
let orders = {};

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
        const result = await DataController.updateByKey("po_orders", "order_id", id, key, value);
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
        let url = `../datasets/get_order_count.php?`;

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

async function generateTable(limit, page) {
    try {
        toggleSpinner(true);
        const filterValues = getFilterValues();
        const result = await get_po_order_list(limit, page, filterValues);
        orders = result.data1;
        const data = result.data2;
        generateDropdown(data);
        const totalCount = result.data2.count;
        const totalPages = Math.ceil(totalCount / limit);

        const orderDataContainer = document.getElementById('order-data-container');
        orderDataContainer.innerHTML = '';
        checkboxStates = [];
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML = `
            <th>
                <input id="allItems" type="checkbox" data-index="-1" name="Allitems" value="-1" data-toggle="tooltip" data-placement="top" title="Select All"/>
            </th>
            <th>Detail</th>
            <th>PO Order ID</th>
            <th>Items</th>
            <th>Factory Name</th>
            <th>Total</th>
            <th>Order Status</th>
            <th>Payment Status</th>
        `;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        orders.forEach((order, index) => {
            const { details, items } = order;
            const { order_id, factory_name, order_status, payment_status } = details;

            const mainRow = document.createElement('tr');
            
            // Checkbox
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'items';
            checkbox.value = order_id;
            checkboxCell.appendChild(checkbox);
            mainRow.appendChild(checkboxCell);

            // View Detail Link
            const detailCell = document.createElement('td');
            const detailLink = document.createElement('a');
            detailLink.href = `order_details.php?order_id=${order_id}`;
            detailLink.innerText = 'View Detail';
            detailCell.appendChild(detailLink);
            mainRow.appendChild(detailCell);

            // PO Order ID
            mainRow.appendChild(Cell.createSpanCell(order_id, false, 1));

            // Items (with collapse)
            const itemsCell = document.createElement('td');
            const collapseButton = document.createElement('button');
            collapseButton.className = 'btn btn-link';
            collapseButton.setAttribute('data-bs-toggle', 'collapse');
            collapseButton.setAttribute('data-bs-target', `#collapse${index}`);
            collapseButton.textContent = `${items.length} item(s)`;
            itemsCell.appendChild(collapseButton);
            
            const collapseDiv = document.createElement('div');
            collapseDiv.id = `collapse${index}`;
            collapseDiv.className = 'collapse';
            
            const itemsList = document.createElement('ul');
            items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item.report_product_name;
                itemsList.appendChild(listItem);
            });
            collapseDiv.appendChild(itemsList);
            itemsCell.appendChild(collapseDiv);
            mainRow.appendChild(itemsCell);

            // Factory Name
            mainRow.appendChild(Cell.createSpanCell(factory_name, false, 1));

            // Total
            mainRow.appendChild(Cell.createSpanCell(details.total_amount.toFixed(2), false, 1));

            // Order Status
            mainRow.appendChild(Cell.createSelectOnModalCell('Order Status', data.order_status, order_id, 'order_status_id', order_status));

            // Payment Status
            // mainRow.appendChild(Cell.createSelectOnModalCell('Payment Status', data.payment_status, order_id, 'order_status_id', order_status));

            tableBody.appendChild(mainRow);
        });

        tableElement.appendChild(tableBody);
        orderDataContainer.appendChild(tableElement);

        dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${limit*page} of ${totalCount} rows`;
        Pagination.updatePagination(page, totalPages, 'pagination1', generateTable);
        Pagination.updatePagination(page, totalPages, 'pagination2', generateTable);
        
        setupCheckboxListeners();
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
}

function setupCheckboxListeners() {
    const selectedAllCheckbox = document.getElementById('allItems');
    const inputCheckboxes = document.querySelectorAll('input[name="items"]');
    
    selectedAllCheckbox.addEventListener('change', function () {
        inputCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            updateCheckBoxList(checkbox.value);
        });
    });
    
    inputCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            updateCheckBoxList(this.value);
        });
    });
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

        // log all variables
        /* console.log("factoryDropdown",factoryDropdown);
        console.log("orderStatusDropdown",orderStatusDropdown);
        console.log("paymentStatusDropdown",paymentStatusDropdown);
        console.log("selectedFactory", selectedFactory);
        console.log("selectedOrderStatus",selectedOrderStatus);
        console.log("selectedPaymentStatus",selectedPaymentStatus);
        console.log("dateInputStart", dateInputStart);
        console.log("dateInputEnd", dateInputEnd); */
        
        factoryDropdown.innerHTML='';
        orderStatusDropdown.innerHTML='';
        paymentStatusDropdown.innerHTML='';
        appendDropdownList(selectedFactory, factoryDropdown, "All", 'factory-filter');
        appendDropdownList(selectedOrderStatus, orderStatusDropdown, "All", 'order-filter');
        appendDropdownList(selectedPaymentStatus, paymentStatusDropdown, "All", 'payment-filter');
        data.factories.forEach(factoryName => {
            appendDropdownList(selectedFactory, factoryDropdown, factoryName, 'factory-filter');
        });
        data.order_status.forEach(orderStatusName => {
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

// Function to handle click event on paperClipIcon button
function handlePaperClipIconClick(files) {
    const modalContent = generateFileListContent(files, 0); // Initialize with first file
    const modalElement = createModalElement(modalContent); // Create modal element with content

    // Open the modal using your custom Modal module
    Modal.openModal(modalElement);
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
    const downloadOrdersButton = document.getElementById('downloadOrders');
    const newDownloadOrdersButton = document.getElementById('newDownloadOrders');
    const createInvoiceButton = document.getElementById('createInvoices');
    const itemSummaryButton = document.getElementById('itemSummaries');
    const dhlPreAlertButton = document.getElementById('dhlPreAlerts');
    const dpostButton = document.getElementById('dpost');
    const thpostButton = document.getElementById('thpost');
    const downloadBarcodes = document.getElementById('downloadBarcodes');
    const deleteOrders = document.getElementById('deleteOrders');

    if (index === -1) {
        checkboxStates.push(key);
    } else {
        checkboxStates.splice(index, 1);
    }
    checkboxStates.sort(function(a, b) {return a-b});
    if (checkboxStates.length > 0) {
        downloadOrdersButton.removeAttribute('disabled');
        newDownloadOrdersButton.removeAttribute('disabled');
        createInvoiceButton.removeAttribute('disabled');
        itemSummaryButton.removeAttribute('disabled');
        dhlPreAlertButton.removeAttribute('disabled');
        dpostButton.removeAttribute('disabled');
        thpostButton.removeAttribute('disabled');
        downloadBarcodes.removeAttribute('disabled');
        deleteOrders.removeAttribute('disabled');
    } else {
        downloadOrdersButton.setAttribute('disabled', '');
        newDownloadOrdersButton.setAttribute('disabled', '');
        createInvoiceButton.setAttribute('disabled', '');
        itemSummaryButton.setAttribute('disabled', '');
        dhlPreAlertButton.setAttribute('disabled', '');
        dpostButton.setAttribute('disabled', '');
        thpostButton.setAttribute('disabled', '');
        downloadBarcodes.setAttribute('disabled', '');
        deleteOrders.setAttribute('disabled', '');
    }
}


const handleDownloadBarcodes = async (e) => {
    e.preventDefault();
    
    // Get the selected orders
    const selectedOrders = orders.filter(order => checkboxStates.includes(order.details.timesort));
    
    if (selectedOrders.length === 0) {
        Alert.showErrorMessage("No orders selected.");
        return;
    }

    // Initialize a new PDF document
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const order of selectedOrders) {
        const labelUrl = `../files/label-${order.details.order_id}.pdf`;
        
        try {
            const existingPdfBytes = await fetch(labelUrl).then(res => res.arrayBuffer());
            const existingPdf = await PDFDocument.load(existingPdfBytes);
            
            const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        } catch (error) {
            console.error(`Error merging label for order ${order.details.order_id}:`, error);
            Alert.showErrorMessage(`Error merging label for order ${order.details.order_id}.`);
        }
    }

    const mergedPdfBytes = await mergedPdf.save();

    // Create a Blob from the PDFBytes and download it
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-labels.pdf';
    a.click();
    URL.revokeObjectURL(url);
}

const handleDeleteOrders = async (e) => {
    e.preventDefault();
    const confirmAlert = await Alert.showConfirmModal("Are you sure you want to delete orders?");
    const swalQueue = Alert.createQueue();
    const results = [];

    if (!confirmAlert.isConfirmed) {
        return;
    }

    const selectedOrders = [];

    orders.forEach((order) => {
        const { timesort } = order.details;
        if (checkboxStates.includes(timesort)) {
            selectedOrders.push(order);
        }
    });

    for (let index = 0; index < selectedOrders.length; index++) {
        const order = selectedOrders[index];
        const { order_id } = order.details;
        try {
            const result1 = await DataController._delete("orders", "order_id", order_id);
            const result2 = await DataController._delete("orders_skus", "order_id", order_id);
            const orderResult = {
                "orders": result1.status,
                "orders_skus": result2.status
            }
            results.push(orderResult);
            if (result1.status && result2.status) {
                const confirmed = await swalQueue.fire({
                    title: `Order ${order_id} deleted successfully!`,
                    icon: 'success',
                    timer: 1500,
                    showCancelButton: false
                });
            } else {
                const confirmed = await swalQueue.fire({
                    title: `Failed to delete order ${order_id}`,
                    icon: 'error',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Next &rarr;'
                });

                if (!confirmed.isConfirmed) {
                    break;
                }
            }
        } catch (error) {
            const confirmed = await swalQueue.fire({
                title: `Failed to delete order ${order_id}`,
                icon: 'error',
                showCancelButton: false,
                showConfirmButton: true,
                confirmButtonText: 'Next &rarr;'
            });

            if (!confirmed.isConfirmed) {
                break;
            }
        }
    }
    generateTable(limit, page);
};