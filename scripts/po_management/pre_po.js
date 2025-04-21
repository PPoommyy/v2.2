import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Pagination } from "../../components/Pagination.js";
import { Cell } from "../../components/Cell.js";
import { PODataController } from "../../components/PODataController.js";

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

const generateDropdown = async () => {
  const dropdownMenu = document.getElementById("dropdown-menu");
  dropdownMenu.innerHTML = "";

  try {
    const factories = await PODataController.get_factory_list();

    factories.forEach((factory) => {
      const { id, name } = factory;

      const option = document.createElement("a");
      option.classList.add("dropdown-item");
      option.href = "#";
      option.textContent = name;
      option.dataset.factoryId = id;

      option.addEventListener("click", (event) => {
        event.preventDefault();
        handleFactorySelection(option);
      });

      dropdownMenu.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching factory list:", error);
    Alert.showErrorMessage("Failed to load factory list.");
  }
};

const handleFactorySelection = (selectedOption) => {
  const selectButton = document.getElementById("select-factory");
  selectButton.textContent = selectedOption.textContent;
  selectButton.dataset.factoryId = selectedOption.dataset.factoryId;
  loadFactorySkus(selectedOption.dataset.factoryId);
};

let checkboxStates = [];

const loadFactorySkus = async (factoryId) => {
  try {
    toggleSpinner(true);
    const orders = await PODataController.get_pre_po_order(factoryId);

    const orderDataContainer = document.getElementById("order-skus");
    orderDataContainer.innerHTML = "";
    checkboxStates = [];

    const tableElement = document.createElement("table");
    tableElement.classList.add(
      "table",
      "table-bordered",
      "table-striped",
      "table-hover",
      "table-condensed"
    );

    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");

    tableHeaderRow.innerHTML = `
            <th>
                <input id="allItems" type="checkbox" name="Allitems" value="-1" data-toggle="tooltip" title="Select All"/>
            </th>
            <th>Detail</th>
            <th>TIME SORT</th>
            <th>Buyer Name</th>
            <th>Report Product Name</th>
            <th>Product Status</th>
            <th>Channel</th>
            <th>Currency</th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");

    orders.forEach((order) => {
      const { data, nested } = order;
      const { items } = nested;

      if (items.length === 0) return;

      const {
        timesort,
        order_id,
        buyer_name,
        website_name,
        currency_code,
        order_status,
        fulfillment_status,
        order_note,
      } = data;

      const tableRow = document.createElement("tr");

      const orderCheckbox = document.createElement("input");
      orderCheckbox.type = "checkbox";
      orderCheckbox.name = "orderCheckbox";
      orderCheckbox.value = timesort;
      orderCheckbox.dataset.orderId = order_id;

      orderCheckbox.addEventListener("change", function () {
        const itemCheckboxes = document.querySelectorAll(
          `input[name="itemCheckbox"][data-order-id="${order_id}"]`
        );
        itemCheckboxes.forEach((checkbox) => {
          checkbox.checked = this.checked;
          updateCheckBoxList(checkbox, order_id, this.checked);
        });
      });

      const firstItemCheckbox = document.createElement("input");
      firstItemCheckbox.type = "checkbox";
      firstItemCheckbox.name = "itemCheckbox";
      firstItemCheckbox.value = items[0].orders_skus_id;
      firstItemCheckbox.dataset.sku_settings_id = items[0].sku_settings_id;
      firstItemCheckbox.dataset.orders_skus_id = items[0].orders_skus_id;
      firstItemCheckbox.dataset.order_product_sku = items[0].order_product_sku;
      firstItemCheckbox.dataset.item_price = items[0].item_price;
      firstItemCheckbox.dataset.quantity_purchased =
        items[0].quantity_purchased;
      firstItemCheckbox.dataset.orderId = order_id;

      firstItemCheckbox.addEventListener("change", function () {
        updateCheckBoxList(this, order_id, this.checked);
        updateOrderCheckboxState(order_id);
      });

      const productName = document.createElement("span");
      productName.innerText = items[0].report_product_name;

      const linkDetails = document.createElement("a");
      linkDetails.href = `order_details.php?order_id=${order_id}`;
      linkDetails.innerText = "View Detail";
      const isCancel = buyer_name.split(" ")[0] == "ยกเลิก";
      const buyerNameSpan = document.createElement("span");
      if (isCancel) {
        buyerNameSpan.classList.add("text-danger");
        buyerNameSpan.innerHTML = `(ยกเลิก แก้ไขเป็น ${
          buyer_name.split(" ")[1]
        })`;
      } else {
        buyerNameSpan.innerHTML = buyer_name;
      }

      const timesortDiv = document.createElement("div");
      const timesortText = document.createElement("p");
      timesortText.innerHTML = timesort;
      timesortDiv.appendChild(timesortText);

      tableRow.appendChild(
        Cell.createElementCell(orderCheckbox, false, items.length, ["th"])
      );
      tableRow.appendChild(
        Cell.createElementCell(linkDetails, false, items.length, false)
      );
      tableRow.appendChild(
        Cell.createElementCell(timesortDiv, false, items.length)
      );
      tableRow.appendChild(
        Cell.createSpanCell(buyer_name, false, items.length, false)
      );
      tableRow.appendChild(
        Cell.createElementCell([firstItemCheckbox, productName], false, false, [
          "d-flex",
          "align-items-center",
          "gap-3",
        ])
      );
      tableRow.appendChild(
        Cell.createSpanCell(items[0].product_status_name, false, false)
      );
      tableRow.appendChild(
        Cell.createSpanCell(website_name, false, items.length)
      );
      tableRow.appendChild(
        Cell.createSpanCell(currency_code, false, items.length)
      );
      /* tableRow.appendChild(
        Cell.createSpanCell(fulfillment_status, false, items.length)
      ); */

      tableBody.appendChild(tableRow);

      items.slice(1).forEach((item) => {
        const itemRow = document.createElement("tr");
        const itemCheckbox = document.createElement("input");
        itemCheckbox.type = "checkbox";
        itemCheckbox.name = "itemCheckbox";
        itemCheckbox.value = item.orders_skus_id;
        itemCheckbox.dataset.sku_settings_id = item.sku_settings_id;
        itemCheckbox.dataset.orders_skus_id = item.orders_skus_id;
        itemCheckbox.dataset.order_product_sku = item.order_product_sku;
        itemCheckbox.dataset.quantity_purchased = item.quantity_purchased;
        itemCheckbox.dataset.item_price = item.item_price;
        itemCheckbox.dataset.orderId = order_id;

        itemCheckbox.addEventListener("change", function () {
          updateCheckBoxList(this, order_id, this.checked);
          updateOrderCheckboxState(order_id);
        });

        const productNameSpan = document.createElement("span");
        productNameSpan.innerText = item.report_product_name;

        itemRow.appendChild(
          Cell.createElementCell(
            [itemCheckbox, productNameSpan],
            false,
            false,
            ["d-flex", "align-items-center", "gap-3"]
          )
        );
        itemRow.appendChild(
          Cell.createSpanCell(item.product_status_name, false, false)
        );
        tableBody.appendChild(itemRow);
      });
    });

    tableElement.appendChild(tableBody);
    orderDataContainer.appendChild(tableElement);

    function updateOrderCheckboxState(order_id) {
      const itemCheckboxes = document.querySelectorAll(
        `input[name="itemCheckbox"][data-order-id="${order_id}"]`
      );
      const orderCheckbox = document.querySelector(
        `input[name="orderCheckbox"][data-order-id="${order_id}"]`
      );

      orderCheckbox.checked = [...itemCheckboxes].every(
        (checkbox) => checkbox.checked
      );
    }

    const allItemsCheckbox = document.getElementById("allItems");
    allItemsCheckbox.addEventListener("change", function () {
      const orderCheckboxes = document.querySelectorAll(
        'input[name="orderCheckbox"]'
      );
      const itemCheckboxes = document.querySelectorAll(
        'input[name="itemCheckbox"]'
      );

      orderCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
        checkbox.dispatchEvent(new Event("change"));
      });

      itemCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
        updateCheckBoxList(checkbox, this.checked);
      });
    });
  } catch (error) {
    console.error(error);
  } finally {
    toggleSpinner(false);
  }
};

function updateCheckBoxList(item, order_id, checked) {
  const createPoOrderButton = document.getElementById("createPoOrder");
  const sku_settings_id = item.dataset.sku_settings_id;
  const orders_skus_id = item.dataset.orders_skus_id;
  const order_product_sku = item.dataset.order_product_sku;
  const quantity_purchased = item.dataset.quantity_purchased;
  const item_price = item.dataset.item_price;
  if (checked) {
    if (!checkboxStates[order_id]) {
      checkboxStates[order_id] = [];
    }
    if (!checkboxStates[order_id].includes(orders_skus_id)) {
      checkboxStates[order_id].push({
        orders_skus_id: orders_skus_id,
        sku_settings_id: sku_settings_id,
        order_product_sku: order_product_sku,
        quantity_purchased: quantity_purchased,
        item_price: item_price,
      });
    }
  } else {
    if (checkboxStates[order_id]) {
      checkboxStates[order_id] = checkboxStates[order_id].filter(
        (id) => id !== orders_skus_id
      );
      if (checkboxStates[order_id].length === 0) {
        delete checkboxStates[order_id];
      }
    }
  }
  if (Object.keys(checkboxStates).length > 0) {
    createPoOrderButton.removeAttribute("disabled");
  } else {
    createPoOrderButton.setAttribute("disabled", "");
  }
}

const createPoOrderButton = document.getElementById("createPoOrder");
createPoOrderButton.addEventListener("click", async () => {
  const selectedFactory =
    document.getElementById("select-factory").dataset.factoryId;

  const poDraft = await PODataController.get_factory_draft(selectedFactory);
  if (!selectedFactory) {
    Alert.showErrorMessage("กรุณาเลือกโรงงานก่อนสร้าง PO Order");
    return;
  }

  const selectedItems = [];
  for (const orderId in checkboxStates) {
    selectedItems.push({
      order_id: orderId,
      items: checkboxStates[orderId],
    });
  }

  if (selectedItems.length === 0) {
    Alert.showErrorMessage("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
    return;
  }

  const encodedData = encodeURIComponent(JSON.stringify(selectedItems));
  const queryString = `pre_po_details.php?factory_id=${selectedFactory}&data=${encodedData}${
    poDraft.length > 0 ? `&po_order_id=${poDraft[0].data.po_order_id}` : ""
  }`;
  window.location.href = queryString;
});

document.addEventListener("DOMContentLoaded", () => {
  generateDropdown();
});
