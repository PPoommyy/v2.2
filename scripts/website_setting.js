import { Cell } from "../components/Cell.js";
import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const key = document.getElementById('editKey').value;
    const value = document.getElementById('editValue').value;
    if(value) {
        const result = await DataController.updateByKey("websites", "id", id, key, value);
        if (result&&result.status) {
            Alert.showSuccessMessage('Update successful');
        } else {
            Alert.showErrorMessage('Update failed');
        }
        Cell.closeEditModal();
        generateTable(100, 1);
    }else {
        Alert.showErrorMessage('Update failed');
    }
});

async function get_websites() {
    try {
        let url = `../backend/get_websites.php`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function generateTable() {
    try {
        const result = await get_websites();
        const websiteGroups = result.data;
        const currencies = result.currencies;
        const paymentMethods = result.paymentMethods;
        const websiteGroupList = document.getElementById('website-group-list');
        websiteGroupList.innerHTML = '';

        websiteGroups.forEach(websiteGroup => {
            const websiteGroupContainer = document.createElement('div');
            websiteGroupContainer.classList.add('container');
            const websiteGroupTitle = document.createElement('p');
            websiteGroupTitle.classList.add('h3', 'mb-3');
            websiteGroupTitle.innerText = websiteGroup.website_group_name;

            const tableElement = document.createElement('table');
            tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

            const tableHeader = document.createElement('thead');
            const tableHeaderRow = document.createElement('tr');
            tableHeaderRow.innerHTML =
            `<th>Website Name</th>
            <th>Currency</th>
            <th>Shipping Fee</th>
            <th>Payment Method</th>
            <th></th>`;
            tableHeader.appendChild(tableHeaderRow);
            tableElement.appendChild(tableHeader);

            const tableBody = document.createElement('tbody');
            if (websiteGroup.website_list.length > 0) {
                websiteGroup.website_list.forEach((website)=>{
                    const tableRow = document.createElement('tr');
                    const deleteButtonCell = Cell.createDeleteButtonCell();
                    const deleteButton = deleteButtonCell.firstChild;
                    deleteButton.addEventListener('click', async () => {
                        const confirmAlert = await Alert.showConfirmModal("Are you sure you want to delete the rows?");
                        
                        if (!confirmAlert.isConfirmed) {
                            return;
                        }

                        const result = await DataController._delete("websites", "id", website.website_id);
                        if (result&&result.status) {
                            Alert.showSuccessMessage('Delete successful');
                        } else {
                            Alert.showErrorMessage('Delete failed');
                        }
                        Cell.closeEditModal();
                        generateTable(100, 1);
                    });
                    tableRow.appendChild(Cell.createInputOnModalCell('Website Name', website.website_id, 'website_name', website.website_name));
                    tableRow.appendChild(Cell.createSelectOnModalCell('Currency', currencies, website.website_id, 'currency', website.currency_name));
                    tableRow.appendChild(Cell.createInputOnModalCell('Shipping Fee', website.website_id, 'shipping_fee', website.shipping_fee));
                    tableRow.appendChild(Cell.createSelectOnModalCell('Payment Method', paymentMethods, website.website_id, 'payment_method', website.payment_method_name));
                    tableRow.appendChild(deleteButtonCell);
                    tableBody.appendChild(tableRow);
                })
            } else {
                const tableRow = document.createElement('tr');
                tableRow.innerHTML =
                `<td class="text-center" colspan="5">No websiteGroup domains retrieved for this group.</td>`;
                tableBody.appendChild(tableRow);
            }

            tableElement.appendChild(tableBody);
            websiteGroupContainer.appendChild(websiteGroupTitle);
            websiteGroupContainer.appendChild(tableElement);
            websiteGroupList.appendChild(websiteGroupContainer);
        });
    } catch (error) {
        console.error(error);
    }
}

generateTable();