<?php
    function get_skus($conn, $limit, $offset) {
        try {
            $query = "
            SELECT 
                ss.id, 
                ss.order_product_sku, 
                ss.report_product_name,
                ws.id as wsid,
                sb.id as sbid,
                w.name as warehouse_name,
                ws.name as warehouse_sku_name,
                sb.name as sku_brand_name
            FROM sku_settings ss
            JOIN warehouses w ON ss.warehouse_id = w.id
            JOIN warehouse_skus ws ON ss.warehouse_sku_id = ws.id
            JOIN sku_brands sb ON ss.sku_brand_id = sb.id
            ORDER BY ss.order_product_sku ASC
            LIMIT :limit OFFSET :offset;
            ";
    
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    
            $stmt->execute();
    
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_sku_count($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count 
            FROM sku_settings ss
            JOIN warehouses w ON ss.warehouse_id = w.id
            JOIN warehouse_skus ws ON ss.warehouse_sku_id = ws.id
            JOIN sku_brands sb ON ss.sku_brand_id = sb.id;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_sku_brands($conn) {
        try {
            $query = "
            SELECT sb.id, sb.name
            FROM sku_brands sb
            ORDER BY sb.name ASC;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_sku_brands_count($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count 
            FROM sku_brands sb;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }
    
    function get_warehouse_skus($conn) {
        try {
            $query = "
            SELECT ws.id, ws.name
            FROM warehouse_skus ws
            ORDER BY ws.name ASC;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_warehouse_skus_count($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count 
            FROM warehouse_skus ws;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_product_sets($conn) {
        try {
            $query = "
            SELECT 
                ps.order_product_sku, 
                ps.report_product_name,
                psi.product_set_id
            FROM 
                product_set_items psi
            JOIN 
                sku_settings ps ON psi.product_set_id = ps.id
            GROUP BY
                psi.product_set_id;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_product_set_items($conn, $key, $value) {
        try {
            $query = "
            SELECT
                item.order_product_sku, 
                item.report_product_name, 
                psi.id,
                psi.product_set_item_id,
                psi.product_set_item_id AS order_item_id,
                psi.product_set_item_id AS sku_settings_id,
                psi.quantity,
                ws.name AS sku,
                sb.name AS brand
            FROM 
                product_set_items psi
            JOIN 
                sku_settings item ON psi.product_set_item_id = item.id
            JOIN 
                warehouse_skus ws ON item.warehouse_sku_id = ws.id
            JOIN 
                sku_brands sb ON item.sku_brand_id = sb.id
            WHERE
                $key = :value;
            ";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':value', $value, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_product_sets_count($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count 
            FROM 
                product_set_items psi
            JOIN 
                sku_settings ps ON psi.product_set_id = ps.id
            JOIN 
                sku_settings p ON psi.product_set_item_id = p.id
            GROUP BY psi.product_set_id;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_factory_skus($conn, $factory_id, $limit, $offset) {
        try {
            $query = "
            SELECT 
                ss.id AS sku_settings_id, 
                ss.order_product_sku, 
                ss.report_product_name,
                fss.factory_id,
                fss.factory_sku_settings_id AS factory_sku_settings_id,
                fss.created_at,
                fss.updated_at,
                CASE 
                    WHEN fss.factory_sku_settings_id IS NOT NULL THEN 1 
                    ELSE 0 
                END AS exist
            FROM
                sku_settings ss
            LEFT JOIN
                factory_sku_settings fss 
                ON ss.id = fss.sku_settings_id AND fss.factory_id = :factory_id
            ORDER BY ss.order_product_sku ASC, ss.id ASC
            LIMIT :limit OFFSET :offset;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_factory_skus_count($conn, $factory_id) {
        try {
            $query = "
            SELECT 
                COUNT(*) as count,
                ss.id as sku_settings_id, 
                ss.order_product_sku, 
                ss.report_product_name
            FROM
                sku_settings ss
            LEFT JOIN
                factory_sku_settings fss 
                ON ss.id = fss.sku_settings_id AND fss.factory_id = :factory_id
            ORDER BY ss.order_product_sku ASC;
            ";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }

    function get_factory_order_skus($conn, $factory_id, $limit, $offset) {
        try {
            /* 
            retrive skus data in order_skus table that are in factory_sku_settings table by factory_id
             */
            $query = "
            SELECT 
                os.id AS order_sku_id, 
                os.order_product_sku, 
                os.report_product_name,
                fss.factory_id,
                fss.factory_sku_settings_id AS factory_sku_settings_id,
                fss.created_at,
                fss.updated_at,
                CASE 
                    WHEN fss.factory_sku_settings_id IS NOT NULL THEN 1 
                    ELSE 0 
                END AS exist
            FROM
                order_skus os
            LEFT JOIN
                factory_sku_settings fss 
                ON os.id = fss.order_sku_id AND fss.factory_id = :factory_id
            ORDER BY os.order_product_sku ASC, os.id ASC
            LIMIT :limit OFFSET :offset;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }
?>