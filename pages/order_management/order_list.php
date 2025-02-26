<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php');?>
<body>
    <?php include('../../templates/header.php');?>
    <input type="hidden" id="filePathInput" value="../reports/download_orders_2.xlsx">
    <div class="container">
        <div class="mb-3"></div>
        <div class="col-sm-12 col-md-6 col-lg-6 card mb-3 p-3 justify-content-start">
            <p class="h1 mb-3">List of Order</p>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Sale Channel</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-website" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="website-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="website-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <label class="col-sm-12 col-md-3 col-lg-3">Date Range</label>
                <div class="col-sm-12 col-md-8 col-lg-8">
                    <div class="row">
                        <div class="col-5">
                            <div class="input-group" id='dateStart'>
                                <input id="order-date-input-start" class="form-control" value="<?php echo date('Y-m-d'); ?>" type="date">
                                <label class="input-group-text bg-secondary text-white" for="order-date-input-start"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                        <div class="col-2 d-flex justify-content-center"><p class="h3"> - </p></div>
                        <div class="col-5">
                            <div class="input-group" id='dateEnd'>
                                <input id="order-date-input-end" class="form-control" value="<?php echo date('Y-m-d'); ?>" type="date">
                                <label class="input-group-text bg-secondary text-white" for="order-date-input-end"><span class="fa fa-calendar"></span></label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="daterange-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Order Status</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-order-status" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="order-status-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="order-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Fulfillment Status</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-fulfillment-status" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="fulfillment-status-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="fulfillment-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-sm-12 col-md-3 col-lg-3">Payment Method</div>
                <div class="col-sm-12 col-md-8 col-lg-8 btn-group">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="selected-payment" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">All</button>
                    <ul id="payment-dropdown" class="dropdown-menu" aria-labelledby="defaultDropdown">
                    </ul>
                </div>
                <div class="col-1">
                    <div>
                        <input type="checkbox" id="payment-filter" name="filter_include" data-toggle="tooltip" data-placement="top" title="Include This"/>
                    </div>
                </div>
            </div>
            <div class="d-md-flex justify-content-md-end">
                <button id="filter-button" class="btn btn-primary" type="button">Filter</button>
            </div>
        </div>
        <div class="row">
            <div class="col mb-3 d-flex align-items-center justify-content-start ">
                <p id="dropdown-title" class="small p-0 m-0 mx-2">Showing</p>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        200
                    </button>
                    <ul id="dropdownMenu" class="dropdown-menu" aria-labelledby="limitDropdown">
                        <li><a class="dropdown-item" data-limit="100">100</a></li>
                        <li><a class="dropdown-item" data-limit="200">200</a></li>
                        <li><a class="dropdown-item" data-limit="400">400</a></li>
                        <li><a class="dropdown-item" data-limit="600">600</a></li>
                        <li><a class="dropdown-item" data-limit="800">800</a></li>
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
        <div class="modal fade" id="trackingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="trackingModalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="trackingModalBody"></div>
                    <div class="modal-footer">
                        <button id="createTrackingBtn" class="btn btn-primary d-none">Create Tracking</button>
                        <button id="deleteTrackingBtn" class="btn btn-danger">Delete Tracking</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="order-data-container" class="overflow-scroll"></div>
        <div class="mb-3 row">
            <div class="col-sm-12 col-md-7">
                <button id="downloadOrders" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Download Orders
				</button>
                <!-- <button id="newDownloadOrders" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> New! Download Orders
				</button> -->
				<button id="createInvoices" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Create Invoice
				</button>
				<button id="itemSummaries" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Item Summary
				</button>
				<!-- <button id="dhlPreAlerts" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> DHL Pre-alert
				</button>
				<button id="dpost" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> DPOST
				</button> -->
				<button id="thpost" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> THPOST
				</button>
                <!-- <button id="aftershipCSV" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Aftership CSV
				</button> -->
				<button id="downloadBarcodes" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Download Barcodes
				</button>
				<button id="deleteOrders" class="btn btn-danger btn-sm" disabled>
					<span class="fa-solid fa-trash"></span> Delete
                </button>
            </div>
            <div class="col-sm-12 col-md-5" id="pagination2">
                <ul class="pagination justify-content-end"></ul>
            </div>
        </div>
        <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editModalLabel">Download Orders</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body row">
                        <div id="ordersList" class="col-4 overflow-scroll" style="max-height: 400px;"></div>
                        <div id="toDownload" class="col-8 overflow-scroll" style="max-height: 400px;"></div>
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
</body>
<script src="../../assets/js/exceljs4.4.0.min.js"></script>
<script type="module" src="../../scripts/order_management/order_list.js"></script>
</html>