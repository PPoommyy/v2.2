<?php include('../../config.php');?>
<?php
    $filterConditions = [];
    $filterParams = [];

    function getFilterValue($filterName) {
        return isset($_GET[$filterName]) ? htmlspecialchars($_GET[$filterName]) : null;
    }

    $website = getFilterValue('website');
    if ($website) {
        $filterConditions[] = "w.name = :website";
        $filterParams[':website'] = $website;
    }

    $orderStatus = getFilterValue('order_status_id');
    if ($orderStatus) {
        $filterConditions[] = "order_status_id = :order_status_id";
        $filterParams[':order_status_id'] = $orderStatus;
    }

    $fulfillmentStatus = getFilterValue('fulfillment_status');
    if ($fulfillmentStatus) {
        $filterConditions[] = "fulfillment_status = :fulfillment_status";
        $filterParams[':fulfillment_status'] = $fulfillmentStatus;
    }

    $paymentMethod = getFilterValue('payment_method');
    if ($paymentMethod) {
        $filterConditions[] = "pm.name = :payment_method";
        $filterParams[':payment_method'] = $paymentMethod;
    }

    $date_start = getFilterValue('date_start');
    $date_end = getFilterValue('date_end');
    if ($date_start && $date_end) {
        $filterConditions[] = "o.payments_date BETWEEN :date_start AND :date_end";
        $filterParams[':date_start'] = date_format(date_create($date_start), 'Y-m-d H:i:s');
        $filterParams[':date_end'] = date_format(date_create($date_end), 'Y-m-d H:i:s');
    }
    
    $filter = empty($filterConditions) ? '' : 'WHERE ' . implode(' AND ', $filterConditions);
    
    try {
        $query = "
        SELECT COUNT(*) as count 
        FROM orders o
        JOIN websites w ON o.website_id = w.id
        JOIN payment_methods pm ON o.payment_method_id = pm.id
        $filter
        ";
        $stmt = $conn->prepare($query);
        foreach ($filterParams as $paramName => &$paramValue) {
            $paramType = is_int($paramValue) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindParam($paramName, $paramValue, $paramType);
        }

        $stmt->execute();
        $result = $stmt->fetchAll();
        $jsonData = json_encode($result);
        echo $jsonData;
    } catch (\Exception $e) {
        echo $e->getMessage();
    }
?>