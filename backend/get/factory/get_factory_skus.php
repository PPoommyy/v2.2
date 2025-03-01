<?php
    include('../../config.php');
    include('../../controllers/po_controller.php');
    include('../../controllers/data_controller.php');
    include('../../controllers/sku_controller.php');

    /*
     * get factory_id from URL the retrive all factory skus data from table factory_sku_settings join with sku_settings table
     * create column name "exist" to check if factory sku exist in factory_sku_settings table
     * Returns JSON object
     */
    try {
        $factory_id = isset($_GET['factory_id']) ? $_GET['factory_id'] : null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

        $res = json_decode(get_factory_skus($conn, $factory_id, $limit, $page), true);
        $factory_skus_count = json_decode(get_factory_skus_count($conn, $factory_id), true);
        $response = [
            'data' => $res,
            'totalCount' => $factory_skus_count[0]['count']
        ];
        echo json_encode($response);
    } catch (\Exception $e) {
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }

?>
