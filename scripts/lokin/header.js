import { Alert } from "../../components/Alert.js";

const menus = {
    "dashboard": {
        "icon": "fa-chart-line",
        "label": "Dashboard",
        "submenus": [
            { "name": "dashboard_orders", "label": "Orders", "link": "../../pages/dashboard/dashboard_orders.php" },
            { "name": "dashboard_po", "label": "PO", "link": "../../pages/dashboard/dashboard_po.php" },
            { "name": "dashboard_stock", "label": "Stock", "link": "../../pages/dashboard/dashboard_stock.php" }
        ]
    },
    "orders": {
        "icon": "fa-list-ul",
        "label": "Orders",
        "submenus": [
            { "name": "order_list", "label": "Order List", "link": "../../pages/order_management/order_list.php" },
            { "name": "order_add", "label": "Add Order", "link": "../../pages/order_management/order_details.php" }
        ]
    },
    "po": {
        "icon": "fa-truck-moving",
        "label": "PO",
        "submenus": [
            { "name": "pre_po", "label": "Pre PO", "link": "../../pages/po_management/pre_po.php" },
            { "name": "po_order_list", "label": "PO Order List", "link": "../../pages/po_management/po_order_list.php" },
            { "name": "po_order_add", "label": "Add PO Order", "link": "../../pages/po_management/po_order_details.php" }
        ]
    },
    "stock": {
        "icon": "fa-warehouse",
        "label": "Stock",
        "link": "../../pages/stock_management/stock.php"
    },
    "return": {
        "icon": "fa-rotate-left",
        "label": "Return",
        "link": "../../pages/return_management/return.php"
    },
    "settings": {
        "icon": "fa-gear",
        "label": "Settings",
        "submenus": [
            { "name": "sku_setting", "label": "SKU Settings", "link": "../../pages/settings/sku_setting.php" },
            { "name": "factory_setting", "label": "Factory Settings", "link": "../../pages/settings/factory_setting.php" },
            { "name": "product_set_setting", "label": "Product Set Settings", "link": "../../pages/settings/product_set_setting.php" }
        ]
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    // ถ้าไม่มี user ใน localStorage → Redirect ไปหน้า login
    if (!user) {
        window.location.href = "../../pages/lokin/lokin.php";
        return;
    }

    // ดึงรายการสิทธิ์ของผู้ใช้ (เป็น array ของ permission_name)
    const userPermissions = user[0].permissions.map(p => p.permission_name);

    const navbar = document.getElementById("navbarMenu");
    navbar.innerHTML = ""; // ล้างเมนูก่อนสร้างใหม่

    let allowedPages = []; // เก็บหน้าที่ user มีสิทธิ์เข้าถึง

    for (const menuKey in menus) {
        const menu = menus[menuKey];

        let hasAccess = userPermissions.includes(menuKey);
        let menuItem = "";
        let submenuHTML = "";

        if (menu.submenus) {
            menu.submenus.forEach(submenu => {
                if (userPermissions.includes(submenu.name)) {
                    submenuHTML += `
                        <li>
                            <a class="dropdown-item" href="${submenu.link}">${submenu.label}</a>
                        </li>
                    `;
                    allowedPages.push(submenu.link); // บันทึกหน้าที่ user มีสิทธิ์
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
            menuItem = `
                <li class="nav-item">
                    <a class="nav-link" href="${menu.link}">
                        <i class="fa-solid ${menu.icon}"></i> ${menu.label}
                    </a>
                </li>
            `;
            allowedPages.push(menu.link); // บันทึกหน้าที่ user มีสิทธิ์
        }

        if (menuItem) {
            navbar.innerHTML += menuItem;
        }
    }

    // ✅ เพิ่มเมนู Logout (แสดงทุก user)
    const logoutItem = `
        <li class="nav-item">
            <a class="nav-link" id="logoutBtn" href="#">
                <i class="fa-solid fa-sign-out"></i> Logout
            </a>
        </li>
    `;
    navbar.innerHTML += logoutItem;

    // ✅ ฟังก์ชัน Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("user"); // เคลียร์ session
        window.location.href = "../../pages/lokin/lokin.php"; // Redirect ไปหน้า login
    });

    // ✅ ป้องกันการเข้าถึงผ่าน URL
    const currentPath = window.location.pathname;

    // แปลง currentPath ให้เหมือนกับ allowedPages (ใช้ ../../ นำหน้า)
    const relativePath = currentPath.substring(currentPath.indexOf("/pages/") + 1); // ตัดพาธก่อนหน้า /pages/
    const currentPage = "../../" + relativePath; // นำ ../../ เข้ามาข้างหน้า

    if (!allowedPages.includes(currentPage)) {
        // redirect ไปหน้า หน้าที่เข้าถึงได้
        window.location.href = allowedPages[0];
    }
});

