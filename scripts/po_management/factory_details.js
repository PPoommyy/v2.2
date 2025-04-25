import { AddressController } from "../../components/AddressController.js";
import { Alert } from "../../components/Alert.js";
import { Cell } from "../../components/Cell.js";
import { DataController } from "../../components/DataController.js";
import { Downloader } from "../../components/Downloader.js";
import { Pagination } from "../../components/Pagination.js";
import { PODataController } from "../../components/PODataController.js";

const factory_id = document.getElementById("factoryId").value;

function toggleSpinner(loading) {
  const spinner = document.getElementById("loading-spinner");
  if (loading) {
    spinner.style.display = "inline-block";
  } else {
    spinner.style.display = "none";
  }
}

const generateSection1 = async () => {
  if (factory_id) {
    const result = await PODataController.get_factory_details(factory_id);
    const factory = result[0];
    const { name, location, contact_person, contact_number, email_address } =
      factory;

    const factoryName = document.getElementById("factory-name");
    const factoryLocation = document.getElementById("factory-location");
    const factoryContactPerson = document.getElementById(
      "factory-contact-person"
    );
    const factoryContactNumber = document.getElementById(
      "factory-contact-number"
    );
    const factoryEmailAddress = document.getElementById(
      "factory-email-address"
    );

    factoryName.value = name;
    factoryLocation.value = location;
    factoryContactPerson.value = contact_person;
    factoryContactNumber.value = contact_number;
    factoryEmailAddress.value = email_address;
  }
};

const generateSection2 = async (limit, page) => {
  if (factory_id) {
    try {
      toggleSpinner(true);
      const factory = await PODataController.get_factory_skus(factory_id);
      const factorySkuDataContainer = document.getElementById("factory-skus");
      factorySkuDataContainer.innerHTML = "";
      const tableElement = document.createElement("table");
      tableElement.classList.add(
        "table",
        "table-sm",
        "table-bordered",
        "table-striped",
        "table-hover"
      );
      const tableHeader = document.createElement("thead");
      const tableHeaderRow = document.createElement("tr");
      tableHeaderRow.innerHTML = `
        <th></th>
        <th>Sku ID</th>
        <th>Order Product Sku</th>
        <th>Report Product Name</th>
        <th>Item Price</th>
        `;
      tableHeader.appendChild(tableHeaderRow);
      tableElement.appendChild(tableHeader);
      const tableBody = document.createElement("tbody");
      tableElement.appendChild(tableBody);
      factory.forEach((factorySku) => {
        const {
          factory_sku_settings_id,
          sku_settings_id,
          order_product_sku,
          report_product_name,
          item_price,
          exist,
        } = factorySku;
        const tableRow = document.createElement("tr");
        tableRow.innerHTML = `
            <td>
                <input type="checkbox" name="factory_sku_settings_id_${factory_sku_settings_id}" value="${factory_sku_settings_id}" ${
          exist == 1 ? "checked" : ""
        } data-item-price="${item_price}">
            </td>
            <td>${sku_settings_id}</td>
            <td>${order_product_sku}</td>
            <td>${report_product_name}</td>
            `;
        tableRow.appendChild(Cell.createInputCell("item_price", item_price));
        tableBody.appendChild(tableRow);
      });
      factorySkuDataContainer.appendChild(tableElement);
    } catch (e) {
      Alert.showErrorMessage("Something went wrong");
    } finally {
      toggleSpinner(false);
    }
  }
};

const saveFactory = async () => {
  const factoryName = document.getElementById("factory-name");
  const factoryLocation = document.getElementById("factory-location");
  const factoryContactPerson = document.getElementById(
    "factory-contact-person"
  );
  const factoryContactNumber = document.getElementById(
    "factory-contact-number"
  );
  const factoryEmailAddress = document.getElementById("factory-email-address");

  const factory = {
    name: factoryName.value,
    location: factoryLocation.value,
    contact_person: factoryContactPerson.value,
    contact_number: factoryContactNumber.value,
    email_address: factoryEmailAddress.value,
  };

  const factoryUpdateResult = await DataController.update(
    "factories",
    "id",
    factory_id,
    factory
  );
  if (!factoryUpdateResult) {
    Alert.showErrorMessage("Failed to update factory details.");
    return;
  }

  const checkboxes = document.querySelectorAll(
    '#factory-skus input[type="checkbox"]'
  );
  const insertResults = [];
  const deleteOperations = [];
  const updateOperations = [];

  for (const checkbox of checkboxes) {
    const factorySkuSettingsId = checkbox.value;
    const isChecked = checkbox.checked;

    const itemPriceInput = checkbox
      .closest("tr")
      .querySelector('input[for="item_price"]');
    const item_price = itemPriceInput.value
      ? parseFloat(itemPriceInput?.value).toFixed(2)
      : null;

    /* console.log("isChecked: ", isChecked);
    console.log("factorySkuSettingsId: ", factorySkuSettingsId);
    console.log("item_price: ", item_price); */

    if (isChecked && factorySkuSettingsId === "null") {
      const skuSettingsId = checkbox
        .closest("tr")
        .querySelector("td:nth-child(2)").textContent;
      try {
        const result = await DataController.insert("factory_sku_settings", {
          factory_id: parseInt(factory_id),
          sku_settings_id: parseInt(skuSettingsId),
          item_price: item_price,
        });
        insertResults.push(result);
      } catch (error) {
        console.error("Error inserting SKU:", error);
      }
    } else if (!isChecked && factorySkuSettingsId !== "null") {
      deleteOperations.push(
        DataController._delete(
          "factory_sku_settings",
          "factory_sku_settings_id",
          factorySkuSettingsId
        )
      );
    } else if (isChecked && factorySkuSettingsId !== "null" && item_price) {
      updateOperations.push(
        DataController.update(
          "factory_sku_settings",
          "factory_sku_settings_id",
          factorySkuSettingsId,
          { item_price: item_price }
        )
      );
    }
  }

  try {
    await Promise.all([...updateOperations, ...deleteOperations]);
    Alert.showSuccessMessage("Factory details and SKUs updated successfully.");
    setTimeout(() => {
      location.reload();
    }, 3000);
  } catch (error) {
    console.error("Error updating/deleting SKUs:", error);
    Alert.showErrorMessage("Failed to update factory SKUs.");
  }
};

