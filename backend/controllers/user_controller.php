<?php
    function get_user_by_email ($conn, $email) {
        try {
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($results);
            return $jsonData;
        } catch (Exception $e) {
            return false;
        }
    }

    function get_permissions_by_user_id ($conn, $user_id) {
        try {
            $stmt = $conn->prepare("SELECT p.permission_name FROM permissions p 
                                    JOIN role_permissions rp ON p.id = rp.permission_id
                                    JOIN user_roles ur ON rp.role_id = ur.role_id
                                    WHERE ur.user_id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($results);
            return $jsonData;
        } catch (Exception $e) {
            return false;
        }
    }
?>