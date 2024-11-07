import { Pagination } from "../components/Pagination.js";
import { Cell } from "../components/Cell.js";
import { Modal } from "../components/Modal.js";
let checkboxStates = [];
let orders = {};
let factories = {};
let selectedFactory = null;

const get_factory_list = async (limit, page) => {
    try {
        let url = `../datasets/get_factory_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const get_order_list = async (limit, page) => {
    try {
        let url = `../datasets/get_order_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function get_order_count() {
    try {
        let url = `../datasets/get_order_count.php?`;

        const response = await axios.get(url);
        return response.data[0].count;
    } catch (error) {
        throw error;
    }
}

const generateFactoryTable = async (limit, page) => {
    const factoryData = await get_factory_list(limit, page);
    factories = factoryData.data1;
    const totalCount = await get_order_count();
    const totalPages = Math.ceil(totalCount / limit);
    const factoryContainer = document.getElementById('factory-data-container');
    factoryContainer.innerHTML = '';
    checkboxStates = [];
    const tableElement = document.createElement('table');
    tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');

    const tableHeader = document.createElement('thead');
    const tableHeaderRow = document.createElement('tr');
    tableHeaderRow.innerHTML =
        `<th><th>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Location</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement('tbody');
    factories.forEach(factory => {
        const tableRow = document.createElement('tr');
        const { details, factory_skus } = factory;
        const { id, name, location, contact_person, contact_number, email_address } = details;
        
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.name = 'items';
        checkboxInput.value = id;
        tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th']));
        tableRow.appendChild(Cell.createSpanCell(id, false, false));
        tableRow.appendChild(Cell.createSpanCell(name, false, false));
        tableRow.appendChild(Cell.createSpanCell(email_address, false, false));
        tableRow.appendChild(Cell.createSpanCell(location, false, false));
        tableBody.appendChild(tableRow);
    });
    tableElement.appendChild(tableBody);

    factoryContainer.appendChild(tableElement);

    const dropdownTitle = document.getElementById('dropdown-title');
    dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${limit*page} of ${totalCount} rows`;
    Pagination.updatePagination(page, totalPages, 'factory-pagination', generateOrderTable);
    
    const inputCheckbox = factoryContainer.querySelectorAll('input[name="items"]');
    inputCheckbox.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            selectedFactory = this.checked ? this.value : null;
            const factory = selectedFactory ? factories.find(f => f.details.id == selectedFactory) : null;
            const factoryItems = factory ? factory.factory_skus.map(sku => sku.report_product_name) : [];

            inputCheckbox.forEach(cb => {
                if (cb !== this) {
                    cb.checked = false;
                }
            });
            generateOrderTable(100, 1)

            updateValidState(factoryItems);
            updateButtonState();
        });
    });
};

