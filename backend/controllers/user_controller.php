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
            $stmt = $conn->prepare("SELECT p.name, p.page_url FROM permissions p 
                                    JOIN role_permissions rp ON p.id = rp.permission_id
                                    JOIN users u ON rp.role_id = u.role_id
                                    WHERE u.id = :user_id");
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