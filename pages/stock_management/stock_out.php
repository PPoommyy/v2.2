<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php');?>
<body>
    <?php include('../../templates/header.php');?>
    <div class="container">
        <div class="row">
            <div class="col-sm-12 col-md-12 col-lg-5 container">
                <div class="row mb-4">
                    <div class="col-3 text-end">Warehouse Name</div>
                    <div class="col-9 btn-group">
                        <button class="btn btn-secondary dropdown-toggle  overflow-hidden" type="button" id="selected-website" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="select-warehouse">
                            Select Warehouse
                        </button>
                        <ul id="website-dropdown" class="dropdown-menu" aria-labelledby="dropdown">
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-sm-12 col-md-12 col-lg-7 row">
                <div class="row mb-5">
                    <div class="container" id="select-product-container">
                        <p>Add product: 
                            <button id="add-product" class="btn btn-warning"><i class="fa fa-plus"></i> Add</button>
                            <button id="download-template" class="btn btn-warning"><i class="fa fa-file-arrow-down"></i> Download Template</button>
                            <button id="import-csv" class="btn btn-warning"><i class="fa fa-file-csv"></i> import csv</button>
                        </p>
                    </div>
                </div>
                <div class="col-sm-12 col-md-12 col-lg-12" id="item-data-container"></div>
                <div class="row mb-3">
                    <div class="col-6"></div>
                    <button id="update-stock" class="btn btn-warning"><i class="fa fa-save"></i> Update</button>
                </div>
            </div>
        </div>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    <?php include("../../templates/footer.php"); ?>
    <script src="../../assets/js/exceljs4.4.0.min.js"></script>
    <script type="module" src="../../scripts/stock_management/stock_out.js"></script>
</body>
</html>