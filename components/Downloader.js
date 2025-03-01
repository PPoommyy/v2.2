import { AddressController } from "../components/AddressController.js";

const readExcel = async (fileName) => {
    try {
        const response = await axios.get(`../backend/file/read_file.php?fileName=${fileName}`, {
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

const readCSV = async (fileName) => {
    try {
        const response = await axios.get(`../backend/file/read_file.php?fileName=${fileName}`, {
            responseType: 'text', // Fetch CSV as text
        });

        const csvData = response.data;

        // Split the CSV data into rows and columns
        const rows = csvData.split(/\r\n|\n/);
        const data = rows.map(row => row.split(','));

        return data; // 2D array of CSV data
    } catch (error) {
        console.error("Error reading CSV file:", error);
        throw error;
    }
};

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

const duplicateStyle = (sourceCell, destinationCell, worksheet) => {
    const sourceStyle = worksheet.getCell(sourceCell).style;
    const destinationCellObject = worksheet.getCell(destinationCell);
    destinationCellObject.style = Object.assign({}, sourceStyle);
}

const duplicateStyleByRange = (fromCell, toCell, worksheet, templateSheet, currentIndex) => {
    const startIndex = parseInt(fromCell.replace(/[^0-9]/g, ''));
    const lastIndex = parseInt(toCell.replace(/[^0-9]/g, ''));
    const startCell = fromCell.replace(/[0-9]/g, '');
    const lastCell = toCell.replace(/[0-9]/g, '');
    for (let i = startIndex; i < lastIndex; i++) {
        for (let char of generateColumnRange(startCell, lastCell)) {
            const templateCellRef = `${char}${i + 1}`;
            const { style, width } = getStyle(templateCellRef, templateSheet);
            const outputCell = worksheet.getCell(currentIndex + i + 1, columnToNumber(char));
            outputCell.style = style;
            worksheet.getColumn(char).width = width;
        }
    }
}

const getValue = (cellRef, sheet) => {
    const cell = sheet.getCell(cellRef);
    const value = cell && cell.value ? cell.value : null;
    return { value };
}

const generateColumnRange = (start, end) => {
    let startNumber = columnNameToNumber(start);
    let endNumber = columnNameToNumber(end);
    const range = [];
    for (let i = startNumber; i <= endNumber; i++) {
        range.push(columnNumberToName(i));
    }
    return range;
}

const columnNameToNumber = (columnName) => {
    let columnNumber = 0;
    for (let i = 0; i < columnName.length; i++) {
        columnNumber = columnNumber * 26 + (columnName.charCodeAt(i) - 64);
    }
    return columnNumber;
}

const range = (start, end) => {
    return Array.from({ length: end.charCodeAt(0) - start.charCodeAt(0) + 1 }, (_, i) =>
        String.fromCharCode(start.charCodeAt(0) + i)
    );
}

const columnNumberToName = (columnNumber) => {
    let columnName = '';
    while (columnNumber > 0) {
        const remainder = (columnNumber - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
}

const get_product_sets = async(limit, page) => {
    try {
        let url = `../backend/get/get_product_sets.php?limit=${limit}&page=${page}`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const updateFormula = (cell, offsetRow) => {
    if (cell.formula) {
        const newFormula = cell.formula.replace(/([A-Za-z])(\d+)/g, (match, col, row) => {
            return `${col}${parseInt(row) + offsetRow}`;
        });
        cell.value = { formula: newFormula };
    }
};

const replaceSetItems = (selectedOrders, productSets) => {
    const productSetMap = productSets.reduce((acc, set) => {
        acc[set.details.order_product_sku] = set.items;
        return acc;
    }, {});

    selectedOrders.forEach(order => {
        let newItems = [];
        order.items.forEach(item => {
            if (productSetMap[item.order_product_sku]) {
                const setItems = productSetMap[item.order_product_sku];
                const setItemPrice = item.total / setItems.length;

                setItems.forEach(setItem => {
                    const itemPricePerUnit = setItemPrice / (setItem.quantity * item.quantity_purchased);
                    newItems.push({
                        ...setItem,
                        item_price: itemPricePerUnit,
                        quantity_purchased: setItem.quantity * item.quantity_purchased,
                        total: setItemPrice,
                        shipping_price: 0,
                    });
                });
            } else {
                newItems.push(item);
            }
        });
        order.items = newItems;
    });

    return selectedOrders;
}

const generateOrderExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);

        const templateInfo = await readExcel('download_orders_2.xlsx');
        const templateSheet = templateInfo.getWorksheet(1);
        /* console.log("templateSheet: ");
        console.log(templateSheet);
        console.log("templateSheet:G1 ");
        console.log(templateSheet.getCell("G1="));
        console.log("templateSheet:G1 value: " );
        console.log(templateSheet.getCell("G1").value);
        console.log("templateSheet:G1 formula: " );
        console.log(templateSheet.getCell("G1").formula); */
        let orderIndex = 0;
        const selectedOrders = [];

        checkboxStates.sort((a, b) => a-b);

        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        

        const result = await get_product_sets(false, false);
        const { product_sets } = result;
        replaceSetItems(selectedOrders, product_sets);

        selectedOrders.sort((a, b) => a.details.timesort-b.details.timesort);

        const wb = new ExcelJS.Workbook();

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }
        const ws = wb.addWorksheet('Orders');

        selectedOrders.forEach((order) => {
            const { details, all_total, items } = order;
            const { 
                raw_address, 
                order_note, 
                shipping_fee, 
                timesort, 
                payments_date, 
                currency_code, 
                payment_methods, 
                website_name, 
                ship_promotion_discount,
                deposit
            } = details;
            const length = items.length;
            const addressSplit = raw_address.split("\n").map(line => line.toUpperCase());
            const orderNoteSplit = order_note ? order_note.split("\n").filter(line => line.trim() !== '') : null;
            const addressLineCount = addressSplit.length;
            const haveEmail = addressSplit[addressLineCount -1].indexOf('@') !== -1;
            if (haveEmail) addressSplit.splice(-1,1);
            const orderSliceNumber = Math.ceil(length / 5);
        
            let total = all_total;
            for (let sliceIndex = 0; sliceIndex < orderSliceNumber; sliceIndex++) {
                let footerIndex = orderIndex + 7;
                let addressIndex = 1;
                let itemIndex = 1;
                
                if (sliceIndex === 0 && sliceIndex < orderSliceNumber-1) {
                    for (let i = 0; i < 7; i++) {
                        for (let char of range('A', 'M')) {
                            const templateCellRef = `${char}${i==6 ? i : i + 1}`;
                            const { style, width } = getStyle(templateCellRef, templateSheet);
                            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                            outputCell.style = style;
                            ws.getColumn(char).width = width;
                        }
                    }

                    addressSplit.forEach((line) => {
                        ws.getCell(orderIndex + addressIndex, columnToNumber("B")).value = line;
                        addressIndex++;
                    });

                    ws.getCell(orderIndex + 1, columnToNumber('I')).value = timesort;
                    ws.getCell(orderIndex + 1, columnToNumber('J')).value = payments_date.split(" ")[0];
                    ws.getCell(orderIndex + 1, columnToNumber('K')).value = addressSplit.join();
                    ws.getCell(orderIndex + 1, columnToNumber('L')).value = currency_code;
                    ws.getCell(orderIndex + 1, columnToNumber('M')).value = all_total.toFixed(2);
                } else if (sliceIndex === 0) {
                    duplicateStyleByRange("A0", "M7", ws, templateSheet, orderIndex);
                    addressSplit.forEach((line) => {
                        ws.getCell(orderIndex + addressIndex, columnToNumber("B")).value = line;
                        addressIndex++;
                    });

                    ws.getCell(orderIndex + 1, columnToNumber('I')).value = timesort;
                    ws.getCell(orderIndex + 1, columnToNumber('J')).value = payments_date.split(" ")[0];
                    ws.getCell(orderIndex + 1, columnToNumber('K')).value = addressSplit.join();
                    ws.getCell(orderIndex + 1, columnToNumber('L')).value = currency_code;
                    ws.getCell(orderIndex + 1, columnToNumber('M')).value = all_total.toFixed(2);

                    // ws.getCell(footerIndex, columnToNumber('C')).value = `${payment_methods} (${website_name}) ${deposit ? "* มัดจำ " + deposit : ""}`;
                    // richText: [{ font: { size: 12, color: { argb: "FFFF6600" }, name: "Calibri", scheme: "minor" }, text: Text here }],
                    ws.getCell(footerIndex, columnToNumber('C')).value = { 
                        richText: [
                            { font: { size: 10, name: "Calibri" }, text: `${payment_methods} (${website_name})` },
                            { font: { size: 10, color: { argb: "FFFF0000" }, name: "Calibri" }, text: `${deposit ? "* มัดจำ " + deposit : ""}` }
                        ]
                    }
                    ws.getCell(footerIndex, columnToNumber('D')).value = `Discount: ${ship_promotion_discount}`;
                    ws.getCell(footerIndex, columnToNumber('G')).value = currency_code;
                    ws.getCell(footerIndex, columnToNumber('H')).value = all_total.toFixed(2);
                } else if (sliceIndex === orderSliceNumber-1) {
                    duplicateStyleByRange("A0", "M7", ws, templateSheet, orderIndex);
                    // ws.getCell(footerIndex, columnToNumber('C')).value = `${payment_methods} (${website_name}) ${deposit ? "* มัดจำ " + deposit : ""}`;
                    ws.getCell(footerIndex, columnToNumber('C')).value = { 
                        richText: [
                            { font: { size: 10, name: "Calibri" }, text: `${payment_methods} (${website_name})` },
                            { font: { size: 10, color: { argb: "FFFF0000" }, name: "Calibri" }, text: `${deposit ? "* มัดจำ " + deposit : ""}` }
                        ]
                    }
                    ws.getCell(footerIndex, columnToNumber('D')).value = `Discount: ${ship_promotion_discount}`;
                    ws.getCell(footerIndex, columnToNumber('G')).value = currency_code;
                    ws.getCell(footerIndex, columnToNumber('H')).value = all_total.toFixed(2);
                } else {
                    for (let i = 0; i < 7; i++) {
                        for (let char of range('A', 'M')) {
                            const templateCellRef = `${char}${i==6 ? i : i + 1}`;
                            const { style, width } = getStyle(templateCellRef, templateSheet);
                            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                            outputCell.style = style;
                            ws.getColumn(char).width = width;
                        }
                    }
                }

                ws.getCell(orderIndex + 1, columnToNumber('C')).value = `No. ${timesort} (${payments_date.split(" ")[0]})`;
                ws.getCell(orderIndex + 1, columnToNumber('D')).value = 'SKU';
                ws.getCell(orderIndex + 1, columnToNumber('E')).value = 'Price';
                ws.getCell(orderIndex + 1, columnToNumber('F')).value = 'Q';
                ws.getCell(orderIndex + 1, columnToNumber('G')).value = 'SF';
                ws.getCell(orderIndex + 1, columnToNumber('H')).value = 'Total';

                const slicedItems = items.slice(sliceIndex * 5, (sliceIndex + 1) * 5);
                slicedItems.forEach((item) => {
                    const { report_product_name, item_price, quantity_purchased, sku, shipping_price } = item;
                    const shippingPrice = (itemIndex === 1) && (sliceIndex === 0) ? shipping_fee : shipping_price;
                    const subTotal = parseFloat(item_price * quantity_purchased) + parseFloat(shippingPrice);
                    const productNameRichText = [{ text: report_product_name, font: { color: { argb: 'FF000000' } } }];
        
                    if (quantity_purchased > 1) {
                        productNameRichText.push({ text: ` (${quantity_purchased})`, font: { 'bold': true, size: 9, color: { argb: 'FFFF0000' }, name: 'Calibri' } });
                    }
        
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C')).value = { richText: productNameRichText };
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('D')).value = sku;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('E')).value = item_price;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('F')).value = quantity_purchased;
                    
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('G')).value = shippingPrice;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('H')).value = subTotal;
                    
                    total+=(item_price*quantity_purchased)+(shippingPrice/orderSliceNumber);
                    itemIndex++;
                    if (orderNoteSplit && itemIndex-1 === slicedItems.length && sliceIndex === orderSliceNumber-1) {
                        if ( 6-itemIndex < orderNoteSplit.length && orderSliceNumber != 1) {
                            let orderNoteIndex = 0;
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + orderNoteIndex + 1, columnToNumber('B')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                orderNoteIndex++;
                            });
                        } else if (6-itemIndex >= orderNoteSplit.length ) {
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                itemIndex++;
                            });
                        } else {
                            let orderNoteIndex = 0;
                            orderIndex += 7;
                            duplicateStyleByRange("B0", "B7", ws, templateSheet, orderIndex);
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + orderNoteIndex + 1, columnToNumber('B')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                orderNoteIndex++;
                            });
                        }
                    } else {
                    }
                });
                orderIndex += 7;
            }
        });        
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'orders-' + Date.now() + '.xlsx';
        link.click();
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }
}

