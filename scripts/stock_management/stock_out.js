import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { Downloader } from "../../components/Downloader.js";

const get_stock_search = async (searchTerm) => {
  try {
    const response = await axios.get(
      `../../backend/get/stock/get_stock_search.php?searchTerm=${searchTerm}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_order_data = async () => {
  try {
    const column1 = [
      "o.order_id",
      "o.payments_date",
      "o.buyer_name",
      "o.ship_phone_number",
      "o.ship_promotion_discount",
      "o.shipping_fee",
      "o.deposit",
      "o.ship_address_1",
      "o.ship_address_2",
      "o.ship_address_3",
      "o.ship_city",
      "o.ship_state",
      "o.ship_postal_code",
      "o.ship_country",
      "o.timesort",
      "o.raw_address",
      "o.override_address",
      "o.order_note",
      "w.name as website_name",
      "w.id as website_id",
      "c.name as currency_code",
      "c.id as currency_id",
      "pm.name as payment_methods",
      "pm.id as payment_method_id",
      "ost.name as order_status",
      "ost.id as order_status_id",
      "ot.name as order_type",
      "ot.id as order_type_id",
    ];
    const join1 = [
      ["orders_skus os", "o.order_id", "os.order_id"],
      ["currencies c", "o.currency_id", "c.id"],
      ["websites w", "o.website_id", "w.id"],
      ["payment_methods pm", "o.payment_method_id", "pm.id"],
      ["order_status ost", "o.order_status_id", "ost.id"],
      ["order_types ot", "o.order_type_id", "ot.id"],
    ];
    const where1 = [["o.order_status_id", "=", 6]];
    const nestedKey = "order_id";

    const nestedTables = [
      {
        table: "orders_skus os",
        columns: [
          "os.orders_skus_id",
          "os.unique_id",
          "os.order_item_id",
          "os.sku_settings_id",
          "os.item_price",
          "os.quantity_purchased",
          "os.shipping_price",
          "os.total",
          "ss.order_product_sku",
          "ss.report_product_name",
          "ws.name AS sku",
          "sb.name AS brand",
        ],
        order_by: "os.orders_skus_id",
        joins: [
          ["sku_settings ss", "os.sku_settings_id", "ss.id"],
          ["warehouse_skus ws", "ss.warehouse_sku_id", "ws.id"],
          ["sku_brands sb", "ss.sku_brand_id", "sb.id"],
        ],
        response_key: "items",
      },
      {
        table: "order_files of",
        columns: ["of.id", "of.order_id", "file_name", "file_pathname"],
        order_by: "of.id",
        response_key: "files",
      },
    ];
    const response = await DataController.selectNested(
      "orders o",
      column1,
      "o.timesort",
      "DESC",
      null,
      null,
      join1,
      where1,
      null,
      nestedKey,
      nestedTables,
      "o.order_id"
    );
    return response.status;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_stock = async (table, limit, page) => {
  try {
    const response = await axios.get(
      `../../backend/get/stock/get_stock.php?table=${table}&limit=${limit}&page=${page}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const update_stock = async (to_update) => {
  try {
    const response = await axios.post(
      `../../backend/update/update_stock.php`,
      {
        to_update,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

const createInput = (type, key, value, isDisabled) => {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.setAttribute("for", key);
  input.classList.add("w-100", key);
  if (isDisabled) {
    input.disabled = true;
  }
  return input;
};

const createTableCell = (element, colspan) => {
  const cell = document.createElement("td");
  cell.classList.add(`col-${colspan}`);
  cell.appendChild(element);
  return cell;
};

const createSkuDiv = (skuInput) => {
  const skuDiv = document.createElement("div");
  skuDiv.classList.add("dropdown");
  const skuDropdown = document.createElement("ul");
  skuDropdown.classList.add("dropdown-menu");
  skuInput.classList.add("dropdown-toggle");
  skuInput.setAttribute("data-bs-toggle", "dropdown");
  skuInput.addEventListener("input", async () => {
    skuInput.removeAttribute("order_product_id");
    skuInput.removeAttribute("order_product_name");
    const searchTerm = skuInput.value;
    const skuOptions = await get_stock_search(searchTerm);
    updateSkuDropdown(skuOptions.data, skuInput, skuDropdown);
  });

  skuInput.addEventListener("keyup", function (event) {
    const activeOption = skuDropdown.querySelector(".dropdown-item.active");
    const options = skuDropdown.querySelectorAll(".dropdown-item");
    const currentIndex = Array.from(options).indexOf(activeOption);
    if ((event.key === "Enter" || event.keyCode === 13) && options.length > 0) {
      event.preventDefault();
      const selectedValue = activeOption.getAttribute(
        "order_product_sku_option"
      );
      skuInput.setAttribute(
        "order_product_id",
        activeOption.getAttribute("order_product_id")
      );
      skuInput.setAttribute(
        "order_product_name",
        activeOption.getAttribute("order_product_name")
      );
      skuInput.value = selectedValue;
    }
    if (
      (event.key === "ArrowUp" || event.keyCode === 38 || event.key === "Up") &&
      currentIndex > 0
    ) {
      event.preventDefault();
      options[currentIndex].classList.remove("active");
      options[currentIndex - 1].classList.add("active");
    }

    if (
      (event.key === "ArrowDown" ||
        event.keyCode === 40 ||
        event.key === "Down") &&
      currentIndex < options.length - 1
    ) {
      event.preventDefault();
      options[currentIndex].classList.remove("active");
      options[currentIndex + 1].classList.add("active");
    }
  });
  skuDiv.appendChild(skuInput);
  skuDiv.appendChild(skuDropdown);
  return skuDiv;
};

const updateSkuDropdown = (skuOptions, skuInput, skuDropdown) => {
  skuDropdown.innerHTML = "";
  if (skuOptions.length === 0) {
    skuDropdown.classList.add("d-none");
  } else {
    skuDropdown.classList.remove("d-none");
  }
  skuOptions.forEach((skuOption, index) => {
    const list = document.createElement("li");
    const option = document.createElement("a");
    const sku = skuOption.order_product_sku;
    const id = skuOption.id;
    const name = skuOption.report_product_name;
    const total_remaining = skuOption.total_remaining;
    if (index === 0) {
      option.classList.add("dropdown-item", "active");
    } else {
      option.classList.add("dropdown-item");
    }
    option.setAttribute("order_product_sku_option", sku);
    option.setAttribute("order_product_id", id);
    option.setAttribute("order_product_name", name);
    option.setAttribute("total_remaining", total_remaining);
    option.value = sku;
    option.textContent = sku;
    option.addEventListener("click", function (event) {
      event.preventDefault();
      const selectedValue = this.getAttribute("order_product_sku_option");
      skuInput.setAttribute(
        "order_product_id",
        this.getAttribute("order_product_id")
      );
      skuInput.setAttribute(
        "order_product_name",
        this.getAttribute("order_product_name")
      );
      skuInput.setAttribute(
        "total_remaining",
        this.getAttribute("total_remaining")
      );
      skuInput.dispatchEvent(new Event("change"));
      const itemRow = skuInput.closest(".item");
      const remainingQuantityInput = itemRow.querySelector(".total-remaining");
      remainingQuantityInput.value = this.getAttribute("total_remaining");
      skuInput.value = selectedValue;
    });
    list.appendChild(option);
    skuDropdown.appendChild(list);
  });
};

const generateItemListTable = () => {
  const itemDataContainer = document.getElementById("item-data-container");
  itemDataContainer.innerHTML = "";

  const tableElement = document.createElement("table");
  tableElement.classList.add(
    "table",
    "table-bordered",
    "table-striped",
    "table-hover"
  );

  const tableHeader = document.createElement("thead");
  const tableHeaderRow = document.createElement("tr");
  tableHeaderRow.classList.add("row");
  tableHeaderRow.innerHTML = `
            <th class="col-6">Product SKU</th>
            <th class="col-2">Remaining Quantity</th>
            <th class="col-2">Quantity</th>
            <th class="col-2"></th>`;
  tableHeader.appendChild(tableHeaderRow);
  tableElement.appendChild(tableHeader);

  const tableBody = document.createElement("tbody");
  tableBody.id = "item-list-body";
  tableElement.appendChild(tableBody);
  itemDataContainer.appendChild(tableElement);
};

const handleCSVImport = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv";

  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsText(file, "utf-8");

      reader.onload = async (e) => {
        const csvData = e.target.result;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        const rows = csvData.split("\n").map((row) => row.split(","));

        rows.forEach((row, index) => {
          worksheet.addRow(row);
        });

        const tbody = document.getElementById("item-list-body");

        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const order_product_name = row.getCell(1).value;
          const quantity_to_issue = parseInt(row.getCell(2).value);

          if (
            !order_product_name ||
            !quantity_to_issue ||
            isNaN(quantity_to_issue)
          )
            continue;

          const stockData = await get_stock_search(order_product_name);
          if (!stockData || stockData.data.length === 0) {
            Alert.showErrorMessage(`❌ ไม่พบสินค้า: ${order_product_name}`);
            continue;
          }

          const product = stockData.data[0];
          const sku_settings_id = product.id;
          const total_remaining = product.total_remaining;

          const tableRow = document.createElement("tr");
          tableRow.classList.add("item", "row");

          const skuInput = createInput(
            "text",
            "order-product-sku",
            order_product_name,
            true
          );
          skuInput.setAttribute("order_product_id", sku_settings_id);
          skuInput.setAttribute("order_product_name", order_product_name);
          tableRow.appendChild(createTableCell(skuInput, 6));

          const remainingQuantityInput = createInput(
            "number",
            "total-remaining",
            total_remaining,
            true
          );
          tableRow.appendChild(createTableCell(remainingQuantityInput, 2));

          const quantityInput = createInput(
            "number",
            "quantity-to-issue",
            quantity_to_issue > total_remaining
              ? total_remaining
              : quantity_to_issue,
            false
          );
          quantityInput.min = 1;
          quantityInput.max = total_remaining;
          tableRow.appendChild(createTableCell(quantityInput, 2));

          const removeButton = document.createElement("button");
          removeButton.classList.add("btn", "btn-danger", "btn-sm");
          removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
          removeButton.addEventListener("click", () => {
            tableRow.remove();
          });
          tableRow.appendChild(createTableCell(removeButton, 2));

          tbody.appendChild(tableRow);
        }

        Alert.showSuccessMessage("📥 CSV นำเข้าสำเร็จ!", "success");
      };
    } catch (error) {
      console.error(error);
      Alert.showErrorMessage("❌ ล้มเหลวในการนำเข้า CSV", "danger");
    }
  });

  input.click();
};
const handleTemplateDownload = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Out Template");

    // Add headers
    worksheet.addRow(["Product SKU", "Quantity to Issue"]);

    // Add sample data
    worksheet.addRow(["EXAMPLE-SKU-001", 10]);
    worksheet.addRow(["EXAMPLE-SKU-002", 5]);

    // Set column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;

    // Create file
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: "text/csv" });

    Downloader.downloadBlob(blob, "Stock-Out-Template.csv");

    Alert.showSuccessMessage("📄 Template ดาวน์โหลดสำเร็จ!", "success");
  } catch (error) {
    console.error(error);
    Alert.showErrorMessage("❌ ล้มเหลวในการดาวน์โหลด Template", "danger");
  }
};

