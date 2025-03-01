<?php
    include('../../config.php');
    include('../../controllers/stock_controller.php');
?>

<?php
    $stock = json_decode(get_stock($conn), true);
    $stock_in = json_decode(get_stock_in($conn), true);
    $stock_out = json_decode(get_stock_out($conn), true);
    $response = [
        'stock' => $stock,
        'stock_in' => $stock_in,
        'stock_out' => $stock_out
    ];

    $jsonData = json_encode($response);
    echo $jsonData;
?>