const generateOrderExcel2 = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);

        const templateInfo = await readExcel('download_orders_3.xlsx');
        const templateSheet = templateInfo.worksheets[0];
        let orderIndex = 0;
        const selectedOrders = [];

        checkboxStates.sort((a, b) => a-b);

        orders.forEach((order) => {
            if (checkboxStates.includes(order.details.timesort)) {
                selectedOrders.push(order);
            }
        });
        

        const result = await get_product_sets(false, false);
        const { product_sets } = result;
        replaceSetItems(selectedOrders, product_sets);

        selectedOrders.sort((a, b) => a.details.timesort-b.details.timesort);

        const wb = new ExcelJS.Workbook();

        if (templateSheet.workbook._themes) {
            wb._themes = { ...templateSheet.workbook._themes };
        }
        const ws = wb.addWorksheet('Orders');

        selectedOrders.forEach((order) => {
            const { details, all_total, items, tax_rate } = order;
            const { 
                raw_address, 
                order_note, 
                shipping_fee, 
                timesort, 
                payments_date, 
                currency_code, 
                payment_methods, 
                website_name, 
                ship_promotion_discount,
                deposit
            } = details;
            const length = items.length;
            const addressSplit = raw_address.split("\n").map(line => line.toUpperCase());
            const orderNoteSplit = order_note ? order_note.split("\n").filter(line => line.trim() !== '') : null;
            const addressLineCount = addressSplit.length;
            const haveEmail = addressSplit[addressLineCount -1].indexOf('@') !== -1;
            if (haveEmail) addressSplit.splice(-1,1);
            const orderSliceNumber = Math.ceil(length / 5);
        
            let total = all_total;
            for (let sliceIndex = 0; sliceIndex < orderSliceNumber; sliceIndex++) {
                let footerIndex = orderIndex + 7;
                let addressIndex = 1;
                let itemIndex = 1;
                
                if (sliceIndex === 0 && sliceIndex < orderSliceNumber-1) {
                    for (let i = 0; i < 7; i++) {
                        for (let char of generateColumnRange('A', 'AM')) {
                            const templateCellRef = `${char}${i==6 ? i : i + 1}`;
                            const { style, width } = getStyle(templateCellRef, templateSheet);
                            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                            outputCell.style = style;
                            ws.getColumn(char).width = width;

                            const { value } = getValue(templateCellRef, templateSheet);
                            outputCell.value = value;
                            updateFormula(outputCell, orderIndex);
                        }
                    }

                    addressSplit.forEach((line) => {
                        ws.getCell(orderIndex + addressIndex, columnToNumber("B")).value = line;
                        addressIndex++;
                    });

                    ws.getCell(orderIndex + 1, columnToNumber('I')).value = timesort;
                    ws.getCell(orderIndex + 1, columnToNumber('J')).value = payments_date.split(" ")[0];
                    ws.getCell(orderIndex + 1, columnToNumber('K')).value = currency_code;
                    ws.getCell(orderIndex + 1, columnToNumber('L')).value = all_total.toFixed(2);
                    ws.getCell(orderIndex + 1, columnToNumber('N')).value = tax_rate.tax_rate * 100;
                    ws.getCell(orderIndex + 1, columnToNumber('AM')).value = addressSplit.join();
                } else if (sliceIndex === 0) {
                    for (let i = 0; i < 7; i++) {
                        for (let char of generateColumnRange('A', 'AM')) {
                            const templateCellRef = `${char}${i + 1}`;
                            const { style, width } = getStyle(templateCellRef, templateSheet);
                            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                            outputCell.style = style;
                            ws.getColumn(char).width = width;

                            const { value } = getValue(templateCellRef, templateSheet);
                            outputCell.value = value;
                            updateFormula(outputCell, orderIndex);
                        }
                    }
                    addressSplit.forEach((line) => {
                        ws.getCell(orderIndex + addressIndex, columnToNumber("B")).value = line;
                        addressIndex++;
                    });

                    ws.getCell(orderIndex + 1, columnToNumber('I')).value = timesort;
                    ws.getCell(orderIndex + 1, columnToNumber('J')).value = payments_date.split(" ")[0];
                    ws.getCell(orderIndex + 1, columnToNumber('K')).value = currency_code;
                    ws.getCell(orderIndex + 1, columnToNumber('L')).value = all_total.toFixed(2);
                    ws.getCell(orderIndex + 1, columnToNumber('N')).value = tax_rate.tax_rate?tax_rate.tax_rate * 100:0;
                    ws.getCell(orderIndex + 1, columnToNumber('AM')).value = addressSplit.join();

                    // ws.getCell(footerIndex, columnToNumber('C')).value = `${payment_methods} (${website_name}) ${deposit ? "* มัดจำ " + deposit : ""}`;
                    // richText: [{ font: { size: 12, color: { argb: "FFFF6600" }, name: "Calibri", scheme: "minor" }, text: Text here }],
                    ws.getCell(footerIndex, columnToNumber('C')).value = { 
                        richText: [
                            { font: { size: 10, name: "Calibri" }, text: `${payment_methods} (${website_name})` },
                            { font: { size: 10, color: { argb: "FFFF0000" }, name: "Calibri" }, text: `${deposit ? "* มัดจำ " + deposit : ""}` }
                        ]
                    }
                    ws.getCell(footerIndex, columnToNumber('D')).value = `Discount:`;
                    ws.getCell(footerIndex, columnToNumber('E')).value = ship_promotion_discount;
                    ws.getCell(footerIndex, columnToNumber('G')).value = currency_code;
                    ws.getCell(footerIndex, columnToNumber('H')).value = all_total.toFixed(2);
                } else if (sliceIndex === orderSliceNumber-1) {
                    duplicateStyleByRange("A0", "H7", ws, templateSheet, orderIndex);
                    // ws.getCell(footerIndex, columnToNumber('C')).value = `${payment_methods} (${website_name}) ${deposit ? "* มัดจำ " + deposit : ""}`;
                    ws.getCell(footerIndex, columnToNumber('C')).value = { 
                        richText: [
                            { font: { size: 10, name: "Calibri" }, text: `${payment_methods} (${website_name})` },
                            { font: { size: 10, color: { argb: "FFFF0000" }, name: "Calibri" }, text: `${deposit ? "* มัดจำ " + deposit : ""}` }
                        ]
                    }
                    ws.getCell(footerIndex, columnToNumber('D')).value = `Discount:`;
                    ws.getCell(footerIndex, columnToNumber('E')).value = ship_promotion_discount;
                    ws.getCell(footerIndex, columnToNumber('G')).value = currency_code;
                    ws.getCell(footerIndex, columnToNumber('H')).value = all_total.toFixed(2);
                } else {
                    for (let i = 0; i < 7; i++) {
                        for (let char of generateColumnRange('A', 'H')) {
                            const templateCellRef = `${char}${i==6 ? i : i + 1}`;
                            const { style, width } = getStyle(templateCellRef, templateSheet);
                            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
                            outputCell.style = style;
                            ws.getColumn(char).width = width;

                            const { value } = getValue(templateCellRef, templateSheet);
                            outputCell.value = value;
                            updateFormula(outputCell, orderIndex);
                        }
                    }
                }

                ws.getCell(orderIndex + 1, columnToNumber('C')).value = `No. ${timesort} (${payments_date.split(" ")[0]})`;
                ws.getCell(orderIndex + 1, columnToNumber('D')).value = 'SKU';
                ws.getCell(orderIndex + 1, columnToNumber('E')).value = 'Price';
                ws.getCell(orderIndex + 1, columnToNumber('F')).value = 'Q';
                ws.getCell(orderIndex + 1, columnToNumber('G')).value = 'SF';
                ws.getCell(orderIndex + 1, columnToNumber('H')).value = 'Total';

                const slicedItems = items.slice(sliceIndex * 5, (sliceIndex + 1) * 5);
                slicedItems.forEach((item) => {
                    const { report_product_name, item_price, quantity_purchased, sku, shipping_price } = item;
                    const shippingPrice = (itemIndex === 1) && (sliceIndex === 0) ? shipping_fee : shipping_price;
                    const subTotal = parseFloat(item_price * quantity_purchased) + parseFloat(shippingPrice);
                    const productNameRichText = [{ text: report_product_name, font: { color: { argb: 'FF000000' } } }];
        
                    if (quantity_purchased > 1) {
                        productNameRichText.push({ text: ` (${quantity_purchased})`, font: { 'bold': true, size: 9, color: { argb: 'FFFF0000' }, name: 'Calibri' } });
                    }
        
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C')).value = { richText: productNameRichText };
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('D')).value = sku;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('E')).value = item_price;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('F')).value = quantity_purchased;
                    
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('G')).value = shippingPrice;
                    ws.getCell(orderIndex + itemIndex + 1, columnToNumber('H')).value = subTotal;
                    
                    total+=(item_price*quantity_purchased)+(shippingPrice/orderSliceNumber);
                    itemIndex++;
                    if (orderNoteSplit && itemIndex-1 === slicedItems.length && sliceIndex === orderSliceNumber-1) {
                        if ( 6-itemIndex < orderNoteSplit.length && orderSliceNumber != 1) {
                            let orderNoteIndex = 0;
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + orderNoteIndex + 1, columnToNumber('B')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                orderNoteIndex++;
                            });
                        } else if (6-itemIndex >= orderNoteSplit.length ) {
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                itemIndex++;
                            });
                        } else {
                            let orderNoteIndex = 0;
                            orderIndex += 7;
                            duplicateStyleByRange("B0", "B7", ws, templateSheet, orderIndex);
                            orderNoteSplit.forEach((orderNote) => {
                                ws.getCell(orderIndex + orderNoteIndex + 1, columnToNumber('B')).value = { richText : [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]};
                                orderNoteIndex++;
                            });
                        }
                    } else {
                    }
                });
                orderIndex += 7;
            }
        });        
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'orders-' + Date.now() + '.xlsx';
        link.click();
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }
}


