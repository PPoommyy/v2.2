import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";


const get_requests = async (table, limit, page) => {
    try {
        const column = [
            "*",
            "requests.id as request_id", 
            "request_status.name as request_status",
            "request_type.name as request_type",
        ];
        const join = [
            ["request_status", "request_status.id", "requests.request_status_id"],
            ["request_type", "request_type.id", "requests.request_type_id"]
        ];
        const filterValues = getFilterValues();
        const where = [];
        // order_date BETWEEN order_date_start AND order_date_end
        // request_status_id = request_status_id
        console.log(where);
        const response = await DataController.select(table, column, "request_date", limit, page, join, where);
        console.log(response);
        return response;
    } catch (error) {
        throw error;
    }
};

const get_request_status = async () => {
    try {
        const response = DataController.select("request_status", ["*"], "id", 100, 0);
        return response;
    } catch (error) {
        throw error;
    }
};

const get_request_type = async () => {
    try {
        const response = DataController.select("request_type", ["*"], "id", 100, 0);
        return response;
    } catch (error) {
        throw error;
    }
};

function formatDateTimeWithSeconds(dateString) {
    if (!dateString) return "";
    return dateString.replace("T", " ") + ":00";
}

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

function updateCheckBoxList(key, checkboxStates) {
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

const generateTable = async(table, limit, page) => {
    try {
        toggleSpinner(true);
        const requests = await get_requests(table, limit, page);
        const requestStatus = await get_request_status();
        const requestType = await get_request_type();
        const requestContainer = document.getElementById('request-container');
        generateDropdown(requestStatus, requestType)
        requestContainer.innerHTML = "";
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');
        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        

        const tableBody = document.createElement('tbody');
        toggleSpinner(true);
        let tableHeaders = [];
        let checkboxStates = [];
        tableHeaders = ["", "Buyer Name","Phone Number", "Tracking Number", "Order Number", "Order Date", "Request Date", "Request Reason", "Request Type", "Request Status"];
        tableHeaders.forEach(header => {
            /* const th = document.createElement('th');
            th.textContent = header; */
            tableHeaderRow.appendChild(Cell.createHeaderCell(header, false, false));
        });
        requests.status.forEach((data, index) => {
            const { request_id, buyer_name, phone_number, tracking_number, order_number, order_date, request_date, request_reason, request_type, request_status} = data;
            const tableRow = document.createElement('tr');
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.name = 'items';
            checkboxInput.value = request_id;
            tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th', 'w-auto', 'text-center', 'd-flex', 'justify-content-center']));
            tableRow.appendChild(Cell.createSpanCell(buyer_name, false, false));
            tableRow.appendChild(Cell.createSpanCell(phone_number, false, false));
            tableRow.appendChild(Cell.createSpanCell(tracking_number, false, false));
            tableRow.appendChild(Cell.createSpanCell(order_number, false, false));
            tableRow.appendChild(Cell.createSpanCell(order_date, false, false));
            tableRow.appendChild(Cell.createSpanCell(request_date, false, false));
            tableRow.appendChild(Cell.createSpanCell(request_reason, false, false));
            tableRow.appendChild(Cell.createSpanCell(request_type, false, false, ['text-danger']));
            tableRow.appendChild(Cell.createSelectOnModalCell("Request Status", requestStatus.status, request_id, "request_status_id", request_status));
            tableBody.appendChild(tableRow);
        });
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        tableElement.appendChild(tableBody);
        requestContainer.appendChild(tableElement);
        const inputCheckbox = document.querySelectorAll('input[name="items"]');
        inputCheckbox.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const sku_settings_id = this.value;
                updateCheckBoxList(sku_settings_id, checkboxStates);
            });
        });
    } catch (error) {
        console.error(error);
        Alert.render("Failed to fetch data", "error");
    } finally {
        toggleSpinner(false);
    }
}

const updateButton = document.getElementById('updateButton');
const filterButton = document.getElementById('filter-button');

updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if (value) {
        const result = await DataController.updateByKey("requests", "id", id, key, value);
        if (result.status) {
            Cell.closeEditModal();
            Alert.showSuccessMessage('Update successful');
            generateTable("requests", 100, 0);
        } else {
            Alert.showErrorMessage('Update failed');
        }
    }else {
        Alert.showErrorMessage('Update failed');
    }
});

filterButton.addEventListener('click', function () {
    generateTable("requests", 100, 0);
});

async function generateDropdown(requestStatus, requestType) {
    try {
        const requestStatusDropdown = document.getElementById('request-status-dropdown');
        const requestTypeDropdown = document.getElementById('request-type-dropdown');

        const selectedRequestStatus = document.getElementById('selected-request-status');
        const selectedRequestType = document.getElementById('selected-request-type');

        const orderDateInputStart = document.getElementById('order-date-input-start');
        const orderDateInputEnd = document.getElementById('order-date-input-end');
        const requestDateInputStart = document.getElementById('request-date-input-start');
        const requestDateInputEnd = document.getElementById('request-date-input-end');

        requestStatusDropdown.innerHTML='';
        requestTypeDropdown.innerHTML='';
        appendDropdownList(selectedRequestStatus, requestStatusDropdown, "All", 'request-status-filter');
        appendDropdownList(selectedRequestType, requestTypeDropdown, "All", 'request-type-filter');

        requestStatus.status.forEach(requestStatusName => {
            appendDropdownList(selectedRequestStatus, requestStatusDropdown, requestStatusName, 'request-status-filter');
        });
        requestType.status.forEach(requestTypeName => {
            appendDropdownList(selectedRequestType, requestTypeDropdown, requestTypeName, 'request-type-filter');
        });
        orderDateInputStart.addEventListener('change', () => {
            const checkbox = document.getElementById("order-date-filter");
            checkbox.checked = true;
        });
        orderDateInputEnd.addEventListener('change', () => {
            const checkbox = document.getElementById("order-date-filter");
            checkbox.checked = true;
        });
        requestDateInputStart.addEventListener('change', () => {
            const checkbox = document.getElementById("request-date-filter");
            checkbox.checked = true;
        });
        requestDateInputEnd.addEventListener('change', () => {
            const checkbox = document.getElementById("request-date-filter");
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

function getFilterValues() {
    const filters = {
        order_date_start: {
            value: document.getElementById('order-date-input-start').value,
            include: document.getElementById('order-daterange-filter').checked,
        },
        order_date_end: {
            value: document.getElementById('order-date-input-end').value,
            include: document.getElementById('order-daterange-filter').checked,
        },
        request_date_start: {
            value: document.getElementById('request-date-input-start').value,
            include: document.getElementById('request-daterange-filter').checked,
        },
        request_date_end: {
            value: document.getElementById('request-date-input-end').value,
            include: document.getElementById('request-daterange-filter').checked,
        },
        request_status_id: {
            value: document.getElementById('selected-request-status').getAttribute('data-value'),
            include: document.getElementById('request-status-filter').checked,
        },
        request_type_id: {
            value: document.getElementById('selected-request-type').getAttribute('data-value'),
            include: document.getElementById('request-type-filter').checked,
        }
    };

    return filters;
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll(".input-group-text").forEach(label => {
        label.addEventListener("click", function () {
            let inputId = this.getAttribute("for"); // ดึง id ของ input ที่เชื่อมโยง
            let inputField = document.getElementById(inputId);
            if (inputField) {
                inputField.showPicker(); // ใช้ showPicker() สำหรับ input type="date"
            }
        });
    });
    generateTable("requests", 100, 0);
});