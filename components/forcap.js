const generateSKUDataCSV = async (toggleSpinner) => {
  try {
    toggleSpinner(true);
    const skuData = await get_sku_data();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SKUData");

    worksheet.columns = [
      { header: "sku_id", key: "sku_id", width: 20 },
      { header: "order_product_sku", key: "order_product_sku", width: 20 },
      { header: "report_product_name", key: "report_product_name", width: 20 },
      { header: "warehouse_name", key: "warehouse_name", width: 20 },
      { header: "warehouse_sku_name", key: "warehouse_sku_name", width: 20 },
      { header: "sku_brand_name", key: "sku_brand_name", width: 20 },
    ];
    skuData.forEach((sku) => {
      worksheet.addRow(sku);
    });

    const buffer = await workbook.csv.writeBuffer();
    var blob = new Blob(["\uFEFF" + buffer], {
      type: "text/csv; charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sku.csv";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    toggleSpinner(false);
  }
};

export const Downloader = {
  ...generateSKUDataCSV,
};

const exportCSVButton = document.getElementById("export-csv");

exportCSVButton.addEventListener("click", async () => {
  const downloadResult = await Downloader.generateSKUDataCSV(toggleSpinner);
  if (downloadResult) Alert.showSuccessMessage("Download Success!");
  else Alert.showErrorMessage("Download Failed!");
});
