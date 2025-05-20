<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>
<?php
$po_order_id = isset($_GET['po_order_id']) ? htmlspecialchars($_GET['po_order_id'], ENT_QUOTES, 'UTF-8') : null;
$factory_id_from_url = isset($_GET['factory_id']) ? (int)$_GET['factory_id'] : null; // For new PO from pre_po
$page_title = $po_order_id ? 'PO Order Details' : 'Create New PO';
?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <style>
        /* Existing styles from order_details.php (SKU search, file preview, form-label-group) */
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

        .file-preview-item .card-img-top-wrapper {
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #e9ecef;
            border-bottom: 1px solid #dee2e6;
            overflow: hidden;
        }

        .file-preview-item .card-img-top-wrapper img,
        .file-preview-item .card-img-top-wrapper iframe {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .file-preview-item .card-img-top-wrapper .file-icon {
            font-size: 3rem;
            color: #6c757d;
        }

        .file-preview-item .card-body {
            padding: 0.75rem;
        }

        .file-preview-item .card-title {
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }

        .form-label-group {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }

        .form-label-group .form-label {
            margin-bottom: 0;
            margin-right: 0.5rem;
            min-width: 130px;
            /* Adjusted width */
            text-align: end;
        }

        .form-label-group .form-control,
        .form-label-group .input-group {
            flex-grow: 1;
        }

        #item-data-container .table {
            table-layout: fixed;
            width: 100%;
        }

        #item-data-container table th,
        #item-data-container table td {
            vertical-align: middle;
        }

        #item-data-container th.col-sku-po,
        #item-data-container td:nth-child(1) {
            width: 15%;
        }

        /* Order SKU ID (from Sales Order) */
        #item-data-container th.col-product-po,
        #item-data-container td:nth-child(2) {
            width: 30%;
        }

        /* Product SKU (Factory/Search) */
        #item-data-container th.col-price-po,
        #item-data-container td:nth-child(4) {
            width: 20%;
        }

        #item-data-container th.col-qty-po,
        #item-data-container td:nth-child(3) {
            width: 15%;
        }

        /* #item-data-container th.col-total-po, #item-data-container td:nth-child(5) { width: 15%; } */
        /* Total might be removed for PO */
        #item-data-container th.col-actions-po,
        #item-data-container td:nth-child(5) {
            width: 10%;
            text-align: center;
        }


        @media (max-width: 767.98px) {
            .form-label-group {
                flex-direction: column;
                align-items: flex-start;
                margin-bottom: 0.75rem;
            }

            .form-label-group .form-label {
                min-width: auto;
                text-align: left;
                margin-bottom: 0.25rem;
                margin-right: 0;
            }

            .form-label-group .form-control,
            .form-label-group .btn-group,
            .form-label-group .input-group {
                width: 100%;
            }
        }
    </style>

    <input id="poOrderId" type="hidden" value="<?php echo $po_order_id; ?>">
    <input id="factoryId" type="hidden" value=""> <!-- Will be populated by JS -->
    <input type="file" id="hiddenPoFileInput" style="display: none;" accept="image/*,application/pdf,.txt,.csv,.xls,.xlsx,.doc,.docx">


    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
            <h1 class="h2 m-0 mb-2 mb-md-0 text-center text-md-start">
                <?php echo $page_title; ?>
                <?php if ($po_order_id): ?>
                    <small class="text-muted fs-6 d-block d-md-inline">(PO ID: <?php echo $po_order_id; ?>)</small>
                <?php endif; ?>
            </h1>
        </div>

        <div id="loading-spinner" class="spinner-border text-primary position-fixed top-50 start-50 translate-middle d-none" style="z-index: 1070; width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>

        <div class="row g-lg-4 g-3">
            <!-- Left Column: Factory Info, Notes, Files -->
            <div class="col-lg-5">
                <div class="card shadow-sm mb-3">
                    <div class="card-header bg-light py-2">
                        <h5 class="mb-0 fs-6">Factory Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="form-label-group">
                            <label for="factory-name" class="form-label">Name:</label>
                            <input type="text" id="factory-name" class="form-control form-control-sm" placeholder="Factory Name" disabled>
                        </div>
                        <div class="form-label-group">
                            <label for="factory-number" class="form-label">Contact No:</label>
                            <input type="text" id="factory-number" class="form-control form-control-sm" placeholder="Factory Number" disabled>
                        </div>
                        <div class="form-label-group">
                            <label for="factory-email" class="form-label">Email:</label>
                            <input type="text" id="factory-email" class="form-control form-control-sm" placeholder="Factory Email" disabled>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm mb-3">
                    <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fs-6">Order Note</h5>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" id="togglePoOrderNote">
                            <label class="form-check-label small" for="togglePoOrderNote">Edit</label>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="poOrderNoteContainer" class="d-none">
                            <textarea id="po-order-note-input" class="form-control form-control-sm" rows="4" placeholder="Enter notes for this PO..."></textarea>
                        </div>
                        <p id="poOrderNoteDisplay" class="text-muted fst-italic small mb-0">No notes added.</p>
                    </div>
                </div>

                <div class="card shadow-sm">
                    <div class="card-header bg-light py-2">
                        <h5 class="mb-0 fs-6">Attached Files</h5>
                    </div>
                    <div class="card-body">
                        <div id="po-file-preview-container" class="mb-3">
                            {/* File previews will be appended here */}
                        </div>
                        <div class="d-flex flex-column flex-sm-row align-items-sm-center">
                            <button type="button" class="btn btn-outline-primary btn-sm mb-2 mb-sm-0 me-sm-2" id="selectPoFileButton">
                                <i class="fas fa-paperclip me-1"></i> Select File
                            </button>
                            <span id="selectedPoFileName" class="text-muted small flex-grow-1 text-truncate mb-2 mb-sm-0 me-sm-2"></span>
                            <button type="button" class="btn btn-success btn-sm d-none" id="uploadSelectedPoFileButton">
                                <i class="fas fa-upload me-1"></i> Upload Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Items & Actions -->
            <div class="col-lg-7">
                <div class="card shadow-sm">
                    <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fs-6">PO Items</h5>
                        <button id="add-po-product" class="btn btn-sm btn-warning">
                            <i class="fas fa-plus me-1"></i> Add Item
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div id="po-item-data-container" class="table-responsive">
                        </div>
                    </div>
                    <div class="card-footer bg-light">
                        <div class="row g-2">
                            <div class="col-md-6">
                                <!-- UPDATE PO Button (Replaces Create Draft) -->
                                <button id="update-po-button" class="btn btn-primary w-100 py-2">
                                    <i class="fas fa-sync-alt me-2"></i>Update PO & PDF
                                </button>
                            </div>
                            <div class="col-md-6">
                                <button id="send-po-email-button" class="btn btn-success w-100 py-2">
                                    <i class="fas fa-paper-plane me-2"></i>Send PO via Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hidden link for PDF generation if needed by pdfMake, or for direct download -->
        <a id="generatedPoPdfLink" href="#" download="" style="display:none;">Download PDF</a>

    </div>
    <?php include('../../templates_/footer.php'); ?>
    <script type='module' src="../../scripts/po_management/po_order_details.js"></script>
    <script src="https://unpkg.com/@pdf-lib/fontkit@0.0.4/dist/fontkit.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    </script>
</body>

</html>