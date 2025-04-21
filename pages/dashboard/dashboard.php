<!DOCTYPE html>
<html lang="th" data-bs-theme="light"> <?php /* เริ่มต้นด้วย light theme, JS จะเปลี่ยนตาม localStorage */ ?>
<?php
// *** PHP Section ***
// ควรจะมีการ include ไฟล์ตั้งค่า, session start, และการตรวจสอบสิทธิ์ที่นี่
// session_start();
// include('../../backend/lokin/check_session.php'); // ตัวอย่างการเช็ค session
// include('../../backend/lokin/check_permission.php'); // ตัวอย่างการเช็ค permission
// $user_permissions = $_SESSION['permissions'] ?? []; // ดึงค่า permissions จริงจาก session

// Include metadata (พวก CSS หลัก, JS Libraries พื้นฐาน)
include('../../templates_/metadata.php');
?>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Order Management</title>
    <?php /* ไฟล์ metadata.php ควรจะ include Bootstrap CSS, FontAwesome CSS แล้ว */ ?>
    <style>
        /* --- Custom Dashboard Styles --- */
        .kpi-card {
            border-left: 5px solid var(--bs-primary);
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .kpi-card .card-body {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            /* Adjust padding */
        }

        .kpi-card .kpi-icon {
            font-size: 2.8rem;
            /* Slightly larger icon */
            opacity: 0.5;
            /* Slightly less opaque */
        }

        .kpi-card .kpi-value {
            font-size: 1.9rem;
            /* Slightly larger value */
            font-weight: 600;
            /* Bolder */
            color: var(--bs-body-color);
            /* Use theme color */
        }

        .kpi-card .kpi-value .spinner-border-sm {
            /* Style spinner inside KPI */
            width: 1.5rem;
            height: 1.5rem;
            color: var(--bs-secondary);
            /* Use secondary color for spinner */
        }

        .kpi-card .card-footer {
            background-color: transparent;
            /* Cleaner footer */
            border-top: 1px solid var(--bs-border-color-translucent);
            padding: 0.75rem 1.25rem;
            font-size: 0.9em;
        }

        .kpi-card .card-footer a {
            text-decoration: none;
        }

        .kpi-card .card-footer a:hover {
            text-decoration: underline;
        }

        .chart-container {
            min-height: 420px;
            padding: 10px;
        }

        /* --- Styles for new Chart Controls --- */
        .chart-controls {
            padding: 0.75rem 1.25rem;
            border-bottom: 1px solid var(--bs-border-color-translucent);
            background-color: var(--bs-tertiary-bg);
            /* Slightly different bg for controls */
        }

        /* Adjust button spacing */
        .chart-controls .btn,
        .chart-controls .dropdown {
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
            /* Add bottom margin for wrapping */
        }

        #orderVolumeChart {
            max-height: 360px !important;
        }

        /* Dark mode adjustments for controls */
        [data-bs-theme="dark"] .chart-controls {
            background-color: var(--bs-tertiary-bg);
            border-bottom-color: var(--bs-border-color);
        }

        [data-bs-theme="dark"] #website-controls-container {
            background-color: var(--bs-secondary-bg);
            /* Darker background */
            border-color: var(--bs-border-color);
        }

        [data-bs-theme="dark"] #website-controls-container .form-check-label {
            color: var(--bs-body-color);
        }

        /* --- Dark Mode Styles --- */
        [data-bs-theme="dark"] {
            --bs-body-bg: #1a1d20;
            /* Darker background */
            --bs-body-color: #e9ecef;
            /* Lighter text */
            --bs-border-color: #495057;
            --bs-border-color-translucent: rgba(255, 255, 255, 0.15);
            --bs-secondary-bg: #2c3034;
            /* Slightly lighter dark for cards/tables */
            --bs-tertiary-bg: #3a3f44;

            /* Card styling */
            .card {
                background-color: var(--bs-secondary-bg);
                border-color: var(--bs-border-color);
            }

            .card-header {
                background-color: var(--bs-tertiary-bg);
                border-bottom-color: var(--bs-border-color);
                color: #f8f9fa;
                /* Brighter header text */
            }

            .kpi-card {
                /* Adjust border color for KPI cards */
                border-left-color: var(--bs-primary);
                /* Keep colored left border */
            }

            .kpi-card .text-muted {
                color: #adb5bd !important;
                /* Lighter muted text */
            }

            .kpi-card .kpi-icon {
                opacity: 0.6;
                /* Slightly more visible icon */
            }

            /* Table styling */
            .table {
                --bs-table-color: #e9ecef;
                --bs-table-bg: var(--bs-secondary-bg);
                --bs-table-border-color: var(--bs-border-color);
                --bs-table-striped-color: #e9ecef;
                --bs-table-striped-bg: rgba(255, 255, 255, 0.04);
                --bs-table-hover-color: #f8f9fa;
                --bs-table-hover-bg: rgba(255, 255, 255, 0.06);
            }

            .table thead th {
                color: #f8f9fa;
                background-color: var(--bs-tertiary-bg);
                /* Darker header */
                border-bottom-width: 1px;
                /* Ensure header border is visible */
            }

            .table>tbody>tr>td,
            .table>tbody>tr>th {
                border-color: var(--bs-border-color);
                /* Ensure cell borders match */
            }


            /* List group */
            .list-group-item {
                background-color: var(--bs-secondary-bg);
                border-color: var(--bs-border-color);
                color: var(--bs-body-color);
            }

            .list-group-item-action:hover,
            .list-group-item-action:focus {
                color: #f8f9fa;
                background-color: var(--bs-tertiary-bg);
            }

            /* Links */
            a {
                color: var(--bs-info);
            }

            a:hover {
                color: var(--bs-light);
            }

            .card-footer a {
                color: var(--bs-info) !important;
            }

            .card-footer a:hover {
                color: var(--bs-light) !important;
            }

            .table a {
                color: var(--bs-info);
            }

            /* Ensure table links are bright */
            .table a:hover {
                color: var(--bs-light);
            }

            /* Button */
            #theme-toggle-button {
                --bs-btn-color: #e9ecef;
                --bs-btn-border-color: #6c757d;
                --bs-btn-hover-color: #1a1d20;
                --bs-btn-hover-bg: #e9ecef;
                --bs-btn-hover-border-color: #e9ecef;
            }

            .text-muted {
                color: #adb5bd !important;
            }

            /* Chart.js tooltips might need dark background */
            .chartjs-tooltip {
                background: rgba(0, 0, 0, 0.7) !important;
                color: white !important;
            }
        }

        /* Style for the global spinner (ensure it's defined in metadata or header) */
        /* #loading-spinner {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1060; // High z-index
            width: 3rem;
            height: 3rem;
            display: none; // Initially hidden, JS controls it
        } */
    </style>
