<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>
<?php
$factory_id = isset($_GET['factory_id']) ? $_GET['factory_id'] : null;
?>

<body>
    <?php include('../../templates_/header.php'); ?>
    <input id="factoryId" type="hidden" value="<?php echo $factory_id ?>">
    <div class="container">
        <p class="mb-4">
            <strong class="h1">
                <?= $factory_id ? 'Factory Details' : 'Add New Factory'; ?>
            </strong>
            <?= $factory_id ? '<small class="text-secondary">(' . $factory_id . ')</small>' : '' ?>
        </p>
        <div class="row">
            <div class="col-6">
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Name</div>
                    <div class="col-9">
                        <input id="factory-name" class="form-control" type="text">
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Location</div>
                    <div class="col-9">
                        <input id="factory-location" class="form-control" type="text">
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Contact Person</div>
                    <div class="col-9">
                        <input id="factory-contact-person" class="form-control" type="text">
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Contact Number</div>
                    <div class="col-9">
                        <input id="factory-contact-number" class="form-control" type="text">
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-3 text-end">Factory Email Address</div>
                    <div class="col-9">
                        <input id="factory-email-address" class="form-control" type="text">
                    </div>
                </div>
            </div>

            <div class="col-6">
                <div class="row mb-3">
                    <div class="col-6"></div>
                    <div class="container">
                        <button id="download-template" class="btn btn-warning"><i class="fa fa-file-arrow-down"></i> Download Template</button>
                        <button id="import-csv" class="btn btn-warning"><i class="fa fa-file-csv"></i> import csv</button>
                        <?php
                        if ($factory_id) {
                            echo '<button id="save-factory" class="btn btn-success"><i class="fa fa-save"></i> Save</button>';
                        } else {
                            echo '<button id="create-factory" class="btn btn-warning"><i class="fa fa-save"></i> Create</button>';
                        }
                        ?>
                    </div>
                </div>
                <div class="col-sm-12 col-md-5" id="pagination1">
                    <ul class="pagination justify-content-start"></ul>
                </div>
                <div id="factory-skus" class="container"></div>
            </div>
            <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <?php include('../../templates_/footer.php'); ?>
    <script type='module' src="../../scripts/po_management/factory_details.js"></script>
</body>

</html>