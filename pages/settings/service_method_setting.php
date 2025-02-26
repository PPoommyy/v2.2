<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php');?>
<body>
    <?php include('../../templates/header.php');?>
    <div class="container">
        <div class="row">
            <div class="col-md-3"></div>
            <div class="col-md-6">
                <p class="h1 mb-3">Service Methods 
                    <button id="add-button" class="btn btn-warning">
                        <i class="fa fa-plus"></i> Add New
                    </button>
                    <button id="save-button" class="btn btn-warning" disabled>
                        <i class="fa fa-floppy-disk"></i> Save
                    </button>
                </p>
                <div class="row">
                    <div class="col mb-3 d-flex justify-content-end">
                        <div id="pagination1">
                            <ul class="pagination m-0"></ul>
                        </div>
                    </div>
                </div>
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
                <div id="service-data-container" class="overflow-scroll"></div>
                    <div class="mb-3">
                        <div id="pagination2">
                            <ul class="pagination justify-content-end"></ul>
                        </div>
                    </div>
                </div>
            <div class="col-md-3"></div>
        </div>        
    </div>
    <?php include("../../templates/footer.php"); ?>
    <script type="module" src="../../scripts/settings/service_method_setting.js"></script>
</body>
</html>