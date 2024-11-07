<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $table = isset($_GET['table']) ? $_GET['table'] : 1;

    $key = isset($_GET['key']) ? $_GET['key'] : ["*"];
    $offset = ($page - 1) * $limit;
    
    try {
        $data = json_decode(select($conn, $table, $key, $key[0], $limit, $offset), true);
        $count = json_decode(select_count($conn, $table, $key[0]), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $data,
            'key' => $key
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>