const menus = {
  dashboard: {
    icon: "fa-chart-line",
    label: "Dashboard",
    submenus: [
      { name: "dashboard_orders", label: "Orders", show: true },
      { name: "dashboard_po", label: "PO", show: true },
      { name: "dashboard_stock", label: "Stock", show: true },
    ],
  },
  orders: {
    icon: "fa-list-ul",
    label: "Orders",
    submenus: [
      { name: "order_list", label: "Order List", show: true },
      { name: "order_add", label: "Add Order", show: true },
    ],
  },
  po: {
    icon: "fa-truck-moving",
    label: "PO",
    submenus: [
      { name: "pre_po", label: "Pre PO", show: true },
      { name: "pre_po_details", label: "Pre PO Details", show: false },
      { name: "po_order_list", label: "PO Order List", show: true },
      { name: "po_order_add", label: "Add PO Order", show: true },
      { name: "po_order_details", label: "PO Order Details", show: false },
      { name: "factory_details", label: "Factory Details", show: false },
    ],
  },
  stock: {
    icon: "fa-warehouse",
    label: "Stock",
    submenus: [
      { name: "stock", label: "Stock", show: true },
      { name: "stock_in", label: "Import Stock", show: true },
      { name: "stock_out", label: "Export Stock", show: true },
    ],
  },
  return: {
    icon: "fa-rotate-left",
    label: "Return",
    submenus: [
      { name: "return", label: "Request List", show: true },
      { name: "return_form", label: "Create Request", show: true },
    ],
  },
  settings: {
    icon: "fa-gear",
    label: "Settings",
    submenus: [
      { name: "user_setting", label: "User Settings", show: true },
      { name: "permission_setting", label: "Permission Settings", show: true },
      { name: "role_setting", label: "Role Settings", show: true },
      { name: "sku_setting", label: "SKU Settings", show: true },
      {
        name: "product_set_setting",
        label: "Product Set Settings",
        show: true,
      },
      { name: "factory_setting", label: "Factory Settings", show: true },
      { name: "website_setting", label: "Website Settings", show: true },
      { name: "currency_setting", label: "Currency Settings", show: true },
      { name: "invoice_setting", label: "Invoice Settings", show: true },
      { name: "sku_brands_setting", label: "SKU Brands Settings", show: true },
      {
        name: "warehouse_skus_setting",
        label: "Warehouse SKU Settings",
        show: true,
      },
      {
        name: "payment_method_setting",
        label: "Payment Method Settings",
        show: true,
      },
      {
        name: "service_method_setting",
        label: "Service Method Settings",
        show: true,
      },
    ],
  },
  test: {
    icon: "fa-rotate-left",
    label: "Test",
    submenus: [
      { name: "test_db_import", label: "Test Database Import", show: true },
    ],
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "../../pages/lokin/lokin.php";
    return;
  }

  const userPermissions = user[0].permissions.map((p) => ({
    name: p.name,
    page_url: p.page_url,
  }));

  const navbar = document.getElementById("navbarMenu");
  navbar.innerHTML = "";

  let allowedPages = [];

  for (const menuKey in menus) {
    const menu = menus[menuKey];

    let hasAccess = userPermissions.some((p) => p.name === menuKey);
    let menuItem = "";
    let submenuHTML = "";

    if (menu.submenus) {
      menu.submenus.forEach((submenu) => {
        const permission = userPermissions.find((p) => p.name === submenu.name);
        if (permission) {
          if (submenu.show)
            submenuHTML += `
              <li>
                  <a class="dropdown-item" href="${permission.page_url}">${submenu.label}</a>
              </li>
            `;
          allowedPages.push(permission.page_url);
        }
      });

      if (submenuHTML) {
        menuItem = `
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid ${menu.icon}"></i> ${menu.label}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            ${submenuHTML}
                        </ul>
                    </li>
                `;
      }
    } else if (hasAccess) {
      const permission = userPermissions.find((p) => p.name === menuKey);
      menuItem = `
                <li class="nav-item">
                    <a class="nav-link" href="${permission.page_url}">
                        <i class="fa-solid ${menu.icon}"></i> ${menu.label}
                    </a>
                </li>
            `;
      allowedPages.push(permission.page_url);
    }

    if (menuItem) {
      navbar.innerHTML += menuItem;
    }
  }

  const logoutItem = `
        <li class="nav-item">
            <a class="nav-link" id="logoutBtn" href="#">
                <i class="fa-solid fa-sign-out"></i> Logout
            </a>
        </li>
    `;
  navbar.innerHTML += logoutItem;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "../../pages/lokin/lokin.php";
  });

  const currentPath = window.location.pathname;

  const relativePath = currentPath.substring(
    currentPath.indexOf("/pages/") + 1
  );
  const currentPage = "../../" + relativePath;

  /* console.log(currentPage);
  console.log(allowedPages); */
  if (!allowedPages.includes(currentPage)) {
    window.location.href = allowedPages[0] || "../../pages/lokin/lokin.php";
  }
});
