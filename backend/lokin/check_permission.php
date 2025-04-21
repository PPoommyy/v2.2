<?php
include('../config.php');
include('../controllers/user_controller.php');

try {
    $user_id = $_SESSION['user_id'] ? $_SESSION['user_id'] : null;
    $menus = [];

    if ($user_id) {
        $permissions = json_decode(get_permissions_by_user_id($conn, $user_id), true);
        foreach ($permissions as $permission) {
            $menus[] = $permission['permission_name'];
        }
    }

    echo json_encode(["menus" => $menus]);
} catch (Exception $e) {
    echo $e->getMessage();
}
