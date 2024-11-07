<!DOCTYPE html>
<html lang="en">
<?php include('../templates/metadata.php');?>
<body>
    <?php include('../templates/header.php');?>
    <div class="container">
        
        <div class="row">
            <div class="col mb-3 d-flex align-items-center justify-content-start ">
                <p id="dropdown-title" class="small p-0 m-0 mx-2">Showing</p>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle overflow-hidden" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        20
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
        <div class="col mb-3 d-flex justify-content-end">
            <div id="factory-pagination">
                <ul class="pagination m-0"></ul>
            </div>
        </div>
        <div id="factory-data-container" class="overflow-scroll"></div>
        <div class="col mb-3 d-flex justify-content-end">
            <div id="order-pagination">
                <ul class="pagination m-0"></ul>
            </div>
        </div>
        <div id="order-data-container" class="overflow-scroll"></div>
        <div class="mb-3 row">
            <div class="col-sm-12 col-md-7">
                <button id="makePO" class="btn btn-warning btn-sm" disabled>
					<span class="fa-solid fa-arrow-circle-down"></span> Make PO
				</button>
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
    <?php include("../templates/footer.php"); ?>
</body>
<script src="../assets/js/exceljs4.4.0.min.js"></script>
<script type="module" src="../scripts/pre_po.js"></script>
</html>