<?php 
    function get_po_orders($conn, $limit, $offset, $filter, $filterParams) {
        try {
            $query = "
            SELECT 
                po.po_orders_id,
                po.timesort,
                po.po_orders_date,
                po.factory_id,
                po.po_orders_status_id,
                po.total_amount,
                po.notes,
                f.name as factory_name,
                pos.name as order_status
            FROM po_orders po
            JOIN factories f ON po.factory_id = f.id
            JOIN po_orders_status pos ON po.po_orders_status_id = pos.id
            $filter
            ORDER BY po.po_orders_id DESC
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
            $po_orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debugging: Log the SQL query and results
            file_put_contents('debug_log.txt', "SQL Query: $query\n", FILE_APPEND);
            file_put_contents('debug_log.txt', "Results: " . print_r($po_orders, true) . "\n", FILE_APPEND);
            return json_encode($po_orders);
        } catch (PDOException $e) {
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    function get_po_orders_items($conn, $po_orders_id) {
        try {
            $query = "
            SELECT 
                poi.po_orders_items_id,
                poi.po_orders_id,
                poi.order_id,
                poi.sku_settings_id,
                poi.quantity,
                poi.unit_price,
                poi.po_orders_items_status_id,
                ss.order_product_sku, 
                ss.report_product_name
            FROM po_orders_items poi
            JOIN sku_settings ss ON poi.sku_settings_id = ss.id
            WHERE poi.po_orders_id = :po_orders_id;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':po_orders_id', $po_orders_id);
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

    function get_po_orders_details($conn, $po_orders_id) {
        try {
            $query = "
            SELECT
                po.order_id,
                po.order_date,
                po.factory_id,
                po.status_id,
                f.name as factory_name,
                ps.name as order_status,
                po.total_amount
            FROM po_orders po
            JOIN factories f ON po.factory_id = f.id
            JOIN po_orders_status ps ON po.status_id = ps.id
            WHERE po.po_orders_id = :po_orders_id;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':po_orders_id', $po_orders_id);
            $stmt->execute();
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            $order['items'] = json_decode(get_po_orders_items($conn, $po_orders_id), true);

            return json_encode($order);
        } catch (PDOException $e) {
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
?>
