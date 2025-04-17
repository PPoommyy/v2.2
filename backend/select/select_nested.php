<?php
include('../config.php');
include('../controllers/data_controller.php');

$table_1 = $_GET['table1'];
$order_by_1 = $_GET['order_by1'] ?? null;
$order_by_type_1 = $_GET['order_by_type1'] ?? "ASC";
$limit_1 = $_GET['limit1'] ?? null;
$page_1 = $_GET['page1'] ?? null;

$requestData = json_decode(file_get_contents('php://input'), true);
$column_1 = $requestData['column1'];
$join_1 = $requestData['join1'] ?? [[]];
$where_1 = $requestData['where1'] ?? [[]];
$logical_operator_1 = $requestData['logical_operator1'] ?? "AND";
$group_by_1 = $requestData['group_by_1'] ?? null;
$nested_key = $requestData['nestedKey'] ?? null;
$nested_tables = $requestData['nestedTables'] ?? []; // รับ nested tables เป็น array

try {
    $responseData = select($conn, $table_1, $column_1, $order_by_1, $order_by_type_1, $limit_1, $page_1, $join_1, $where_1, $logical_operator_1, $group_by_1);
    $data_1 = json_decode($responseData, true);

    $response = array_map(function ($data) use ($conn, $nested_key, $nested_tables) {
        if (!is_string($nested_key) || !isset($data[$nested_key])) {
            return [
                'error' => "Invalid nested_key or missing key in data",
                'nested_key' => $nested_key,
                'data' => $data
            ];
        }

        $nested_results = [];
        foreach ($nested_tables as $nested) {
            $table = $nested['table'];
            $columns = $nested['columns'];
            $order_by = $nested['order_by'] ?? null;
            $order_by_type = $nested['order_by_type'] ?? "ASC";
            $limit = $nested['limit'] ?? null;
            $page = $nested['page'] ?? null;
            $joins = $nested['joins'] ?? [[]];
            $where = $nested['where'] ?? [[]];
            $logical_operator = $nested['logical_operator'] ?? "AND";
            $response_key = $nested['response_key'] ?? $table;

            $where_nested_key = [$nested_key, "=", $data[$nested_key]];
            $new_where = array_merge($where, [$where_nested_key]);

            $nested_data = json_decode(select($conn, $table, $columns, $order_by, $order_by_type, $limit, $page, $joins, $new_where, $logical_operator), true);
            $nested_results[$response_key] = $nested_data['result'];
        }

        return [
            'data' => $data,
            'nested' => $nested_results,
        ];
    }, $data_1['result']);

    echo json_encode(['status' => $response, 'query' => $data_1['query']]);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
