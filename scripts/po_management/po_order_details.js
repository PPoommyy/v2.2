import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";
import { PODataController } from "../../components/PODataController.js";

const factoryId = new URLSearchParams(window.location.search).get("factory_id");
const poOrderId = document.getElementById("orderId").value;

const get_factory_details = async (factoryId) => {
  try {
    const response = await DataController.selectByKey(
      "factories",
      "id",
      parseInt(factoryId)
    );
    return response;
  } catch (error) {
    throw error;
  }
};

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

const get_po_order_details = async (po_order_id) => {
  try {
    const response = await axios.get(
      `../../backend/get/get_po_order_details.php?po_order_id=${po_order_id}`
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

const updateFactoryDetails = async (factoryDetails) => {
  toggleSpinner(true);
  const factoryName = document.getElementById("factory-name");
  const factoryNumber = document.getElementById("factory-number");
  const factoryEmail = document.getElementById("factory-email");
  const PONotes = document.getElementById("order-note-input");
  factoryName.value = factoryDetails.factory_name;
  factoryNumber.value = factoryDetails.contact_number;
  factoryEmail.value = factoryDetails.email_address;
  PONotes.value = factoryDetails.notes;
};

const updateFilesList = async (files) => {
  if (files.length > 0) {
    const fileListGroup = document.getElementById("file-list");
    fileListGroup.innerHTML = "";

    files.forEach((file) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "list-group-item-secondary",
        "mb-2"
      );

      const fileList = document.createElement("span");
      fileList.classList.add("me-2");
      fileList.innerHTML = file.file_name;

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("btn", "btn-danger", "me-1");
      deleteButton.innerHTML = "Delete";

      deleteButton.addEventListener("click", async () => {
        const result = await DataController._delete(
          "po_orders_files",
          "id",
          file.id
        );
        if (result.status) {
          Alert.showSuccessMessage("Delete file successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          Alert.showErrorMessage("File deleted failed!");
        }
      });

      const downloadButton = document.createElement("button");
      downloadButton.classList.add("btn", "btn-primary");
      downloadButton.innerHTML = "Download";
      downloadButton.addEventListener("click", async () => {
        try {
          const result = await DataController.download(file.file_pathname);
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(result);
          link.download = file.file_name;
          link.click();
          Alert.showSuccessMessage("Download file successfully!");
        } catch (error) {
          Alert.showErrorMessage("File Downloaded failed!");
        }
      });

      listItem.appendChild(fileList);
      listItem.appendChild(deleteButton);
      listItem.appendChild(downloadButton);
      fileListGroup.appendChild(listItem);
    });
  }
};
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

const generateItemListTable = async (po_order_id) => {
  try {
    toggleSpinner(true);

    /* const urlParams = new URLSearchParams(window.location.search);
    const factoryId = urlParams.get("factory_id");
    const encodedData = urlParams.get("data"); */

    /* if (!factoryId || !encodedData) {
      console.error("Missing required parameters.");
      return;
    } */

    // const selectedItems = JSON.parse(decodeURIComponent(encodedData));

    if (po_order_id) {
      const po_orders = await PODataController.get_po_details(po_order_id);
      const { data, nested } = po_orders[0];
      const { items, files } = nested;
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
               <th class="col-4">Order ID</th>
               <th class="col-4">Product SKU</th>
               <th class="col-1">Quantity</th>
               <th class="col-2">Price</th>
               <th class="col-1"></th>`;
      tableHeader.appendChild(tableHeaderRow);
      tableElement.appendChild(tableHeader);

      const tableBody = document.createElement("tbody");
      tableBody.id = "item-list-body";
      items.forEach((item) => {
        const { order_id } = item;
        const tableRow = document.createElement("tr");
        tableRow.classList.add("item", "row");

        const orderIdSpan = document.createElement("span");
        orderIdSpan.classList.add("order-id");
        orderIdSpan.textContent = order_id ? order_id : "";
        tableRow.appendChild(createTableCell(orderIdSpan, 4));

        const skuInput = createInput(
          "text",
          "order-product-sku",
          item.order_product_sku,
          false
        );
        const skuDiv = createSkuDiv(skuInput);
        tableRow.appendChild(createTableCell(skuDiv, 4));

        const quantityInput = createInput(
          "number",
          "quantity-purchased",
          item.quantity,
          false
        );
        quantityInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(quantityInput, 1));

        const itemPriceInput = createInput(
          "number",
          "item-price",
          item.item_price,
          false
        );
        itemPriceInput.addEventListener("change", () => updateTotal(tableRow));
        tableRow.appendChild(createTableCell(itemPriceInput, 2));

        const removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-danger", "btn-sm");
        removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
        removeButton.addEventListener("click", () => {
          tableRow.remove();
        });
        tableRow.appendChild(createTableCell(removeButton, 1));

        tableBody.appendChild(tableRow);
      });

      tableElement.appendChild(tableBody);
      itemDataContainer.appendChild(tableElement);
      await updateFactoryDetails(data);
      await updateFilesList(files);
    } else {
    }
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

      const poOrderDetails = await get_po_order_details(newOrderId);

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
    title: `ใบสั่งซื้อ #${order.po_order_id} จาก ${
      factory.name || "บริษัทของเรา"
    }`,
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

    const baseUrl = window.location.origin + "/test/work/v2.2/files/";
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
      `${host}pages/view_only/po_order_details.php?po_order_id=${newPOOrder.po_order_id}`
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
    /* const NotoSansThai = await toBase64(
      "../../assets/webfonts/NotoSansThai-Regular.ttf"
    );
    const NotoSansThaiBold = await toBase64(
      "../../assets/webfonts/NotoSansThai-Bold.ttf"
    ); */
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

const handleSendEmail = async (event) => {
  try {
    event.preventDefault();
    let po_order_id, itemsList, newPOOrder;

    if (poOrderId) {
      const po_orders = await PODataController.get_po_details(po_order_id);
      const { data, nested } = po_orders[0];
      const { items, files } = nested;
      po_order_id = poOrderId;

      const tbody = document.getElementById("item-list-body");
      const orderNoteInput = document.getElementById("order-note-input").value;
      const itemsRows = tbody.querySelectorAll(".item");

      itemsList = [];
      for (const itemRow of itemsRows) {
        let orders_skus_id = null;
        let item_price = 0.0;
        let total = 0.0;
        let quantity = 0;
        let id = null;
        let sku_name = "";

        const orderIdSpan = itemRow.querySelector("span.order-id");
        if (orderIdSpan) {
          orders_skus_id = orderIdSpan.dataset.orders_skus_id;
          id = orderIdSpan.dataset.sku_settings_id;
          const skuData = await DataController.selectByKey(
            "sku_settings",
            "id",
            id
          );
          if (skuData && skuData.status && skuData.status.length > 0) {
            sku_name = skuData.status[0].sku || "";
          }
        } else {
          const skuInput = itemRow.querySelector("input.order-product-sku");
          sku_name = skuInput.value;
          id = parseInt(skuInput.getAttribute("order_product_id"));
          if (!id && sku_name) {
            const result = await get_sku_by_name(sku_name);
            if (result.status === 200) {
              id = parseInt(result.data[0].id);
            } else {
              Alert.showErrorMessage(
                `Couldn't find Product "${sku_name}" in database`
              );
              return;
            }
          }
        }

        const itemPriceInput = itemRow.querySelector("input.item-price");
        item_price = parseFloat(itemPriceInput.value);
        const quantityInput = itemRow.querySelector("input.quantity-purchased");
        quantity = parseInt(quantityInput.value);
        const totalInput = itemRow.querySelector("input.total");
        total = parseFloat(totalInput.value);

        if (id && quantity > 0) {
          const newItem = {
            po_order_id: po_order_id,
            orders_skus_id: orders_skus_id ? parseInt(orders_skus_id) : null,
            sku_settings_id: parseInt(id),
            quantity: parseInt(quantity),
            item_price: parseFloat(item_price),
            total: parseFloat(total),
          };
          itemsList.push(newItem);
        }
      }

      newPOOrder = await PODataController.get_po_details(po_order_id);
      if (newPOOrder && newPOOrder.length > 0) {
        const { data, nested } = newPOOrder[0];
        const { items } = nested;
        itemsList = items;
        newPOOrder = data;

        await DataController.update("po_orders", "po_order_id", po_order_id, {
          po_order_status_id: 1,
          notes: orderNoteInput,
        });

        newPOOrder.po_order_status_id = 1;
        newPOOrder.notes = orderNoteInput;
      } else {
        Alert.showErrorMessage(`Couldn't find PO Order: ${po_order_id}`);
        return;
      }
    } else {
      Alert.showErrorMessage("PO Order ID is missing!");
      return;
    }

    if (itemsList.length === 0) {
      Alert.showErrorMessage("PO Order item is empty!");
      return;
    }

    const pdfFile = await createPOAsPDF(newPOOrder, itemsList);
    if (!pdfFile) {
      Alert.showErrorMessage("Failed to generate PDF!");
      return;
    }

    const factoryData = await DataController.selectByKey(
      "factories",
      "id",
      newPOOrder.factory_id
    );
    let factoryEmail = "s6404062630554@email.kmutnb.ac.th"; // อีเมลเริ่มต้น

    if (factoryData && factoryData.status) {
      if (factoryData.status[0].email_address) {
        factoryEmail = factoryData.status[0].email_address;
      }
    }
    const sendEmailResult = await sendEmail(pdfFile, newPOOrder, factoryEmail);

    if (sendEmailResult) {
      Alert.showSuccessMessage("Email sent successfully!");
      setTimeout(() => {
        window.location.href = `po_order_list.php`;
      }, 2000);
    } else {
      Alert.showErrorMessage("Failed to send email!");
    }
  } catch (error) {
    console.error("Error:", error);
    Alert.showErrorMessage("An error occurred while processing your request");
  }
};

