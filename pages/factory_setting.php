<!DOCTYPE html>
<html lang="en">
<?php include('../templates/metadata.php');?>
<body>
    <?php include('../templates/header.php');?>
    <div class="container">
        <button class="btn btn-secondary dropdown-toggle overflow-hidden visually-hidden" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            100
        </button>
        <p class="h1 mb-3">Factory Settings
            <button id="add-button" class="btn btn-warning">
                <i class="fa fa-plus"></i> Add New
            </button>
            <button id="save-button" class="btn btn-warning" disabled>
                <i class="fa fa-floppy-disk"></i> Save
            </button>
        </p>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editModalLabel">Edit SKU</h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="number" id="editId" class="form-control" hidden>
                    <input type="text" id="editKey" class="form-control" hidden>
                    <input type="text" id="editValue" class="form-control" hidden>
                    <div id="editValueContainer"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="updateButton">Update</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>
        <div id="factory-sku-container" class="container"></div>
    </div>
    <?php include("../templates/footer.php"); ?>
    <script type="module" src="../scripts/factory_setting.js"></script>
</body>
</html>