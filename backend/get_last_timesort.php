<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    $year_and_month = isset($_GET['year_and_month']) ? $_GET['year_and_month']:'';
    $table = isset($_GET['table']) ? $_GET['table'] : 'orders';
    try {
        $last_timesort = get_last_timesort($conn, $table, $year_and_month);

        $resoonse = array(
            'last_timesort' => $last_timesort
        );

        $jsonData = json_encode($resoonse);

        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>