const addProductButton = document.getElementById("add-product");
const updateStockButton = document.getElementById("update-stock");
const importCSVButton = document.getElementById("import-csv");
const downloadTemplateButton = document.getElementById("download-template");

addProductButton.addEventListener("click", function (event) {
  event.preventDefault();
  const tbody = document.getElementById("item-list-body");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("item", "row");

  const skuInput = createInput("text", "order-product-sku", "", false);
  const skuDiv = createSkuDiv(skuInput);
  tableRow.appendChild(createTableCell(skuDiv, 6));

  const remainingQuantityInput = createInput(
    "number",
    "total-remaining",
    1,
    false
  );
  tableRow.appendChild(createTableCell(remainingQuantityInput, 2));

  const quantityInput = createInput("number", "quantity-to-issue", 1, false);
  quantityInput.min = 1;
  tableRow.appendChild(createTableCell(quantityInput, 2));

  quantityInput.addEventListener("input", function () {
    const maxValue = parseInt(this.max, 10);
    const currentValue = parseInt(this.value, 10);

    if (currentValue > maxValue) {
      this.value = maxValue;
    }
  });

  skuInput.addEventListener("change", function () {
    const totalRemaining = parseInt(this.getAttribute("total_remaining"), 10);
    quantityInput.max = totalRemaining;

    // 🔹 รีเซ็ตค่าให้อยู่ในช่วงที่กำหนด
    if (parseInt(quantityInput.value, 10) > totalRemaining) {
      quantityInput.value = totalRemaining;
    }
  });

  const removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-danger", "btn-sm");
  removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
  removeButton.addEventListener("click", () => {
    tableRow.remove();
  });
  tableRow.appendChild(createTableCell(removeButton, 2));
  tbody.appendChild(tableRow);
});

