<?php
    include('../../config.php');
    include('../../controllers/stock_controller.php');
?>

<?php
    $limit = isset($_GET['limit']) ? $_GET['limit'] : false;
    $offset = isset($_GET['offset']) ? $_GET['offset'] : false;
    $table = isset($_GET['table']) ? $_GET['table'] : 'total';
    if($table == 'total') {
        $stock = json_decode(get_stock($conn, $limit, $offset), true);
        $response = [
            'stock' => $stock
        ];
    } else if($table == 'stock_in') {
        $stock_in = json_decode(get_stock_in($conn, $limit, $offset), true);
        $response = [
            'stock_in' => $stock_in
        ];
    } else if($table == 'stock_out') {
        $stock_out = json_decode(get_stock_out($conn, $limit, $offset), true);
        $response = [
            'stock_out' => $stock_out
        ];
    } else {
        $response = [
            'message' => 'Invalid table name'
        ];
    }
    $jsonData = json_encode($response);
    echo $jsonData;
?>