<?php
$data = json_decode(file_get_contents("php://input"), true);
$permissions = $data['permissions'] ?? [];

function hasPermission($permissions, $name)
{
    foreach ($permissions as $perm) {
        if ($perm['name'] === $name) return true;
    }
    return false;
}

$buttons = "";

$buttonClass = "btn btn-sm me-2 mb-2"; // ระยะห่างแนวนอนและแนวล่าง

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

echo $buttons;
