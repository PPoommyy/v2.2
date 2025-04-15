<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>
<?php
$po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;
?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <input id="orderId" type="hidden" value="<?php echo $po_order_id ?>">
    <div class="container py-4">

        <div id="loading-spinner" class="spinner-border text-primary position-fixed top-50 start-50 translate-middle d-none" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>

        <div class="container py-4">
            <div class="d-flex align-items-center mb-4">
                <h1 class="mb-0 fs-3">
                    <?= $po_order_id ? 'PO Order Details' : 'Add New PO Order'; ?>
                    <?= $po_order_id ? '<small class="text-secondary ms-2">(' . $po_order_id . ')</small>' : '' ?>
                </h1>
            </div>

            <div class="row g-4">
                <!-- Left Column -->
                <div class="col-12 col-lg-5">
                    <div class="card shadow-lg rounded-4">
                        <div class="card-body p-4">
                            <!-- Each Input -->
                            <?php
                            $inputs = [
                                ["Factory Name", "factory-name", "Factory Name"],
                                ["Factory Number", "factory-number", "Factory Number"],
                                ["Factory Email", "factory-email", "Factory Email"]
                            ];
                            foreach ($inputs as [$label, $id, $placeholder]) {
                                echo "
                        <div class='mb-3'>
                            <label class='form-label fw-bold'>$label</label>
                            <input type='text' id='$id' class='form-control' placeholder='$placeholder' disabled>
                        </div>";
                            }
                            ?>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Order Note</label>
                                <textarea id="order-note-input" class="form-control" rows="5" placeholder="Enter order note."></textarea>
                            </div>

                            <div class="mb-3">
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
                <div class="col-12 col-lg-7">
                    <div class="card shadow-lg rounded-4">
                        <div class="card-body p-4">
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="fw-bold">Add product:</span>
                                    <button id="add-product" class="btn btn-warning d-flex align-items-center">
                                        <i class="fa fa-plus me-2"></i>Add
                                    </button>
                                </div>
                                <div id="item-data-container"></div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 shadow-sm">
                                    <div class="fw-bold fs-5">All total</div>
                                    <div class="d-flex align-items-end">
                                        <span id="currency" class="text-danger fs-4 me-2">THB</span>
                                        <input type="number" id="alltotal" class="form-control-plaintext text-end fs-4 text-dark" disabled value="0.00">
                                    </div>
                                </div>
                            </div>

                            <div class="row g-2">
                                <div class="col-12 col-md-6">
                                    <?php
                                    if ($po_order_id) {
                                        echo '
                                <button id="update-draft" class="btn btn-success w-100 py-2">
                                <i class="fa fa-save me-2"></i>Update Draft
                                </button>
                                ';
                                    } else {
                                        echo '
                                <button id="create-draft" class="btn btn-warning w-100 py-2">
                                <i class="fa fa-file-lines me-2"></i>Create Draft
                                </button>
                                ';
                                    }
                                    ?>
                                </div>
                                <div class="col-12 col-md-6">
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
    </div>
    <?php include('../../templates_/footer.php'); ?>
    <script type='module' src="../../scripts/po_management/pre_po_details.js"></script>
    <script src="https://unpkg.com/@pdf-lib/fontkit@0.0.4/dist/fontkit.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    </script>
</body>

</html>