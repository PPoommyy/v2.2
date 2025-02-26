<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php'); ?>
<?php 
    $factory_id = isset($_GET['factory_id']) ? $_GET['factory_id'] : null;
?>
<body>
    <?php include('../../templates/header.php');?>
    <input id="factoryId" type="hidden" value="<?php echo $factory_id ?>">
    <div class="container">
        <p class="mb-4">
            <strong class="h1">
                <?= $factory_id ? 'Factory Details' : 'Add New Factory'; ?>
            </strong>
                <?= $factory_id ? '<small class="text-secondary">(' . $factory_id . ')</small>' : ''?>
        </p>
        <!-- 
        /* 
    show 2 section
    1. on left side show factory details
    2. on right side show factory skus table have pagination from Pagination.js and each row have check box to add factory sku to factory_sku_settings table (checkbox enabled if exist)
    have save button on above to create or delete factory_sku_settings from checkbox
*/
         -->
        <div class="row">
            <!--  
            example detail
                        {
                            "id": 1,
                            "name": "Shanghai Electronics",
                            "location": "Shanghai, China",
                            "contact_person": "Li Wei",
                            "contact_number": "+86-21-12345678",
                            "email_address": "liwei@shanghai-electronics.com"
                        }

            example format
            <div class="row mb-4">
                    <div class="col-3 text-end">Website Name</div>
                    <div class="col-9 btn-group">
                        <button class="btn btn-secondary dropdown-toggle  overflow-hidden" type="button" id="selected-website" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" for="select-website">
                            Select Website
                        </button>
                        <ul id="website-dropdown" class="dropdown-menu" aria-labelledby="dropdown">
                        </ul>
                    </div>
                </div> 
                
                -->
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
                    <?php
                        if ($factory_id) {
                            echo '<button id="save-factory" class="btn btn-warning"><i class="fa fa-save"></i> Save</button>';
                        } else {
                            echo '<button id="create-factory" class="btn btn-warning"><i class="fa fa-save"></i> Create</button>';
                        }
                    ?>
                </div>
                <div class="col-sm-12 col-md-5" id="pagination1">
                    <ul class="pagination justify-content-start"></ul>
                </div>
                <div id="factory-skus" class="container"></div>
            </div>
        </div>
    </div>
    <?php include('../../templates/footer.php');?>
    <script type='module' src="../../scripts/po_management/factory_details.js"></script>
</body>
</html>