<?php
include('../config.php');
include('../controllers/data_controller.php');
?>
<?php
$table = $_GET['table'];
$condition_key = isset($_GET['condition_key']) ? $_GET['condition_key'] : 'id';
$condition_value = $_GET['condition_value'];
$requestData = json_decode(file_get_contents('php://input'), true);
$key = $requestData['key'];
$value = $requestData['value'];
if ($key === "password_hash") {
    $value = password_hash($value, PASSWORD_BCRYPT);
}
try {
    $res = update_by_key($conn, $table, $condition_key, $condition_value, $key, $value);
    $response = [
        'request' => $requestData,
        'conditon_key' => $condition_key,
        'condition_value' => $condition_value,
        'value' => $value,
        'status' => $res
    ];

    $jsonData = json_encode($response);
    echo $jsonData;
} catch (Exception $e) {
    echo $e->getMessage();
}
?>