const generateOrderExcel3 = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);

        const templateInfo = await readExcel('download_orders_3.xlsx');
        const templateSheet = templateInfo.worksheets[0];
        const wb = new ExcelJS.Workbook();
        if (templateSheet.workbook._themes) wb._themes = { ...templateSheet.workbook._themes };
        const ws = wb.addWorksheet('Orders');

        const selectedOrders = orders.filter(order => checkboxStates.includes(order.details.timesort));
        selectedOrders.sort((a, b) => a.details.timesort - b.details.timesort);

        const { product_sets } = await get_product_sets(false, false);
        replaceSetItems(selectedOrders, product_sets);

        let orderIndex = 0;
        for (const order of selectedOrders) {
            orderIndex = processOrder(order, ws, templateSheet, orderIndex);
        }

        await saveExcelFile(wb, 'orders-' + Date.now() + '.xlsx');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }
};

const processOrder = (order, ws, templateSheet, orderIndex) => {
    const { details, all_total, items, tax_rate } = order;
    const addressSplit = AddressController.splitAddressData(details.raw_address);
    const orderNoteSplit = details.order_note ? details.order_note.split("\n").filter(line => line.trim()) : null;
    const orderSliceNumber = Math.ceil(items.length / 5);

    let total = all_total;
    for (let sliceIndex = 0; sliceIndex < orderSliceNumber; sliceIndex++) {
        applyTemplate(ws, templateSheet, orderIndex);
        fillOrderDetails(ws, details, all_total, tax_rate, orderIndex, addressSplit);
        fillOrderItems(ws, items.slice(sliceIndex * 5, (sliceIndex + 1) * 5), details.shipping_fee, orderSliceNumber, orderIndex);
        if (sliceIndex === orderSliceNumber - 1) fillFooter(ws, details, all_total, orderIndex);
        if (orderNoteSplit && sliceIndex === orderSliceNumber - 1) fillOrderNotes(ws, orderNoteSplit, orderIndex);
        orderIndex += 7;
    }
    return orderIndex;
};

