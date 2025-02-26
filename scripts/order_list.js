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
const thaiPostApiHost = "https://dpinterapi.thailandpost.com";
const aftershipApiHost = "https://api.aftership.com";
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
        const result = await DataController.updateByKey("orders", "order_id", id, key, value);
        if (result.status) {
            Cell.closeEditModal();
            Alert.showSuccessMessage('Update successful');
            generateTable(200, 1);
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

generateTable(200, 1);

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
        orders = result.data1;
        const data = result.data2;
        generateDropdown(data);
        const totalCount = await get_order_count(filterValues);
        const totalPages = Math.ceil(totalCount / limit);

        const orderDataContainer = document.getElementById('order-data-container');
        orderDataContainer.innerHTML = '';
        checkboxStates = [];
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `<th>
            <input id="allItems" type="checkbox" data-index="-1" name="Allitems" value="-1" data-toggle="tooltip" data-placement="top" title="Select All"/>
         </th>
         <th>Detail</th>
         <th>TIME SORT</th>
         <th>Buyer Name</th>
         <th>Report Product Name</th>
         <th>Channel</th>
         <th>All Total</th>
         <th>Currency</th>
         <th>Order Status</th>
         <th>Fulfillment Status</th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        orders.forEach(order => {
            const tableRow = document.createElement('tr');
            const { details, items, all_total, files, tracking } = order;
            const { timesort, order_id, buyer_name, website_name, currency_code, order_status, fulfillment_status, order_note } = details;
            /* 
                tableRow.appendChild(Cell.createInputOnModalCell('Id', serviceMethod.id, 'id', serviceMethod.id));
                tableRow.appendChild(Cell.createInputOnModalCell('Name', serviceMethod.id, 'name', serviceMethod.name));
            */
            /* tableRow.innerHTML =
                `<th rowspan=${items.length}>
                    <input type="checkbox" name="items" value=${timesort} />
                 </th>
                 <td rowspan=${items.length}><a href="order_details.php?order_id=${order_id}">View Detail</a></td>
                 <td rowspan=${items.length}>${timesort}</td>
                 <td rowspan=${items.length}>${buyer_name}</td>
                 <td>${items[0].report_product_name}</td>
                 <td rowspan=${items.length}>${website_name}</td>
                 <td rowspan=${items.length}>${all_total.toFixed(2)}</td>
                 <td rowspan=${items.length}>${currency_code}</td>
                 <td rowspan=${items.length}>${order_status_id}</td>
                 <td rowspan=${items.length}>${fulfillment_status}</td>`; */
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.name = 'items';
            checkboxInput.value = timesort;

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
            
            if (files.length > 0) {
                const paperClipIcon = document.createElement('button');
                paperClipIcon.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'fa-solid', 'fa-paperclip', 'me-1');
                timesortDiv.appendChild(paperClipIcon);
            
                // Add click event listener to paperClipIcon button
                paperClipIcon.addEventListener('click', () => handlePaperClipIconClick(files));
            }

            if (order_note) {
                const notesIcon = document.createElement('button');
                notesIcon.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'fa-solid', 'fa-note-sticky');
                notesIcon.type = 'button';
                notesIcon.setAttribute('data-bs-toggle', 'popover');
                notesIcon.setAttribute('data-bs-content', order_note);
                timesortDiv.appendChild(notesIcon);
            
                var popover = new bootstrap.Popover(notesIcon, {
                    container: 'body',
                    placement: 'right',
                    trigger: 'hover focus',
                    tapindex: '0'
                });

                notesIcon.addEventListener('click', () => {
                    copyTextToClipboard(order_note);
                });
            }

            if (tracking.length > 0) {
                const trackingNumber = tracking[0].tracking_number || null;
                const trackingID = tracking[0].tracking_id || null;
                const color = trackingNumber ? (trackingID ? "success" : "warning") : "danger";
            
                console.log(`Tracking`, tracking);
                console.log(`TrackingID ${trackingID} TrackingID == null ? ${trackingID === null}`);
            
                // Create the envelopeIcon button
                const envelopeIcon = document.createElement('button');
                envelopeIcon.classList.add('btn', `btn-outline-${color}`, 'btn-sm', 'fa-solid', 'fa-envelope-circle-check', 'me-1');
                envelopeIcon.type = 'button';
                timesortDiv.appendChild(envelopeIcon);
            
                // Add event listener to open the modal and update content dynamically
                envelopeIcon.addEventListener('click', () => {
                    const modalTitle = document.getElementById('trackingModalTitle');
                    const modalBody = document.getElementById('trackingModalBody');
                    const createTrackingBtn = document.getElementById('createTrackingBtn');
                    const deleteTrackingBtn = document.getElementById('deleteTrackingBtn');    
            
                    // Update modal content
                    modalTitle.textContent = 'Tracking Information';
                    modalBody.innerHTML = `
                        <p>Tracking Number: ${trackingNumber || "none"}</p>
                        <p>Tracking ID: ${trackingID || "none"}</p>
                    `;
            
                    if (!trackingID) {
                        // Show Create Tracking button if trackingID is null
                        createTrackingBtn.classList.remove('d-none');
                    } else {
                        createTrackingBtn.classList.add('d-none');
                    }
            
                    // Open the modal
                    const trackingModal = new bootstrap.Modal(document.getElementById('trackingModal'));
                    trackingModal.show();
            
                    // Add event listener to Create Tracking button
                    createTrackingBtn.onclick = async () => {
                        try {
                            // Call API to create tracking
                            const createTracking = await AftershipAPIController.createTracking(order, aftershipApiHost, trackingNumber);
            
                            console.log(createTracking);
                            if (createTracking.success) {
                                // Update the tracking table
                                const result = await DataController.updateByKey("tracking", "id", tracking[0].id, "tracking_id", createTracking.data.id);
            
                                if (result.status) {
                                    trackingModal.hide();
                                    Alert.showSuccessMessage('Tracking created and updated successfully');
                                    generateTable(100, 1);
                                } else {
                                    Alert.showErrorMessage('Update failed');
                                }
                            } else {
                                Alert.showErrorMessage('Tracking creation failed');
                            }
                        } catch (error) {
                            console.error('Error creating tracking:', error);
                            Alert.showErrorMessage('An error occurred during tracking creation');
                        }
                    };

                    deleteTrackingBtn.onclick = async () => {
                        try {
                            const res = await DataController._delete("tracking", "id", tracking[0].id);
                            if (res.status) {
                                trackingModal.hide();
                                Alert.showSuccessMessage('Tracking deleted successfully');
                                generateTable(100, 1);
                            } else {
                                Alert.showErrorMessage('Delete tracking failed');
                            }
                        } catch (error) {
                            console.error('Error deleting tracking:', error);
                            Alert.showErrorMessage('An error occurred during tracking deletion');
                        }
                    };
                });
            }                                  
            
            tableRow.appendChild(Cell.createElementCell(checkboxInput, false, items.length, ['th']));
            tableRow.appendChild(Cell.createElementCell(linkDetails, false, items.length, false));
            tableRow.appendChild(Cell.createElementCell(timesortDiv, false, items.length));
            tableRow.appendChild(Cell.createElementCell(buyerNameSpan, false, items.length, false));
            tableRow.appendChild(Cell.createSpanCell(items[0].report_product_name, false, false));
            tableRow.appendChild(Cell.createSpanCell(website_name, false, items.length));
            tableRow.appendChild(Cell.createSpanCell(all_total.toFixed(2), false, items.length));
            tableRow.appendChild(Cell.createSpanCell(currency_code, false, items.length));
            // tableRow.appendChild(Cell.createSpanCell(order_status_id, false, items.length));
            tableRow.appendChild(Cell.createSelectOnModalCell('Order Status', data.order_status, order_id, 'order_status_id', order_status));
            tableRow.appendChild(Cell.createSpanCell(fulfillment_status, false, items.length));
            tableBody.appendChild(tableRow);
            items.slice(1).forEach(item => {
                const itemRow = document.createElement('tr');
                /* itemRow.innerHTML =
                    `<td>${item.report_product_name}</td>`; */
                itemRow.appendChild(Cell.createSpanCell(item.report_product_name));
                tableBody.appendChild(itemRow);
            });
        });
        tableElement.appendChild(tableBody);

        orderDataContainer.appendChild(tableElement);
        dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${limit*page} of ${totalCount} rows`;
        Pagination.updatePagination(page, totalPages, 'pagination1', generateTable);
        Pagination.updatePagination(page, totalPages, 'pagination2', generateTable);
        
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
        const websiteDropdown = document.getElementById('website-dropdown');
        const orderStatusDropdown = document.getElementById('order-status-dropdown');
        const fulfillmentStatusDropdown = document.getElementById('fulfillment-status-dropdown');
        const paymentDropdown = document.getElementById('payment-dropdown');
        const selectedWebsite = document.getElementById('selected-website');
        const selectedOrderStatus = document.getElementById('selected-order-status');
        const selectedFulfillmentStatus = document.getElementById('selected-fulfillment-status');
        const selectedPayment = document.getElementById('selected-payment');
        const dateInputStart = document.getElementById('order-date-input-start');
        const dateInputEnd = document.getElementById('order-date-input-end');

        websiteDropdown.innerHTML='';
        orderStatusDropdown.innerHTML='';
        fulfillmentStatusDropdown.innerHTML='';
        paymentDropdown.innerHTML='';
        appendDropdownList(selectedWebsite, websiteDropdown, "All", 'website-filter');
        appendDropdownList(selectedOrderStatus, orderStatusDropdown, "All", 'order-filter');
        appendDropdownList(selectedFulfillmentStatus, fulfillmentStatusDropdown, "All", 'fulfillment-filter');
        appendDropdownList(selectedPayment, paymentDropdown, "All", 'payment-filter');
        data.websites.forEach(websiteName => {
            appendDropdownList(selectedWebsite, websiteDropdown, websiteName, 'website-filter');
        });
        data.order_status.forEach(orderStatusName => {
            appendDropdownList(selectedOrderStatus, orderStatusDropdown, orderStatusName, 'order-filter');
        });
        data.fulfillment_status.forEach(fulfillmentStatusName => {
            appendDropdownList(selectedFulfillmentStatus, fulfillmentStatusDropdown, fulfillmentStatusName, 'fulfillment-filter');
        });
        data.payment_methods.forEach(paymentMethodName => {
            appendDropdownList(selectedPayment, paymentDropdown, paymentMethodName, 'payment-filter');
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

        /* 
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
        */
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

function copyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;

    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;

    document.body.appendChild(textarea);

    textarea.select();

    try {
        const success = document.execCommand('copy');
        if (success) {
            Alert.showSuccessMessage("Notes copied successfully.");
        } else {
            Alert.showSuccessMessage("Failed to copy notes.");
        }
    } catch (error) {
        Alert.showErrorMessage("Error copying text to clipboard:", error);
    }

    document.body.removeChild(textarea);
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
        website: {
            value: document.getElementById('selected-website').textContent,
            include: document.getElementById('website-filter').checked,
        },
        date_start: {
            value: document.getElementById('order-date-input-start').value,
            include: document.getElementById('daterange-filter').checked,
        },
        date_end: {
            value: document.getElementById('order-date-input-end').value,
            include: document.getElementById('daterange-filter').checked,
        },
        order_status: {
            value: document.getElementById('selected-order-status').getAttribute('data-value'),
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
    // const downloadOrdersButton = document.getElementById('downloadOrders');
    // const newDownloadOrdersButton = document.getElementById('newDownloadOrders');
    const createInvoiceButton = document.getElementById('createInvoices');
    const itemSummaryButton = document.getElementById('itemSummaries');
    // const dhlPreAlertButton = document.getElementById('dhlPreAlerts');
    // const dpostButton = document.getElementById('dpost');
    const thpostButton = document.getElementById('thpost');
    // const aftershipCSVButton = document.getElementById('aftershipCSV');
    const downloadBarcodes = document.getElementById('downloadBarcodes');
    const deleteOrders = document.getElementById('deleteOrders');

    if (index === -1) {
        checkboxStates.push(key);
    } else {
        checkboxStates.splice(index, 1);
    }
    checkboxStates.sort(function(a, b) {return a-b});
    if (checkboxStates.length > 0) {
        // downloadOrdersButton.removeAttribute('disabled');
        // newDownloadOrdersButton.removeAttribute('disabled');
        createInvoiceButton.removeAttribute('disabled');
        itemSummaryButton.removeAttribute('disabled');
        // dhlPreAlertButton.removeAttribute('disabled');
        // dpostButton.removeAttribute('disabled');
        thpostButton.removeAttribute('disabled');
        // aftershipCSVButton.removeAttribute('disabled');
        downloadBarcodes.removeAttribute('disabled');
        deleteOrders.removeAttribute('disabled');
    } else {
        // downloadOrdersButton.setAttribute('disabled', '');
        // newDownloadOrdersButton.setAttribute('disabled', '');
        createInvoiceButton.setAttribute('disabled', '');
        itemSummaryButton.setAttribute('disabled', '');
        // dhlPreAlertButton.setAttribute('disabled', '');
        // dpostButton.setAttribute('disabled', '');
        thpostButton.setAttribute('disabled', '');
        // aftershipCSVButton.setAttribute('disabled', '');
        downloadBarcodes.setAttribute('disabled', '');
        deleteOrders.setAttribute('disabled', '');
    }
}

// const downloadOrdersButton = document.getElementById('downloadOrders');
const newDownloadOrdersButton = document.getElementById('newDownloadOrders');
const createInvoiceButton = document.getElementById('createInvoices');
const itemSummaryButton = document.getElementById('itemSummaries');
// const dhlPreAlertButton = document.getElementById('dhlPreAlerts');
const dpost = document.getElementById('dpost');
const thpost = document.getElementById('thpost');
const aftershipCSV = document.getElementById('aftershipCSV');
const downloadBarcodes = document.getElementById('downloadBarcodes');
const deleteOrders = document.getElementById('deleteOrders');

const handleDownloadOrders = (e) => {
    e.preventDefault();
    Downloader.generateOrderExcel(orders, toggleSpinner, checkboxStates);
};

const handleNewDownloadOrders = (e) => {
    e.preventDefault();
    Downloader.generateOrderExcel2(orders, toggleSpinner, checkboxStates);
};

const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const result = await Downloader.generateInvoiceExcel(orders, toggleSpinner, checkboxStates);
    if (result) {
        Alert.showSuccessMessage("Invoice generated successfully");
    } else {
        Alert.showErrorMessage("Invoice can not generated");
    }
};

const handleItemSummary = async (e) => {
    e.preventDefault();
    const result = await Downloader.generateItemSummaryExcel(orders, toggleSpinner, checkboxStates);
    if (result) {
        Alert.showSuccessMessage("Item summary generated successfully");
    } else {
        Alert.showErrorMessage("Item summary can not generated");
    }
};

const handleDhlPreAlert = async (e) => {
    e.preventDefault();
    const result = await Downloader.generateDhlPreAlertExcel(orders, toggleSpinner, checkboxStates);
    if (result) {
        Alert.showSuccessMessage("DHL pre alert generated successfully");
    } else {
        Alert.showErrorMessage("DHL pre alert can not generated");
    }
};

const handleDpost = async (e) => {
    e.preventDefault();
    const result = await Downloader.generateDpostExcel(orders, toggleSpinner, checkboxStates);
    if (result) {
        Alert.showSuccessMessage("Dpost generated successfully");
    } else {
        Alert.showErrorMessage("Dpost can not generated");
    }
};

const handleThpost = async (e) => {
    e.preventDefault();
    toggleSpinner(true);

    const results = [];
    let swalInstance;

    try {
        const selectedOrders = orders.filter(order => checkboxStates.includes(order.details.timesort));
        selectedOrders.sort((a, b) => a.details.timesort - b.details.timesort);

        const createTokenResult = (await ThaiPostAPIController.createToken(thaiPostApiHost)).response;
        if (createTokenResult) {
            // Split orders into filteredOrders (need barcodes) and barcodeGeneratedOrders (already have barcodes)
            const filteredOrders = await filterOrdersWithBarcodes(selectedOrders);

            if (filteredOrders.length > 0) {
                swalInstance = Swal.fire({
                    title: 'Processing Orders',
                    html: createResultsHTML(results),
                    icon: 'info',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    width: '800px'
                });

                for (const filteredOrder of filteredOrders) {
                    try {
                        const result = {
                            timesort: filteredOrder.details.timesort,
                            generateBarcodeResult: 'pending',
                            updateTracking: 'pending',
                            uploadResponse: 'pending',
                            // createTracking: 'pending'
                        };
                        results.push(result);
                        await Swal.update({ html: createResultsHTML(results) });

                        const generateBarcodeResult = (await ThaiPostAPIController.generateBarcode(filteredOrder, thaiPostApiHost, createTokenResult.access_token)).response;
                        result.generateBarcodeResult = generateBarcodeResult.fileUrl ? 'success' : 'failed';
                        await Swal.update({ html: createResultsHTML(results) });

                        if (generateBarcodeResult.fileUrl) {
                            // const createTracking = await AftershipAPIController.createTracking(filteredOrder, aftershipApiHost, generateBarcodeResult.listItemBarcode[0].barcode);
                            // result.createTracking = createTracking.status ? 'success' : 'failed';
                            // await Swal.update({ html: createResultsHTML(results) });
                            const insertData = {
                                order_id: filteredOrder.details.order_id,
                                tracking_number: generateBarcodeResult.listItemBarcode[0].barcode,
                                tracking_id: /* createTracking.data.id */"",
                            };
                            const updateTracking = await DataController.insert("tracking", insertData);
                            result.updateTracking = updateTracking.status ? 'success' : 'failed';
                            await Swal.update({ html: createResultsHTML(results) });

                            const uploadResponse = await ThaiPostAPIController.uploadFile(generateBarcodeResult.fileUrl, filteredOrder.details.order_id);
                            result.uploadResponse = uploadResponse.status ? 'success' : 'failed';
                            await Swal.update({ html: createResultsHTML(results) });
                        } else {
                            result.updateTracking = 'failed';
                            result.uploadResponse = 'failed';
                            // result.createTracking = 'failed';
                        }
                    } catch (error) {
                        console.error(`Error processing order ${filteredOrder.details.order_id}:`, error.response?.data.Message ? error.response.data.Message : error.response.data);
                    }
                }

                await Swal.fire({
                    title: 'Processing Complete',
                    html: createResultsHTML(results),
                    icon: 'success',
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    width: '800px'
                }).then(() => {
                    Downloader.generateMergedPDF(selectedOrders);
                });
            } else {
                Alert.showErrorMessage("No orders to process after filtering.");
            }
        } else {
            Alert.showErrorMessage("Create Token Failed");
        }
    } catch (e) {
        console.log(e);
        Alert.showErrorMessage("An unexpected error occurred. Check console for details.");
    } finally {
        toggleSpinner(false);
    }
};

const handleAftershipCSV = async (e) => {
    e.preventDefault();
    const result = await Downloader.generateAftershipCSV(orders, toggleSpinner, checkboxStates);
    if (result) {
        Alert.showSuccessMessage("Aftership CSV generated successfully");
    } else {
        Alert.showErrorMessage("Aftership CSV can not generated");
    }
};

const handleDownloadBarcodes = async (e) => {
    e.preventDefault();
    
    const selectedOrders = orders.filter(order => checkboxStates.includes(order.details.timesort));
    
    if (selectedOrders.length === 0) {
        Alert.showErrorMessage("No orders selected.");
        return;
    }

    await Downloader.generateMergedPDF(selectedOrders);
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

// Create a map to keep track of added event listeners
const eventListenersMap = new Map();

const removeAllEventListeners = () => {
    const eventListeners = eventListenersMap.get('buttons');
    if (eventListeners) {
        eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
    }
    eventListenersMap.set('buttons', []);
};

const addAllEventListeners = () => {
    const eventListeners = [
        // { element: downloadOrdersButton, type: 'click', listener: handleDownloadOrders },
        // { element: newDownloadOrdersButton, type: 'click', listener: handleNewDownloadOrders },
        { element: createInvoiceButton, type: 'click', listener: handleCreateInvoice },
        { element: itemSummaryButton, type: 'click', listener: handleItemSummary },
        // { element: dhlPreAlertButton, type: 'click', listener: handleDhlPreAlert },
        // { element: dpost, type: 'click', listener: handleDpost },
        { element: thpost, type: 'click', listener: handleThpost },
        // { element: aftershipCSV, type: 'click', listener: handleAftershipCSV },
        { element: downloadBarcodes, type: 'click', listener: handleDownloadBarcodes },
        { element: deleteOrders, type: 'click', listener: handleDeleteOrders },
    ];

    eventListeners.forEach(({ element, type, listener }) => {
        element.addEventListener(type, listener, false);
    });

    eventListenersMap.set('buttons', eventListeners);
};

async function checkFileExists(fileUrl) {
    try {
        const response = await axios.head(`${fileUrl}`);
        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false;
        } else {
            return false;
        }
    }
}

async function filterOrdersWithBarcodes(orders) {
    const filteredOrders = [];

    for (const order of orders) {
        const fileUrl = `../files/label-${order.details.order_id}.pdf`;
        const fileExists = await checkFileExists(fileUrl);

        if (!fileExists) {
            filteredOrders.push(order);
        } else {
            Alert.showErrorMessage(`Barcode for order ${order.details.order_id} already exists.`);
        }
    }

    return filteredOrders;
}

removeAllEventListeners();
addAllEventListeners();

const updateSwalContent = (swalInstance, results) => {
    if (swalInstance) {
        swalInstance.update({
            html: createResultsHTML(results)
        });
    }
};

const createResultsHTML = (results) => {
    const getStatusIcon = (status) => {
        switch(status) {
            case 'success': return '<span class="fa-solid fa-check-circle text-success"></span>';
            case 'failed': return '<span class="fa-solid fa-times-circle text-danger"></span>';
            case 'pending': return '<span class="fa-solid fa-spinner fa-spin text-primary"></span>';
            default: return '<span class="fa-solid fa-question-circle text-warning"></span>';
        }
    };

    let html = `
    <div class="table-responsive" style="max-height: 400px;">
        <table class="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Timesort</th>
                    <th>Generate Barcode</th>
                    <th>Update Tracking</th>
                    <th>Upload File</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(result => {
        /* html += `
        <tr>
            <td>${result.timesort}</td>
            <td>${getStatusIcon(result.generateBarcodeResult)}</td>
            <td>${getStatusIcon(result.uploadResponse)}</td>
            <td>${getStatusIcon(result.createTracking)}</td>
        </tr>
        `; */
        html += `
        <tr>
            <td>${result.timesort}</td>
            <td>${getStatusIcon(result.generateBarcodeResult)}</td>
            <td>${getStatusIcon(result.updateTracking)}</td>
            <td>${getStatusIcon(result.uploadResponse)}</td>
        </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    `;

    return html;
};