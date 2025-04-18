<?php
include('../config.php');

$po_order_id = isset($_GET['po_order_id']) ? $_GET['po_order_id'] : null;

if (!$po_order_id) {
    echo json_encode(["error" => "Missing PO Order ID"]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT po_order_status_id FROM po_orders WHERE po_order_id = :po_order_id");
    $stmt->bindParam(':po_order_id', $po_order_id);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode($result);
    } else {
        echo json_encode(["error" => "PO Order Not Found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
