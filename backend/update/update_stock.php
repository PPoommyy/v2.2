<?php
include('../config.php');
include('../controllers/stock_controller.php');

$requestData = json_decode(file_get_contents('php://input'), true);
$to_update = $requestData['to_update'];

try {
    $res = update_stock($conn, $to_update);
    echo json_encode(['status' => 'completed', 'results' => $res]);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
