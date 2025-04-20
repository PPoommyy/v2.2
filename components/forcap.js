const sendEmail = async (pdfFile, newPOOrder, options = {}) => {
  try {
    const recipientEmail = "s6404062630511@email.kmutnb.ac.th";
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);

    const baseUrl = window.location.origin + "/test/work/v2.2/files/";
    const pdfUrl = baseUrl + encodeURIComponent(pdfFile.name);
    const pngUrl = baseUrl + encodeURIComponent(uploadResponse.fileName);

    const factory = await DataController.selectByKey(
      ...
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
    ...
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