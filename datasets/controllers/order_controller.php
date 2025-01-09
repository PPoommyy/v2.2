<?php
  function get_orders($conn, $limit, $offset, $filter, $filterParams) {
    try {
        $query = "
        SELECT 
          o.order_id,
          payments_date,
          buyer_name,
          ship_phone_number,
          ship_promotion_discount,
          o.shipping_fee,
          deposit,
          ship_address_1,
          ship_address_2,
          ship_address_3,
          ship_city,
          ship_state,
          ship_postal_code,
          ship_country,
          o.timesort,
          raw_address,
          override_address,
          order_note,
          fulfillment_status,
          w.name as website_name,
          w.id as website_id,
          c.name as currency_code,
          c.id as currency_id,
          pm.name as payment_methods,
          pm.id as payment_method_id,
          ost.name as order_status,
          ost.id as order_status_id
        FROM orders o
        JOIN orders_skus os ON o.order_id = os.order_id
        JOIN currencies c ON o.currency_id = c.id
        JOIN websites w ON o.website_id = w.id
        JOIN payment_methods pm ON o.payment_method_id = pm.id
        JOIN order_status ost ON o.order_status_id = ost.id
        $filter
        GROUP BY o.order_id
        ORDER BY timesort DESC
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

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
  }

  function get_order_by_id($conn, $order_id) {
    try {
        $query = "
        SELECT 
          o.order_id, 
          o.shipping_fee, 
          o.ship_promotion_discount, 
          raw_address,
          override_address,
          order_note,
          payments_date,
          quantity_purchased, 
          total,
          w.name as website_name,
          w.id as website_id,
          c.name as currency_code,
          c.id as currency_id,
          pm.name as payment_methods,
          pm.id as payment_method_id,
          ost.name as order_status,
          ost.id as order_status_id
        FROM orders o
        JOIN orders_skus os ON o.order_id = os.order_id
        JOIN currencies c ON o.currency_id = c.id
        JOIN websites w ON o.website_id = w.id
        JOIN payment_methods pm ON o.payment_method_id = pm.id
        JOIN order_status ost ON o.order_status_id = ost.id
        where o.order_id = :order_id
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':order_id',$order_id);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
  }

  function get_order_total ($conn, $order_id) {
    try {
      $query = "
      SELECT sum(round(total,2)) as total
      FROM orders_skus
      WHERE order_id = '$order_id';
      ";
      $stmt = $conn->prepare($query); 
      $stmt->execute();
    
      $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
      $jsonData = json_encode($result);
      return $jsonData;
    } catch(PDOException $e) {
      return null;
    }
  }

  function get_order_items ($conn, $order_id) {
    try {
      $query = "
      SELECT 
        unique_id,
        order_item_id,
        sku_settings_id,
        item_price, 
        order_product_sku, 
        report_product_name,
        item_price,
        quantity_purchased,
        shipping_price,
        total,
        ws.name AS sku,
        sb.name AS brand
      FROM orders_skus os 
      JOIN sku_settings ss ON os.sku_settings_id = ss.id
      JOIN warehouse_skus ws ON ss.warehouse_sku_id = ws.id
      JOIN sku_brands sb ON ss.sku_brand_id = sb.id
      WHERE os.order_id = :order_id;
      ";
      $stmt = $conn->prepare($query);
      $stmt->bindParam(':order_id', $order_id);
      $stmt->execute();
    
      $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
      $jsonData = json_encode($result);
      return $jsonData;
    } catch(PDOException $e) {
      return null;
    }
  }

  function get_order_files ($conn, $order_id) {
    try {
      $query = "
      SELECT 
        id,
        order_id,
        file_name,
        file_pathname
      FROM order_files
      WHERE order_id = :order_id;
      ";
      $stmt = $conn->prepare($query);
      $stmt->bindParam(':order_id', $order_id);
      $stmt->execute();
    
      $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
      $jsonData = json_encode($result);
      return $jsonData;
    } catch(PDOException $e) {
      return null;
    }
  }

  function get_order_tracking ($conn, $order_id) {
    try {
      $query = "
      SELECT 
        id,
        order_id,
        tracking_id,
        tracking_number
      FROM tracking
      WHERE order_id = :order_id;
      ";
      $stmt = $conn->prepare($query);
      $stmt->bindParam(':order_id', $order_id);
      $stmt->execute();
    
      $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
      $jsonData = json_encode($result);
      return $jsonData;
    } catch(PDOException $e) {
      return null;
    }
  }

  function insert_order($conn, $order) {
    try {
        $orderColumns = implode(', ', array_keys($order));
        $orderPlaceholders = ':' . implode(', :', array_keys($order));
        $query = "
        INSERT INTO orders ($orderColumns) 
        VALUES ($orderPlaceholders)";
        $stmt = $conn->prepare($query);

        foreach ($order as $column => $columnValue) {
            if (is_int($columnValue)) {
                $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_STR);
            }
        }
        $stmt->execute();
        return true;
    } catch(PDOException $e) {
        return $e->getMessage();
    }
  }

  function insert_order_skus($conn, $item) {
    try {
      $itemColumns = implode(', ', array_keys($item));
      $itemValues = "'" . implode("', '", $item) . "'";
      $query = "
      INSERT INTO orders_skus ($itemColumns)
      VALUES ($itemValues)
      ";

      $stmt = $conn->prepare($query);
      $stmt->execute();
      return true;
    } catch(PDOException $e) {
      return $e->getMessage();
    };
  }

  function update_order($conn, $table, $key, $value, $order) {
    try {
        $updateColumns = array_map(function ($column) {
            return $column . ' = :' . $column;
        }, array_keys($order));

        $updateClause = implode(', ', $updateColumns);

        $query = "
            UPDATE $table
            SET $updateClause
            WHERE $key = :value
        ";

        $stmt = $conn->prepare($query);

        foreach ($order as $column => $columnValue) {
            if (is_int($columnValue)) {
                $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_STR);
            }
        }

        $stmt->bindValue(':value', $value);
        $stmt->execute();
        return true;
    } catch (PDOException $e) {
        return $e->getMessage();
    }
  }
  
  
  
  
  function get_order_details_by_id($conn, $order_id) {
    try {
        $query = "
        SELECT 
          o.order_id,
          o.date_created,
          o.date_updated,
          o.buyer_name,
          o.buyer_phone_number,
          o.recipient_name,
          o.shipping_fee, 
          o.ship_promotion_discount,
          o.ship_phone_number,
          o.deposit,
          o.ship_address_1,
          o.ship_address_2,
          o.ship_address_3,
          o.ship_city,
          o.ship_state,
          o.ship_postal_code,
          o.ship_country,
          o.raw_address,
          o.override_address,
          o.order_note,
          o.payments_date,
          w.name as website_name,
          w.id as website_id,
          c.name as currency_code,
          c.id as currency_id,
          pm.name as payment_methods,
          pm.id as payment_method_id,
          ost.name as order_status,
          ost.id as order_status_id,
          ot.name as order_type,
          ot.id as order_type_id
        FROM orders o
        JOIN currencies c ON o.currency_id = c.id
        JOIN websites w ON o.website_id = w.id
        JOIN payment_methods pm ON o.payment_method_id = pm.id
        JOIN order_status ost ON o.order_status_id = ost.id
        JOIN order_types ot ON o.order_type_id = ot.id
        where o.order_id = :order_id
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':order_id',$order_id);
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