updateStockButton.addEventListener("click", async function (event) {
  event.preventDefault();
  const itemRows = document.querySelectorAll(".item");
  const items = Array.from(itemRows).map((itemRow) => {
    const skuInput = itemRow.querySelector(".order-product-sku");
    const quantityInput = itemRow.querySelector(".quantity-to-issue");
    return {
      sku_settings_id: parseInt(skuInput.getAttribute("order_product_id")),
      quantity_to_issue: parseInt(quantityInput.value),
    };
  });

  if (items.length === 0) {
    Alert.showErrorMessage("⚠️ ไม่มีข้อมูลให้ส่งอัปเดต!", "warning");
    return;
  }

  try {
    toggleSpinner(true);
    const response = await update_stock(items);
    console.log(response);
    const selectedOrders = Array.from(
      document.getElementById("order-selector").selectedOptions
    ).map((opt) => opt.value);

    for (const order_id of selectedOrders) {
      await DataController.update("orders", "order_id", order_id, {
        order_status_id: 2,
      });
    }
    Alert.showSuccessMessage("✅ อัปเดตสต็อกสำเร็จ!", "success");
  } catch (error) {
    console.error(error);
    Alert.showErrorMessage("❌ ล้มเหลวในการอัปเดตสต็อก", "danger");
  } finally {
    toggleSpinner(false);
  }
});

