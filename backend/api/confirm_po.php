<?php
include('../config.php');
include('../controllers/data_controller.php');

$po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;
$is_confirmed = isset($_GET['is_confirmed']) ? $_GET['is_confirmed'] : null;

try {
    if (empty($po_order_id)) {
        throw new Exception("PO Order ID is missing");
    }
    if (!isset($is_confirmed)) {  // เปลี่ยนจาก empty เป็น isset จะดีกว่า
        throw new Exception("Confirmation status is missing");
    }

    $is_updated = update_by_key($conn, "po_orders", "po_order_id", $po_order_id, "po_order_status_id", $is_confirmed ? 2 : 4);

    if ($is_updated) {
        echo "<script>alert('Update success');</script>";
    } else {
        echo "<script>alert('Error: PO Order not found');</script>";
    }
} catch (Exception $e) {
    echo "<script>alert('Error: " . $e->getMessage() . "');</script>";
}
