<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body class="bg-light">
    <?php include('../../templates_/header.php'); ?>

    <div class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-10">
                <div class="card shadow-lg">
                    <div class="card-header bg-primary text-white text-center">
                        <h4>Order Dashboard</h4>
                    </div>
                    <div class="card-body">
                        <canvas id="order-dashboard"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include("../../templates_/footer.php"); ?>
    <script src="../../scripts/dashboard/dashboard.js"></script>
</body>
</html>
