import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";


const get_stock = async () => {
    try {
        const response = await axios.get(`../../backend/get_stock.php`);
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

const generateTable = async(menu, limit, page) => {
    try {
        toggleSpinner(true);
        const stock = await get_stock();
        const stockContainer = document.getElementById('stock-container');
        stockContainer.innerHTML = "";
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed');
        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        

        const tableBody = document.createElement('tbody');
        toggleSpinner(true);
        const tableHeaders = [];
        if (menu === "total") {
            const stockData = stock.data.stock;
            tableHeaders = ["#", "Product Name", "Remaining Stock"];
    
        } else if (menu === "stock-in") {
            const stockData = stock.data.stock_in;
            tableHeaders = ["#", "Product Name", "Quantity","Remaining Stock"];
        }
        else if (menu === "stock-out") {
            const stockData = stock.data.stock_out;
            tableHeaders = ["#", "Product Name", "Remaining Stock"];
        }

        tableHeaders.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            tableHeaderRow.appendChild(th);
        });
        
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

    totalStockMenu.addEventListener('click', async () => {
        generateTable("total", 100, 1);
    });

    stockIn.addEventListener('click', async () => {
        generateTable("stock-in", 100, 1);
    });

    stockOut.addEventListener('click', async () => {
        generateTable("stock-out", 100, 1);
    });
});