const saveExcelFile = async (wb, filename) => {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

const applyTemplate = (ws, templateSheet, orderIndex) => {
    for (let i = 0; i < 7; i++) {
        for (let char of generateColumnRange('A', 'AM')) {
            const templateCellRef = `${char}${i + 1}`;
            const { style, width } = getStyle(templateCellRef, templateSheet);
            const outputCell = ws.getCell(orderIndex + i + 1, columnToNumber(char));
            outputCell.style = style;
            ws.getColumn(char).width = width;
            outputCell.value = getValue(templateCellRef, templateSheet).value;
            updateFormula(outputCell, orderIndex);
        }
    }
};

// กรอกข้อมูลพื้นฐานของออเดอร์
const fillOrderDetails = (ws, details, all_total, tax_rate, orderIndex, addressSplit) => {
    let addressIndex = 1;
    addressSplit.forEach(line => ws.getCell(orderIndex + addressIndex++, columnToNumber("B")).value = line);
    
    ws.getCell(orderIndex + 1, columnToNumber('I')).value = details.timesort;
    ws.getCell(orderIndex + 1, columnToNumber('J')).value = details.payments_date.split(" ")[0];
    ws.getCell(orderIndex + 1, columnToNumber('K')).value = details.currency_code;
    ws.getCell(orderIndex + 1, columnToNumber('L')).value = all_total.toFixed(2);
    ws.getCell(orderIndex + 1, columnToNumber('N')).value = (tax_rate.tax_rate || 0) * 100;
    ws.getCell(orderIndex + 1, columnToNumber('AM')).value = addressSplit.join();
};

// กรอกรายการสินค้าของออเดอร์
const fillOrderItems = (ws, slicedItems, shippingFee, orderSliceNumber, orderIndex) => {
    let itemIndex = 1;
    slicedItems.forEach(({ report_product_name, item_price, quantity_purchased, sku, shipping_price }) => {
        const shippingPrice = (itemIndex === 1) ? shippingFee : shipping_price;
        const subTotal = (item_price * quantity_purchased) + shippingPrice;
        
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('C')).value = {
            richText: [{ text: report_product_name, font: { color: { argb: 'FF000000' } } }]
        };
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('D')).value = sku;
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('E')).value = item_price;
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('F')).value = quantity_purchased;
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('G')).value = shippingPrice;
        ws.getCell(orderIndex + itemIndex + 1, columnToNumber('H')).value = subTotal;
        
        itemIndex++;
    });
};

