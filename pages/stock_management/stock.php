<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <div class="container mt-4">
        <h2>Stock Management</h2>

        <!-- Filters Section (same as before) -->
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Filters</h5>
                <div class="row g-3">
                    <div class="col-md-5">
                        <label for="dateStartInput" class="form-label">Date Range (for IN/OUT)</label>
                        <div class="input-group">
                            <input type="date" class="form-control" id="dateStartInput" aria-label="Start Date">
                            <span class="input-group-text">to</span>
                            <input type="date" class="form-control" id="dateEndInput" aria-label="End Date">
                        </div>
                    </div>
                    <div class="col-md-5">
                        <label for="skuSearchInput" class="form-label">Search SKU</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="skuSearchInput" placeholder="Enter SKU or Product Name">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                        </div>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="applyFiltersButton"><i class="fas fa-filter me-1"></i>Apply</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stock Menu and Permission Buttons (same as before) -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="btn-group" role="group" aria-label="Stock Menu">
                <input type="radio" class="btn-check" name="stockViewRadio" id="total-stock" value="total" autocomplete="off" checked>
                <label class="btn btn-outline-primary" for="total-stock">TOTAL</label>

                <input type="radio" class="btn-check" name="stockViewRadio" id="stock-in" value="stock_in" autocomplete="off">
                <label class="btn btn-outline-success" for="stock-in">IN</label>

                <input type="radio" class="btn-check" name="stockViewRadio" id="stock-out" value="stock_out" autocomplete="off">
                <label class="btn btn-outline-danger" for="stock-out">OUT</label>
            </div>
            <div id="permission-buttons-container"></div>
        </div>
        <div id="stock-container" class="table-responsive"></div>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status" style="display: none; width: 3rem; height: 3rem; z-index: 1056;">
            <span class="visually-hidden">Loading...</span>
        </div>

        <!-- Modal for setting Stock Levels -->
        <div class="modal fade" id="setStockLevelsModal" tabindex="-1" aria-labelledby="setStockLevelsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="setStockLevelsModalLabel">Set Stock Levels</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="stockLevelSkuIdInput">
                        <p>SKU: <strong id="stockLevelSkuNameLabel"></strong></p>
                        <div class="mb-3">
                            <label for="minQuantityInput" class="form-label">Min Quantity (Low Stock Alert):</label>
                            <input type="number" class="form-control" id="minQuantityInput" min="0">
                        </div>
                        <div class="mb-3">
                            <label for="maxQuantityInput" class="form-label">Max Quantity (for PO):</label>
                            <input type="number" class="form-control" id="maxQuantityInput" min="0">
                        </div>
                        <!-- ADDED: Enable Low Stock Alert Checkbox -->
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="" id="enableLowStockAlertCheckbox">
                            <label class="form-check-label" for="enableLowStockAlertCheckbox">
                                Enable Low Stock Alert for this SKU
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="saveStockLevelsButton">Save Levels</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include("../../templates_/footer.php"); ?>
    <script type="module" src="../../scripts/stock_management/stock.js"></script>
</body>
</html>