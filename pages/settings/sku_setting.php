<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <p class="h1 m-0">SKU Settings</p>
            <div>
                <button id="add-button" class="btn btn-warning">
                    <i class="fa fa-plus"></i> Add New
                </button>
                <button id="save-button" class="btn btn-warning" disabled>
                    <i class="fa fa-floppy-disk"></i> Save
                </button>
                <button id="export-csv" class="btn btn-success">
                    <i class="fa fa-file-csv"></i> Export as CSV
                </button>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Filters</h5>
                <div class="row g-3">
                    <div class="col-md-3">
                        <label for="skuSearchInput" class="form-label">Search SKU / Product Name</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="skuSearchInput" placeholder="Enter SKU or Name">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="warehouseFilterSelect" class="form-label">Warehouse</label>
                        <select class="form-select" id="warehouseFilterSelect">
                            <option value="">All Warehouses</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                    </div>
                    <div class="col-md-3"> <!-- Increased width for Warehouse SKU -->
                        <label for="warehouseSkuFilterSelect" class="form-label">Warehouse SKU</label>
                        <select class="form-select" id="warehouseSkuFilterSelect">
                            <option value="">All Warehouse SKUs</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="brandFilterSelect" class="form-label">Brand</label>
                        <select class="form-select" id="brandFilterSelect">
                            <option value="">All Brands</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="applySkuFiltersButton"><i class="fas fa-filter me-1"></i>Apply</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- End Filters Section -->

        <!-- Pagination, Loading Spinner, Modal, Table Container (same as before) -->
        <div class="row">
            <div class="col mb-3 d-flex align-items-center justify-content-start ">
                <p id="dropdown-title" class="small p-0 m-0 mx-2">Showing</p>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        100
                    </button>
                    <ul id="dropdownMenu" class="dropdown-menu" aria-labelledby="limitDropdown">
                        <li><a class="dropdown-item" data-limit="20">20</a></li>
                        <li><a class="dropdown-item" data-limit="50">50</a></li>
                        <li><a class="dropdown-item" data-limit="100">100</a></li>
                        <li><a class="dropdown-item" data-limit="150">150</a></li>
                        <li><a class="dropdown-item" data-limit="200">200</a></li>
                    </ul>
                </div>
                <p class="small p-0 m-0 mx-2">records per page</p>
            </div>
            <div class="col mb-3 d-flex justify-content-end">
                <div id="pagination1">
                    <ul class="pagination m-0"></ul>
                </div>
            </div>
        </div>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status" style="display: none; width: 3rem; height: 3rem; z-index: 1056;">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editModalLabel">Edit SKU</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="number" id="editId" class="form-control" hidden>
                        <input type="text" id="editKey" class="form-control" hidden>
                        <div id="editValueContainer">
                            <!-- Input or Select will be dynamically placed here by Cell.js -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="updateButton">Update</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="sku-data-container" class="table-responsive"></div>
        <div class="mb-3">
            <div id="pagination2">
                <ul class="pagination justify-content-end"></ul>
            </div>
        </div>
    </div>
    <?php include("../../templates_/footer.php"); ?>
    <script type="module" src="../../scripts/settings/sku_setting.js"></script>
</body>
</html>