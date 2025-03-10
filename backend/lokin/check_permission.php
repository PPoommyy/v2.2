<?php
include('../config.php');
session_start();

$user_id = $_SESSION['user_id'] ?? null;
$menus = [];

if ($user_id) {
    $sql = "SELECT p.permission_name FROM permissions p 
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $menus[] = $row['permission_name'];
    }
}

echo json_encode(["menus" => $menus]);
?>