// ใส่ข้อมูลท้ายออเดอร์
const fillFooter = (ws, details, all_total, orderIndex) => {
    ws.getCell(orderIndex + 7, columnToNumber('C')).value = {
        richText: [
            { font: { size: 10, name: "Calibri" }, text: `${details.payment_methods} (${details.website_name})` },
            { font: { size: 10, color: { argb: "FFFF0000" }, name: "Calibri" }, text: details.deposit ? `* มัดจำ ${details.deposit}` : "" }
        ]
    };
    ws.getCell(orderIndex + 7, columnToNumber('D')).value = `Discount:`;
    ws.getCell(orderIndex + 7, columnToNumber('E')).value = details.ship_promotion_discount;
    ws.getCell(orderIndex + 7, columnToNumber('G')).value = details.currency_code;
    ws.getCell(orderIndex + 7, columnToNumber('H')).value = all_total.toFixed(2);
};

// ใส่โน้ตของออเดอร์
const fillOrderNotes = (ws, orderNoteSplit, orderIndex) => {
    let noteIndex = 0;
    orderNoteSplit.forEach(orderNote => {
        ws.getCell(orderIndex + noteIndex + 1, columnToNumber('B')).value = {
            richText: [{ text: orderNote, font: { color: { argb: 'FFFF0000' }, name: 'Calibri' } }]
        };
        noteIndex++;
    });
};

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
            const { details, all_total, sub_total, enable_invoice } = order;
            if (!enable_invoice || enable_invoice === 0 || enable_invoice === "0") {
                return;
            }
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
            const addressLineCount = addressSplit.length;
            const haveEmail = addressSplit[addressLineCount -1].indexOf('@') !== -1;
            if (haveEmail) addressSplit.splice(-1,1);
            let addressIndex = 10;
            addressSplit.forEach((line) => {
                const outputCell = ws.getCell(addressIndex, columnToNumber('A'));
                outputCell.value = line;
                addressIndex++;
            });

            ws.getCell(19, columnToNumber('F')).value = sub_total;
            ws.getCell(41, columnToNumber('A')).value = `Currency : ${details.currency_code}`;
        })
        if (wb.worksheets.length === 0) {
            return false;
        }
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'invoice-' + Date.now() + '.xlsx';
        link.click();
        return true;
    } catch (error) {
        console.error(error);
        return false;
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
                warehouseCount[sku].quantity += parseInt(quantity_purchased);
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
        return true;
    } catch (error) {
        console.error(error);
        return false;
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
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }  
}