const generateOrderTable = async (limit, page) => {
    const orderData = await get_order_list(limit, page);
    orders = orderData.data1;
    const totalCount = await get_order_count();
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
        const { details, items, all_total, files, tracking } = order;
        const { timesort, order_id, buyer_name, website_name, currency_code, order_status, fulfillment_status, order_note } = details;

        const tableRow = document.createElement('tr');
        tableRow.setAttribute('data-order-id', timesort);

        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.name = 'items';
        checkboxInput.value = timesort;

        const linkDetails = document.createElement('a');
        linkDetails.href = `order_details.php?order_id=${order_id}`;
        linkDetails.innerText = 'View Detail';
        const timesortDiv = document.createElement('div');
        const timesortText = document.createElement('p');
        timesortText.innerHTML = timesort;
        timesortDiv.appendChild(timesortText);
        const buyerNameSpan = document.createElement('span');
        buyerNameSpan.innerHTML = buyer_name;

        tableRow.appendChild(Cell.createElementCell(checkboxInput, false, items.length, ['th']));
        tableRow.appendChild(Cell.createElementCell(linkDetails, false, items.length, false));
        tableRow.appendChild(Cell.createElementCell(timesortDiv, false, items.length));
        tableRow.appendChild(Cell.createElementCell(buyerNameSpan, false, items.length, false));
        tableRow.appendChild(Cell.createSpanCell(items[0].report_product_name, false, false));
        tableRow.appendChild(Cell.createSpanCell(website_name, false, items.length));
        tableRow.appendChild(Cell.createSpanCell(all_total.toFixed(2), false, items.length));
        tableRow.appendChild(Cell.createSpanCell(currency_code, false, items.length));
        tableRow.appendChild(Cell.createSpanCell(fulfillment_status, false, items.length));
        tableBody.appendChild(tableRow);
        items.slice(1).forEach(item => {
            const itemRow = document.createElement('tr');
            itemRow.setAttribute('data-order-id', timesort);

            itemRow.appendChild(Cell.createSpanCell(item.report_product_name));
            tableBody.appendChild(itemRow);
        });
    });
    tableElement.appendChild(tableBody);

    orderDataContainer.appendChild(tableElement);

    const dropdownTitle = document.getElementById('dropdown-title');
    dropdownTitle.innerText = `Showing ${(limit*(page-1))+1}-${limit*page} of ${totalCount} rows`;
    Pagination.updatePagination(page, totalPages, 'order-pagination', generateOrderTable);
    
    const selectedAllCheckbox = document.getElementById('allItems');
    const inputCheckbox = orderDataContainer.querySelectorAll('input[name="items"]');
    selectedAllCheckbox.addEventListener('change', function () {
        const factory = selectedFactory ? factories.find(f => f.details.id == selectedFactory) : null;
        const factoryItems = factory ? factory.factory_skus.map(sku => sku.report_product_name) : [];

        inputCheckbox.forEach(checkbox => {
            const timesort = checkbox.value;
            updateCheckBoxList(timesort);
            checkbox.checked = this.checked;
            
            const itemRows = document.querySelectorAll(`[data-order-id="${timesort}"]`);
            itemRows.forEach((itemRow, index)=>{
                const itemCell = itemRow.querySelector(index==0?'td:nth-child(5)':'td');
                itemCell.classList.remove('bg-success', 'bg-danger');
                const productSku = itemCell.innerText.trim();
                if (this.checked) {
                    if (factoryItems.includes(productSku)) {
                        itemCell.classList.add('bg-success');
                    } else {
                        itemCell.classList.add('bg-danger');
                    }
                } else {
                    itemCell.classList.remove('bg-success', 'bg-danger');
                }
            });
        });

        // Check validity after selecting/deselecting all items
        updateValidState(factoryItems);
        updateButtonState();
    });

    inputCheckbox.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const factory = selectedFactory ? factories.find(f => f.details.id == selectedFactory) : null;
            const factoryItems = factory ? factory.factory_skus.map(sku => sku.report_product_name) : [];
            const timesort = checkbox.value;
            updateCheckBoxList(timesort);

            const itemRows = document.querySelectorAll(`[data-order-id="${timesort}"]`);
            itemRows.forEach((itemRow, index) => {
                const itemCell = itemRow.querySelector(index==0?'td:nth-child(5)':'td');
                const productSku = itemCell.innerText.trim();
                if (this.checked) {
                    if (factoryItems.includes(productSku)) {
                        itemCell.classList.add('bg-success');
                    } else {
                        itemCell.classList.add('bg-danger');
                    }
                } else {
                    itemCell.classList.remove('bg-success', 'bg-danger');
                }
            });

            // Check validity after individual checkbox change
            updateValidState(factoryItems);
            updateButtonState();
        });
    });
};

function updateCheckBoxList(key) {
    const index = checkboxStates.indexOf(key);
    const makePOButton = document.getElementById('makePO');

    if (index === -1) {
        checkboxStates.push(key);
    } else {
        checkboxStates.splice(index, 1);
    }
    checkboxStates.sort((a, b) => a - b);

    updateButtonState(); // Update button state after any checkbox change
}

function updateButtonState() {
    const makePOButton = document.getElementById('makePO');
    if (checkboxStates.length > 0 && window.valid) {
        makePOButton.removeAttribute('disabled');
    } else {
        makePOButton.setAttribute('disabled', '');
    }
}

function updateValidState(factoryItems) {
    let valid = true;
    checkboxStates.forEach(timesort => {
        const itemRows = document.querySelectorAll(`[data-order-id="${timesort}"]`);
        itemRows.forEach((itemRow, index) => {
            const itemCell = itemRow.querySelector(index == 0 ? 'td:nth-child(5)' : 'td');
            const productSku = itemCell.innerText.trim();
            if (!factoryItems.includes(productSku)) {
                valid = false;
            }
        });
    });

    window.valid = valid; // Store global validity state
}

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

