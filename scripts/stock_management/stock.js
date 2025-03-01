import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";


const get_stock = async (table, limit, page) => {
    try {
        const response = await axios.get(`../../backend/get/stock/get_stock.php?table=${table}&limit=${limit}&page=${page}`);
        return response;
    } catch (error) {
        throw error;
    }
};

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
        const stock = await get_stock(table, limit, page);
        const stockContainer = document.getElementById('stock-container');
        stockContainer.innerHTML = "";
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');
        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        

        const tableBody = document.createElement('tbody');
        toggleSpinner(true);
        let tableHeaders = [];
        let checkboxStates = [];

        if (table === "total") {
            const stockData = stock.data.stock;
            tableHeaders = ["", "Product Name","Remaining Stock"];
            tableHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                tableHeaderRow.appendChild(th);
            });
            stockData.forEach((stock, index) => {
                const { sku_settings_id, product_order_product_sku, total_remaining } = stock;
                const tableRow = document.createElement('tr');
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.name = 'items';
                checkboxInput.value = sku_settings_id;
                tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th', 'w-auto', 'text-center', 'd-flex', 'justify-content-center']));
                tableRow.appendChild(Cell.createSpanCell(product_order_product_sku, false, false));
                tableRow.appendChild(Cell.createSpanCell(total_remaining, false, false));
                tableBody.appendChild(tableRow);
            });
            tableHeader.appendChild(tableHeaderRow);
            tableElement.appendChild(tableHeader);
            tableElement.appendChild(tableBody);
            stockContainer.appendChild(tableElement);
            // console.log(stockData);
            const inputCheckbox = document.querySelectorAll('input[name="items"]');
            inputCheckbox.forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const sku_settings_id = this.value;
                    updateCheckBoxList(sku_settings_id, checkboxStates);
                });
            });
        } else if (table === "stock_in") {
            const stockData = stock.data.stock_in;
            // console.log(stockData);
            tableHeaders = ["", "Product Name", "Receive Quantity","Remaining Quantity", "Received Date"];
            tableHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                tableHeaderRow.appendChild(th);
            });
            stockData.forEach((stock, index) => {
                const { stock_id, product_order_product_sku, received_quantity, remaining_quantity, received_date } = stock;
                const tableRow = document.createElement('tr');
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.name = 'items';
                checkboxInput.value = stock_id;
                tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th', 'w-auto', 'text-center', 'd-flex', 'justify-content-center']));
                tableRow.appendChild(Cell.createSpanCell(product_order_product_sku, false, false));
                tableRow.appendChild(Cell.createSpanCell(received_quantity, false, false));
                tableRow.appendChild(Cell.createSpanCell(remaining_quantity, false, false));
                tableRow.appendChild(Cell.createSpanCell(received_date, false, false));
                tableBody.appendChild(tableRow);
            });
            tableHeader.appendChild(tableHeaderRow);
            tableElement.appendChild(tableHeader);
            tableElement.appendChild(tableBody);
            stockContainer.appendChild(tableElement);
            const inputCheckbox = document.querySelectorAll('input[name="items"]');
            inputCheckbox.forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const stock_id = this.value;
                    updateCheckBoxList(stock_id, checkboxStates);
                });
            });
        }
        else if (table === "stock_out") {
            const stockData = stock.data.stock_out;
            // console.log(stockData);
            tableHeaders = ["", "Product Name", "Receive Quantity","Remaining Quantity", "Received Date"];
            tableHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                tableHeaderRow.appendChild(th);
            });
            stockData.forEach((stock, index) => {
                const { stock_id, product_order_product_sku, received_quantity, remaining_quantity, received_date } = stock;
                const tableRow = document.createElement('tr');
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.name = 'items';
                checkboxInput.value = stock_id;
                tableRow.appendChild(Cell.createElementCell(checkboxInput, false, false, ['th', 'w-auto', 'text-center', 'd-flex', 'justify-content-center']));
                tableRow.appendChild(Cell.createSpanCell(product_order_product_sku, false, false));
                tableRow.appendChild(Cell.createSpanCell(received_quantity, false, false));
                tableRow.appendChild(Cell.createSpanCell(remaining_quantity, false, false));
                tableRow.appendChild(Cell.createSpanCell(received_date, false, false));
                tableBody.appendChild(tableRow);
            });
            tableHeader.appendChild(tableHeaderRow);
            tableElement.appendChild(tableHeader);
            tableElement.appendChild(tableBody);
            stockContainer.appendChild(tableElement);
            const inputCheckbox = document.querySelectorAll('input[name="items"]');
            inputCheckbox.forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const stock_id = this.value;
                    updateCheckBoxList(stock_id, checkboxStates);
                });
            });
        }
        
    } catch (error) {
        console.error(error);
        Alert.render("Failed to fetch data", "error");
    } finally {
        toggleSpinner(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const totalStockMenu = document.getElementById('total-stock');
    const stockIn = document.getElementById('stock-in');
    const stockOut = document.getElementById('stock-out');
    generateTable("total", 100, 1);
    totalStockMenu.addEventListener('click', async () => {
        generateTable("total", 100, 1);
    });

    stockIn.addEventListener('click', async () => {
        generateTable("stock_in", 100, 1);
    });

    stockOut.addEventListener('click', async () => {
        generateTable("stock_out", 100, 1);
    });
});