const generateDpostExcel = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);
        const templateInfo = await readExcel('dpost.xlsx');
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
            const templateRowHeight = templateSheet.getRow(i).height;
            const outputRow = ws.getRow(i);
            outputRow.height = templateRowHeight;
        
            for (let colNumber = 1; colNumber <= 31; colNumber++) {
                const char = columnNumberToName(colNumber);
                
                const templateCellRef = `${char}${i + 1}`;
                const { style, width } = getStyle(templateCellRef, templateSheet);
                const { value } = getValue(templateCellRef, templateSheet);
                const templateColumn = templateSheet.getColumn(colNumber);
                const outputColumn = ws.getColumn(colNumber);
                const outputCell = ws.getCell(i + 1, colNumber);
                
                outputCell.style = style;
                outputCell.width = width;
                outputCell.value = value;
                outputColumn.hidden = templateColumn.hidden;
                ws.getColumn(char).width = width;
            }
        }

        selectedOrders.forEach((order)=>{
            const { details, all_total, sub_total, items, service_id } = order;
            if (orderIndex>2){
                for (let colNumber = 1; colNumber <= 31; colNumber++) {
                    const char = columnNumberToName(colNumber);
                    const templateCellRef = `${char}${orderIndex-1}`;
                    const { style, width } = getStyle(templateCellRef, ws);
                    const { value } = getValue(templateCellRef, ws);
                    const outputCell = ws.getCell(orderIndex, colNumber);
                    outputCell.style = style;
                    outputCell.value = value;
                }
            }
            
            const resultArray = AddressController.splitAddressData(details.raw_address).slice(1);

            const isThai = AddressController.checkThaiProvince(resultArray);
            
            const addressSplit = AddressController.splitAddressData(details.raw_address);
            const addressLineCount = addressSplit.length;
            const haveEmail = addressSplit[addressLineCount -1][0].indexOf('@') !== -1;

            let buyer_email, buyer_phone_number, ship_city, ship_postal_code, ship_state;

            if (haveEmail && addressLineCount >2 ) {
                buyer_phone_number = addressSplit[addressLineCount-2][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
            } else if (addressLineCount > 4) {
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
                ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
                ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, false);
            } else {
                buyer_phone_number = addressSplit[addressLineCount - 1][0];
                ship_city = null;
                ship_postal_code = null;
                ship_state = null;
            }

            const receiver_address = addressSplit[1]?addressSplit[1].length > 0 ? addressSplit[1].join(" ") : addressSplit[1]:"";
            
            ws.getCell(orderIndex, columnToNumber('A')).value = details.ship_country ? details.ship_country === "UK" ? "GB" : details.ship_country : "";
            ws.getCell(orderIndex, columnToNumber('C')).value = service_id ? service_id.service_id : "";
            ws.getCell(orderIndex, columnToNumber('N')).value = details.buyer_name ? details.buyer_name.toUpperCase() : "";
            ws.getCell(orderIndex, columnToNumber('O')).value = buyer_phone_number ? AddressController.formatPhoneNumber(buyer_phone_number) : "";
            ws.getCell(orderIndex, columnToNumber('P')).value = haveEmail ? addressSplit[addressLineCount-1][0] : "";
            ws.getCell(orderIndex, columnToNumber('Q')).value = receiver_address;
            ws.getCell(orderIndex, columnToNumber('R')).value = ship_state ? ship_state : "";
            ws.getCell(orderIndex, columnToNumber('S')).value = ship_city ? ship_city : "";
            ws.getCell(orderIndex, columnToNumber('T')).value = ship_postal_code ? ship_postal_code : "";
            ws.getCell(orderIndex, columnToNumber('U')).value = details.currency_code ? details.currency_code : "";
            ws.getCell(orderIndex, columnToNumber('Y')).value = sub_total ? sub_total.toFixed(2) : "";
            orderIndex++;
        })
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'dpost-' + Date.now() + '.xlsx';
        link.click();
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }  
}

