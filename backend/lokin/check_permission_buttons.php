<?php
$data = json_decode(file_get_contents("php://input"), true);
$permissions = isset($data['permissions']) ? $data['permissions'] : [];
$page = isset($data['page']) ? $data['page'] : 'order_list';

function hasPermission($permissions, $name)
{
    foreach ($permissions as $perm) {
        if ($perm['name'] === $name) return true;
    }
    return false;
}

$buttons = "";
$buttonClass = "btn btn-sm me-2 mb-2";

if ($page === 'order_list') {
    if (hasPermission($permissions, 'download_orders')) {
        $buttons .= '<button id="downloadOrders" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> Download Orders
                    </button>';
    }
    if (hasPermission($permissions, 'create_invoice')) {
        $buttons .= '<button id="createInvoices" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> Create Invoice
                    </button>';
    }
    if (hasPermission($permissions, 'item_summary')) {
        $buttons .= '<button id="itemSummaries" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> Item Summary
                    </button>';
    }
    if (hasPermission($permissions, 'th_post')) {
        $buttons .= '<button id="thpost" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> THPOST
                    </button>';
    }
    if (hasPermission($permissions, 'download_barcode')) {
        $buttons .= '<button id="downloadBarcodes" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> Download Barcodes
                    </button>';
    }
    if (hasPermission($permissions, 'delete_orders')) {
        $buttons .= '<button id="deleteOrders" class="' . $buttonClass . ' btn-danger" disabled>
                        <span class="fa-solid fa-trash"></span> Delete
                    </button>';
    }
} elseif ($page === 'stock') {
    if (hasPermission($permissions, 'stock_import')) {
        $buttons .= '<a href="stock_in.php" class="' . $buttonClass . ' btn-outline-success">
                        <i class="fa-solid fa-square-plus"></i> Import
                    </a>';
    }
    if (hasPermission($permissions, 'stock_export')) {
        $buttons .= '<a href="stock_out.php" class="' . $buttonClass . ' btn-outline-danger">
                        <i class="fa-solid fa-square-minus"></i> Export
                    </a>';
    }
} elseif ($page === 'po_order_list') {
    if (hasPermission($permissions, 'download_po_orders')) {
        $buttons .= '<button id="downloadOrders" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-arrow-circle-down"></span> Download Orders
                    </button>';
    }
    if (hasPermission($permissions, 'delete_po_orders')) {
        $buttons .= '<button id="deleteOrders" class="' . $buttonClass . ' btn-danger" disabled>
                        <span class="fa-solid fa-trash"></span> Delete
                    </button>';
    }
} elseif ($page === 'return') {
    if (hasPermission($permissions, 'accept_request_item')) {
        $buttons .= '<button id="itemAccepted" class="' . $buttonClass . ' btn-success" disabled>
                        <span class="fa-solid fa-clipboard-check"></span> Item Accepted
                    </button>';
    }
    if (hasPermission($permissions, 'damage_request_item')) {
        $buttons .= '<button id="itemDamaged" class="' . $buttonClass . ' btn-warning" disabled>
                        <span class="fa-solid fa-triangle-exclamation"></span> Item Damaged
                    </button>';
    }
    if (hasPermission($permissions, 'delete_request')) {
        $buttons .= '<button id="deleteRequest" class="' . $buttonClass . ' btn-danger" disabled>
                        <span class="fa-solid fa-trash"></span> Delete
                    </button>';
    }
}

echo $buttons;
