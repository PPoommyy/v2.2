<!DOCTYPE html>
<html lang="en">
<?php include('../templates/metadata.php'); ?>
<?php 
    $po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;
?>
<body>
    <?php include('../templates/header.php');?>
    <input id="orderId" type="hidden" value="<?php echo $po_order_id ?>">
    <div class="container">
        <p class="mb-4">
            <strong class="h1">
                <?= $po_order_id ? 'PO Order Details' : 'Add New PO Order'; ?>
            </strong>
                <?= $po_order_id ? '<small class="text-secondary">(' . $po_order_id . ')</small>' : ''?>
        </p>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50 d-none" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="row">
            <div class="col-sm-12 col-md-12 col-lg-5 container">
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Name</div>
                    <div class="col-9">
                        <input type="text" id="factory-name" class="form-control" placeholder="Factory Name" aria-label="Factory Name" disabled>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Number</div>
                    <div class="col-9">
                        <input type="text" id="factory-number" class="form-control" placeholder="Factory Number" aria-label="Factory Number" disabled>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Email</div>
                    <div class="col-9">
                        <input type="text" id="factory-email" class="form-control" placeholder="Factory Email" aria-label="Factory Email" disabled>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Order Note</div>
                    <div class="col-9">  
                        <textarea id="order-note-input" class="form-control" rows="6" aria-label="With textarea" placeholder="Enter order note."></textarea>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">File Upload</div>
                    <div class="col-9">
                        <ul class="list-group" id="file-list"></ul>
                        <div class="input-group">
                            <input type="file" class="form-control" id="file-input">
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-12 col-md-12 col-lg-7 row">
                <div class="container" id="select-product-container">
                <p>Add product: <div class="container" id="timesort-container">
                <button id="add-product" class="btn btn-warning"><i class="fa fa-plus"></i> Add</button></p>

                <!-- <p>Select Products: <button id="add-product" class="btn btn-warning"><i class="fa fa-plus"></i> Add Product</button></p> -->
                </div>
                <div class="col-sm-12 col-md-12 col-lg-12" id="item-data-container"></div>
                <div class="col-sm-12 col-md-6 col-lg-6">
                    <div class="row mb-3">
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <label class="me-3">Deposit?</label>
                            <input type="checkbox" id="hasDeposit" data-toggle="tooltip" data-placement="top" title="Include This"/>
                        </div>
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <input type="number" id="deposit" class="form-control" disabled>
                        </div>
                    </div>
                </div>
                <div class="col-sm-12 col-md-6 col-lg-6">
                    <div class="row mb-3">
                        <label class="col-sm-12 col-md-6 col-lg-6" >Subtotal</label>
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <input type="number" id="subtotal" class="form-control" disabled>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <label class="col-sm-12 col-md-6 col-lg-6">Discount</label>
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <input type="number" id="discount" class="form-control">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <label class="col-sm-12 col-md-6 col-lg-6">Shipping Fee</label>
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <input type="number" id="shippingFee" class="form-control">
                        </div>
                    </div>
                    <div class="form-group text-end mb-3">
                        <div>
                            <span id="currency" class="h1 text-danger"></span>
                            <span class="h1"><u id="alltotal">0.00</u></span>
                            <br>
                            <span class="small">All Total</span>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-6"></div>
                        <?php
                            if ($po_order_id) {
                                echo '<button id="save-order" class="btn btn-warning"><i class="fa fa-save"></i> Save</button>';
                            } else {
                                echo '<button id="insert-order" class="btn btn-warning"><i class="fa fa-save"></i> Insert</button>';
                            }
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <p class="h2">Recently Added/Updated Orders</p>
    </div>
    <?php include('../templates/footer.php');?>
    <script type='module' src="../scripts/pre_po_details.js"></script>
</body>
</html>