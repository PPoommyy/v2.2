import { AddressController } from "../../components/AddressController.js";
import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js"

const factory_id = document.getElementById('factoryId').value;

console.log("factory_id ", factory_id);
const get_factory_details = async (factory_id) => {
    try {
        const url = `../../backend/get_value_by_key.php?table=factories`;
        /* const response = await axios.get(url,
            {
                "key": "id",
                "value": factory_id
            }); */
        const response = await axios.post(url, 
            { 
                key: "id", 
                value: factory_id
            });

        return response;
    } catch (error) {
        Alert.showErrorMessage();
    }
}
const get_factory_skus = async (factory_id, page) => {
    try {
        const url = `../../backend/get_factory_skus.php?factory_id=${factory_id}&page=${page}`;
        const response = await axios.get(url);
        return response;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

/* 
this is front-end code call from factory_details.php
 sample data from get_factory_skus
    {
    "data": [
        {
            "sku_settings_id": 3,
            "order_product_sku": "BXSKID-003-3S",
            "report_product_name": "กางเกงเด็ก BXSKID-003   3S",
            "factory_id": null,
            "factory_sku_settings_id": null,
            "created_at": null,
            "updated_at": null,
            "exist": 0
        },
        {
            "sku_settings_id": 5,
            "order_product_sku": "BXSKID-005-3S",
            "report_product_name": "กางเกงเด็ก BXSKID-005   3S",
            "factory_id": null,
            "factory_sku_settings_id": null,
            "created_at": null,
            "updated_at": null,
            "exist": 0
        },
        {
            "sku_settings_id": 6,
            "order_product_sku": "BXSKID-006-3S",
            "report_product_name": "กางเกงเด็ก BXSKID-006   3S",
            "factory_id": null,
            "factory_sku_settings_id": null,
            "created_at": null,
            "updated_at": null,
            "exist": 0
        },
        {
            "sku_settings_id": 10,
            "order_product_sku": "BXSKID-010-3S",
            "report_product_name": "กางเกงเด็ก BXSKID-010  ชมพู  3S",
            "factory_id": null,
            "factory_sku_settings_id": null,
            "created_at": null,
            "updated_at": null,
            "exist": 0
        },
        {
            "sku_settings_id": 12,
            "order_product_sku": "BXSKID-012-3S",
            "report_product_name": "กางเกงเด็ก BXSKID-012   3S",
            "factory_id": null,
            "factory_sku_settings_id": null,
            "created_at": null,
            "updated_at": null,
            "exist": 0
        }
    ]
}

 sample data from get_factory_details
     {
    "id": null,
    "table": "factories",
    "column": "*",
    "request": {
        "key": "id",
        "value": 1
    },
    "status": [
        {
            "id": 1,
            "name": "Shanghai Electronics",
            "location": "Shanghai, China",
            "contact_person": "Li Wei",
            "contact_number": "+86-21-12345678",
            "email_address": "liwei@shanghai-electronics.com"
        }
    ]
}
*/

/* 
    show 2 section in factory_details.php
    1. on left side show factory details
    2. on right side show factory skus table have pagination from Pagination.js and each row have check box to add factory sku to factory_sku_settings table (checkbox enabled if exist)
    have save button on above to create or delete factory_sku_settings from checkbox
*/
const generateSection1 = async () => {
    // if factory_id is null then meaning of add new factory
    if (factory_id) {
        const result = await get_factory_details(factory_id);
        const factory = result.data.status[0];
        const { name, location, contact_person, contact_number, email_address } = factory;
        console.log("factory", factory);

        const factoryName = document.getElementById('factory-name');
        const factoryLocation = document.getElementById('factory-location');
        const factoryContactPerson = document.getElementById('factory-contact-person');
        const factoryContactNumber = document.getElementById('factory-contact-number');
        const factoryEmailAddress = document.getElementById('factory-email-address');

        /*
        <div class="row mb-4">
                    <div class="col-3 text-end">Factory Name</div>
                    <div class="col-9">
                        <input id="factory-name" class="form-control" type="text">
                    </div>
                </div> 
         */
        factoryName.value = name;
        factoryLocation.value = location;
        factoryContactPerson.value = contact_person;
        factoryContactNumber.value = contact_number;
        factoryEmailAddress.value = email_address;
    }
}

const generateSection2 = async (limit, page) => {
    console.log("page = ", page);
    // if factory_id is null then meaning of add new factory
    if (factory_id) {
        const result = await get_factory_skus(factory_id, page);
        const factory = result.data.data;
        console.log("result", result);
        const factorySkuDataContainer = document.getElementById('factory-skus');
        factorySkuDataContainer.innerHTML = "";
        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-sm', 'table-bordered', 'table-striped', 'table-hover');
        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.innerHTML =
        `
        <th></th>
        <th>Sku ID</th>
        <th>Order Product Sku</th>
        <th>Report Product Name</th>
        <th>Item Price</th>
        `;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        const tableBody = document.createElement('tbody');
        tableElement.appendChild(tableBody);
        factory.forEach(factorySku => {
            const { factory_sku_settings_id, sku_settings_id, order_product_sku, report_product_name, item_price, exist } = factorySku;
            const tableRow = document.createElement('tr');
            //checkbox true when exist = 1
            tableRow.innerHTML =
            `
            <td>
                <input type="checkbox" name="factory_sku_settings_id_${factory_sku_settings_id}" value="${factory_sku_settings_id}" ${exist === 1 ? 'checked' : ''} data-item-price="${item_price}">
            </td>
            <td>${sku_settings_id}</td>
            <td>${order_product_sku}</td>
            <td>${report_product_name}</td>
            `;
            tableRow.appendChild(Cell.createInputCell("item_price", item_price));
            tableBody.appendChild(tableRow);
        });
        factorySkuDataContainer.appendChild(tableElement);
        const totalCount = result.data.totalCount;
        const totalPages = Math.ceil(totalCount / 100);
        Pagination.updatePagination(page, totalPages, 'pagination1', generateSection2);
    }
}

/* 
    create function for save-factory and create-factory button from factory_details.php
    1. get value from factory details input then update to factories table by Datacontroller.js component
    2. get value from checkbox in factory-skus table then create or delete data in factory_sku_settings table by Datacontroller.js component
*/

const saveFactory = async () => {
    // Gather factory details
    const factoryName = document.getElementById('factory-name');
    const factoryLocation = document.getElementById('factory-location');
    const factoryContactPerson = document.getElementById('factory-contact-person');
    const factoryContactNumber = document.getElementById('factory-contact-number');
    const factoryEmailAddress = document.getElementById('factory-email-address');

    const factory = {
        name: factoryName.value,
        location: factoryLocation.value,
        contact_person: factoryContactPerson.value,
        contact_number: factoryContactNumber.value,
        email_address: factoryEmailAddress.value,
    };

    console.log("factory", factory);

    // Update factory details
    const factoryUpdateResult = await DataController.update("factories", "id", factory_id, factory);
    if (!factoryUpdateResult) {
        Alert.showErrorMessage("Failed to update factory details.");
        return;
    }

    // Process checkboxes for factory SKUs
    const checkboxes = document.querySelectorAll('#factory-skus input[type="checkbox"]');
    const insertResults = [];
    const deleteOperations = [];
    const updateOperations = [];

    for (const checkbox of checkboxes) {
        const factorySkuSettingsId = checkbox.value; // Existing record ID
        const isChecked = checkbox.checked;
        
        // Get item_price
        const itemPriceInput = checkbox.closest('tr').querySelector('input[for="item_price"]');
        const item_price = parseFloat(itemPriceInput?.value || 0).toFixed(2);

        console.log("isChecked: ", isChecked);
        console.log("factorySkuSettingsId: ", factorySkuSettingsId);
        console.log("item_price: ", item_price);

        if (isChecked && factorySkuSettingsId === "null") {
            // Insert new row for checked item that does not exist
            console.log("insert new row");
            const skuSettingsId = checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
            try {
                const result = await DataController.insert("factory_sku_settings", { 
                    factory_id: parseInt(factory_id), 
                    sku_settings_id: parseInt(skuSettingsId), 
                    item_price: item_price 
                });
                console.log("Insert result:", result);
                insertResults.push(result);
            } catch (error) {
                console.error("Error inserting SKU:", error);
            }
        } else if (!isChecked && factorySkuSettingsId !== "null") {
            // Delete unchecked item that exists
            deleteOperations.push(DataController._delete("factory_sku_settings", "factory_sku_settings_id", factorySkuSettingsId));
        } else if (isChecked && factorySkuSettingsId !== "null") {
            // Update existing record if item_price has changed
            updateOperations.push(DataController.update("factory_sku_settings", "factory_sku_settings_id", factorySkuSettingsId, { item_price: item_price }));
        }
    }

    try {
        // Execute all updates and deletes in parallel
        await Promise.all([...updateOperations, ...deleteOperations]);
        Alert.showSuccessMessage("Factory details and SKUs updated successfully.");
    } catch (error) {
        console.error("Error updating/deleting SKUs:", error);
        Alert.showErrorMessage("Failed to update factory SKUs.");
    }
};

const createFactory = async () => {
    const factoryName = document.getElementById('factory-name');
    const factoryLocation = document.getElementById('factory-location');
    const factoryContactPerson = document.getElementById('factory-contact-person');
    const factoryContactNumber = document.getElementById('factory-contact-number');
    const factoryEmailAddress = document.getElementById('factory-email-address');
    const factory = {
        name: factoryName.value,
        location: factoryLocation.value,
        contact_person: factoryContactPerson.value,
        contact_number: factoryContactNumber.value,
        email_address: factoryEmailAddress.value,
    };
    const result = await DataController.insert("factories", factory);
    console.log("result", result);
    if (result) {
        Alert.showSuccessMessage();
    } else {
        Alert.showErrorMessage();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const saveFactoryButton = document.getElementById('save-factory');
    const createFactoryButton = document.getElementById('create-factory');

    if (saveFactoryButton) {
        saveFactoryButton.addEventListener('click', saveFactory);
    }
    if (createFactoryButton) {
        createFactoryButton.addEventListener('click', createFactory);
    }

    generateSection1();
    generateSection2(10, 1);
});