const addProductButton = document.getElementById("add-product");
const createDraftButton = document.getElementById("create-draft");
const sendEmailButton = document.getElementById("send-email");

addProductButton.addEventListener("click", function (event) {
  event.preventDefault();
  const tbody = document.getElementById("item-list-body");
  const tableRow = document.createElement("tr");
  tableRow.classList.add("item", "row");

  const orderIdSpan = document.createElement("span");
  orderIdSpan.classList.add("order-id");
  orderIdSpan.textContent = null;
  tableRow.appendChild(createTableCell(orderIdSpan, 4));

  const skuInput = createInput("text", "order-product-sku", "", false);
  const skuDiv = createSkuDiv(skuInput);
  tableRow.appendChild(createTableCell(skuDiv, 4));

  const quantityInput = createInput("number", "quantity-purchased", 1, false);
  quantityInput.addEventListener("change", () => updateTotal(tableRow));
  tableRow.appendChild(createTableCell(quantityInput, 1));

  const itemPriceInput = createInput("number", "item-price", 1, false);
  itemPriceInput.addEventListener("change", () => updateTotal(tableRow));
  tableRow.appendChild(createTableCell(itemPriceInput, 2));

  const removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-danger", "btn-sm");
  removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
  removeButton.addEventListener("click", () => {
    tableRow.remove();
  });
  tableRow.appendChild(createTableCell(removeButton, 1));
  tbody.appendChild(tableRow);
});

