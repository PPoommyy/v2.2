<?php
include('../config.php');
include('../controllers/data_controller.php');
?>
<?php

try {
    $currencies = json_decode(get_currency_list($conn), true);
    $paymentMethods = json_decode(get_payment_methods($conn), true);
    $websites_list = json_decode(get_website_by_group($conn, 2), true);

    $response = [
        'data' => $websites_list,
        'currencies' => $currencies,
        'paymentMethods' => $paymentMethods,
    ];

    $jsonData = json_encode($response);
    echo $jsonData;
} catch (Exception $e) {
    echo $e->getMessage();
}
?>