<?php
    include('config.php');
    include('./controllers/order_controller.php');
    include('./controllers/data_controller.php');
?>
<?php
    $data = json_decode(file_get_contents('php://input'), true);

    $order = $data['order'];
    $items = $data['items'];
    $year_and_month = $data['yearAndMonth'];
    try {
        $res1 = insert_order($conn, $order);
        if ($res1) {
            foreach ($items as $item) {
                $res2 = insert_order_skus($conn, $item);
                if (!$res2){
                    break;
                }
            }
        } else {
            $res2 = false;
        }
        $response = [
            'order' => $order,
            'items' => $items,
            'last_timesort' => $last_timesort,
            'res1' => $res1,
            'res2' => $res2
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>