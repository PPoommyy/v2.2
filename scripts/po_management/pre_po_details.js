import { Alert } from "../../components/Alert.js";
import { DataController } from "../../components/DataController.js";

const factoryId = new URLSearchParams(window.location.search).get('factory_id');

const get_factory_details = async (factoryId) => {
    try {
        const response = await DataController.selectByKey("factories", "id", parseInt(factoryId));
        return response;
    } catch (error) {
        throw error;
    }
};

const get_factory_sku_search = async(searchTerm, factory_id) => {
    try {
        const response = await axios.get(`../../backend/get_factory_sku_search.php?factory_id=${factory_id}&searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_po_order_details = async(po_orders_id) => {
    try {
        const response = await axios.get(`../../backend/get_po_order_details.php?po_orders_id=${po_orders_id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_sku_by_name = async (name) => {
    try {
        const response = await axios.get(`../../backend/get_sku_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_last_timesort = async(yearAndMonth) => {
    try {
        const response = await axios.get(`../../backend/get_last_timesort.php?table=po_orders&year_and_month=${yearAndMonth}`);
        return response.data.last_timesort;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

const loadFactoryDetails = async (factoryId) => {
    try {
        toggleSpinner(true);
        const result = await get_factory_details(factoryId);
        const factoryDetails = result.status[0];
        const factoryName = document.getElementById('factory-name');
        const factoryNumber = document.getElementById('factory-number');
        const factoryEmail = document.getElementById('factory-email');
        factoryName.value = factoryDetails.name;
        factoryNumber.value = factoryDetails.contact_number;
        factoryEmail.value = factoryDetails.email_address;
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
};

const createInput = (type, key, value, isDisabled) => {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.setAttribute('for', key);
    input.classList.add('w-100', key);
    if (isDisabled) {
        input.disabled = true;
    }
    return input;
}

const createTableCell = (element, colspan) => {
    const cell = document.createElement('td');
    cell.classList.add(`col-${colspan}`);
    cell.appendChild(element);
    return cell;
}

const createSkuDiv = (skuInput) => {
    const skuDiv = document.createElement('div');
    skuDiv.classList.add('dropdown')
    const skuDropdown = document.createElement('ul');
    skuDropdown.classList.add('dropdown-menu');
    skuInput.classList.add('dropdown-toggle');
    skuInput.setAttribute('data-bs-toggle', 'dropdown');
    skuInput.addEventListener('input', async () => {
        skuInput.removeAttribute('order_product_id');
        skuInput.removeAttribute('order_product_name');
        const searchTerm = skuInput.value;
        const skuOptions = await get_factory_sku_search(searchTerm, factoryId);
        updateSkuDropdown(skuOptions.data, skuInput, skuDropdown);
    });

    skuInput.addEventListener('keyup', function (event) {
        const activeOption = skuDropdown.querySelector('.dropdown-item.active');
        const options = skuDropdown.querySelectorAll('.dropdown-item');
        const currentIndex = Array.from(options).indexOf(activeOption);
        if ((event.key === 'Enter' || event.keyCode === 13) && options.length > 0) {
            event.preventDefault();
            const selectedValue = activeOption.getAttribute('order_product_sku_option');
            skuInput.setAttribute('order_product_id', activeOption.getAttribute('order_product_id'));
            skuInput.setAttribute('order_product_name', activeOption.getAttribute('order_product_name'));
            skuInput.value = selectedValue;
        }
        if ((event.key === 'ArrowUp' || event.keyCode === 38 || event.key === 'Up') && currentIndex > 0) {
            event.preventDefault();
            options[currentIndex].classList.remove('active');
            options[currentIndex - 1].classList.add('active');
        }
    
        if ((event.key === 'ArrowDown' || event.keyCode === 40 || event.key === 'Down') && currentIndex < options.length - 1) {
            event.preventDefault();
            options[currentIndex].classList.remove('active');
            options[currentIndex + 1].classList.add('active');
        }
    });
    skuDiv.appendChild(skuInput);
    skuDiv.appendChild(skuDropdown);
    return skuDiv;
}

const updateSkuDropdown = (skuOptions, skuInput, skuDropdown) => {
    skuDropdown.innerHTML = '';
    if (skuOptions.length === 0) {
        skuDropdown.classList.add('d-none');
    } else{
        skuDropdown.classList.remove('d-none');
    }
    skuOptions.forEach((order_product_sku, index) => {
        const list = document.createElement('li');
        const option = document.createElement('a');
        const sku = order_product_sku.order_product_sku;
        const id = order_product_sku.id;
        const name = order_product_sku.report_product_name;
        if (index === 0) {
            option.classList.add('dropdown-item', 'active');
        } else {
            option.classList.add('dropdown-item');
        }
        option.setAttribute('order_product_sku_option', sku);
        option.setAttribute('order_product_id', id);
        option.setAttribute('order_product_name', name);
        option.value = sku;
        option.textContent = sku;
        option.addEventListener('click', function (event) {
            event.preventDefault();
            const selectedValue = this.getAttribute('order_product_sku_option');
            skuInput.setAttribute('order_product_id', this.getAttribute('order_product_id'));
            skuInput.setAttribute('order_product_name', this.getAttribute('order_product_name'));
            skuInput.value = selectedValue;
        });
        list.appendChild(option);
        skuDropdown.appendChild(list);
    });
}

const generateItemListTable = async () => {
    try {
        toggleSpinner(true);

        const urlParams = new URLSearchParams(window.location.search);
        const factoryId = urlParams.get('factory_id');
        const encodedData = urlParams.get('data');

        if (!factoryId || !encodedData) {
            console.error("Missing required parameters.");
            return;
        }

        const selectedItems = JSON.parse(decodeURIComponent(encodedData));

        const itemDataContainer = document.getElementById('item-data-container');
        itemDataContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('table', 'table-bordered', 'table-striped', 'table-hover');

        const tableHeader = document.createElement('thead');
        const tableHeaderRow = document.createElement('tr');
        tableHeaderRow.classList.add('row');
        tableHeaderRow.innerHTML =
            `
             <th class="col-4">Order ID</th>
             <th class="col-4">Product SKU</th>
             <th class="col-1">Quantity</th>
             <th class="col-2">Price</th>
             <th class="col-1"></th>`;
        tableHeader.appendChild(tableHeaderRow);
        tableElement.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'item-list-body';
        selectedItems.forEach((selectedItem, index) => {
            const { order_id, items } = selectedItem;
            items.forEach(item => {
                const tableRow = document.createElement('tr');
                tableRow.classList.add('item', 'row');
            
                const orderIdSpan = document.createElement('span');
                orderIdSpan.classList.add('order-id');
                orderIdSpan.textContent = order_id;
                tableRow.appendChild(createTableCell(orderIdSpan, 4));

                const skuInput = createInput('text', 'order-product-sku', item.order_product_sku, false);
                const skuDiv = createSkuDiv(skuInput)
                tableRow.appendChild(createTableCell(skuDiv, 4));

                const quantityInput = createInput('number', 'quantity-purchased', item.quantity_purchased, false);
                quantityInput.addEventListener('change', () => updateTotal(tableRow));
                tableRow.appendChild(createTableCell(quantityInput, 1));

                const itemPriceInput = createInput('number', 'item-price', item.item_price, false);
                itemPriceInput.addEventListener('change', () => updateTotal(tableRow));
                tableRow.appendChild(createTableCell(itemPriceInput, 2));

                const removeButton = document.createElement('button');
                removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
                removeButton.addEventListener('click', () =>{
                    tableRow.remove();
                });
                tableRow.appendChild(createTableCell(removeButton, 1));

                tableBody.appendChild(tableRow);
            })
        });
        
        tableElement.appendChild(tableBody);
        itemDataContainer.appendChild(tableElement);
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
  
        if (!poOrderDetails || !poOrderDetails.data1 || poOrderDetails.data1.items.length <= 0) {
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
    var _date = date.getFullYear() + '-' + (date.getMonth()+1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    var _time = "00:00:00";
    var date_time = _date + ' ' + _time;
    return date_time;
}

const generateNewTimeSort = (date, lastTimeSort) => {
    const resultArray = lastTimeSort ? [lastTimeSort.toString().slice(0, 2), lastTimeSort.toString().slice(2, 4), lastTimeSort.toString().slice(4)] : [];
    const year = String(date.getFullYear()).slice(-2);
    const month = (date.getMonth()+1).toString().padStart(2, '0');
    const sortOrder = (Number(resultArray[2]) + 1).toString().padStart(4, '0');
    var newTimeSort = "";
    newTimeSort += year === resultArray[0] ? resultArray[0] : year;
    newTimeSort += year === resultArray[0] && month === resultArray[1] ? resultArray[1] : month;
    newTimeSort += year === resultArray[0] && month === resultArray[1] ? sortOrder : "0001";
    return newTimeSort;
}

const getFileExtension = (filename) => {
    return filename.split('.').pop();
}

const dataURLToBlob = async (dataURL) => {
    const response = await fetch(dataURL);
    return await response.blob();
}

const generateEmailContent = (selectedOrders) => {
    const title = 'Purchase Order from BoxSense';
    const acceptLink = 'https://example.com/accept';
    const cancelLink = 'https://example.com/cancel';
    const viewLink = 'https://example.com/view';

    return {
        title: title,
        body: `
            ${title}

            Please find attached the PDF file containing the selected SKUs.

            Actions:
            - Accept: ${acceptLink}
            - Cancel: ${cancelLink}
            - View: ${viewLink}

            Thank you for your business.
        `,
        buttons: [
            { text: 'Accept', link: acceptLink, class: 'btn-success' },
            { text: 'Cancel', link: cancelLink, class: 'btn-danger' },
            { text: 'View', link: viewLink, class: 'btn-primary' }
        ]
    };
}

const sendEmail = async (pdfFile, newPOOrder) => {
    try {
        console.log(pdfFile);
        console.log("newPoOrder", newPOOrder);

        // โหลด pdf.js library
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(1);
        
        // กำหนดขนาด canvas
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // เรนเดอร์หน้าแรกของ PDF ลงบน canvas
        await page.render({ canvasContext: context, viewport }).promise;

        // แปลง canvas เป็น blob
        const pngBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, "image/png");
        });

        // กำหนดชื่อไฟล์ให้ตรงกับ PDF แต่เปลี่ยนเป็น .png
        const pngFileName = pdfFile.name.replace(/\.pdf$/, ".png");
        const pngFile = new File([pngBlob], pngFileName, { type: "image/png" });

        // อัปโหลด PNG ไปยังเซิร์ฟเวอร์
        const pngFormData = new FormData();
        pngFormData.append("file", pngFile, pngFileName);
        const uploadResponse = await DataController.upload(pngFormData, "../files/");
        console.log("uploadResponse", uploadResponse);
        if (!uploadResponse?.fileName) {
            throw new Error("Failed to upload PNG file.");
        }

        // บันทึกข้อมูลไฟล์ PNG ลงฐานข้อมูล
        const pngFileData = {
            po_orders_id: newPOOrder.po_orders_id,
            file_name: uploadResponse.fileName,
            file_pathname: uploadResponse.filePath,
        };
        await DataController.insert("po_orders_files", pngFileData);

        // **เปลี่ยนให้เป็น absolute URL**
        const baseUrl = window.location.origin + "/test/work/v2.2/files/";
        const pdfUrl = baseUrl + encodeURIComponent(pdfFile.name);
        const pngUrl = baseUrl + encodeURIComponent(uploadResponse.fileName);

        // Generate email content
        const emailContent = generateEmailContent([newPOOrder]);
        const email = "s6404062630511@email.kmutnb.ac.th";
        // const email = "s6404062630554@email.kmutnb.ac.th";
        // Create FormData with both PDF and PNG
        const emailFormData = new FormData();
        emailFormData.append("title", emailContent.title);
        emailFormData.append("body", emailContent.body);
        emailFormData.append("buttons", JSON.stringify(emailContent.buttons));
        emailFormData.append("email", email);
        emailFormData.append("pdf_url", pdfUrl);
        emailFormData.append("png_url", pngUrl);

        // ส่งไปยัง send_email.php
        const response = await axios.post("../../backend/send_email.php", emailFormData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("send_email response", response);
        return response.data.success;

    } catch (error) {
        console.error("Error processing PDF:", error);
        Alert.showErrorMessage("Failed to process PDF for email");
        return false;
    }
};

async function createPOAsPDF(newPOOrder, itemsList) {
    try {
        const { PDFDocument, rgb } = PDFLib;
        const fontkit = window.fontkit;

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // โหลด font ที่รองรับภาษาไทย
        const fontBytes = await fetch('../assets/webfonts/tahoma.ttf').then(res => res.arrayBuffer());
        const fontBytesBold = await fetch('../assets/webfonts/tahoma.ttf').then(res => res.arrayBuffer());
        
        // Embed fonts
        const thFont = await pdfDoc.embedFont(fontBytes);
        const thFontBold = await pdfDoc.embedFont(fontBytesBold);

        // Get factory details
        const factory = await DataController.selectByKey("factories", "id", newPOOrder.factory_id);
        const factoryName = factory.status[0].name;
        const factoryAddress = factory.status[0].address || '';
        const factoryContact = factory.status[0].contact || '';

        // Helper function for text alignment
        const drawText = (text, x, y, options = {}) => {
            const defaultOptions = {
                size: 13, // ปรับขนาด font ให้เหมาะสมกับ THSarabunNew
                font: thFont,
                color: rgb(0, 0, 0),
                maxWidth: width - 100
            };
            page.drawText(text, { ...defaultOptions, ...options, x, y });
        };

        // Draw company logo placeholder
        page.drawRectangle({
            x: 50,
            y: height - 120,
            width: 150,
            height: 50,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
        });

        // Header
        drawText('ใบสั่งซื้อ / PURCHASE ORDER', width / 2 - 100, height - 50, { 
            font: thFontBold, 
            size: 24,
            color: rgb(0, 0.3, 0.6)
        });

        // PO Details
        const currentDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Left side information
        drawText('ถึง / To:', 50, height - 150, { font: thFontBold });
        drawText(factoryName, 50, height - 170);
        drawText(factoryAddress, 50, height - 190, { size: 12 });
        drawText(factoryContact, 50, height - 210, { size: 12 });

        // Right side information
        drawText('เลขที่ใบสั่งซื้อ / PO Number:', width - 250, height - 150, { font: thFontBold });
        drawText(newPOOrder.po_orders_id, width - 250, height - 170);
        drawText('วันที่ / Date:', width - 250, height - 190, { font: thFontBold });
        drawText(currentDate, width - 250, height - 210);

        // Draw horizontal line
        page.drawLine({
            start: { x: 50, y: height - 240 },
            end: { x: width - 50, y: height - 240 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Table header
        const tableTop = height - 270;
        const columns = [
            { x: 150, width: 150, title: 'รหัสสินค้า\nSKU ID' },
            { x: 300, width: 100, title: 'จำนวน\nQuantity' },
            { x: 400, width: 100, title: 'ราคาต่อหน่วย\nUnit Price' },
            { x: 500, width: 45, title: 'รวม\nTotal' }
        ];

        // Draw table header
        columns.forEach(col => {
            const [thTitle, enTitle] = col.title.split('\n');
            drawText(thTitle, col.x, tableTop, { 
                font: thFontBold,
                size: 13
            });
            drawText(enTitle, col.x, tableTop - 15, { 
                font: thFontBold,
                size: 11
            });
        });

        // Draw table content
        let yOffset = tableTop - 40;
        let totalAmount = 0;

        itemsList.forEach((item, index) => {
            // Add new page if needed
            if (yOffset < 100) {
                page = pdfDoc.addPage([595, 842]);
                yOffset = height - 50;
            }

            const lineTotal = parseFloat(item.quantity) * parseFloat(item.item_price);
            console.log(`lineTotal: ${lineTotal} = ${item.quantity} * ${item.item_price}`);
            totalAmount += lineTotal;

            // Draw alternating row background
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: 45,
                    y: yOffset - 15,
                    width: width - 90,
                    height: 20,
                    color: rgb(0.95, 0.95, 0.95),
                });
            }

            columns.forEach((col, colIndex) => {
                let value = '';
                switch (colIndex) {
                    case 0: value = String(item.sku_settings_id); break;  // แปลงเป็น string
                    case 1: value = String(item.quantity); break;  // แปลงเป็น string
                    case 2: value = item.item_price.toFixed(2); break;  // toFixed จะคืนค่าเป็น string อยู่แล้ว
                    case 3: value = lineTotal.toFixed(2); break;  // toFixed จะคืนค่าเป็น string อยู่แล้ว
                }
                drawText(value, col.x, yOffset, { size: 12 });
            });

            yOffset -= 25;
        });

        // Draw totals
        const totalsY = yOffset - 20;
        page.drawLine({
            start: { x: 50, y: yOffset },
            end: { x: width - 50, y: yOffset },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        drawText('ยอดรวมทั้งสิ้น / Total Amount:', width - 300, totalsY, { font: thFontBold });
        drawText(String(totalAmount.toFixed(2)), width - 100, totalsY);  // แปลงเป็น string

        // Notes section
        if (newPOOrder.notes) {
            drawText('หมายเหตุ / Notes:', 50, totalsY - 40, { font: thFontBold });
            drawText(newPOOrder.notes, 50, totalsY - 60, { 
                size: 12,
                maxWidth: width - 100
            });
        }

        // Footer
        const footerY = 50;
        page.drawLine({
            start: { x: 50, y: footerY + 100 },
            end: { x: width - 50, y: footerY + 100 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Signature boxes
        const signatureWidth = (width - 150) / 3;
        [
            ['จัดทำโดย', 'Prepared By'],
            ['ตรวจสอบโดย', 'Reviewed By'],
            ['อนุมัติโดย', 'Approved By']
        ].forEach((titles, index) => {
            const xPos = 75 + (signatureWidth * index);
            const [thTitle, enTitle] = titles;
            drawText(thTitle, xPos, footerY + 85, { font: thFontBold });
            drawText(enTitle, xPos, footerY + 70, { font: thFontBold, size: 11 });
            
            page.drawLine({
                start: { x: xPos, y: footerY + 40 },
                end: { x: xPos + signatureWidth - 50, y: footerY + 40 },
                thickness: 1,
                color: rgb(0, 0, 0),
            });
            drawText('วันที่ / Date: ________________', xPos, footerY + 20);
        });

        // Save and upload PDF
        const pdfBytes = await pdfDoc.save();
        const pdfFile = new File([pdfBytes], `PO-${newPOOrder.po_orders_id}.pdf`, { 
            type: 'application/pdf' 
        });

        const formData = new FormData();
        formData.append('file', pdfFile, `PO-${newPOOrder.po_orders_id}.pdf`);
        const uploadResponse = await DataController.upload(formData, '../files/');

        if (uploadResponse?.fileName) {
            const fileData = {
                po_orders_id: newPOOrder.po_orders_id,
                file_name: uploadResponse.fileName,
                file_pathname: uploadResponse.filePath,
            };
            await DataController.insert('po_orders_files', fileData);
            return pdfFile;
        }
        return false;
    } catch (error) {
        console.error('Error generating PO PDF:', error);
        throw error;
    }
}

const addProductButton = document.getElementById('add-product');
const createDraftButton = document.getElementById('create-draft');
const sendEmailButton = document.getElementById('send-email');

addProductButton.addEventListener('click', function (event) {
    event.preventDefault();
    const tbody = document.getElementById('item-list-body');
    const tableRow = document.createElement('tr');
    tableRow.classList.add('item', 'row');

    const orderIdSpan = document.createElement('span');
    orderIdSpan.classList.add('order-id');
    orderIdSpan.textContent = null;
    tableRow.appendChild(createTableCell(orderIdSpan, 4));

    const skuInput = createInput('text', 'order-product-sku', '', false);
    const skuDiv = createSkuDiv(skuInput)
    tableRow.appendChild(createTableCell(skuDiv, 4));

    const quantityInput = createInput('number', 'quantity-purchased', 1, false);
    quantityInput.addEventListener('change', () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(quantityInput, 1));

    const itemPriceInput = createInput('number', 'item-price', 1, false);
    itemPriceInput.addEventListener('change', () => updateTotal(tableRow));
    tableRow.appendChild(createTableCell(itemPriceInput, 2));

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
    removeButton.addEventListener('click', () =>{
        tableRow.remove();
    });
    tableRow.appendChild(createTableCell(removeButton, 1));
    tbody.appendChild(tableRow);
});


createDraftButton.addEventListener('click', async() => {
    try {
        const tbody = document.getElementById('item-list-body');
        const orderNoteInput = document.getElementById('order-note-input').value;
        const fileInput = document.getElementById('file-input');

        const po_orders_id = await generateUniqueOrderId();

        const currentDate = new Date().toISOString().split('T')[0];
        const odate = currentDate.split("-").join("/");
        const idate = new Date(odate);
        const idateYear = String(idate.getFullYear()).slice(-2);
        const idateMonth = (idate.getMonth()+1).toString().padStart(2, '0');
        const lastTimeSort = await get_last_timesort(idateYear+""+idateMonth);
        const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

        const formData = new FormData();
        const file = fileInput.files[0];
        if (file) {
            const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
            formData.append('file', file, filename);
            const response = await DataController.upload(formData, "../files/");
            
            const to_insert_file = {
                po_orders_id: factoryId,
                file_name: response.fileName,
                file_pathname: response.filePath,
            }

            const res = await DataController.insert("po_order_files", to_insert_file);
        }

        const newPOOrder = {
            po_orders_id: po_orders_id,
            timesort: newTimeSort,
            factory_id: factoryId,
            po_orders_status_id: 5,
            notes: orderNoteInput
        };

        const items = tbody.querySelectorAll('.item');
        const itemsList = [];
        for (const item of items) {
            const orderID = item.querySelector('span.order-id').innerHTML;
            const skuInput = item.querySelector('input.order-product-sku');
            const quantityInput = item.querySelector('input.quantity-purchased');

            let id = parseInt(skuInput.getAttribute('order_product_id'));

            const sku = skuInput.value;
            const quantity = parseInt(quantityInput.value);
            if (sku) {
                if (!id) {
                    const result = await get_sku_by_name(sku);
                    if (result.status === 200) {
                        id = parseInt(result.data[0].id);
                    } else {
                        Alert.showErrorMessage(`Couldn't find Product "${sku}" in database`);
                        return;
                    }
                }
        
                const newItem = {
                    po_orders_id: po_orders_id,
                    order_id: orderID,
                    sku_settings_id: id,
                    quantity: quantity,
                    item_price: 0,
                    po_orders_items_status_id: 5,
                };
                itemsList.push(newItem);
            }
        }
        if (itemsList.length==0) {
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
        console.error('Error:', error);
    }
});   

sendEmailButton.addEventListener('click', async() => {
    try {
        const tbody = document.getElementById('item-list-body');
        const orderNoteInput = document.getElementById('order-note-input').value;
        const fileInput = document.getElementById('file-input');
        const po_orders_id = await generateUniqueOrderId();
        const currentDate = new Date().toISOString().split('T')[0];
        const odate = currentDate.split("-").join("/");
        const idate = new Date(odate);
        const idateYear = String(idate.getFullYear()).slice(-2);
        const idateMonth = (idate.getMonth()+1).toString().padStart(2, '0');
        const lastTimeSort = await get_last_timesort(idateYear+""+idateMonth);
        const newTimeSort = generateNewTimeSort(idate, lastTimeSort);

        const formData = new FormData();
        const file = fileInput.files[0];
        if (file) {
            const filename = `po-${Date.now()}.${getFileExtension(file.name)}`;
            formData.append('file', file, filename);
            const response = await DataController.upload(formData, "../files/");
            
            const to_insert_file = {
                po_orders_id: factoryId,
                file_name: response.fileName,
                file_pathname: response.filePath,
            }

            const res = await DataController.insert("po_order_files", to_insert_file);
        }

        const newPOOrder = {
            po_orders_id: po_orders_id,
            timesort: newTimeSort,
            factory_id: factoryId,
            po_orders_status_id: 1,
            notes: orderNoteInput
        };

        const items = tbody.querySelectorAll('.item');
        const itemsList = [];
        for (const item of items) {
            const orderID = item.querySelector('span.order-id').innerHTML;
            const skuInput = item.querySelector('input.order-product-sku');
            const quantityInput = item.querySelector('input.quantity-purchased');
            const itemPrice = parseFloat(item.querySelector('input.item-price').value);
            let id = parseInt(skuInput.getAttribute('order_product_id'));

            const sku = skuInput.value;
            const quantity = parseInt(quantityInput.value);
            if (sku) {
                if (!id) {
                    const result = await get_sku_by_name(sku);
                    if (result.status === 200) {
                        id = parseInt(result.data[0].id);
                    } else {
                        Alert.showErrorMessage(`Couldn't find Product "${sku}" in database`);
                        return;
                    }
                }
        
                const newItem = {
                    po_orders_id: po_orders_id,
                    order_id: orderID,
                    sku_settings_id: id,
                    quantity: quantity,
                    item_price: itemPrice,
                    po_orders_items_status_id: 1,
                };
                itemsList.push(newItem);
            }
        }
        if (itemsList.length==0) {
            Alert.showErrorMessage("PO Order item is empty!");
            return;
        }
        const result1 = await DataController.insert("po_orders", newPOOrder);
        for (const item of itemsList) {
            await DataController.insert("po_orders_items", item);
        }

        if (result1.status) {
            Alert.showSuccessMessage("PO Order Inserted Successfully");
            
            // Generate PDF
            const pdfFile = await createPOAsPDF(newPOOrder, itemsList);
            if (!pdfFile) {
                Alert.showErrorMessage("Failed to generate PDF!");
                return;
            }
            const sendEmailResult = await sendEmail(pdfFile, newPOOrder);
            if (sendEmailResult) {
                Alert.showSuccessMessage("Email sent successfully!");
            } else {
                Alert.showErrorMessage("Failed to send email!");
            }
        } else {
            Alert.showErrorMessage("PO Order Insertion Failed!");
        }
    } catch (error) {
        console.error('Error:', error);
        Alert.showErrorMessage("An error occurred while processing your request");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadFactoryDetails(factoryId);
    generateItemListTable();
});