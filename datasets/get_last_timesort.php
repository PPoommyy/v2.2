<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    $year_and_month = isset($_GET['year_and_month']) ? $_GET['year_and_month']:'';
    try {
        $last_timesort = get_last_timesort($conn, $year_and_month);

        $resoonse = array(
            'last_timesort' => $last_timesort
        );

        $jsonData = json_encode($resoonse);

        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>