<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>
<?php
$order_id = isset($_GET['order_id']) ? htmlspecialchars($_GET['order_id'], ENT_QUOTES, 'UTF-8') : null;
$request_id = isset($_GET['request_id']) ? (int)$_GET['request_id'] : null;
$page_title = $order_id ? 'Order Details' : 'Add New Order';
?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <style>
        /* Existing styles from your previous code - Keep them */
        .sku-search-dropdown-container .dropdown-menu {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ced4da;
            box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15);
        }

        .sku-search-dropdown-container .dropdown-item.active,
        .sku-search-dropdown-container .dropdown-item:active {
            background-color: #0d6efd;
            color: white;
        }

        .editable-cell-display {
            background-color: transparent !important;
            border: none !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            box-shadow: none !important;
            cursor: pointer;
        }

        .editable-cell-display:focus {
            outline: none !important;
            box-shadow: none !important;
        }

        .cursor-pointer {
            cursor: pointer;
        }

        /* New styles for file preview cards */
        .file-preview-item .card-img-top-wrapper {
            height: 150px;
            /* Adjust as needed */
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #e9ecef;
            /* Light background for preview area */
            border-bottom: 1px solid #dee2e6;
            overflow: hidden;
            /* Clip overflowing content like large iframes */
        }

        .file-preview-item .card-img-top-wrapper img,
        .file-preview-item .card-img-top-wrapper iframe,
        .file-preview-item .card-img-top-wrapper object,
        .file-preview-item .card-img-top-wrapper embed {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            /* Or 'cover' depending on desired effect */
        }

        .file-preview-item .card-img-top-wrapper .file-icon {
            font-size: 3rem;
            /* Larger icons */
            color: #6c757d;
            /* Muted color */
        }

        .file-preview-item .card-body {
            padding: 0.75rem;
            /* Smaller padding for card body */
        }

        .file-preview-item .card-title {
            font-size: 0.875rem;
            /* Smaller file name */
            margin-bottom: 0.25rem;
        }

        .file-preview-item .btn-group-sm .btn {
            padding: 0.2rem 0.4rem;
            font-size: 0.75rem;
        }

        .form-label-group {
            display: flex;
            align-items: center;
            /* Vertically align label and control */
            margin-bottom: 1rem;
        }

        .form-label-group .form-label {
            margin-bottom: 0;
            /* Remove default bottom margin */
            margin-right: 0.5rem;
            /* Space between label and control */
            min-width: 120px;
            /* Adjust for consistent label width */
            text-align: end;
        }

        .form-label-group .form-control,
        .form-label-group .btn-group {
            flex-grow: 1;
            /* Make control take remaining space */
        }

        /* styles.css or in <style> tag in order_details.php */

        /* Responsive table for order items */
        #item-data-container .table {
            /* Target the table inside the container */
            table-layout: fixed;
            /* Helps with column width control, but can make content overflow if not careful */
            width: 100%;
        }

        #item-data-container table th,
        #item-data-container table td {
            vertical-align: middle;
            /* Consider word-break for long SKUs if they still cause issues */
            /* overflow-wrap: break-word; */
            /* word-break: break-all; */
            /* Use with caution, can break words mid-way */
        }

        /* Define column widths - adjust percentages as needed */
        /* These classes should be added to <th> elements */
        #item-data-container th.col-sku,
        #item-data-container td:nth-child(1) {
            /* First data cell */
            width: 35%;
            /* min-width: 180px; */
            /* Optional: minimum width */
        }

        #item-data-container th.col-price,
        #item-data-container td:nth-child(2) {
            /* Second data cell */
            width: 18%;
        }

        #item-data-container th.col-qty,
        #item-data-container td:nth-child(3) {
            /* Third data cell */
            width: 15%;
        }

        #item-data-container th.col-total,
        #item-data-container td:nth-child(4) {
            /* Fourth data cell */
            width: 18%;
        }

        #item-data-container th.col-actions,
        #item-data-container td:nth-child(5) {
            /* Fifth data cell */
            width: 14%;
            text-align: center;
        }


        /* Ensure inputs within table cells don't cause overflow and are usable on mobile */
        #item-data-container .table input[type="text"],
        #item-data-container .table input[type="number"] {
            /* width: 100%; */
            /* Let table cell width control it */
            /* max-width: 100%; */
            /* Prevent exceeding cell */
            box-sizing: border-box;
            padding: 0.25rem 0.5rem;
            /* Smaller padding for inputs in table */
            font-size: 0.875rem;
            min-width: 50px;
            /* Minimum touch target */
        }

        #item-data-container .table .btn-sm {
            padding: 0.2rem 0.4rem;
            font-size: 0.75rem;
        }

        /* SKU Search Dropdown specific to table context */
        #item-data-container .sku-search-dropdown-container .dropdown-menu {
            font-size: 0.875rem;
            /* Smaller font in dropdown */
            /* Position relative to the input field if needed */
        }
    </style>

    <input id="orderId" type="hidden" value="<?php echo $order_id; ?>">
    <input id="requestId" type="hidden" value="<?php echo $request_id; ?>">
    <input type="file" id="hiddenFileInput" style="display: none;" accept="image/*,application/pdf,.txt,.csv,.xls,.xlsx,.doc,.docx">

    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <h1 class="h2 m-0">
                <?php echo $page_title; ?>
                <?php if ($order_id): ?>
                    <small class="text-muted fs-6">(ID: <?php echo $order_id; ?>)</small>
                <?php endif; ?>
            </h1>
            <!-- Action buttons can go here or at the bottom -->
        </div>

        <div class="row g-4">
            <!-- Left Column: Order Information & Files -->
            <div class="col-lg-5">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Order Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="form-label-group">
                            <label for="selected-website" class="form-label">Website:</label>
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-secondary dropdown-toggle text-start overflow-hidden" type="button" id="selected-website" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="select-website">
                                    Select Website
                                </button>
                                <ul id="website-dropdown" class="dropdown-menu w-100" aria-labelledby="selected-website"></ul>
                            </div>
                        </div>
                        <div class="form-label-group">
                            <label for="order-date-input" class="form-label">Order Date:</label>
                            <div class="input-group">
                                <input id="order-date-input" class="form-control" value="<?php echo date('Y-m-d'); ?>" type="date">
                                <span class="input-group-text"><i class="fas fa-calendar-alt"></i></span>
                            </div>
                        </div>
                        <div class="form-label-group">
                            <label for="selected-currency" class="form-label">Currency:</label>
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-secondary dropdown-toggle text-start overflow-hidden" type="button" id="selected-currency" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="select-currency">
                                    Select Currency
                                </button>
                                <ul id="currency-dropdown" class="dropdown-menu w-100" aria-labelledby="selected-currency"></ul>
                            </div>
                        </div>
                        <div class="form-label-group">
                            <label for="selected-payment" class="form-label">Payment:</label>
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-secondary dropdown-toggle text-start overflow-hidden" type="button" id="selected-payment" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="select-payment">
                                    Select Payment
                                </button>
                                <ul id="payment-dropdown" class="dropdown-menu w-100" aria-labelledby="selected-payment"></ul>
                            </div>
                        </div>
                        <div class="form-label-group">
                            <label for="selected-order-status" class="form-label">Status:</label>
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-secondary dropdown-toggle text-start overflow-hidden" type="button" id="selected-order-status" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="selected-order-status">
                                    Select Status
                                </button>
                                <ul id="order-status-dropdown" class="dropdown-menu w-100" aria-labelledby="selected-order-status"></ul>
                            </div>
                        </div>
                        <div class="form-label-group">
                            <label for="selected-order-type" class="form-label">Type:</label>
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-secondary dropdown-toggle text-start overflow-hidden" type="button" id="selected-order-type" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="selected-order-type">
                                    Select Type
                                </button>
                                <ul id="order-type-dropdown" class="dropdown-menu w-100" aria-labelledby="selected-order-type"></ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Shipping & Notes</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="ship-address-input" class="form-label">Shipping Address:</label>
                            <textarea id="ship-address-input" class="form-control" rows="5" aria-label="Shipping Address" placeholder="Customer Name
                                Street Address 1
                                Street Address 2 (Optional)
                                City, State/Province, Postal Code
                                Country
                                Phone Number
                                Email (Optional)"></textarea>
                        </div>

                        <div class="form-check form-switch mb-2">
                            <input class="form-check-input" type="checkbox" role="switch" id="toggleOverrideAddress">
                            <label class="form-check-label" for="toggleOverrideAddress">Use Override Address</label>
                        </div>
                        <div class="mb-3 d-none" id="overrideAddressContainer">
                            <textarea id="override-address-input" class="form-control" rows="5" aria-label="Override Address" placeholder="Enter override address details..."></textarea>
                        </div>

                        <div class="form-check form-switch mb-2">
                            <input class="form-check-input" type="checkbox" role="switch" id="toggleOrderNote">
                            <label class="form-check-label" for="toggleOrderNote">Add Order Note</label>
                        </div>
                        <div class="d-none" id="orderNoteContainer">
                            <textarea id="order-note-input" class="form-control" rows="3" aria-label="Order Note" placeholder="Enter internal notes for this order..."></textarea>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Attachments</h5>
                    </div>
                    <div class="card-body">
                        <div id="file-preview-container" class="mb-3">
                            <!-- File previews will be appended here by JS -->
                        </div>
                        <div class="d-flex align-items-center">
                            <button type="button" class="btn btn-outline-primary btn-sm" id="selectFileButton">
                                <i class="fas fa-paperclip me-1"></i> Select File
                            </button>
                            <span id="selectedFileName" class="ms-2 text-muted small flex-grow-1 text-truncate"></span>
                            <button type="button" class="btn btn-success btn-sm d-none" id="uploadSelectedFileButton">
                                <i class="fas fa-upload me-1"></i> Upload Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Items & Totals -->
            <div class="col-lg-7">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Order Items</h5>
                        <button id="add-product" class="btn btn-sm btn-warning">
                            <i class="fas fa-plus me-1"></i> Add Product
                        </button>
                    </div>
                    <div class="card-body p-0"> <!-- Remove padding for table to fit better -->
                        <div id="item-data-container" class="table-responsive">
                            <!-- Item list table will be generated here -->
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Summary & Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-label-group">
                                    <label class="form-label text-nowrap">Deposit?</label>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="hasDeposit" role="switch" data-bs-toggle="tooltip" title="Enable deposit amount">
                                    </div>
                                </div>
                                <div class="form-label-group">
                                    <label for="deposit" class="form-label">Deposit Amt:</label>
                                    <input type="number" id="deposit" class="form-control form-control-sm" disabled value="0">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-label-group">
                                    <label for="subtotal" class="form-label">Subtotal:</label>
                                    <input type="number" id="subtotal" class="form-control form-control-sm" disabled readonly>
                                </div>
                                <div class="form-label-group">
                                    <label for="discount" class="form-label">Discount:</label>
                                    <input type="number" id="discount" class="form-control form-control-sm" value="0">
                                </div>
                                <div class="form-label-group">
                                    <label for="shippingFee" class="form-label">Shipping Fee:</label>
                                    <input type="number" id="shippingFee" class="form-control form-control-sm" value="0">
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="text-end mb-3">
                            <span class="text-muted me-2">Order Total:</span>
                            <span id="currency" class="h3 text-primary fw-bold"></span>
                            <span class="h3 text-primary fw-bold"><u id="alltotal">0.00</u></span>
                        </div>
                        <div class="d-grid gap-2"> <!-- Use d-grid for full width button -->
                            <?php
                            if ($order_id) {
                                echo '<button id="save-order" class="btn btn-primary btn-lg"><i class="fas fa-save me-2"></i>Save Changes</button>';
                            } else {
                                echo '<button id="insert-order" class="btn btn-success btn-lg"><i class="fas fa-plus-circle me-2"></i>Add New Order</button>';
                            }
                            ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php if ($order_id): ?>
            <hr class="my-5">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="h3 m-0">Order History (Recently Added/Updated)</h2>
                <!-- Potentially add refresh button for this table -->
            </div>
            <div class="card shadow-sm">
                <div class="card-body p-0">
                    <div id="order-data-container" class="table-responsive">
                        <!-- Recently added/updated orders table will be here -->
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
    <?php include('../../templates_/footer.php'); ?>
    <script type='module' src="../../scripts/order_management/order_details.js"></script>
</body>

</html>