<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <style>
        /* Add some basic styling for better visual appearance */
        .card-header h5 {
            font-size: 1.1rem;
        }

        .table th,
        .table td {
            vertical-align: middle;
        }

        .action-buttons .btn {
            margin-left: 0.5rem;
        }

        @media (max-width: 767.98px) {
            .action-buttons {
                margin-top: 0.5rem;
                width: 100%;
                display: flex;
                flex-direction: column;
            }

            .action-buttons .btn {
                margin-left: 0;
                margin-bottom: 0.5rem;
                width: 100%;
            }

            .page-title-container {
                flex-direction: column;
                align-items: flex-start !important;
            }

            .page-title-container h1 {
                margin-bottom: 0.5rem !important;
            }
        }
    </style>

    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom page-title-container">
            <h1 class="h2 m-0">Website Settings</h1>
            <div class="action-buttons">
                <button id="run-google-script" class="btn btn-info">
                    <i class="fab fa-google me-2"></i>Run Order Sync
                </button>
                <button id="add-button" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Add New Website
                </button>
                <button id="save-button" class="btn btn-success" disabled>
                    <i class="fas fa-save me-2"></i>Save New Websites
                </button>
            </div>
        </div>

        <div id="loading-spinner-global" class="spinner-border text-primary position-fixed top-50 start-50 translate-middle d-none" style="z-index: 1070; width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>

        <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editModalLabel">Edit Website Property</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editId">
                        <input type="hidden" id="editKey">
                        <div id="editValueContainer">
                            {/* Input or Select will be placed here by Cell.js */}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="updateButton">
                            <i class="fas fa-check me-1"></i>Update
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="databaseModal" tabindex="-1" aria-labelledby="databaseModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg"> {/* Made modal larger */}
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="databaseModalLabel">Database Configuration</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="databaseWebsiteId">
                        <input type="hidden" id="databaseConfigId"> {/* To store ID of website_database record if editing */}
                        <div class="row g-3">
                            <div class="col-md-6 mb-3">
                                <label for="db_host" class="form-label">Database Host <span class="text-danger">*</span></label>
                                <input type="text" id="db_host" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="db_name" class="form-label">Database Name <span class="text-danger">*</span></label>
                                <input type="text" id="db_name" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="db_user" class="form-label">Database User <span class="text-danger">*</span></label>
                                <input type="text" id="db_user" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="db_password" class="form-label">Database Password <span class="text-danger">*</span></label>
                                <input type="password" id="db_password" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="retreive_period" class="form-label">Retrieve Period (days) <span class="text-danger">*</span></label>
                                <input type="number" id="retreive_period" class="form-control form-control-sm" min="1" value="30" required>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" id="databaseSaveButton">
                            <i class="fas fa-save me-1"></i>Save Config
                        </button>
                        <button type="button" class="btn btn-danger d-none" id="databaseRemoveButton">
                            <i class="fas fa-trash-alt me-1"></i>Remove Config
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm">
            <div class="card-header bg-light py-2">
                <h5 class="mb-0 fs-6">Configured Websites</h5>
            </div>
            <div class="card-body p-0">
                <div id="website-list" class="table-responsive">
                    {/* Website list table will be generated here */}
                </div>
            </div>
            <div class="card-footer bg-light text-muted small py-2">
                Manage website connections and their database settings for order synchronization.
            </div>
        </div>
    </div>
    <?php include('../../templates_/footer.php'); ?>
    <script type="module" src="../../scripts/settings/website_setting.js"></script>
</body>

</html>