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
                        <h4>Order Dashboard</h4>
                    </div>
                    <div class="card-body">
                        <!-- ✅ จัดวาง Dropdown, Toggle, ปุ่มในแถวเดียวกัน -->
                        <div class="row d-flex align-items-center justify-content-center mb-3">
                            <div class="col-auto">
                                <button id="latestMonthBtn" class="btn btn-secondary">1 เดือน</button>
                                <button id="latest3MonthsBtn" class="btn btn-secondary">3 เดือน</button>
                                <button id="latest6MonthsBtn" class="btn btn-secondary">6 เดือน</button>
                                <button id="latestYearBtn" class="btn btn-secondary">1 ปี</button>
                            </div>
                            <div class="col-auto">
                                <div class="dropdown">
                                    <button class="btn btn-secondary dropdown-toggle" type="button" id="yearDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                        เลือกปี
                                    </button>
                                    <ul class="dropdown-menu" id="yearDropdownMenu"></ul>
                                </div>
                            </div>
                            <div class="col-auto">
                                <div class="form-check form-switch d-flex align-items-center">
                                    <input class="form-check-input" type="checkbox" id="toggleChart">
                                    <label class="form-check-label ms-2" for="toggleChart">Show Chart</label>
                                </div>
                            </div>
                        </div>

                        <!-- Date Range Picker -->
                        <div class="row mb-3">
                            <label class="col-sm-12 col-md-3 col-lg-3">Date Range</label>
                            <div class="col-sm-12 col-md-8 col-lg-8">
                                <div class="row">
                                    <div class="col-5">
                                        <div class="input-group" id='dateStart'>
                                            <input id="order-date-input-start" class="form-control" type="date">
                                            <label class="input-group-text bg-secondary text-white" for="order-date-input-start">
                                                <span class="fa fa-calendar"></span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-2 d-flex justify-content-center">
                                        <p class="h3"> - </p>
                                    </div>
                                    <div class="col-5">
                                        <div class="input-group" id='dateEnd'>
                                            <input id="order-date-input-end" class="form-control" type="date">
                                            <label class="input-group-text bg-secondary text-white" for="order-date-input-end">
                                                <span class="fa fa-calendar"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button id="filterDateRangeBtn" class="btn btn-primary">Filter</button>
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
    <script type="module" src="../../scripts/dashboard/dashboard_orders.js"></script>

</body>
</html>
