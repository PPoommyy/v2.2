<?php 
    function get_po_orders($conn, $limit, $offset, $filter, $filterParams) {
        try {
            $query = "
            SELECT 
                po.order_id,
                po.order_date,
                po.factory_id,
                po.status_id,
                po.created_at,
                po.updated_at,
                f.name as factory_name,
                ps.name as order_status,
                po.total_amount
            FROM po_orders po
            JOIN factories f ON po.factory_id = f.id
            JOIN po_order_status ps ON po.status_id = ps.id
            $filter
            ORDER BY po.order_id DESC
            LIMIT :limit OFFSET :offset;
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    
            foreach ($filterParams as $paramName => &$paramValue) {
                $paramType = is_int($paramValue) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindParam($paramName, $paramValue, $paramType);
            }
    
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debugging: Log the SQL query and results
            file_put_contents('debug_log.txt', "SQL Query: $query\n", FILE_APPEND);
            file_put_contents('debug_log.txt', "Results: " . print_r($orders, true) . "\n", FILE_APPEND);
    
            foreach ($orders as &$order) {
                $order['items'] = get_order_items($conn, $order['order_id']);
            }
    
            return json_encode($orders);
        } catch (PDOException $e) {
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    function get_po_order_items($conn, $order_id) {
        try {
            $query = "
            SELECT 
                poi.order_item_id,
                poi.order_id,
                poi.sku_settings_id,
                poi.quantity,
                poi.unit_price,
                poi.total_price,
                ss.order_product_sku, 
                ss.report_product_name
            FROM po_order_items poi
            JOIN sku_settings ss ON poi.sku_settings_id = ss.id
            WHERE poi.order_id = :order_id;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':order_id', $order_id);
            $stmt->execute();
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $json = json_encode($items);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSON encoding error in get_order_items: " . json_last_error_msg());
            }

            return $json;
        } catch (PDOException $e) {
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            return json_encode(['error' => 'Error: ' . $e->getMessage()]);
        }
    }
?>
