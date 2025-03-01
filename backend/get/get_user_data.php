<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    try {
        $users = json_decode(get_user_data($conn), true);
        $jsonData = json_encode($users);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>