<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php');?>
<body>
    <?php include('../../templates/header.php');?>
    <div class="container mt-4">
        <div class="col-sm-12 col-md-6 col-lg-6 card mb-3 p-3 justify-content-start">
            <p class="h1 mb-4">Request Management</p>
            <div class="row mb-4">
                <label class="col-sm-12 col-md-3 col-lg-3">Order Date Range</label>
                <div class="col-sm-12 col-md-8 col-lg-8">
                    <div class="row">
                        <div class="col-5">
                            <div class="input-group" id='dateStart'>
                                <input id="order-date-input-start" class="form-control" value="<?php echo date('Y-m-d\TH:i'); ?>" type="datetime-local">
                                <label class="input-group-text bg-secondary text-white" for="order-date-input-start"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                        <div class="col-2 d-flex justify-content-center"><p class="h3"> - </p></div>
                        <div class="col-5">
                            <div class="input-group" id='dateEnd'>
                                <input id="order-date-input-end" class="form-control" value="<?php echo date('Y-m-d\TH:i'); ?>" type="datetime-local">
                                <label class="input-group-text bg-secondary text-white" for="order-date-input-end"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="order-daterange-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <label class="col-sm-12 col-md-3 col-lg-3">Request Date Range</label>
                <div class="col-sm-12 col-md-8 col-lg-8">
                    <div class="row">
                        <div class="col-5">
                            <div class="input-group" id='dateStart'>
                                <input id="request-date-input-start" class="form-control" value="<?php echo date('Y-m-d\TH:i'); ?>" type="datetime-local">
                                <label class="input-group-text bg-secondary text-white" for="request-date-input-start"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                        <div class="col-2 d-flex justify-content-center"><p class="h3"> - </p></div>
                        <div class="col-5">
                            <div class="input-group" id='dateEnd'>
                                <input id="request-date-input-end" class="form-control" value="<?php echo date('Y-m-d\TH:i'); ?>" type="datetime-local">
                                <label class="input-group-text bg-secondary text-white" for="request-date-input-end"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="request-daterange-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Request Status</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-request-status" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="request-status-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="request-status-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Request Type</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-request-type" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="request-type-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="request-type-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="d-md-flex justify-content-md-end">
                <button id="filter-button" class="btn btn-primary" type="button">Filter</button>
            </div>
        </div>
        <div id="request-container" class="overflow-scroll"></div>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editModalLabel">Edit</h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text" id="editId" class="form-control" hidden>
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
    </div>
    <?php include("../../templates/footer.php"); ?>
    <script type="module" src="../../scripts/return_management/return.js"></script>
</body>
</html>