const generatePDFAndConvertToPNG = async (selectedOrders) => {
    const { PDFDocument, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;

    page.drawText('Selected SKUs', {
        x: 50,
        y: height - 50,
        size: 16,
        color: rgb(0, 0, 0),
    });

    const skuSummary = summarizeSkus(selectedOrders);
    let yOffset = height - 80;

    skuSummary.forEach((item, index) => {
        page.drawText(`${item.sku}: ${item.quantity}`, {
            x: 50,
            y: yOffset,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
        yOffset -= 20;

        if (yOffset < 50) {
            page = pdfDoc.addPage();
            yOffset = height - 50;
        }
    });

    // Save PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Create a Blob object from the PDF
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    return { pdfBlob, skuSummary };
};

const sendEmail = async (emailContent, selectedOrders, email) => {
    // Generate PDF and PNG
    const pdfBlob = await generatePDF(selectedOrders);

    // Use html2canvas to generate PNG
    html2canvas(document.body).then(async (canvas) => {
        const pngDataUrl = canvas.toDataURL('image/png');
        
        // Convert base64 PNG to a Blob
        const pngBlob = await dataURLToBlob(pngDataUrl);

        // Send form data with PNG image and PDF
        const formData = new FormData();
        formData.append('title', emailContent.title);
        formData.append('body', emailContent.body);
        formData.append('buttons', JSON.stringify(emailContent.buttons));
        formData.append('png_image', new File([pngBlob], 'screenshot.png', { type: 'image/png' })); // Append PNG as a File
        formData.append('email', email);
        formData.append('skuSummary', JSON.stringify(summarizeSkus(selectedOrders)));
        formData.append('pdf_file', new File([pdfBlob], 'summary.pdf', { type: 'application/pdf' })); // Append PDF as a File
        
        // Send the request using axios
        axios.post('../datasets/send_email.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(response => {
            if (response.data.success) {
                console.log('Email sent successfully');
            } else {
                console.error('Email failed to send:', response.data.message);
            }
        }).catch(error => {
            console.error('Error sending email:', error);
        });
    });
}
const dataURLToBlob = async (dataURL) => {
    const response = await fetch(dataURL);
    return await response.blob();
}

const summarizeSkus = (selectedOrders) => {
    const skuMap = new Map();

    selectedOrders.forEach(order => {
        order.items.forEach(item => {
            console.log(item);
            const currentQuantity = skuMap.get(item.order_product_sku) || 0;
            skuMap.set(item.order_product_sku, parseInt(currentQuantity) + parseInt(item.quantity_purchased));
        });
    });

    return Array.from(skuMap, ([sku, quantity]) => ({ sku, quantity }));
}

const generatePDF = async (selectedOrders) => {
    const { PDFDocument, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;

    page.drawText('Selected SKUs', {
        x: 50,
        y: height - 50,
        size: 16,
        color: rgb(0, 0, 0),
    });

    const skuSummary = summarizeSkus(selectedOrders);
    let yOffset = height - 80;

    skuSummary.forEach((item, index) => {
        page.drawText(`${item.sku}: ${item.quantity}`, {
            x: 50,
            y: yOffset,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
        yOffset -= 20;

        if (yOffset < 50) {
            page = pdfDoc.addPage();
            yOffset = height - 50;
        }
    });

    return await pdfDoc.save();
}

const generateEmailContent = (selectedOrders) => {
    const title = 'Purchase Order from BoxSense';
    const acceptLink = 'https://example.com/accept';
    const cancelLink = 'https://example.com/cancel';
    const viewLink = 'https://example.com/view';

    return {
        title: title,
        body: `
            ${title}

            Please find attached the PDF file containing the selected SKUs.

            Actions:
            - Accept: ${acceptLink}
            - Cancel: ${cancelLink}
            - View: ${viewLink}

            Thank you for your business.
        `,
        buttons: [
            { text: 'Accept', link: acceptLink, class: 'btn-success' },
            { text: 'Cancel', link: cancelLink, class: 'btn-danger' },
            { text: 'View', link: viewLink, class: 'btn-primary' }
        ]
    };
}

const handleEmailButtonClick = async () => {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        alert('Please select at least one order.');
        return;
    }

    const emailContent = generateEmailContent(selectedOrders);
    const email = 's6404062630511@email.kmutnb.ac.th';

    try {
        await sendEmail(emailContent, selectedOrders, email);
    } catch (error) {
        console.error('Error:', error);
    }
};

const getSelectedOrders = () => {
    return Array.from(document.querySelectorAll('#order-data-container input[name="items"]:checked'))
        .map(checkbox => orders.find(order => order.details.timesort === checkbox.value));
}

async function main(limit, page) {
    try {
        toggleSpinner(true);
        generateFactoryTable(5, 1);
        generateOrderTable(limit, page);
        const makePOButton = document.getElementById('makePO');
        makePOButton.addEventListener('click', handleEmailButtonClick);
    } catch (e) {
        console.error(e);
    } finally {
        toggleSpinner(false);
    }
}

main(100, 1)