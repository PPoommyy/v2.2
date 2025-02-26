<?php
    /* 
    
    SELECT 
        ss.id AS sku_settings_id,
        ss.order_product_sku AS product_order_product_sku,
        SUM(s.remaining_quantity) AS total_remaining
    FROM stock s
    JOIN sku_settings ss ON s.sku_settings_id = ss.id
    GROUP BY ss.id, ss.order_product_sku
    HAVING total_remaining > 0
    ORDER BY ss.order_product_sku;
 */
    function get_stock ($conn) {
        try {
            $query = "
            SELECT 
                ss.id AS sku_settings_id,
                ss.order_product_sku AS product_order_product_sku,
                SUM(s.remaining_quantity) AS total_remaining
            FROM stock s
            JOIN sku_settings ss ON s.sku_settings_id = ss.id
            GROUP BY ss.id, ss.order_product_sku
            HAVING total_remaining > 0
            ORDER BY ss.order_product_sku;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_stock_in ($conn) {
        try {
            $query = "
            SELECT 
                s.id AS stock_id,
                ss.id AS sku_settings_id,
                ss.order_product_sku AS product_order_product_sku,
                s.quantity AS received_quantity,
                s.remaining_quantity,
                s.received_date
            FROM stock s
            JOIN sku_settings ss ON s.sku_settings_id = ss.id
            ORDER BY s.received_date DESC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_stock_out ($conn) {
        try {
            $query = "
            SELECT 
                so.id AS stock_out_id,
                ss.id AS sku_settings_id,
                ss.order_product_sku AS product_order_product_sku,
                so.quantity AS issued_quantity,
                so.issued_date
            FROM stock_out so
            JOIN sku_settings ss ON so.sku_settings_id = ss.id
            ORDER BY so.issued_date DESC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function update_stock ($conn, ) {

    }
?>