createDraftButton.addEventListener("click", async () => {
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

    const formData = new FormData();
    const file = fileInput.files[0];
    if (file) {
      const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
      formData.append("file", file, filename);
      const response = await DataController.upload(formData, "../../files/");

      const to_insert_file = {
        po_order_id: factoryId,
        file_name: response.fileName,
        file_pathname: response.filePath,
      };

      const res = await DataController.insert("po_order_files", to_insert_file);
    }

    const newPOOrder = {
      po_order_id: po_order_id,
      timesort: newTimeSort,
      factory_id: factoryId,
      po_order_status_id: 5,
      notes: orderNoteInput,
    };

    const items = tbody.querySelectorAll(".item");
    const itemsList = [];
    for (const item of items) {
      const orderID = item.querySelector("span.order-id").innerHTML;
      const skuInput = item.querySelector("input.order-product-sku");
      const quantityInput = item.querySelector("input.quantity-purchased");

      let id = parseInt(skuInput.getAttribute("order_product_id"));

      const sku = skuInput.value;
      const quantity = parseInt(quantityInput.value);
      if (sku) {
        if (!id) {
          const result = await get_sku_by_name(sku);
          if (result.status === 200) {
            id = parseInt(result.data[0].id);
          } else {
            Alert.showErrorMessage(
              `Couldn't find Product "${sku}" in database`
            );
            return;
          }
        }

        const newItem = {
          po_order_id: po_order_id,
          order_id: orderID,
          sku_settings_id: id,
          quantity: quantity,
          item_price: 0,
          po_order_items_status_id: 5,
        };
        itemsList.push(newItem);
      }
    }
    if (itemsList.length == 0) {
      Alert.showErrorMessage("PO Order item is empty!");
      return;
    }
    const result1 = await DataController.insert("po_orders", newPOOrder);
    itemsList.forEach(async (item) => {
      const result2 = await DataController.insert("po_orders_items", item);
    });
    if (result1.status) {
      await createPOAsPDF(newPOOrder, itemsList);
      Alert.showSuccessMessage("PO Order Inserted Successfully");
      /* setTimeout(() => {
                window.location.href = `po_order_list.php`;
            }, 2000); */
    } else {
      Alert.showErrorMessage("PO Order Inserted Failed!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

sendEmailButton.addEventListener("click", async (event) => {
  await handleSendEmail(event);
});

document.addEventListener("DOMContentLoaded", () => {
  generateItemListTable(poOrderId);
});
