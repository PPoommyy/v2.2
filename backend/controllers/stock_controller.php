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
    function get_stock ($conn, $limit, $offset) {
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
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            if ($offset) {
                $query .= " OFFSET :offset";
            }
            $stmt = $conn->prepare($query); 
            if ($limit) {
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            }
            if ($offset) {
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            }
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_stock_in ($conn, $limit, $offset) {
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
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            if ($offset) {
                $query .= " OFFSET :offset";
            }
            $stmt = $conn->prepare($query); 
            if ($limit) {
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            }
            if ($offset) {
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            }
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_stock_out ($conn, $limit, $offset) {
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
            JOIN stock s ON so.stock_id = s.id
            ORDER BY so.issued_date DESC;
            ";
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            if ($offset) {
                $query .= " OFFSET :offset";
            }
            $stmt = $conn->prepare($query); 
            if ($limit) {
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            }
            if ($offset) {
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            }
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_stock_by_search($conn, $searchTerm) {
        try {
            $query = "
            SELECT 
                ss.order_product_sku, 
                ss.id, 
                ss.report_product_name, 
                SUM(s.remaining_quantity) AS total_remaining
            FROM sku_settings ss
            JOIN stock s ON ss.id = s.sku_settings_id 
            WHERE 
                ss.order_product_sku LIKE :searchTerm_start
                OR ss.order_product_sku LIKE :searchTerm_contain
            GROUP BY ss.id, ss.order_product_sku, ss.report_product_name
            HAVING total_remaining > 0
            ORDER BY 
                CASE 
                    WHEN ss.order_product_sku LIKE :searchTerm_start THEN 0
                    ELSE 1
                END,
                ss.order_product_sku ASC
            LIMIT 8;
            ";
    
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':searchTerm_start', $searchTerm . '%', PDO::PARAM_STR);
            $stmt->bindValue(':searchTerm_contain', '%' . $searchTerm . '%', PDO::PARAM_STR);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode($result);
        } catch (PDOException $e) {
            return json_encode(["error" => $e->getMessage()]);
        }
    }
    
    function update_stock($conn, $to_update) {
        try {
            $conn->beginTransaction();
            $results = [];
    
            foreach ($to_update as $item) {
                $sku_settings_id = $item['sku_settings_id'];
                $quantity_to_issue = $item['quantity_to_issue'];
                $total_issued = 0;
    
                // ดึงจำนวนสินค้าในคลังทั้งหมด
                $checkStock = "SELECT SUM(remaining_quantity) AS total_stock FROM stock WHERE sku_settings_id = ?";
                $stmt = $conn->prepare($checkStock);
                $stmt->execute([$sku_settings_id]);
                $stockInfo = $stmt->fetch(PDO::FETCH_ASSOC);
                $total_stock = $stockInfo['total_stock'] ?? 0;
    
                if ($total_stock === 0) {
                    $results[] = [
                        'sku_settings_id' => $sku_settings_id,
                        'quantity_requested' => $quantity_to_issue,
                        'quantity_issued' => 0,
                        'status' => 'not_found'
                    ];
                    continue;
                } elseif ($total_stock < $quantity_to_issue) {
                    $results[] = [
                        'sku_settings_id' => $sku_settings_id,
                        'quantity_requested' => $quantity_to_issue,
                        'quantity_issued' => $total_stock,
                        'status' => 'not_enough'
                    ];
                    $quantity_to_issue = $total_stock;
                }
    
                while ($quantity_to_issue > 0) {
                    $sql = "SELECT id, remaining_quantity FROM stock 
                            WHERE sku_settings_id = ? AND remaining_quantity > 0 
                            ORDER BY received_date ASC 
                            LIMIT 1";
    
                    $stmt = $conn->prepare($sql);
                    $stmt->execute([$sku_settings_id]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
                    if (!$row) {
                        break;
                    }
    
                    $stock_id = $row['id'];
                    $remaining = $row['remaining_quantity'];
    
                    if ($remaining >= $quantity_to_issue) {
                        $updateStock = "UPDATE stock SET remaining_quantity = remaining_quantity - ? WHERE id = ?";
                        $stmt = $conn->prepare($updateStock);
                        $stmt->execute([$quantity_to_issue, $stock_id]);
    
                        $insertOut = "INSERT INTO stock_out (stock_id, sku_settings_id, quantity, issued_date) 
                                      VALUES (?, ?, ?, NOW())";
                        $stmt = $conn->prepare($insertOut);
                        $stmt->execute([$stock_id, $sku_settings_id, $quantity_to_issue]);
    
                        $total_issued += $quantity_to_issue;
                        $quantity_to_issue = 0;
                    } else {
                        $updateStock = "UPDATE stock SET remaining_quantity = 0 WHERE id = ?";
                        $stmt = $conn->prepare($updateStock);
                        $stmt->execute([$stock_id]);
    
                        $insertOut = "INSERT INTO stock_out (stock_id, sku_settings_id, quantity, issued_date) 
                                      VALUES (?, ?, ?, NOW())";
                        $stmt = $conn->prepare($insertOut);
                        $stmt->execute([$stock_id, $sku_settings_id, $remaining]);
    
                        $total_issued += $remaining;
                        $quantity_to_issue -= $remaining;
                    }
                }
    
                if ($total_issued > 0) {
                    $results[] = [
                        'sku_settings_id' => $sku_settings_id,
                        'quantity_requested' => $item['quantity_to_issue'],
                        'quantity_issued' => $total_issued,
                        'status' => 'success'
                    ];
                }
            }
    
            $conn->commit();
            return $results;
        } catch (Exception $e) {
            $conn->rollBack();
            return ['error' => $e->getMessage()];
        }
    }
?>