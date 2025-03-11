import { Alert } from "../../components/Alert.js";

const menus = {
    "dashboard": {
        "icon": "fa-chart-line",
        "label": "Dashboard",
        "submenus": [
            { "name": "dashboard_orders", "label": "Orders" },
            { "name": "dashboard_po", "label": "PO" },
            { "name": "dashboard_stock", "label": "Stock" }
        ]
    },
    "orders": {
        "icon": "fa-list-ul",
        "label": "Orders",
        "submenus": [
            { "name": "order_list", "label": "Order List" },
            { "name": "order_add", "label": "Add Order" }
        ]
    },
    "po": {
        "icon": "fa-truck-moving",
        "label": "PO",
        "submenus": [
            { "name": "pre_po", "label": "Pre PO" },
            { "name": "po_order_list", "label": "PO Order List" },
            { "name": "po_order_add", "label": "Add PO Order" }
        ]
    },
    "stock": {
        "icon": "fa-warehouse",
        "label": "Stock"
    },
    "return": {
        "icon": "fa-rotate-left",
        "label": "Return"
    },
    "settings": {
        "icon": "fa-gear",
        "label": "Settings",
        "submenus": [
            { "name": "user_setting", "label": "User Settings" },
            { "name": "permission_setting", "label": "Permission Settings" },
            { "name": "role_setting", "label": "Role Settings" },
            { "name": "sku_setting", "label": "SKU Settings" },
            { "name": "product_set_setting", "label": "Product Set Settings" },
            { "name": "factory_setting", "label": "Factory Settings" },
            { "name": "website_setting", "label": "Website Settings" },
            { "name": "currency_setting", "label": "Currency Settings" },
            { "name": "invoice_setting", "label": "Invoice Settings" },
            { "name": "sku_brands_setting", "label": "SKU Brands Settings" },
            { "name": "warehouse_skus_setting", "label": "Warehouse SKU Settings" },
            { "name": "payment_method_setting", "label": "Payment Method Settings" },
            { "name": "service_method_setting", "label": "Service Method Settings" }
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

    console.log(user);

    // ✅ แปลง permissions ให้อยู่ในรูปแบบของอาร์เรย์ที่เก็บ `{ name, page_url }`
    const userPermissions = user[0].permissions.map(p => ({
        name: p.name,
        page_url: p.page_url
    }));

    console.log(userPermissions);

    const navbar = document.getElementById("navbarMenu");
    navbar.innerHTML = ""; // ล้างเมนูก่อนสร้างใหม่

    let allowedPages = []; // เก็บหน้าที่ user มีสิทธิ์เข้าถึง

    for (const menuKey in menus) {
        const menu = menus[menuKey];

        let hasAccess = userPermissions.some(p => p.name === menuKey);
        let menuItem = "";
        let submenuHTML = "";

        if (menu.submenus) {
            menu.submenus.forEach(submenu => {
                // ✅ หาว่าผู้ใช้มีสิทธิ์เข้าถึงเมนูย่อยนี้หรือไม่
                const permission = userPermissions.find(p => p.name === submenu.name);
                if (permission) {
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
            const permission = userPermissions.find(p => p.name === menuKey);
            menuItem = `
                <li class="nav-item">
                    <a class="nav-link" href="${permission.page_url}">
                        <i class="fa-solid ${menu.icon}"></i> ${menu.label}
                    </a>
                </li>
            `;
            allowedPages.push(permission.page_url); // บันทึกหน้าที่ user มีสิทธิ์
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
        window.location.href = allowedPages[0] || "../../pages/lokin/lokin.php";
    }
});