const createFactory = async () => {
  const factoryName = document.getElementById("factory-name");
  const factoryLocation = document.getElementById("factory-location");
  const factoryContactPerson = document.getElementById(
    "factory-contact-person"
  );
  const factoryContactNumber = document.getElementById(
    "factory-contact-number"
  );
  const factoryEmailAddress = document.getElementById("factory-email-address");
  const factory = {
    name: factoryName.value,
    location: factoryLocation.value,
    contact_person: factoryContactPerson.value,
    contact_number: factoryContactNumber.value,
    email_address: factoryEmailAddress.value,
  };
  const result = await DataController.insert("factories", factory);
  if (result) {
    Alert.showSuccessMessage();
  } else {
    Alert.showErrorMessage();
  }
};

const handleTemplateDownload = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Factory SKU Template");

    worksheet.addRow(["Order Product SKU", "Price"]);

    worksheet.addRow(["EXAMPLE-SKU-001", 100.5]);
    worksheet.addRow(["EXAMPLE-SKU-002", 200.0]);

    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 15;

    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: "text/csv" });

    Downloader.downloadBlob(blob, "Factory-SKU-Template.csv");

    Alert.showSuccessMessage("📄 Template ดาวน์โหลดสำเร็จ!", "success");
  } catch (error) {
    console.error(error);
    Alert.showErrorMessage("❌ ล้มเหลวในการดาวน์โหลด Template", "danger");
  }
};

const handleCSVImport = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv";

  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, "utf-8");

    reader.onload = async (e) => {
      const csvData = e.target.result;
      const rows = csvData.split("\n").map((row) => row.split(","));

      const csvSkus = rows.slice(1).map((row) => ({
        order_product_sku: row[0]?.trim(),
        price: parseFloat(row[1]?.trim()) || 0,
      }));

      try {
        toggleSpinner(true);
        const factorySkus = await PODataController.get_factory_skus(factory_id);

        csvSkus.forEach(({ order_product_sku, price }) => {
          const match = factorySkus.find(
            (sku) => sku.order_product_sku === order_product_sku
          );

          if (match) {
            const rows = document.querySelectorAll("#factory-skus tr");
            let row = null;

            rows.forEach((tr) => {
              const skuTd = tr.querySelector("td:nth-child(3)");
              if (skuTd && skuTd.textContent.trim() === order_product_sku) {
                row = tr;
              }
            });

            if (row) {
              const checkbox = row.querySelector('input[type="checkbox"]');
              const priceInput = row.querySelector('input[for="item_price"]');

              if (checkbox) checkbox.checked = true;
              if (priceInput) priceInput.value = price.toFixed(2);
            }
          }
        });
        Alert.showSuccessMessage("📥 CSV นำเข้าสำเร็จ!", "success");
      } catch (error) {
        console.error(error);
        Alert.showErrorMessage("❌ ล้มเหลวในการนำเข้า CSV", "danger");
      } finally {
        toggleSpinner(false);
      }
    };
  });
  input.click();
};

document.addEventListener("DOMContentLoaded", () => {
  const saveFactoryButton = document.getElementById("save-factory");
  const createFactoryButton = document.getElementById("create-factory");
  const importCSVButton = document.getElementById("import-csv");
  const downloadTemplateButton = document.getElementById("download-template");

  if (saveFactoryButton)
    saveFactoryButton.addEventListener("click", saveFactory);

  if (createFactoryButton)
    createFactoryButton.addEventListener("click", createFactory);

  importCSVButton.addEventListener("click", handleCSVImport);
  downloadTemplateButton.addEventListener("click", handleTemplateDownload);

  generateSection1();
  generateSection2(10, 1);
});
