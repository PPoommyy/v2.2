import { AddressController } from "../components/AddressController.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";
import { Pagination } from "../components/Pagination.js"

const factory_id = document.getElementById('factoryId').value;

console.log("factory_id ", factory_id);
const get_factory_details = async (factory_id) => {
    try {
        const url = `../datasets/get_value_by_key.php?table=factories`;
        const response = await axios.get(url,
            {
                "key": "id",
                "value": factory_id
            });
        return response;
    } catch (error) {
        Alert.showErrorMessage();
    }
}
const get_factory_skus = async (factory_id, page) => {
    try {
        const url = `../datasets/get_factory_skus.php?factory_id=${factory_id}&page=${page}`;
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
const generateSection1 = async (factory_id) => {
    // if factory_id is null then meaning of add new factory
    if (factory_id) {
        const result = await get_factory_details(factory_id);
        const factory = result.data;
        console.log("factory", factory);
        /* const factorySkuDataContainer = document.getElementById('factory-skus');
        const tableElement = document.createElement('table'); */

        const factoryName = document.getElementById('factory-name');
        const factoryLocation = document.getElementById('factory-location');
        const factoryContactPerson = document.getElementById('factory-contact-person');
        const factoryContactNumber = document.getElementById('factory-contact-number');
        const factoryEmailAddress = document.getElementById('factory-email-address');

        factoryName.textContent = factory.name;
        factoryLocation.textContent = factory.location;
        factoryContactPerson.textContent = factory.contact_person;
        factoryContactNumber.textContent = factory.contact_number;
        factoryEmailAddress.textContent = factory.email_address;

        /* factorySkuDataContainer.appendChild(tableElement); */
    }
}

const generateSection2 = async (factory_id, limit, page) => {
    // if factory_id is null then meaning of add new factory
    if (factory_id) {
        const result = await get_factory_skus(factory_id, limit, page);
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
        <th>Sku</th>
        <th>Report Product Name</th>
        `;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);
        const tableBody = document.createElement('tbody');
        tableElement.appendChild(tableBody);
        factory.forEach(factorySku => {
            const { factory_sku_settings_id, sku_settings_id, order_product_sku, report_product_name, exist } = factorySku;
            const tableRow = document.createElement('tr');
            //checkbox true when exist = 1
            tableRow.innerHTML =
            `
            <td>
                <input type="checkbox" name="factory_sku_settings_id[]" value="${factory_sku_settings_id}" ${exist === 1 ? 'checked' : ''}>
            </td>
            <td>${sku_settings_id}</td>
            <td>${order_product_sku}</td>
            <td>${report_product_name}</td>
            `;
            tableBody.appendChild(tableRow);
        });
        factorySkuDataContainer.appendChild(tableElement);
        const totalCount = result.data.totalCount;
        const totalPages = Math.ceil(totalCount / limit);
        Pagination.updatePagination(page, totalPages, 'pagination1', generateSection2);
    }
}

generateSection1(factory_id);
generateSection2(factory_id, 10, 1);