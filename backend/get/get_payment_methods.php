<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $payment_methods = json_decode(get_payment_methods($conn, $limit, $offset), true);
        $count = json_decode(get_payment_methods_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $payment_methods
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>