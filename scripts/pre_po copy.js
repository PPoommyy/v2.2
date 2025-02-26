import { Pagination } from "../../components/Pagination.js";
import { Downloader } from "../../components/Downloader.js";
import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Cell } from "../../components/Cell.js";
import { Modal } from "../../components/Modal.js";

const getFactory = async (limit, page) => {
    try {
        let url = `../../backend/get_factory_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const generateTable = (headers, data, currentPage, totalPages, paginationId) => {
    try {
        const tableContainer = document.getElementById('table-container');
        tableContainer.innerHTML = ''; // Clear any previous table

        // Create table and table elements
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Add Bootstrap 5 classes for table styling
        table.classList.add('table', 'table-bordered', 'table-hover', 'table-striped');

        // Create and append header row
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const headerCell = Cell.createHeaderCell(header);
            headerRow.appendChild(headerCell);
        });
        thead.appendChild(headerRow);

        // Create and append body rows
        data.forEach(row => {
            const bodyRow = document.createElement('tr');
            Object.keys(row).forEach(key => {
                const value = row[key];
                const cell = Cell.createSpanCell(value);
                bodyRow.appendChild(cell);
            });
            tbody.appendChild(bodyRow);
        });

        // Append thead and tbody to the table
        table.appendChild(thead);
        table.appendChild(tbody);

        // Append table to the container
        tableContainer.appendChild(table);

        // Update pagination
        Pagination.updatePagination(currentPage, totalPages, paginationId, generateTable);

        // Show success message on table load
        Alert.showSuccessMessage('Table loaded successfully!');
    } catch (error) {
        Alert.showErrorMessage('Failed to load the table.');
    }
};

const generateFactoryTable = (factories, currentPage, totalPages) => {
    const tableContainer = document.getElementById('factory-table-container');
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    table.classList.add('table', 'table-bordered', 'table-hover');

    // Table headers
    const headerRow = document.createElement('tr');
    ['ID', 'Name', 'Email', 'Location'].forEach(header => {
        const headerCell = document.createElement('th');
        headerCell.innerText = header;
        headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    factories.forEach(factory => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${factory.id}</td>
            <td>${factory.name}</td>
            <td>${factory.email}</td>
            <td>${factory.location}</td>
        `;
        row.addEventListener('click', () => {
            selectedFactory = factory; // Store selected factory
            highlightOrderItems(factory.skus); // Highlight items in the order table
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    Pagination.updatePagination(currentPage, totalPages, 'factory-pagination', generateFactoryTable);
};

// Generate order table with highlighting based on the selected factory
const generateOrderTable = (orders, currentPage, totalPages) => {
    const tableContainer = document.getElementById('order-table-container');
    tableContainer.innerHTML = ''; // Clear previous table

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    table.classList.add('table', 'table-bordered', 'table-hover');

    // Table headers
    const headerRow = document.createElement('tr');
    ['Order ID', 'Customer', 'Items'].forEach(header => {
        const headerCell = document.createElement('th');
        headerCell.innerText = header;
        headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    orders.forEach(order => {
        const row = document.createElement('tr');

        // For the items column, we will add logic to highlight the background
        const itemsHTML = order.items.map(item => {
            const itemClass = selectedFactory && selectedFactory.skus.includes(item) ? 'bg-success' : 'bg-danger';
            return `<span class="${itemClass}">${item}</span>`;
        }).join(', ');

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${itemsHTML}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);

    Pagination.updatePagination(currentPage, totalPages, 'order-pagination', generateOrderTable);
};

// Highlight order items based on selected factory SKUs
const highlightOrderItems = (factorySkus) => {
    generateOrderTable(orders, 1, 1); // Re-render the order table to apply new highlighting
};

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

async function main(limit, page) {
    try {
        toggleSpinner(true);
        const factoryHeaders = ['ID', 'Name', 'Email', 'Location'];

        /* const factoryData = [
            { id: 1, name: 'John Doe', email: 'john@example.com', action: 'edit' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', action: 'select', options: [{ id: 1, name: 'Option 1' }, { id: 2, name: 'Option 2' }] },
        ]; */
        const factories = await getFactory(limit, page);
        let factoryData = [];
    
        factories.data1.forEach(factory => {
            const factoryDetails = factory.details;
            const factorySkus = factory.factory_skus.map(sku => ({
                orderProductSku: sku.order_product_sku,
                reportProductName: sku.report_product_name
            }));
        
            // Create an entry for each factory with aggregated SKUs
            factoryData.push({
                id: factoryDetails.id,
                name: factoryDetails.name,
                location: factoryDetails.location,
                contactPerson: factoryDetails.contact_person,
                contactNumber: factoryDetails.contact_number,
                email: factoryDetails.email_address,
                skus: factorySkus // array of SKU data
            });
        });
        console.log("factories", factoryData);
        /* const factoryTotalPages = 10;
        const factoryCurrentPage = 1;
        const factoryPaginationId = 'factory-pagination-1';

        const factoryDataContainer = document.getElementById('factory-data-container');
        factoryDataContainer.innerHTML = '';
        factoryDataContainer.appendChild(generateTable(factoryHeaders, factoryData, factoryTotalPages, factoryCurrentPage, factoryPaginationId));

        const orderDataContainer = document.getElementById('order-data-container');
        orderDataContainer.innerHTML = '';
        orderDataContainer.appendChild(generateTable(headers, data, currentPage, totalPages, paginationId)); */

        generateFactoryTable(factoryData, 1, 1);
        // generateOrderTable(orders, 1, 1);
    } catch (e) {
        console.error(e);
    } finally {
        toggleSpinner(false);
    }
}

document.addEventListener('DOMContentLoaded', main(100, 1));
