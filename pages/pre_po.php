<!DOCTYPE html>
<html lang="en">
<?php include('../templates/metadata.php'); ?>
<body>
    <?php include('../templates/header.php'); ?>
    <div class="container">
        <!-- Dropdown for selecting factory -->
        <div class="row">
            <div class="col-12">
                <div class="dropdown">
                    <button class="btn btn-primary dropdown-toggle" type="button" id="select-factory" data-bs-toggle="dropdown" aria-expanded="false">
                        Select Factory
                    </button>
                    <ul class="dropdown-menu" id="dropdown-menu" aria-labelledby="select-factory"></ul>
                </div>
            </div>
        </div>

        <!-- Container to show product list -->
        <div class="row mt-3">
            <div class="col-12">
                <div id="order-skus"></div>
            </div>
        </div>
    </div>
    <?php include("../templates/footer.php"); ?>
</body>
<script src="../assets/js/exceljs4.4.0.min.js"></script>
<script type="module" src="../scripts/pre_po.js"></script>
</html>
