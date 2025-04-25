<?php
include('../config.php');
include('../controllers/data_controller.php');

$po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;
try {
    if (empty($po_order_id)) {
        throw new Exception("PO Order ID is missing");
    }
    if (!isset($action)) {
        throw new Exception("Confirmation status is missing");
    }
    $new_status_id = 1;
    if ($action == 'reject') {
        $new_status_id = 4;
    } else if ($action == 'confirm') {
        $new_status_id = 2;
    } else if ($action == 'cancel') {
        $new_status_id = 1;
    } else if ($action == 'shipped') {
        $new_status_id = 6;
    } else {
        throw new Exception("Invalid action");
    }

    $is_updated = update_by_key($conn, "po_orders", "po_order_id", $po_order_id, "po_order_status_id", $new_status_id);

    if ($is_updated) {
        echo "<script>alert('Update success');</script>";
    } else {
        echo "<script>alert('Error: PO Order not found');</script>";
    }
} catch (Exception $e) {
    echo "<script>alert('Error: " . $e->getMessage() . "');</script>";
}
