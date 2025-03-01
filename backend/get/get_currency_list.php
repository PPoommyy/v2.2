<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $currencies = json_decode(get_currency_list($conn, $limit, $offset), true);
        $count = json_decode(get_currency_list_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $currencies
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>