importCSVButton.addEventListener("click", handleCSVImport);
downloadTemplateButton.addEventListener("click", handleTemplateDownload);

const importOrderItems = async () => {
  const selectedOrders = Array.from(
    document.getElementById("order-selector").selectedOptions
  ).map((opt) => opt.value);

  if (selectedOrders.length === 0) {
    Alert.showErrorMessage("❌ กรุณาเลือกอย่างน้อย 1 Order", "danger");
    return;
  }

  try {
    const orderDataList = await get_order_data();

    const matchedOrders = orderDataList.filter((order) =>
      selectedOrders.includes(order.data.order_id.toString())
    );

    const selectedItems = matchedOrders.flatMap((order) =>
      order.nested.items.map((item) => ({
        ...item,
        order_product_sku: item.order_product_sku,
        report_product_name: item.report_product_name,
        sku_settings_id: item.sku_settings_id,
        quantity: item.quantity_purchased,
        total_remaining: item.total_remaining || 99, // fallback for demo
      }))
    );

    const tbody = document.getElementById("item-list-body");

    selectedItems.forEach((item) => {
      const tableRow = document.createElement("tr");
      tableRow.classList.add("item", "row");

      const skuInput = createInput(
        "text",
        "order-product-sku",
        item.order_product_sku,
        true
      );
      skuInput.setAttribute("order_product_id", item.sku_settings_id);
      skuInput.setAttribute("order_product_name", item.report_product_name);
      skuInput.setAttribute("total_remaining", item.total_remaining);
      tableRow.appendChild(createTableCell(skuInput, 6));

      const remainingQuantityInput = createInput(
        "number",
        "total-remaining",
        item.total_remaining,
        true
      );
      tableRow.appendChild(createTableCell(remainingQuantityInput, 2));

      const quantityInput = createInput(
        "number",
        "quantity-to-issue",
        item.quantity,
        false
      );
      quantityInput.min = 1;
      quantityInput.max = item.total_remaining;
      tableRow.appendChild(createTableCell(quantityInput, 2));

      const removeButton = document.createElement("button");
      removeButton.classList.add("btn", "btn-danger", "btn-sm");
      removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
      removeButton.addEventListener("click", () => tableRow.remove());
      tableRow.appendChild(createTableCell(removeButton, 2));

      tbody.appendChild(tableRow);
    });

    Alert.showSuccessMessage("📤 เพิ่มรายการเบิกสินค้าสำเร็จ", "success");
  } catch (error) {
    console.error("❌ โหลดสินค้าจาก Order ไม่สำเร็จ", error);
    Alert.showErrorMessage("❌ โหลดสินค้าจาก Order ไม่สำเร็จ", "danger");
  }
};

const loadOrderSelector = async () => {
  try {
    const orderSelector = document.getElementById("order-selector");

    const orderDataList = await get_order_data();

    orderSelector.innerHTML = "";
    orderDataList.forEach((order) => {
      const { order_id, timesort, buyer_name } = order.data;
      const option = document.createElement("option");
      option.value = order_id;
      option.textContent = `Order #${timesort} - ${buyer_name}`;
      orderSelector.appendChild(option);
    });
  } catch (error) {
    console.error("❌ โหลดรายการ Order ไม่สำเร็จ", error);
  }
};

document
  .getElementById("import-order-items")
  .addEventListener("click", importOrderItems);

document.addEventListener("DOMContentLoaded", () => {
  toggleSpinner(false);
  generateItemListTable();
  loadOrderSelector();
});
