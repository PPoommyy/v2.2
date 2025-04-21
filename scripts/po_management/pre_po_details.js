import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { PODataController } from "../../components/PODataController.js";

// const host = "http://localhost/test/work/v2.2";
const host = "https://komsant.com/v2.2";

const get_factory_sku_search = async (searchTerm, factory_id) => {
  try {
    const response = await axios.get(
      `../../backend/get/factory/get_factory_sku_search.php?factory_id=${factory_id}&searchTerm=${searchTerm}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_sku_by_name = async (name) => {
  try {
    const response = await axios.get(
      `../../backend/get/sku/get_sku_by_name.php?name=${name}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_last_timesort = async (yearAndMonth) => {
  try {
    const response = await axios.get(
      `../../backend/get/get_last_timesort.php?table=po_orders&year_and_month=${yearAndMonth}`
    );
    return response.data.last_timesort;
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

const loadFactoryDetails = async (factoryDetails, poOrderDetails) => {
  try {
    toggleSpinner(true);
    const { name, contact_number, email_address } = factoryDetails;
    const factoryName = document.getElementById("factory-name");
    const factoryNumber = document.getElementById("factory-number");
    const factoryEmail = document.getElementById("factory-email");
    factoryName.value = name;
    factoryNumber.value = contact_number;
    factoryEmail.value = email_address;
    if (poOrderDetails) {
      const { files } = poOrderDetails.nested;
      const orderNoteInput = document.getElementById("order-note-input");
      orderNoteInput.value = poOrderDetails.notes || "";
      if (files.length > 0) {
        const fileName = files[0].file_name;
        const filePath = files[0].file_pathname;
        const fileLink = document.getElementById("file-link");
        fileLink.href = `${host}/files/${filePath}`;
        fileLink.textContent = fileName;
        fileLink.style.display = "block";
        fileLink.target = "_blank";
        fileLink.download = fileName;
        fileLink.addEventListener("click", (event) => {
          event.preventDefault();
          const fileUrl = `${host}/files/${filePath}`;
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    toggleSpinner(false);
  }
};

const updatedObject = (object, key, oldData, newData) => {
  if (newData != oldData) {
    Object.assign(object, { [key]: newData });
  }
  return object;
};

const updateTotal = async (tableRow) => {
  let item_price = parseFloat(tableRow.querySelector(".item-price").value);
  let quantity_purchased = parseFloat(
    tableRow.querySelector(".quantity-purchased").value
  );

  if (quantity_purchased > 50) {
    const confirmAlert = await Alert.showConfirmModal(
      `Add ${quantity_purchased} items?`
    );
    if (!confirmAlert.isConfirmed) {
      quantity_purchased = 0;
    }
  }

  if (!isNaN(item_price) && !isNaN(quantity_purchased)) {
    const total = (item_price * quantity_purchased).toFixed(2);
    tableRow.querySelector(".total").value = total;
    updateSubtotal();
  }
};

const updateSubtotal = () => {
  const allTotalInputs = document.querySelectorAll(".total");
  let alltotal = 0;

  allTotalInputs.forEach((totalInput) => {
    const totalValue = parseFloat(totalInput.value);
    if (!isNaN(totalValue)) {
      alltotal += totalValue;
    }
  });

  const subtotalField = document.getElementById("alltotal");
  subtotalField.value = alltotal.toFixed(2);
};

const createInput = (type, key, value, isDisabled) => {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.setAttribute("for", key);
  input.classList.add("w-100", "form-control", key);
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

const createSkuDiv = (skuInput, factoryId) => {
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
    const skuOptions = await get_factory_sku_search(searchTerm, factoryId);
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
  skuOptions.forEach((order_product_sku, index) => {
    const list = document.createElement("li");
    const option = document.createElement("a");
    const sku = order_product_sku.order_product_sku;
    const id = order_product_sku.id;
    const name = order_product_sku.report_product_name;
    if (index === 0) {
      option.classList.add("dropdown-item", "active");
    } else {
      option.classList.add("dropdown-item");
    }
    option.setAttribute("order_product_sku_option", sku);
    option.setAttribute("order_product_id", id);
    option.setAttribute("order_product_name", name);
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
      skuInput.value = selectedValue;
    });
    list.appendChild(option);
    skuDropdown.appendChild(list);
  });
};

const generateItemListTable = async (poOrders) => {
  try {
    toggleSpinner(true);

    const urlParams = new URLSearchParams(window.location.search);
    const factoryId = urlParams.get("factory_id");
    const encodedData = urlParams.get("data");

    if (!factoryId) {
      console.error("Missing required parameters.");
      return;
    }

    const selectedItems = encodedData
      ? JSON.parse(decodeURIComponent(encodedData))
      : [];

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
             <th class="col-2">Order SKU ID</th>
             <th class="col-3">Product SKU</th>
             <th class="col-2">Unit Price</th>
             <th class="col-2">Quantity</th>
             <th class="col-2">Total</th>
             <th class="col-1"></th>`;
    tableHeader.appendChild(tableHeaderRow);
    tableElement.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");
    tableBody.id = "item-list-body";
    if (poOrders) {
      const { data, nested } = poOrders;
      const { items } = nested;
      items.forEach((item) => {
        const tableRow = document.createElement("tr");
        tableRow.classList.add("item", "row");

        const orderIdSpan = document.createElement("span");
        orderIdSpan.classList.add("order-id");
        orderIdSpan.textContent = item.orders_skus_id
          ? item.orders_skus_id
          : null;
        orderIdSpan.dataset.orders_skus_id = item.orders_skus_id;
        orderIdSpan.dataset.po_order_item_id = item.po_order_item_id;
        orderIdSpan.dataset.sku_settings_id = item.sku_settings_id;
        orderIdSpan.dataset.quantity = item.quantity;
        orderIdSpan.dataset.item_price = item.item_price ? item.item_price : 0;
        tableRow.appendChild(createTableCell(orderIdSpan, 2));

        const skuSpan = document.createElement("span");
        skuSpan.classList.add("order-product-sku");
        skuSpan.textContent = item.order_product_sku;
        tableRow.appendChild(createTableCell(skuSpan, 3));
        const priceInput = createInput(
          "number",
          "item-price",
          item.item_price,
          false
        );
        priceInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(priceInput, 2));
        const quantityInput = createInput(
          "number",
          "quantity-purchased",
          item.quantity,
          false
        );
        quantityInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(quantityInput, 2));
        const totalInput = createInput(
          "number",
          "total",
          parseFloat(item.item_price * item.quantity).toFixed(2),
          true
        );
        tableRow.appendChild(createTableCell(totalInput, 2));

        const removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-danger", "btn-sm");
        removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
        removeButton.addEventListener("click", () => {
          tableRow.remove();
          updateTotal(tableRow);
        });
        tableRow.appendChild(createTableCell(removeButton, 1));

        tableBody.appendChild(tableRow);
      });
    }
    selectedItems.forEach((selectedItem, index) => {
      const { order_id, items } = selectedItem;
      items.forEach((item) => {
        const tableRow = document.createElement("tr");
        tableRow.classList.add("item", "row", "new-item", "table-success");

        const orderIdSpan = document.createElement("span");
        orderIdSpan.classList.add("order-id");
        orderIdSpan.textContent = item.orders_skus_id;
        orderIdSpan.dataset.orders_skus_id = item.orders_skus_id;
        orderIdSpan.dataset.sku_settings_id = item.sku_settings_id;
        orderIdSpan.dataset.quantity = item.quantity_purchased;
        orderIdSpan.dataset.item_price = item.item_price ? item.item_price : 0;
        tableRow.appendChild(createTableCell(orderIdSpan, 2));
        const skuSpan = document.createElement("span");
        skuSpan.classList.add("order-product-sku");
        skuSpan.textContent = item.order_product_sku;
        tableRow.appendChild(createTableCell(skuSpan, 3));
        const priceInput = createInput(
          "number",
          "item-price",
          item.item_price,
          false
        );
        priceInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(priceInput, 2));
        const quantityInput = createInput(
          "number",
          "quantity-purchased",
          item.quantity_purchased,
          false
        );
        quantityInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(quantityInput, 2));

        const totalInput = createInput(
          "number",
          "total",
          parseFloat(item.item_price * item.quantity_purchased).toFixed(2),
          true
        );
        tableRow.appendChild(createTableCell(totalInput, 2));

        const removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-danger", "btn-sm");
        removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
        removeButton.addEventListener("click", () => {
          tableRow.remove();
        });
        tableRow.appendChild(createTableCell(removeButton, 1));

        tableBody.appendChild(tableRow);
      });
    });

    tableElement.appendChild(tableBody);
    itemDataContainer.appendChild(tableElement);
    updateSubtotal();
  } catch (error) {
    console.error("Error generating item list table:", error);
  } finally {
    toggleSpinner(false);
  }
};

const uniqid = () => {
  var timestamp = Math.floor(new Date().getTime() / 1000);
  var random = Math.random().toString(36).substr(2, 5);
  var uniqueId = timestamp.toString(16) + random;
  return uniqueId;
};

const generateUniqueOrderId = async () => {
  try {
    let newOrderId;
    do {
      newOrderId = uniqid();

      const poOrderDetails = await PODataController.get_po_details(newOrderId);

      if (
        !poOrderDetails ||
        !poOrderDetails.data1 ||
        poOrderDetails.data1.items.length <= 0
      ) {
        break;
      }
    } while (true);

    return newOrderId;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const formatDate = (date) => {
  var _date =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getDate().toString().padStart(2, "0");
  var _time = "00:00:00";
  var date_time = _date + " " + _time;
  return date_time;
};

const generateNewTimeSort = (date, lastTimeSort) => {
  const resultArray = lastTimeSort
    ? [
        lastTimeSort.toString().slice(0, 2),
        lastTimeSort.toString().slice(2, 4),
        lastTimeSort.toString().slice(4),
      ]
    : [];
  const year = String(date.getFullYear()).slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const sortOrder = (Number(resultArray[2]) + 1).toString().padStart(4, "0");
  var newTimeSort = "";
  newTimeSort += year === resultArray[0] ? resultArray[0] : year;
  newTimeSort +=
    year === resultArray[0] && month === resultArray[1]
      ? resultArray[1]
      : month;
  newTimeSort +=
    year === resultArray[0] && month === resultArray[1] ? sortOrder : "0001";
  return newTimeSort;
};

const getFileExtension = (filename) => {
  return filename.split(".").pop();
};

const dataURLToBlob = async (dataURL) => {
  const response = await fetch(dataURL);
  return await response.blob();
};

function generateEnhancedEmailContent(order, factory, items) {
  const totalAmount = items.reduce((sum, item) => {
    return sum + parseFloat(item.quantity) * parseFloat(item.item_price);
  }, 0);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let itemsTable = "";
  if (items.length > 0) {
    itemsTable = `
      <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">รหัสสินค้า</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">จำนวน</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">ราคาต่อหน่วย</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">รวม</th>
        </tr>
    `;

    items.forEach((item) => {
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.item_price);
      itemsTable += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${
            item.sku_settings_id
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
            item.quantity
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(
            item.item_price
          ).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${lineTotal.toFixed(
            2
          )}</td>
        </tr>
      `;
    });

    itemsTable += `
        <tr style="font-weight: bold;">
          <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">ยอดรวมทั้งสิ้น:</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalAmount.toFixed(
            2
          )}</td>
        </tr>
      </table>
    `;
  }

  return {
    title: `ใบสั่งซื้อ #${order.po_order_id} จาก Boxsense`,
    body: `
      <div style="font-family: 'Sarabun', sans-serif; line-height: 1.6;">
        <p>เรียน ${factory.contact || "ผู้เกี่ยวข้อง"},</p>
        
        <p>บริษัทของเรามีความยินดีที่จะส่งใบสั่งซื้อ (Purchase Order) เลขที่ ${
          order.po_order_id
        } 
        ลงวันที่ ${formattedDate} มายังท่าน</p>
        
        <p>รายละเอียดสินค้าที่สั่งซื้อ:</p>
        ${itemsTable}
        
        ${order.notes ? `<p><strong>หมายเหตุ:</strong> ${order.notes}</p>` : ""}
        
        <p>กรุณาตรวจสอบรายละเอียดในเอกสารแนบ และยืนยันการรับคำสั่งซื้อกลับมาที่อีเมลนี้</p>
        
        <p>ขอบคุณสำหรับความร่วมมือ</p>
        
        <p style="margin-top: 30px;">ขอแสดงความนับถือ<br>
        ฝ่ายจัดซื้อ<br>
        บริษัทของเรา</p>
      </div>
    `,
    buttons: [
      {
        text: "ยืนยันการรับคำสั่งซื้อ",
        url: `${window.location.origin}/confirm-po.php?id=${order.po_order_id}`,
      },
      {
        text: "ดูรายละเอียดเพิ่มเติม",
        url: `${window.location.origin}/po-details.php?id=${order.po_order_id}`,
      },
    ],
  };
}

const sendEmail = async (pdfFile, newPOOrder, factoryEmail) => {
  try {
    const recipientEmail = factoryEmail || "s6404062630554@email.kmutnb.ac.th";
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);

    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
      intent: "print",
    }).promise;

    const pngBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png", 1.0); // คุณภาพสูงสุด
    });

    const pngFileName = pdfFile.name.replace(/\.pdf$/, ".png");
    const pngFile = new File([pngBlob], pngFileName, { type: "image/png" });

    const pngFormData = new FormData();
    pngFormData.append("file", pngFile, pngFileName);
    const uploadResponse = await DataController.upload(
      pngFormData,
      "../../files/"
    );

    if (!uploadResponse?.fileName) {
      throw new Error("Failed to upload PNG preview image.");
    }

    const pngFileData = {
      po_order_id: newPOOrder.po_order_id,
      file_name: uploadResponse.fileName,
      file_pathname: uploadResponse.filePath,
      file_type: "preview",
    };
    await DataController.insert("po_orders_files", pngFileData);

    const baseUrl = `${host}/files/`;
    const pdfUrl = baseUrl + encodeURIComponent(pdfFile.name);
    const pngUrl = baseUrl + encodeURIComponent(uploadResponse.fileName);

    const factory = await DataController.selectByKey(
      "factories",
      "id",
      newPOOrder.factory_id
    );

    const factoryData = factory?.status?.[0] || {};

    const poItems = await DataController.selectByKey(
      "po_orders_items",
      "po_order_id",
      newPOOrder.po_order_id
    );

    const emailContent = generateEnhancedEmailContent(
      newPOOrder,
      factoryData,
      poItems?.status || []
    );

    const emailFormData = new FormData();
    emailFormData.append("title", emailContent.title);
    emailFormData.append("email", recipientEmail);
    emailFormData.append(
      "accept_url",
      `${host}/pages/view_only/po_order_details.php?po_order_id=${newPOOrder.po_order_id}`
    );
    emailFormData.append(
      "cancel_url",
      `${host}/pages/view_only/po_order_details.php?po_order_id=${newPOOrder.po_order_id}`
    );
    emailFormData.append("pdf_url", pdfUrl);
    emailFormData.append("png_url", pngUrl);

    emailFormData.append("po_number", newPOOrder.po_order_id);
    emailFormData.append("factory_name", factoryData.name || "");

    const response = await axios.post(
      "../../backend/api/thaibulksms/send_email.php",
      emailFormData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    await DataController.insert("po_orders_email_log", {
      po_order_id: newPOOrder.po_order_id,
      recipient_email: recipientEmail,
      sent_date: new Date().toISOString().split("T")[0],
      status: response.data.success ? "success" : "failed",
    });

    return response.data.success;
  } catch (error) {
    console.error("Error sending email:", error);
    Alert.showErrorMessage("ไม่สามารถส่งอีเมลได้: " + error.message);
    return false;
  }
};

async function toBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mergeSimilarItems(items) {
  const merged = [];

  items.forEach((item) => {
    const existing = merged.find(
      (i) =>
        i.sku_settings_id === item.sku_settings_id &&
        parseFloat(i.item_price) === parseFloat(item.item_price)
    );

    console.log("mergeSimilarItems", item);
    console.log("item_price = ", parseFloat(item.item_price));
    console.log("total = ", parseFloat(item.total));
    if (existing) {
      existing.quantity += parseFloat(item.quantity);
      existing.total += parseFloat(item.total);
    } else {
      // Clone object เพื่อกันข้อมูลต้นฉบับเสีย
      merged.push({
        sku_settings_id: item.sku_settings_id,
        order_product_sku: item.order_product_sku,
        report_product_name: item.report_product_name,
        quantity: parseFloat(item.quantity),
        item_price: parseFloat(item.item_price),
        total: parseFloat(item.total),
      });
    }
  });

  return merged;
}

async function createPOAsPDF(newPOOrder, itemsList) {
  try {
    const logoBase64 = await toBase64("../../assets/img/boxsense.jpeg");
    const mergedItemsList = mergeSimilarItems(itemsList);

    const totalAmount = mergedItemsList.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    );

    const tableBody = [
      [
        { text: "ลำดับ (No.)", bold: true, fontSize: 9 },
        { text: "รหัสสินค้า (SKU)", bold: true, fontSize: 9 },
        { text: "ชื่อสินค้า (Product Name)", bold: true, fontSize: 9 },
        { text: "จำนวน (Qty)", bold: true, fontSize: 9 },
        { text: "ราคา/หน่วย (Unit Price)", bold: true, fontSize: 9 },
        { text: "รวม (Total)", bold: true, fontSize: 9 },
      ],
      ...mergedItemsList.map((item, index) => [
        index + 1,
        item.order_product_sku,
        item.report_product_name,
        item.quantity,
        parseFloat(item.item_price).toFixed(2),
        parseFloat(item.total).toFixed(2),
      ]),
    ];

    const docDefinition = {
      content: [
        // { image: logoBase64, width: 120, margin: [0, 0, 0, 10] },
        { text: "BOXSENSE CO., LTD.", style: "header" },
        {
          text: "18/94 Soi Ramintra 65 Tharang Bangkhen Bangkok 10230, THAILAND",
        },
        {
          text: "Tel: 0889564992  Email: procurement@boxsense.com",
          margin: [0, 0, 0, 10],
        },
        { text: "ใบสั่งซื้อ / PURCHASE ORDER", style: "poTitle" },
        {
          columns: [
            [
              { text: "ผู้ขาย / Supplier:", bold: true },
              { text: newPOOrder.factory_name },
              { text: `Tel: ${newPOOrder.contact_number}`, fontSize: 9 },
              { text: `Email: ${newPOOrder.email_address}`, fontSize: 9 },
            ],
            [
              { text: "ผู้ซื้อ / Buyer:", bold: true },
              { text: "BoxSense Co., Ltd." },
              { text: `Tel: 0889564992`, fontSize: 9 },
              { text: `Email: procurement@boxsense.com`, fontSize: 9 },
            ],
          ],
          columnGap: 50,
          margin: [0, 10],
        },
        {
          columns: [
            {
              text: `เลขที่ / PO Number: ${newPOOrder.po_order_id}`,
              bold: true,
            },
            {
              text: `วันที่ / Date: ${new Date(
                newPOOrder.po_order_date
              ).toLocaleDateString("th-TH")}`,
              alignment: "right",
              bold: true,
            },
          ],
          margin: [0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "auto", "auto", "auto"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
          margin: [0, 10],
        },
        {
          columns: [
            {
              text: "รวมทั้งสิ้น / Grand Total:",
              bold: true,
              alignment: "right",
            },
            {
              text: totalAmount.toFixed(2),
              bold: true,
              alignment: "right",
              width: 60,
            },
          ],
        },
        ...(newPOOrder.notes && newPOOrder.notes !== "undefined"
          ? [
              { text: "หมายเหตุ / Notes:", bold: true, margin: [0, 10, 0, 0] },
              { text: newPOOrder.notes, margin: [0, 0, 0, 10] },
            ]
          : []),
        {
          columns: ["Prepared By", "Reviewed By", "Approved By"].map(
            (label) => ({
              stack: [
                { text: label, bold: true, alignment: "center" },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 100,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                },
                {
                  text: "วันที่ / Date: __________________",
                  alignment: "center",
                  margin: [0, 5, 0, 0],
                },
              ],
            })
          ),
          columnGap: 40,
          margin: [0, 20],
        },
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          color: "#1a1a99",
          margin: [0, 0, 0, 5],
        },
        poTitle: {
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 10, 0, 10],
          color: "#004d99",
        },
      },
      defaultStyle: {
        font: "NotoSansThai",
        fontSize: 10,
      },
    };

    pdfMake.fonts = {
      NotoSansThai: {
        normal: "NotoSansThai-Regular.ttf",
        bold: "NotoSansThai-Bold.ttf",
        italics: "NotoSansThai-Regular.ttf",
        bolditalics: "NotoSansThai-Bold.ttf",
      },
    };

    function getPdfBlob(docDefinition) {
      return new Promise((resolve, reject) => {
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate PDF Blob"));
        });
      });
    }

    const blob = await getPdfBlob(docDefinition);
    const pdfFile = new File([blob], `PO-${newPOOrder.po_order_id}.pdf`, {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", pdfFile, `PO-${newPOOrder.po_order_id}.pdf`);

    const uploadResponse = await DataController.upload(
      formData,
      "../../files/"
    );

    if (uploadResponse?.fileName) {
      const fileData = {
        po_order_id: newPOOrder.po_order_id,
        file_name: uploadResponse.fileName,
        file_pathname: uploadResponse.filePath,
      };
      await DataController.insert("po_orders_files", fileData);
      return pdfFile;
    }
    return false;
  } catch (error) {
    console.error("Error creating PO PDF:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const factoryId = new URLSearchParams(window.location.search).get(
    "factory_id"
  );
  const poOrderId = new URLSearchParams(window.location.search).get(
    "po_order_id"
  );
  const factory_details = await PODataController.get_factory_details(factoryId);
  const poDraft = await PODataController.get_factory_draft(factoryId);
  if (poOrderId) {
    loadFactoryDetails(factory_details[0], poDraft[0]);
    generateItemListTable(poDraft[0]);
  } else {
    loadFactoryDetails(factory_details[0], null);
    generateItemListTable(null);
  }

  const handleAddddProduct = async (event) => {
    event.preventDefault();
    const tbody = document.getElementById("item-list-body");
    const tableRow = document.createElement("tr");
    tableRow.classList.add("item", "row", "new-item");

    const orderIdSpan = document.createElement("span");
    orderIdSpan.textContent = null;
    tableRow.appendChild(createTableCell(orderIdSpan, 2));

    const skuInput = createInput("text", "order-product-sku", "", false);
    const skuDiv = createSkuDiv(skuInput, factoryId);
    tableRow.appendChild(createTableCell(skuDiv, 3));

    const itemPriceInput = createInput("number", "item-price", 1, false);
    itemPriceInput.addEventListener("change", () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(itemPriceInput, 2));

    const quantityInput = createInput("number", "quantity-purchased", 1, false);
    quantityInput.addEventListener("change", () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(quantityInput, 2));

    const totalInput = createInput(
      "number",
      "total",
      parseFloat(1).toFixed(2),
      true
    );
    tableRow.appendChild(createTableCell(totalInput, 2));

    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-danger", "btn-sm");
    removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
    removeButton.addEventListener("click", () => {
      tableRow.remove();
    });
    tableRow.appendChild(createTableCell(removeButton, 1));
    tbody.appendChild(tableRow);
  };

  const handleCreateDraft = async (isCalledFromSend = false) => {
    try {
      const tbody = document.getElementById("item-list-body");
      const orderNoteInput = document.getElementById("order-note-input").value;
      const fileInput = document.getElementById("file-input");

      const po_order_id = await generateUniqueOrderId();

      const currentDate = new Date().toISOString().split("T")[0];
      const odate = currentDate.split("-").join("/");
      const idate = new Date(odate);
      const idateYear = String(idate.getFullYear()).slice(-2);
      const idateMonth = (idate.getMonth() + 1).toString().padStart(2, "0");
      const lastTimeSort = await get_last_timesort(idateYear + "" + idateMonth);
      const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

      const file = fileInput?.files?.[0];
      if (file) {
        const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
        const formData = new FormData();
        formData.append("file", file, filename);
        const response = await DataController.upload(formData, "../../files/");

        if (response && response.fileName) {
          const to_insert_file = {
            po_order_id: po_order_id,
            file_name: response.fileName,
            file_pathname: response.filePath,
          };

          await DataController.insert("po_order_files", to_insert_file);
        }
      }

      const newPOOrder = {
        po_order_id,
        timesort: newTimeSort,
        factory_id: factoryId,
        po_order_status_id: 5,
        notes: orderNoteInput,
      };

      const items = tbody.querySelectorAll(".item");
      const itemsList = [];

      for (const item of items) {
        let orders_skus_id = null;
        let id = null;
        let item_price = 0.0;
        let total = 0.0;
        let quantity = 0;

        const orderIdSpan = item.querySelector("span.order-id");
        if (orderIdSpan) {
          orders_skus_id = orderIdSpan.dataset.orders_skus_id;
          id = orderIdSpan.dataset.sku_settings_id;
          quantity = orderIdSpan.dataset.quantity;
          item_price = orderIdSpan.dataset.item_price;
        } else {
          const skuInput = item.querySelector("input.order-product-sku");
          const quantityInput = item.querySelector("input.quantity-purchased");
          quantity = parseFloat(quantityInput.value);
          id = parseFloat(skuInput.getAttribute("order_product_id"));
          if (!id && skuInput.value) {
            const result = await get_sku_by_name(skuInput.value);
            if (result.status === 200) {
              id = parseFloat(result.data[0].id);
            } else {
              Alert.showErrorMessage(`ไม่พบสินค้า "${skuInput.value}"`);
              return;
            }
          }
        }
        const totalInput = item.querySelector("input.total");
        total = parseFloat(totalInput.value);

        const newItem = {
          po_order_id,
          orders_skus_id: orders_skus_id ? parseFloat(orders_skus_id) : null,
          sku_settings_id: parseFloat(id),
          quantity: parseFloat(quantity),
          item_price: parseFloat(item_price) || 0,
          total: parseFloat(total),
          product_status_id: 8,
        };

        itemsList.push(newItem);
      }

      if (itemsList.length === 0) {
        Alert.showErrorMessage("ยังไม่มีสินค้าในใบสั่งซื้อ");
        return;
      }

      const orderInsert = await DataController.insert("po_orders", newPOOrder);

      if (orderInsert.status) {
        for (const item of itemsList) {
          await DataController.insert("po_orders_items", item);

          if (item.orders_skus_id) {
            await DataController.updateByKey(
              "orders_skus",
              "orders_skus_id",
              item.orders_skus_id,
              "product_status_id",
              8
            );
          }
        }

        return {
          success: true,
          poOrderId: po_order_id,
          items: itemsList,
          poOrderData: newPOOrder,
        };
      } else {
        Alert.showErrorMessage("ไม่สามารถสร้าง Draft ได้");
        return {
          success: false,
          message: "ไม่สามารถสร้าง Draft ได้",
          poOrderId: null,
          items: [],
          poOrderData: null,
        };
      }
    } catch (error) {
      console.error("Error creating draft:", error);
      Alert.showErrorMessage("เกิดข้อผิดพลาดในการสร้าง Draft");
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการสร้าง Draft",
        poOrderId: null,
        items: [],
        poOrderData: null,
      };
    }
  };

  const handleUpdateDraft = async (event) => {
    try {
      const { data, nested } = poDraft[0];
      const { items } = nested;
      const tbody = document.getElementById("item-list-body");
      const orderNoteInput = document.getElementById("order-note-input").value;
      const fileInput = document.getElementById("file-input");

      const currentDate = new Date().toISOString().split("T")[0];
      const odate = currentDate.split("-").join("/");
      const idate = new Date(odate);
      const idateYear = String(idate.getFullYear()).slice(-2);
      const idateMonth = (idate.getMonth() + 1).toString().padStart(2, "0");
      const lastTimeSort = await get_last_timesort(idateYear + "" + idateMonth);
      const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

      const formData = new FormData();
      const file = fileInput.files[0];
      if (file) {
        const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
        formData.append("file", file, filename);
        const response = await DataController.upload(formData, "../../files/");

        const to_insert_file = {
          po_order_id: poOrderId,
          file_name: response.fileName,
          file_pathname: response.filePath,
        };

        const res = await DataController.insert(
          "po_order_files",
          to_insert_file
        );
      }

      const itemsRows = tbody.querySelectorAll(".item");
      const itemsList = [];
      const to_insert_items = [];
      const to_update_items = [];
      const to_delete_items = items.map((item) =>
        parseFloat(item.po_order_item_id)
      );
      for (const itemRow of itemsRows) {
        let orders_skus_id = null;
        let item_price = 0.0;
        let total = 0.0;
        let quantity = 0;
        let id = null;
        let po_order_item_id = null;
        const orderIdSpan = itemRow.querySelector("span.order-id");
        if (orderIdSpan) {
          po_order_item_id = orderIdSpan.dataset.po_order_item_id;
          orders_skus_id = orderIdSpan.dataset.orders_skus_id;
          id = orderIdSpan.dataset.sku_settings_id;
        } else {
          const skuInput = itemRow.querySelector("input.order-product-sku");
          const sku = skuInput.value;
          id = parseFloat(skuInput.getAttribute("order_product_id"));
          if (sku) {
            if (!id) {
              const result = await get_sku_by_name(sku);
              if (result.status === 200) {
                id = parseFloat(result.data[0].id);
              } else {
                Alert.showErrorMessage(
                  `Couldn't find Product "${sku}" in database`
                );
                return;
              }
            }
          }
        }
        const itemPriceInput = itemRow.querySelector("input.item-price");
        item_price = parseFloat(itemPriceInput.value);
        const quantityInput = itemRow.querySelector("input.quantity-purchased");
        quantity = parseFloat(quantityInput.value);
        const totalInput = itemRow.querySelector("input.total");
        total = parseFloat(totalInput.value);
        const newItem = {
          po_order_id: poOrderId,
          orders_skus_id: orders_skus_id ? parseFloat(orders_skus_id) : null,
          sku_settings_id: parseFloat(id),
          quantity: parseFloat(quantity),
          item_price: parseFloat(item_price),
          total: parseFloat(total),
          product_status_id: 8,
          ...(po_order_item_id && {
            po_order_item_id: parseFloat(po_order_item_id),
          }),
        };
        itemsList.push(newItem);
      }

      for (const itemInList of itemsList) {
        const index = to_delete_items.indexOf(itemInList.po_order_item_id);
        if (index !== -1) {
          let to_update_items_object = {};
          to_update_items_object = updatedObject(
            to_update_items_object,
            "item_price",
            items[index].item_price,
            itemInList.item_price
          );
          to_update_items_object = updatedObject(
            to_update_items_object,
            "quantity",
            items[index].quantity,
            itemInList.quantity
          );
          to_update_items_object = updatedObject(
            to_update_items_object,
            "total",
            items[index].total,
            itemInList.total
          );
          if (Object.keys(to_update_items_object).length > 0) {
            to_update_items_object = updatedObject(
              to_update_items_object,
              "po_order_item_id",
              "",
              itemInList.po_order_item_id
            );
            to_update_items.push(to_update_items_object);
          }
          items.splice(index, 1);
          to_delete_items.splice(index, 1);
        } else {
          to_insert_items.push(itemInList);
        }
      }
      if (itemsList.length == 0) {
        Alert.showErrorMessage("PO Order item is empty!");
        return;
      }
      const swalQueue = Alert.createQueue();

      if (to_insert_items && to_insert_items.length > 0) {
        for (const to_insert_item of to_insert_items) {
          const res = await DataController.insert(
            "po_orders_items",
            to_insert_item
          );
          if (res.status) {
            if (to_insert_item.orders_skus_id) {
              const updateOrderItemStatus = await DataController.updateByKey(
                "orders_skus",
                "orders_skus_id",
                to_insert_item.orders_skus_id,
                "product_status_id",
                8
              );
            }

            const confirmed = await swalQueue.fire({
              title: `Item ${res.status} inserted successfully!`,
              icon: "success",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          } else {
            const confirmed = await swalQueue.fire({
              title: `Item ${res} inserted failed!`,
              icon: "error",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          }
        }
      }

      if (to_update_items && to_update_items.length > 0) {
        for (const to_update_item of to_update_items) {
          const res = await DataController.update(
            "po_orders_items",
            "po_order_item_id",
            to_update_item.po_order_item_id,
            to_update_item
          );
          if (res.status) {
            const confirmed = await swalQueue.fire({
              title: `Item ${to_update_item.po_order_item_id} updated successfully!`,
              icon: "success",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          } else {
            const confirmed = await swalQueue.fire({
              title: `Item ${to_update_item.po_order_item_id} updated failed!`,
              icon: "error",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          }
        }
      }

      if (to_delete_items && to_delete_items.length > 0) {
        for (const to_delete_item of to_delete_items) {
          const itemToDelete = items.find(
            (item) => item.po_order_item_id === to_delete_item
          );

          const res = await DataController._delete(
            "po_orders_items",
            "po_order_item_id",
            to_delete_item
          );

          if (res.status) {
            if (itemToDelete && itemToDelete.orders_skus_id) {
              const updateOrderItemStatus = await DataController.updateByKey(
                "orders_skus",
                "orders_skus_id",
                itemToDelete.orders_skus_id,
                "product_status_id",
                1
              );
            }

            const confirmed = await swalQueue.fire({
              title: `Item ${to_delete_item} deleted successfully!`,
              icon: "success",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          } else {
            const confirmed = await swalQueue.fire({
              title: `Item ${to_delete_item} deleted failed!`,
              icon: "error",
              timer: 1000,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: "Next &rarr;",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSendEmail = async (event) => {
    try {
      event.preventDefault();
      let po_order_id_to_use;
      let itemsListForPDF;
      let poOrderDataForPDF;
      let isNewOrder = false;
      if (poOrderId) {
        await handleUpdateDraft();
        po_order_id_to_use = poOrderId;
        const updatedPODataResult = await PODataController.get_po_details(
          po_order_id_to_use
        );
        if (updatedPODataResult && updatedPODataResult.length > 0) {
          const { data, nested } = updatedPODataResult[0];
          itemsListForPDF = nested.items;
          poOrderDataForPDF = data;
          await DataController.update(
            "po_orders",
            "po_order_id",
            po_order_id_to_use,
            {
              po_order_status_id: 1,
            }
          );
        } else {
          poOrderDataForPDF.po_order_status_id = 1;
          Alert.showErrorMessage(
            `Couldn't find updated PO Order details: ${po_order_id_to_use}`
          );
          return;
        }
      } else {
        isNewOrder = true;
        const createResult = await handleCreateDraft(); // เรียกใช้ handleCreateDraft

        if (createResult.success) {
          po_order_id_to_use = createResult.poOrderId;
          itemsListForPDF = createResult.items;
          poOrderDataForPDF = createResult.poOrderData;

          await DataController.update(
            "po_orders",
            "po_order_id",
            po_order_id_to_use,
            {
              po_order_status_id: 1,
            }
          );
          poOrderDataForPDF.po_order_status_id = 1;
        } else {
          console.error("Failed to create draft:", createResult.message);
          return;
        }
      }
      const finalPODataResult = await PODataController.get_po_details(
        po_order_id_to_use
      );

      if (finalPODataResult && finalPODataResult.length > 0) {
        const { data, nested } = finalPODataResult[0];
        poOrderDataForPDF = data;
        itemsListForPDF = nested.items;

        if (!itemsListForPDF || itemsListForPDF.length === 0) {
          Alert.showErrorMessage("ไม่พบรายการสินค้าหลังจากดึงข้อมูล!");
          return;
        }
        if (
          !itemsListForPDF[0].hasOwnProperty("order_product_sku") ||
          !itemsListForPDF[0].hasOwnProperty("report_product_name")
        ) {
          console.warn(
            "Fetched items list might be missing 'order_product_sku' or 'report_product_name'. Check PODataController.get_po_details backend logic."
          );
        }
        if (poOrderDataForPDF.po_order_status_id !== 1) {
          console.warn(
            `PO status in fetched data is ${poOrderDataForPDF.po_order_status_id}, expected 1.`
          );
        }
      } else {
        Alert.showErrorMessage(
          `Couldn't fetch complete PO details for PDF: ${po_order_id_to_use}`
        );
        return;
      }

      const pdfFile = await createPOAsPDF(poOrderDataForPDF, itemsListForPDF);
      if (!pdfFile) {
        Alert.showErrorMessage("Failed to generate PDF!");
        await DataController.update(
          "po_orders",
          "po_order_id",
          po_order_id_to_use,
          { po_order_status_id: 5 }
        );

        return;
      }

      const factoryData = await DataController.selectByKey(
        "factories",
        "id",
        poOrderDataForPDF.factory_id
      );
      let factoryEmail = "s6404062630554@email.kmutnb.ac.th"; // อีเมลเริ่มต้น

      if (factoryData?.status?.[0]?.email_address) {
        factoryEmail = factoryData.status[0].email_address;
      }
      const sendEmailResult = await sendEmail(
        pdfFile,
        poOrderDataForPDF,
        factoryEmail
      );

      if (sendEmailResult) {
        Alert.showSuccessMessage("Email sent successfully!");
        setTimeout(() => {
          // window.location.href = `po_order_list.php`;
        }, 2000);
      } else {
        await DataController.update(
          "po_orders",
          "po_order_id",
          po_order_id_to_use,
          { po_order_status_id: 5 }
        );

        Alert.showErrorMessage("Failed to send email!");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.showErrorMessage("An error occurred while processing your request");
    }
  };

  if (poOrderId) {
    const updateDraftButton = document.getElementById("update-draft");
    updateDraftButton.style.display = "block";
    updateDraftButton.addEventListener("click", handleUpdateDraft);
  } else {
    const createDraftButton = document.getElementById("create-draft");
    createDraftButton.style.display = "block";
    createDraftButton.addEventListener("click", handleCreateDraft);
  }
  const addProductButton = document.getElementById("add-product");
  const sendEmailButton = document.getElementById("send-email");
  addProductButton.addEventListener("click", handleAddddProduct);
  sendEmailButton.addEventListener("click", handleSendEmail);
});
