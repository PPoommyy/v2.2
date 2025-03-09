import { Alert } from '../../components/Alert.js';
import { DataController } from '../../components/DataController.js';

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("requestForm");
    const requestReason = document.getElementById("requestReason");
    const otherReasonDiv = document.getElementById("otherReasonDiv");
    const otherReasonInput = document.getElementById("otherReason");
    const fileUpload = document.getElementById("fileUpload");
    const requestType = document.getElementById("requestType");

    function formatDateTimeWithSeconds(dateString) {
        if (!dateString) return "";
        return dateString.replace("T", " ") + ":00";
    }

    requestReason.addEventListener("change", function () {
        if (this.value === "Other") {
            otherReasonDiv.classList.remove("d-none");
            otherReasonInput.setAttribute("required", "true");
        } else {
            otherReasonDiv.classList.add("d-none");
            otherReasonInput.removeAttribute("required");
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        let formData = {
            buyer_name: document.getElementById("buyerName").value,
            phone_number: document.getElementById("phoneNumber").value,
            tracking_number: document.getElementById("trackingNumber").value,
            order_number: document.getElementById("orderNumber").value,
            order_date: formatDateTimeWithSeconds(document.getElementById("orderDate").value),
            request_reason: requestReason.value === "Other" ? otherReasonInput.value : requestReason.value,
            request_type_id: requestType.value
        };

        if (fileUpload.files.length > 0) {
            const file = fileUpload.files[0];
            const reader = new FileReader();

            reader.onloadend = async function () {
                await sendData(formData, "requests");
            };

            reader.readAsDataURL(file);
        } else {
            await sendData(formData, "requests");
        }
    });

    async function sendData(insertedData, table) {
        try {
            const response = await DataController.insert(table, insertedData);
            response.status
                ? Alert.showSuccessMessage("Form submitted successfully.")
                : Alert.showErrorMessage("Failed to submit form. Please try again.");
            form.reset();
            form.classList.remove("was-validated");
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    }
});
