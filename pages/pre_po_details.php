<!DOCTYPE html>
<html lang="en">
<?php include('../templates/metadata.php'); ?>
<?php 
    $po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;
?>
<body>
    <?php include('../templates/header.php');?>
    <input id="orderId" type="hidden" value="<?php echo $po_order_id ?>">
    <div class="container py-4">
        <div class="d-flex align-items-center mb-4">
            <h1 class="mb-0">
                <?= $po_order_id ? 'PO Order Details' : 'Add New PO Order'; ?>
                <?= $po_order_id ? '<small class="text-secondary ms-2">(' . $po_order_id . ')</small>' : ''?>
            </h1>
        </div>

        <div id="loading-spinner" class="spinner-border text-primary position-fixed top-50 start-50 translate-middle d-none" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>

        <div class="row g-4">
            <!-- Left Column -->
            <div class="col-lg-5">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="mb-4">
                            <label class="form-label fw-bold">Factory Name</label>
                            <input type="text" id="factory-name" class="form-control" placeholder="Factory Name" disabled>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Factory Number</label>
                            <input type="text" id="factory-number" class="form-control" placeholder="Factory Number" disabled>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Factory Email</label>
                            <input type="text" id="factory-email" class="form-control" placeholder="Factory Email" disabled>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Order Note</label>
                            <textarea id="order-note-input" class="form-control" rows="6" placeholder="Enter order note."></textarea>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">File Upload</label>
                            <ul class="list-group mb-2" id="file-list"></ul>
                            <div class="input-group">
                                <input type="file" class="form-control" id="file-input">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="col-lg-7">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div id="select-product-container" class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="fw-bold">Add product:</span>
                                <button id="add-product" class="btn btn-warning">
                                    <i class="fa fa-plus me-2"></i>Add
                                </button>
                            </div>
                            
                            <div id="item-data-container"></div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <button id="create-draft" class="btn btn-warning w-100 py-2">
                                    <i class="fa fa-file-lines me-2"></i>Create Draft
                                </button>
                            </div>
                            <div class="col-md-6">
                                <button id="send-email" class="btn btn-primary w-100 py-2">
                                    <i class="fa fa-paper-plane me-2"></i>Send Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include('../templates/footer.php');?>
    <script type='module' src="../scripts/pre_po_details.js"></script>
    <script src="https://unpkg.com/@pdf-lib/fontkit@0.0.4/dist/fontkit.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    </script>
    </body>
</html>