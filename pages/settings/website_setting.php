<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <div class="container">
        <p class="h1 mb-3">Website Settings
            <button id="add-button" class="btn btn-warning">
                <i class="fa fa-plus"></i> Add New
            </button>
            <button id="save-button" class="btn btn-warning" disabled>
                <i class="fa fa-floppy-disk"></i> Save
            </button>
        </p>
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
        <div class="modal fade" id="databaseModal" tabindex="-1" role="dialog" aria-labelledby="databaseModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="databaseModalLabel">Database Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="databaseWebsiteId">
                        <div class="mb-3">
                            <label for="db_host" class="form-label">Database Host</label>
                            <input type="text" id="db_host" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label for="db_name" class="form-label">Database Name</label>
                            <input type="text" id="db_name" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label for="db_user" class="form-label">Database User</label>
                            <input type="text" id="db_user" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label for="db_password" class="form-label">Database Password</label>
                            <input type="password" id="db_password" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label for="retreive_period" class="form-label">Retrieve Period (days)</label>
                            <input type="number" id="retreive_period" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" id="databaseSaveButton">
                            <i class="fa fa-floppy-disk"></i> Save</button>
                        <button type="button" class="btn btn-danger d-none" id="databaseRemoveButton">
                            <i class="fa fa-trash"></i> Remove
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="website-list" class="container"></div>
    </div>
    <?php include("../../templates_/footer.php"); ?>
    <script type="module" src="../../scripts/settings/website_setting.js"></script>
</body>

</html>