const generateAftershipCSV = async (orders, toggleSpinner, checkboxStates) => {
    try {
        toggleSpinner(true);
        // Load template CSV
        const templateData = await readCSV('../reports/aftershipCSV.csv');
        
        // Define the column headers
        const headers = [
            'courier', 'tracking_number', 'email', 'sms', 'order_id', 'title', 'order_path',
            'customer_name', 'origin_country', 'destination_country', 'custom_1', 'custom_2',
            'tracking_postal_code', 'tracking_ship_date', 'tracking_account_number', 'tracking_key',
            'tracking_destination_country', 'order_date', 'order_number', 'language', 'shipment_type',
            'order_promised_delivery_date', 'shipment_tags', 'courier_connection_id', 'origin_state',
            'origin_city', 'origin_postal_code', 'origin_address', 'destination_state', 'destination_city',
            'destination_postal_code', 'destination_address'
        ];

        // Filter selected orders based on checkbox states
        const selectedOrders = orders.filter(order => checkboxStates.includes(order.details.timesort));
        // Create data array including headers
        let editedData = [headers];
        // Map selected orders to CSV rows
        selectedOrders.forEach(order => {
            const { details, items, tracking } = order;
            // Check if tracking is valid and if it's an array with at least one item
            if (!tracking || !Array.isArray(tracking) || !tracking.length) {
                return; // Skip this order if no valid tracking info
            }
            editedData.push([
                order.courier || 'thailand-post', 
                tracking[0].tracking_number || '', 
                details.buyer_email || 's6404062630511@email.kmutnb.ac.th', 
                details.sms || '', 
                details.order_id || '',
                items[0]?.report_product_name || '', // Safely access and decode
                order.order_path || '', 
                details.buyer_name || '', 
                order.origin_country || '',
                details.ship_country || '', 
                order.custom_1 || '', 
                order.custom_2 || '',
                details.ship_postal_code || '', 
                order.tracking_ship_date || '', 
                order.tracking_account_number || '',
                order.tracking_key || '', 
                order.tracking_destination_country || '', 
                details.payments_date || '',
                details.timesort || '', 
                order.language || '', 
                order.shipment_type || '',
                order.order_promised_delivery_date || '', 
                order.shipment_tags || '', 
                order.courier_connection_id || '',
                order.origin_state || '', 
                order.origin_city || '', 
                order.origin_postal_code || '', 
                order.origin_address || '',
                order.destination_state || '', 
                order.destination_city || '', 
                order.destination_postal_code || '', 
                order.destination_address || ''
            ]);
        });
        // Convert edited data to CSV string
        const csvContent = editedData.map(row => row.join(',')).join('\n');
        // Trigger a download of the edited CSV file
        const downloadCSV = (csvContent, filename) => {
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        downloadCSV(csvContent, 'aftership-' + Date.now() + '.csv');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        toggleSpinner(false);
    }
};

const generateMergedPDF = async (selectedOrders) => {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    
    for (const order of selectedOrders) {
        const labelUrl = `../files/label-${order.details.order_id}.pdf`;
        
        try {
            const existingPdfBytes = await fetch(labelUrl).then(res => res.arrayBuffer());
            const existingPdf = await PDFDocument.load(existingPdfBytes);
            
            const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        } catch (error) {
            console.error(`Error merging label for order ${order.details.order_id}:`, error);
        }
    }

    const mergedPdfBytes = await mergedPdf.save();

    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-labels.pdf';
    a.click();
    URL.revokeObjectURL(url);
    Alert.showSuccessMessage(`Barcode Downloaded Successfully`);
}

const generateUserDataCSV = async (userData) => {
    /* TODO :
        using exceljs to
            1. generate csv file from userData 
            2. download the file as userData.csv

        example data:
        [
            {
                "buyer_email": "aapo.vara1@gmail.com",
                "buyer_name": "Aapo Heinonen",
                "buyer_phone_number": "T. +358402142530",
                "short_name": "Finland"
            },
            {
                "buyer_email": "Alnievera@gmail.com",
                "buyer_name": "Aaron Nievera",
                "buyer_phone_number": "T. 650-892-5656",
                "short_name": "United States"
            },
            {
                "buyer_email": "heinis@gmail.com",
                "buyer_name": "Aatos Putkonen",
                "buyer_phone_number": "T. 0407688767",
                "short_name": "Finland"
            }
        ]
    */
   try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('UserData');

    worksheet.columns = [
        { header: 'buyer_name', key: 'buyer_name', width: 20 },
        { header: 'buyer_email', key: 'buyer_email', width: 20 },
        { header: 'buyer_phone_number', key: 'buyer_phone_number', width: 20 },
        { header: 'short_name', key: 'short_name', width: 20 }
    ];
    console.log("userData: " + userData);
    userData.forEach((user) => {
        console.log("user: " + user);
        worksheet.addRow(user);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'userData.csv';
    a.click();
    URL.revokeObjectURL(url);
    return true;
   } catch (error) {
    console.error(error);
    return false;
   }
}

export const Downloader = {
    generateInvoiceExcel,
    generateOrderExcel,
    generateOrderExcel2,
    generateOrderExcel3,
    generateItemSummaryExcel,
    generateDhlPreAlertExcel,
    generateDpostExcel,
    generateAftershipCSV,
    generateMergedPDF,
    generateUserDataCSV
}