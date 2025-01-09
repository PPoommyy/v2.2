import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Pagination } from "../components/Pagination.js";

const get_factory_list = async (limit, page) => {
    try {
        const url = `../datasets/get_factory_list.php?limit=${limit}&page=${page}`;
        const response = await axios.get(url);
        return response.data;
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
                handleFactorySelection(id, name);
            });

            dropdownMenu.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching factory list:", error);
        Alert.showErrorMessage("Failed to load factory list.");
    }
};

const handleFactorySelection = (factoryId, factoryName) => {
    const selectButton = document.getElementById('select-factory');
    selectButton.textContent = factoryName; // Update button text
    loadFactorySkus(factoryId); // Load SKUs for the selected factory
};

const loadFactorySkus = async (factoryId) => {
    const orderSkusContainer = document.getElementById('order-skus');
    orderSkusContainer.innerHTML = '<p>Loading SKUs...</p>';

    try {
        const response = await DataController.selectByKey("factory_sku_settings", "factory_id", factoryId);
        const skus = response.data1; // Assuming SKUs are returned in `data1`
        console.log(response);
        if (skus.length === 0) {
            orderSkusContainer.innerHTML = '<p>No SKUs found for the selected factory.</p>';
            return;
        }

        // Render SKUs
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped');
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>SKU ID</th>
                <th>Name</th>
                <th>Quantity</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        skus.forEach(sku => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sku.id}</td>
                <td>${sku.name}</td>
                <td>${sku.quantity}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        orderSkusContainer.innerHTML = ''; // Clear loading message
        orderSkusContainer.appendChild(table);
    } catch (error) {
        console.error("Error loading SKUs:", error);
        orderSkusContainer.innerHTML = '<p>Failed to load SKUs.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    generateDropdown();
});