</head>

<body>
    <?php
    include('../../templates_/header.php');
    ?>

    <div class="container-fluid mt-4">

        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1 class="h3 mb-0 text-gray-800">Dashboard</h1>
            <!-- <button id="theme-toggle-button" class="btn btn-outline-secondary btn-sm">
                <i class="fas fa-moon"></i> Dark Mode <?php /* JS will update text/icon */ ?>
            </button> -->
        </div>


        <div class="row mb-4 g-3" id="kpi-row">
            <div class="col-xl-3 col-md-6 mb-4" data-permission="view_customer_orders">
                <div class="card kpi-card border-primary shadow-sm h-100">
                    <div class="card-body">
                        <div>
                            <div class="text-muted text-uppercase small mb-1">New Orders (Last 7d)</div> <?php /* Changed Label */ ?>
                            <span class="kpi-value" id="kpi-new-orders">
                                <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
                            </span>
                        </div>
                        <i class="fas fa-shopping-cart kpi-icon text-primary"></i>
                    </div>
                    <a href="../order_management/order_list.php?status=new" class="card-footer d-flex align-items-center justify-content-between">
                        <span>View Details</span>
                        <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4" data-permission="view_po_management">
                <div class="card kpi-card border-warning shadow-sm h-100">
                    <div class="card-body">
                        <div>
                            <div class="text-muted text-uppercase small mb-1">Pending PO Drafts</div>
                            <span class="kpi-value" id="kpi-pending-po">
                                <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
                            </span>
                        </div>
                        <i class="fas fa-file-invoice kpi-icon text-warning"></i>
                    </div>
                    <a href="../po_management/po_order_list.php" class="card-footer d-flex align-items-center justify-content-between">
                        <span>Manage Drafts</span>
                        <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4" data-permission="view_return_management">
                <div class="card kpi-card border-danger shadow-sm h-100">
                    <div class="card-body">
                        <div>
                            <div class="text-muted text-uppercase small mb-1">Pending Requests</div> <?php /* Changed Label */ ?>
                            <span class="kpi-value" id="kpi-pending-requests"> <?php /* Changed ID */ ?>
                                <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
                            </span>
                        </div>
                        <i class="fas fa-undo kpi-icon text-danger"></i>
                    </div>
                    <a href="../return_management/return.php?status=pending" class="card-footer d-flex align-items-center justify-content-between">
                        <span>Process Requests</span>
                        <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4" data-permission="view_stock_management">
                <div class="card kpi-card border-info shadow-sm h-100">
                    <div class="card-body">
                        <div>
                            <div class="text-muted text-uppercase small mb-1">Low Stock SKUs</div> <?php /* Changed Label */ ?>
                            <span class="kpi-value" id="kpi-low-stock">
                                <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
                            </span>
                        </div>
                        <i class="fas fa-boxes-stacked kpi-icon text-info"></i>
                    </div>
                    <a href="../stock_management/stock.php?level=low" class="card-footer d-flex align-items-center justify-content-between">
                        <span>View Stock</span>
                        <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>
        </div>
        <div class="row mb-4 g-3">
            <div class="col-md-12 col-lg-2" data-permission="view_order_reports">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-sliders-h me-2"></i>Website Filter</h6>
                    </div>
                    <div class="card-body" style="max-height: 360px;;overflow-y: auto;">
                        <div id="website-controls" class="form-small"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 col-lg-10" data-permission="view_order_reports">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-chart-line me-2"></i>Order Trends</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="orderVolumeChartContainer">
                            <canvas id="orderVolumeChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4 g-3">
            <div class="col-lg-6" data-permission="view_order_reports">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-chart-pie me-2"></i>Orders by Source (Last 7 Days)</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="orderSourceChartContainer">
                            <canvas id="orderSourceChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6" data-permission="view_order_reports">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-chart-pie me-2"></i>Orders by Source (Last 90 Days)</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="orderSourceChartContainer2">
                            <canvas id="orderSourceChart2"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mb-4 g-3">
            <div class="col-lg-7" data-permission="view_customer_orders">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-receipt me-2"></i>Recent Customer Orders</h6>
                        <a href="../order_management/order_list.php" class="btn btn-sm btn-outline-primary">View All <i class="fas fa-external-link-alt fa-sm"></i></a>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Timesort</th> <?php /* Changed from Order ID */ ?>
                                        <th>Customer</th>
                                        <th>Source</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody id="recent-orders-tbody">
                                    <tr>
                                        <td colspan="5" class="text-center p-5">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-5" data-permission="view_po_management || view_return_management">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-tasks me-2"></i>Pending Actions</h6>
                    </div>
                    <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                        <div id="pending-po-section" data-permission="view_po_management" class="mb-3">
                            <h6 class="card-subtitle mb-2 text-muted">Pending PO Drafts</h6>
                            <div class="table-responsive">
                                <table class="table table-hover table-sm mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>PO ID</th> <?php /* Changed from Ref# */ ?>
                                            <th>Factory</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="pending-po-tbody">
                                        <tr>
                                            <td colspan="3" class="text-center p-3">Loading...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="pending-requests-section" data-permission="view_return_management"> <?php /* Changed ID */ ?>
                            <h6 class="card-subtitle mb-2 text-muted">Pending Requests</h6> <?php /* Changed Label */ ?>
                            <div class="table-responsive">
                                <table class="table table-hover table-sm mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Request ID</th> <?php /* Changed from Return ID */ ?>
                                            <th>Order ID</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="pending-requests-tbody"> <?php /* Changed ID */ ?>
                                        <tr>
                                            <td colspan="3" class="text-center p-3">Loading...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="no-pending-actions" class="text-center text-muted mt-3" style="display: none;">
                            No pending actions require your attention.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- <div class="row mb-4 g-3">
            <div class="col-lg-6" data-permission="view_system_settings">
                <div class="card shadow-sm h-100">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary"><i class="fas fa-database me-2"></i>Data Sync Status</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush" id="sync-status-list">
                            <li class="list-group-item">Loading status...</li>
                        </ul>
                        <div class="mt-2 text-muted small text-end" id="last-sync-time">
                            Status checked: Loading...
                        </div>
                    </div>
                </div>
            </div>
        </div> -->
    </div><?php
            // Include Footer
            include("../../templates_/footer.php");
            ?>

    <script src="../../assets/js/chart.min.js"></script>
    <script type="module" src="../../scripts/dashboard/dashboard.js"></script>

</body>

</html>