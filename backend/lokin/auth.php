<?php
include('../config.php');
include('../controllers/user_controller.php');

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'];
    $password = $data['password'];
    $user = json_decode(get_user_by_email($conn, $email), true);
    if ($user) {
        if (password_verify($password, $user[0]['password_hash'])) {
            $permissions = json_decode(get_permissions_by_user_id($conn, $user[0]['id']), true);
            $user[0]['permissions'] = $permissions;
            $response = [
                'message' => 'Login successful',
                'user' => $user,
                // 'permissions' => $permissions
            ];
        } else {
            $response = [
                'message' => 'Invalid password'
            ];
        }
    } else {
        $response = [
            'message' => 'User not found'
        ];
    }
    $jsonData = json_encode($response);
    echo $jsonData;
} catch (Exception $e) {
    echo $e->getMessage();
}
