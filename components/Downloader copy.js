const readExcel = async (fileName) => {
    try {
        const response = await axios.get(`../backend/file/read_xlsx.php?fileName=${fileName}`, {
            responseType: 'arraybuffer',
        });
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(response.data);
        return workbook;
    } catch (error) {
        console.error("Error reading Excel file:", error);
        throw error;
    }
}

const columnToNumber = (column) =>{
    let result = 0;
    for (let i = 0; i < column.length; i++) {
        result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
}

const getStyle = (cellRef, sheet) => {
    const cell = sheet.getCell(cellRef);
    const style = cell && cell.style ? cell.style : {};
    const columnNumber = columnToNumber(cellRef.charAt(0));
    const width = cell && sheet.getColumn(columnNumber).width ? sheet.getColumn(columnNumber).width : 8;
    return { style, width };
}

function duplicateStyle(sourceCell, destinationCell, worksheet) {
    const sourceStyle = worksheet.getCell(sourceCell).style;
    const destinationCellObject = worksheet.getCell(destinationCell);
    destinationCellObject.style = Object.assign({}, sourceStyle);
}

const getValue = (cellRef, sheet) => {
    const cell = sheet.getCell(cellRef);
    const value = cell && cell.value ? cell.value : "";
    return { value };
}

const range = (start, end) => {
    return Array.from({ length: end.charCodeAt(0) - start.charCodeAt(0) + 1 }, (_, i) =>
        String.fromCharCode(start.charCodeAt(0) + i)
    );
}

const generateOrderExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);

        const templateInfo = await readExcel('download_orders.xlsx');
        const templateSheet = templateInfo.worksheets[0];

        let orderIndex = 0;
        const selectedOrders = [];
        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        const wb = new ExcelJS.Workbook();

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }

        const ws = wb.addWorksheet('Orders');
        selectedOrders.forEach((order) => {
            const { details, all_total, items } = order;
            let footerIndex = orderIndex+6;
            let addressIndex = 1;
            let itemIndex = 1;
            for (let i = 0; i < 6; i++) {
                for (let char of range('A', 'M')) {
                    const templateCellRef = `${char}${i + 1}`;
                    const { style, width } = getStyle(templateCellRef, templateSheet);

                    const outputCell = ws.getCell(orderIndex+i+1, columnToNumber(char));
                    outputCell.style = style;
                    ws.getColumn(char).width = width;
                }
            }

            const addressSplit = details.raw_address.split("\n").map(line => line.toUpperCase());
            
            addressSplit.forEach((line) => {
                const outputCell = ws.getCell(orderIndex+addressIndex, 2);
                outputCell.value = line;
                addressIndex++;
            });

            items.forEach((item) => {
                let outputCell;
                const { report_product_name, item_price, quantity_purchased, sku, shipping_price } = item;
                const shippingPrice = itemIndex === 1 ? details.shipping_fee : shipping_price;
                const subTotal = (item_price * quantity_purchased) + shippingPrice;
            
                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C'));
                const productNameRichText = [{ text: report_product_name, font: { color: { argb: 'FF000000' } } }];
                if (quantity_purchased > 1) {
                    productNameRichText.push({ text: ` (${quantity_purchased})`, font: { size: 9, color: { argb: 'FFF79646' }, name: 'Calibri' } });
                }
                outputCell.value = { richText: productNameRichText }

                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('D'));
                outputCell.value = sku;
            
                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('E'));
                outputCell.value = item_price;
            
                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('F'));
                outputCell.value = quantity_purchased;
                if (quantity_purchased != 1) {
                    outputCell.style.font = { size: 9, color: { argb: 'FFF79646' }, name: 'Calibri' };
                }
            
                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('G'));
                outputCell.value = shippingPrice;
            
                outputCell = ws.getCell(orderIndex + itemIndex + 1, columnToNumber('H'));
                outputCell.value = subTotal;
            
                itemIndex++;
            });

            ws.getCell(orderIndex+1, columnToNumber('C')).value = `No. ${details.timesort} (${details.payments_date.split(" ")[0]})`;
            ws.getCell(orderIndex+1, columnToNumber('D')).value = 'SKU';
            ws.getCell(orderIndex+1, columnToNumber('E')).value = 'Price';
            ws.getCell(orderIndex+1, columnToNumber('F')).value = 'Q';
            ws.getCell(orderIndex+1, columnToNumber('G')).value = 'SF';
            ws.getCell(orderIndex+1, columnToNumber('H')).value = 'Total';
            ws.getCell(orderIndex+1, columnToNumber('I')).value = details.timesort;
            ws.getCell(orderIndex+1, columnToNumber('J')).value = details.payments_date.split(" ")[0];
            ws.getCell(orderIndex+1, columnToNumber('K')).value = addressSplit.join();
            ws.getCell(orderIndex+1, columnToNumber('L')).value = details.currency_code;
            ws.getCell(orderIndex+1, columnToNumber('M')).value = all_total.toFixed(2);

            ws.getCell(footerIndex, columnToNumber('C')).value = `${details.payment_methods} (${details.website_name})`;
            ws.getCell(footerIndex, columnToNumber('D')).value = `Discount: ${details.ship_promotion_discount}`;
            ws.getCell(footerIndex, columnToNumber('G')).value = details.currency_code;
            ws.getCell(footerIndex, columnToNumber('H')).value = all_total-details.ship_promotion_discount;
            orderIndex += 6;
        });
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'orders-' + Date.now() + '.xlsx';
        link.click();
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }
}

const generateInvoiceExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);
        const templateInfo = await readExcel('create_invoice.xlsx');
        const templateSheet = templateInfo.worksheets[0];
        let orderIndex = 0;
        const selectedOrders = [];
        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        const wb = new ExcelJS.Workbook();

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }

        selectedOrders.forEach((order)=>{
            const { details, all_total, items } = order;
            const ws = wb.addWorksheet(order.details.timesort,
                {
                    pageSetup:templateSheet.pageSetup,
                    properties:templateSheet.properties,
                    views:templateSheet.views
                }
            );

            templateSheet.eachRow((row, rowNumber) => {
                const templateRowHeight = row.height;
                const newRow = ws.getRow(orderIndex + rowNumber);
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);
                    newCell.value = cell.value;
                    newCell.style = cell.style;
                });
        
                newRow.height = templateRowHeight;
            });
            
            templateSheet.model.merges.forEach(merge => {
                ws.mergeCells(merge);
            });
        
            ws.name = order.details.timesort;
            
            for (let i = 0; i < 41; i++) {
                for (let char of range('A', 'H')) {
                    const templateCellRef = `${char}${i + 1}`;
                    const { style, width } = getStyle(templateCellRef, templateSheet);
                    const { value } = getValue(templateCellRef, templateSheet);

                    const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                    outputCell.style = style;
                    outputCell.value = value;
                    ws.getColumn(char).width = width;
                }
            }

            const addressSplit = details.raw_address.split("\n").map(line => line.toUpperCase());
            let addressIndex = 10;
            addressSplit.forEach((line) => {
                const outputCell = ws.getCell(addressIndex, columnToNumber('A'));
                outputCell.value = line;
                addressIndex++;
            });
        })
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'invoice-' + Date.now() + '.xlsx';
        link.click();
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }  
}

const generateItemSummaryExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);
        const templateInfo = await readExcel('item_summary.xlsx');
        const templateSheet = templateInfo.worksheets[0];
        let itemIndex = 6;
        let warehouseIndex = 6;
        const selectedOrders = [];
        const warehouseCount = {};
        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('sheet1',
            {
                pageSetup:templateSheet.pageSetup,
                properties:templateSheet.properties,
                views:templateSheet.views
            }
        );

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }

        for (let i = 0; i < 6; i++) {
            for (let char of range('A', 'G')) {
                const templateCellRef = `${char}${i + 1}`;
                const { style, width } = getStyle(templateCellRef, templateSheet);
                const { value } = getValue(templateCellRef, templateSheet);
                const outputCell = ws.getCell(i + 1, columnToNumber(char));
                outputCell.style = style;
                outputCell.width = width;
                outputCell.value = value;
                ws.getColumn(char).width = width? width : 8;
            }
        }
        
        selectedOrders.forEach((order)=>{
            const { details, all_total, items } = order;
            templateSheet.model.merges.forEach(merge => {
                ws.mergeCells(merge);
            });

            items.forEach(item =>{
                const { sku, brand, order_product_sku, report_product_name, quantity_purchased } = item;
                ws.getCell(itemIndex, columnToNumber('A')).value = brand;
                ws.getCell(itemIndex, columnToNumber('B')).value = order_product_sku;
                ws.getCell(itemIndex, columnToNumber('C')).value = report_product_name;
                ws.getCell(itemIndex, columnToNumber('D')).value = quantity_purchased;
                if (itemIndex!=6 ) {
                    duplicateStyle(`A${itemIndex-1}`, `A${itemIndex}`, ws);
                    duplicateStyle(`B${itemIndex-1}`, `B${itemIndex}`, ws);
                    duplicateStyle(`C${itemIndex-1}`, `C${itemIndex}`, ws);
                    duplicateStyle(`D${itemIndex-1}`, `D${itemIndex}`, ws);
                }
                if (!warehouseCount[sku]) {
                    warehouseCount[sku] = { name: item.sku, quantity: 0 };
                }
                warehouseCount[sku].quantity += quantity_purchased;
                itemIndex++;
            })
        })
        const from = selectedOrders[selectedOrders.length-1].details.payments_date.split(' ')[0];
        const to = selectedOrders[0].details.payments_date.split(' ')[0];
        ws.getCell(3, columnToNumber('A')).value = `Item Summary ${from} to ${to}`;
        
        const warehouseCountArray = Object.values(warehouseCount);
        warehouseCountArray.forEach((item)=>{
            const { name, quantity } = item;
                ws.getCell(warehouseIndex, columnToNumber('F')).value = name;
                ws.getCell(warehouseIndex, columnToNumber('G')).value = quantity;
                if (warehouseIndex!=6 ) {
                    duplicateStyle(`F${warehouseIndex-1}`, `F${warehouseIndex}`, ws);
                    duplicateStyle(`G${warehouseIndex-1}`, `G${warehouseIndex}`, ws);
                }
                warehouseIndex++;
        })
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'item-summary-' + Date.now() + '.xlsx';
        link.click();
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }  
}

const generateDhlPreAlertExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);
        const templateInfo = await readExcel('dhl_prealert_2.xlsx');
        const templateSheet = templateInfo.worksheets[0];
        let orderIndex = 2;
        const selectedOrders = [];

        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('sheet1',
            {
                pageSetup:templateSheet.pageSetup,
                properties:templateSheet.properties,
                views:templateSheet.views,
            }
        );

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }

        for (let i = 0; i < 2; i++) {
            for (let char of range('A', 'L')) {
                const templateCellRef = `${char}${i + 1}`;
                const { style, width } = getStyle(templateCellRef, templateSheet);
                const { value } = getValue(templateCellRef, templateSheet);
                const outputCell = ws.getCell(i + 1, columnToNumber(char));
                outputCell.style = style;
                outputCell.width = width;
                outputCell.value = value;
                ws.getColumn(char).width = width;
            }
        }

        selectedOrders.forEach((order)=>{
            const { details, all_total, items } = order;
            const isManual = !!details.raw_address;
            
            templateSheet.model.merges.forEach(merge => {
                ws.mergeCells(merge);
            });
        
            
            let raw_address_split = details.raw_address.split("\r\n");
            const raw_address = raw_address_split.join(" . ");
            const ship_address_1 = isManual?raw_address:details.ship_address_1;
            const ship_address_2 = !isManual?details.ship_address_2:"";
            const ship_address_3 = !isManual?details.ship_address_3:"";
            const ship_city = !isManual?details.ship_city?details.ship_city:"N/A":"";
            const ship_state = !isManual?details.ship_state:"";
            const ship_postal_code = !isManual?details.ship_postal_code:"";

            ws.getCell(orderIndex, columnToNumber('A')).value = details.timesort;
            ws.getCell(orderIndex, columnToNumber('B')).value = details.buyer_name.toUpperCase();
            ws.getCell(orderIndex, columnToNumber('C')).value = ship_address_1;
            ws.getCell(orderIndex, columnToNumber('D')).value = ship_address_2;
            ws.getCell(orderIndex, columnToNumber('E')).value = ship_address_3;
            ws.getCell(orderIndex, columnToNumber('F')).value = ship_city;
            ws.getCell(orderIndex, columnToNumber('G')).value = ship_state;
            ws.getCell(orderIndex, columnToNumber('H')).value = ship_postal_code;
            ws.getCell(orderIndex, columnToNumber('I')).value = details.ship_country;
            ws.getCell(orderIndex, columnToNumber('J')).value = details.ship_phone_number;
            ws.getCell(orderIndex, columnToNumber('K')).value = details.currency_code;
            ws.getCell(orderIndex, columnToNumber('L')).value = all_total;
            orderIndex++;
        })
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'dhl-prealert-' + Date.now() + '.xlsx';
        link.click();
    } catch (error) {
        console.error(error);
    } finally {
        toggleSpinner(false);
    }  
}

export const Downloader = {
    generateInvoiceExcel,
    generateOrderExcel,
    generateItemSummaryExcel,
    generateDhlPreAlertExcel
}