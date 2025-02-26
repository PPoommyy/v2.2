<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php'); ?>
<body class="bg-light">

    <?php include('../../templates/header.php'); ?>

    <div class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-10">
                <div class="card shadow-lg">
                    <div class="card-header bg-primary text-white text-center">
                        <h4>PO Dashboard</h4>
                    </div>
                    <div class="card-body text-center">
                        <!-- ✅ Toggle Switch -->
                        <div class="form-check form-switch d-flex justify-content-center mb-3">
                            <input class="form-check-input" type="checkbox" id="toggleChart">
                            <label class="form-check-label ms-2" for="toggleChart">Show Chart</label>
                        </div>

                        <!-- ✅ Checkbox Controls -->
                        <div id="website-controls" class="mb-3"></div>

                        <canvas id="order-dashboard"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include("../../templates/footer.php"); ?>

    <!-- Dashboard Script -->
    <script type="module" src="../../scripts/dashboard/dashboard_po.js"></script>

</body>
</html>
