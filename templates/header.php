<nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-5">
  <div class="container-fluid px-5 py-2">
    <a class="navbar-brand ms-3" href="../pages/order_list.php">
        <i class="fa-solid fa-paper-plane"></i> Order Management <sup style="color:red">Beta</sup>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarToggler" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarToggler">
      <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
        <li class="nav-item dropdown">
            <a class="nav-link" id="navbarDarkDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-list-ul"></i> Orders
            </a>
            <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="navbarDarkDropdownMenuLink">
                <li><a class="dropdown-item" href="../pages/order_list.php">Order List</a></li>
                <li><a class="dropdown-item" href="../pages/order_details.php">Add Order</a></li>
            </ul>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link" id="navbarDarkDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fa-solid fa-warehouse"></i> PO
          </a>
          <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="navbarDarkDropdownMenuLink">
              <li><a class="dropdown-item" href="../pages/pre_po.php">Pre po</a></li>
              <li><a class="dropdown-item" href="../pages/po_order_list.php">PO Order List</a></li>
              <li><a class="dropdown-item" href="../pages/po_order_details.php">Add PO Order</a></li>
          </ul>
        </li>
        <li class="nav-item dropdown">
            <a class="nav-link" id="navbarDarkDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-gear"></i> Settings
            </a>
            <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="navbarDarkDropdownMenuLink">
                <li><h6 class="dropdown-header">Management Settings</h6></li>
                <li><a class="dropdown-item" href="../pages/sku_setting.php">SKU Settings</a></li>
                <li><a class="dropdown-item" href="../pages/factory_setting.php">Factory Settings</a></li>
                <li><a class="dropdown-item" href="../pages/product_set_setting.php">Product Set Settings</a></li>
                <li><a class="dropdown-item" href="../pages/sku_brands_setting.php">SKU Brands Settings</a></li>
                <li><a class="dropdown-item" href="../pages/warehouse_skus_setting.php">Warehouse SKUs Settings</a></li>
                <li><h6 class="dropdown-header">Other</h6></li>
                <li><a class="dropdown-item" href="../pages/website_setting.php">Websites Settings</a></li>
                <li><a class="dropdown-item" href="../pages/invoice_setting.php">Invoice Settings</a></li>
                <li><a class="dropdown-item" href="../pages/currency_setting.php">Currency Settings</a></li>
                <li><a class="dropdown-item" href="../pages/payment_method_setting.php">Payment Method Settings</a></li>
                <li><a class="dropdown-item" href="../pages/service_method_setting.php">Service Method Settings</a></li>
            </ul>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="../pages/login.php"role="button">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </a>
        </li>
      </ul>
    </div>
  </div>
  <script type="module" src="../scripts/checkSessionExpiration.js"></script>
</nav>