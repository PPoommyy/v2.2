<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata_.php'); ?>

<body>
    <?php include('../../templates/header_.php'); ?>

    <div class="container mt-4">
        <div class="card bg-light shadow-sm p-4">
            <h2 class="card-header text-center mb-4">Request Request Form</h2>
            <form id="requestForm" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="requestType" class="form-label">Request Type</label>
                    <select class="form-select" id="requestType" name="requestType" required>
                        <option value="" selected disabled>-- Select Type --</option>
                        <option value="1">Return</option>
                        <option value="2">Refund</option>
                    </select>
                    <div class="invalid-feedback">Please select a request type.</div>
                </div>
                <div class="mb-3">
                    <label for="buyerName" class="form-label">Buyer Name</label>
                    <input type="text" class="form-control" id="buyerName" name="buyerName" minlength="2" maxlength="50" pattern="^[A-Za-zก-๙\s]+$" required>
                    <div class="invalid-feedback">Please enter your name.</div>
                </div>

                <div class="mb-3">
                    <label for="phoneNumber" class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="phoneNumber" name="phoneNumber" pattern="^0[0-9]{9}$" required>
                    <div class="invalid-feedback">Please enter a valid 10-digit phone number.</div>
                </div>

                <div class="mb-3">
                    <label for="trackingNumber" class="form-label">Tracking Number</label>
                    <input type="text" class="form-control" id="trackingNumber" name="trackingNumber" pattern="^[A-Z0-9]{13}$" required>
                    <div class="invalid-feedback">Please enter your tracking number.</div>
                </div>

                <div class="mb-3">
                    <label for="orderNumber" class="form-label">Order Number</label>
                    <input type="text" class="form-control" id="orderNumber" name="orderNumber" pattern="^[0-9]{8}$" required>
                    <div class="invalid-feedback">Please enter your order number.</div>
                </div>

                <div class="mb-3">
                    <label for="orderDate" class="form-label">Order Date</label>
                    <input type="datetime-local" class="form-control" id="orderDate" name="orderDate" required>
                    <div class="invalid-feedback">Please select your order date.</div>
                </div>

                <div class="mb-3">
                    <label for="requestReason" class="form-label">Reason for Return</label>
                    <select class="form-select" id="requestReason" name="requestReason" required>
                        <option value="" selected disabled>-- Select Reason --</option>
                        <option value="Defective">Defective Product</option>
                        <option value="WrongItem">Wrong Item Sent</option>
                        <option value="NotAsDescribed">Not as Described</option>
                        <option value="Other">Other</option>
                    </select>
                    <div class="invalid-feedback">Please select a reason.</div>
                </div>

                <div class="mb-3 d-none" id="otherReasonDiv">
                    <label for="otherReason" class="form-label">Please specify</label>
                    <input type="text" class="form-control" id="otherReason" name="otherReason">
                    <div class="invalid-feedback">Please provide a reason.</div>
                </div>

                <div class="mb-3">
                    <label for="fileUpload" class="form-label">Upload Receipt (Optional)</label>
                    <input type="file" class="form-control" id="fileUpload" name="fileUpload" accept=".png, .jpg, .jpeg, .pdf">
                    <div class="invalid-feedback">Invalid file type. Only PNG, JPG, JPEG, or PDF allowed.</div>
                </div>

                <div class="card-footer bg-transparent text-center">
                    <button type="submit" class="btn btn-primary">Submit request Request</button>
                </div>
            </form>
        </div>
    </div>

    <?php include("../../templates/footer.php"); ?>
    <script type="module" src="../../scripts/return_management/return_form.js"></script>
</body>
</html>
