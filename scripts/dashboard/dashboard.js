import { DataController } from "../../components/DataController.js";

// Use SweetAlert (assuming it's globally available from footer.php)
const Swal = window.Swal;

// --- Centralized Data Fetching Function ---
/**
 * Fetches data (counts or lists) using DataController.select
 * @param {string} table Table name (potentially with alias like 'orders o')
 * @param {string[]} [columns=['count(*) as count']] Columns to select
 * @param {string} [filterType=null] Predefined filter type (e.g., 'new', 'recent', 'draft', 'low')
 * @param {number} [limit=null] Limit results
 * @param {number} [page=null] Page number (requires limit)
 * @returns {Promise<Array|null>} Promise resolving to the data array or null on error
 */
const getCountOrData = async (
  table,
  columns = ["count(*) as count"],
  filterType = null,
  limit = null,
  page = null
) => {
  try {
    let where = []; // Default empty where clause
    let join = [];
    let orderBy = "id"; // Default order
    let orderByType = "ASC";
    let groupBy = null;
    let having = null; // Use for conditions on aggregated results

    // --- Define conditions based on table and filterType ---
    const tableNameOnly = table.split(" ")[0]; // Get base table name

    switch (tableNameOnly) {
      case "orders":
        orderBy = "o.timesort"; // Use alias if table has one
        join = [
          // Always join status and websites for orders? Adjust if needed.
          ["LEFT JOIN", "order_status os", "os.id", "o.order_status_id"],
          ["LEFT JOIN", "websites w", "w.id", "o.website_id"],
        ];
        if (filterType === "new") {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          where = [["o.date_created", ">=", date.toISOString().slice(0, 10)]];
          orderByType = "DESC";
        } else if (filterType === "recent") {
          // No specific WHERE for recent, just ordering and limit
          orderByType = "DESC";
        }
        break;

      case "po_orders":
        orderBy = "po.po_order_id"; // Use alias if table has one
        if (filterType === "draft") {
          // Assuming status ID 5 means draft
          join = [["LEFT JOIN", "factories f", "f.id", "po.factory_id"]];
          where = [["po.po_order_status_id", "=", 5]];
          // Consider ordering by creation date for pending drafts
          // orderBy = "po.created_at";
          // orderByType = "ASC";
        }
        break;

      case "requests": // Assuming 'requests' is the table for returns/requests
        orderBy = "r.request_date"; // Use alias
        orderByType = "ASC";
        if (filterType === "pending") {
          // Assuming status ID 1 means pending
          join = [["LEFT JOIN", "orders o", "o.timesort", "r.order_number"]];
          where = [["r.request_status_id", "=", 1]];
        }
        break;

      case "stock":
        orderBy = "s.id"; // Use alias
        if (filterType === "low") {
          // This counts the *number of distinct SKUs* that are low stock
          // Requires joining sku_settings
          join = [
            ["LEFT JOIN", "sku_settings ss", "s.sku_settings_id", "ss.id"],
          ];
          columns = ["s.sku_settings_id", "ss.order_product_sku"]; // Select columns to group by
          // --- IMPORTANT: Define what 'low' means ---
          // Example: Aggregate quantity per SKU and check against a threshold (e.g., 5)
          // We need to group first, then apply the condition on the aggregated sum
          groupBy = "s.sku_settings_id, ss.order_product_sku"; // Group by SKU ID and name
          // Apply condition on the aggregated sum using HAVING
          having = [["SUM(s.remaining_quantity)", "<", 5]]; // *** VERIFY column `remaining_quantity` and threshold `5` ***
          // Note: 'having' needs special handling in DataController.select or backend
          // For now, we fetch the groups and count length in JS
          // If DataController.select doesn't support HAVING directly, this query needs adjustment
          // Maybe fetch all groups and filter in JS, or create a dedicated backend endpoint
          // Let's adjust to fetch the groups and count in JS for now
          columns = ["s.sku_settings_id"]; // Just need the ID to count distinct SKUs
          groupBy = "s.sku_settings_id";
          // HAVING clause simulation: We fetch groups, JS will check count
          // This might be inefficient if there are many SKUs.
          // A dedicated backend endpoint is better for HAVING clauses.
          // We will rely on the JS `lowStockRes.length` calculation for the count for now.
        }
        break;

      default:
        // Default behavior if table doesn't match specific cases
        orderBy = "id";
        break;
    }

    // --- Call DataController ---
    const response = await DataController.select(
      table, // Table name (with alias if needed)
      columns, // Columns to select
      orderBy, // Order by column
      limit, // Limit
      page, // Page (requires limit)
      join, // Joins
      where, // Where conditions
      "AND", // Logical operator for WHERE
      orderByType, // Order direction
      groupBy // Group By clause
      // having         // Pass having if DataController supports it
    );

    // --- Handle Response ---
    // Assuming DataController.select returns { status: true/false, data: [...] }
    if (response && response.status) {
      return response.status; // Return the data array
    } else {
      console.error(`DataController.select failed for ${table}:`, response);
      return null; // Indicate failure
    }
  } catch (error) {
    console.error(`Error in getCountOrData for ${table}:`, error);
    return null; // Return null on exception
  }
};

async function fetchChartCountBy(options = {}) {
  const {
    table = "websites",
    column = "*",
    order_by = "id",
    key = "website_id",
    data_key = "id",
    date = "payments_date",
    table_key = "orders",
  } = options;

  try {
    const response = await axios.get(`../../backend/count/count_by.php`, {
      params: { table, column, order_by, key, data_key, date, table_key },
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.error("Invalid data structure from count_by.php", response.data);
      return [];
    }
  } catch (err) {
    console.error("Failed to fetch chart data:", err);
    return [];
  }
}

// --- MOCK Permissions (!!! REPLACE with actual permission fetching !!!) ---
const MOCK_USER_PERMISSIONS = [
  "view_customer_orders",
  "view_po_management",
  "view_return_management",
  "view_stock_management",
  "view_order_reports",
  "view_system_settings",
  // Add/remove permissions to test visibility
];
// --- End MOCK Permissions ---

// --- DOM Elements ---
const globalSpinner = document.getElementById("loading-spinner");
const themeToggle = document.getElementById("theme-toggle-button");
const noPendingActionsDiv = document.getElementById("no-pending-actions");

// --- Global Chart Instances ---
// Keep placeholders for potential future charts, but comment out if not used immediately
// window.orderVolumeChartInstance = null; // Or websiteOrdersChartInstance
window.orderSourceChartInstance = null;

// --- Helper Functions ---
function showGlobalSpinner() {
  if (globalSpinner) globalSpinner.style.display = "block";
}

function hideGlobalSpinner() {
  if (globalSpinner) globalSpinner.style.display = "none";
}

function displayError(
  containerOrTbodyId,
  message = "Failed to load data.",
  type = "general"
) {
  const element = document.getElementById(containerOrTbodyId);
  if (!element) return;

  if (type === "table" || element.tagName === "TBODY") {
    const colCount =
      element.previousElementSibling?.querySelectorAll("th")?.length || 1;
    element.innerHTML = `<tr><td colspan="${colCount}" class="text-center text-danger p-3">${message}</td></tr>`;
  } else if (type === "chart") {
    element.innerHTML = `<div class="alert alert-danger m-2">${message}</div>`;
  } else if (type === "list") {
    element.innerHTML = `<li class="list-group-item text-danger">${message}</li>`;
  } else {
    element.innerHTML = `<div class="alert alert-danger m-2">${message}</div>`; // Default
  }
}

function applyPermissions(userPermissions) {
  let hasVisiblePendingActions = false;
  const elementsWithPermission = document.querySelectorAll("[data-permission]");

  elementsWithPermission.forEach((el) => {
    const requiredPermission = el.dataset.permission;
    const requiredPermissions = requiredPermission
      .split("||")
      .map((p) => p.trim());
    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasPermission) {
      el.style.display = "none";
    } else {
      el.style.display = ""; // Ensure it's visible if permission exists
      // Check if this is one of the pending action sections that is now visible
      if (
        el.id === "pending-po-section" ||
        el.id === "pending-requests-section"
      ) {
        // Updated ID
        hasVisiblePendingActions = true;
      }
    }
  });

  // Show/hide the "No pending actions" message based on visibility of action sections
  if (noPendingActionsDiv) {
    noPendingActionsDiv.style.display = hasVisiblePendingActions
      ? "none"
      : "block";
  }
}

// --- Dark Mode Logic ---
const preferredTheme = localStorage.getItem("theme");
function setTheme(theme) {
  const htmlElement = document.documentElement;
  const sunIcon = '<i class="fas fa-sun fa-fw"></i> Light Mode';
  const moonIcon = '<i class="fas fa-moon fa-fw"></i> Dark Mode';

  if (theme === "dark") {
    htmlElement.setAttribute("data-bs-theme", "dark");
    if (themeToggle) themeToggle.innerHTML = sunIcon;
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.setAttribute("data-bs-theme", "light");
    if (themeToggle) themeToggle.innerHTML = moonIcon;
    localStorage.setItem("theme", "light");
  }
  // Re-render charts with updated theme colors if they exist
  // if (window.orderVolumeChartInstance) renderOrderVolumeChart(theme); // Keep commented if chart removed
  if (window.orderSourceChartInstance) renderOrderSourceChart(theme);
}

// Set initial theme
if (preferredTheme) {
  setTheme(preferredTheme);
} else {
  setTheme("light"); // Default to light
}

// Add listener to the toggle button
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-bs-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });
}

// --- Data Fetching & Updating Functions ---
async function fetchKpiData() {
  try {
    // Fetch counts using the new centralized function
    const [ordersCountRes, poCountRes, returnsCountRes, lowStockRes] =
      await Promise.all([
        getCountOrData("orders o", ["count(*) as count"], "new"), // Fetch count of new orders
        getCountOrData("po_orders po", ["count(*) as count"], "draft"), // Fetch count of draft POs
        getCountOrData("requests r", ["count(*) as count"], "pending"), // Fetch count of pending requests
        getCountOrData("stock s", ["s.sku_settings_id"], "low"), // Fetch list of low stock SKU groups
      ]);

    // Helper to update KPI text safely
    const updateKpi = (elementId, data, isLengthCount = false) => {
      const element = document.getElementById(elementId);
      if (element) {
        let count = "N/A"; // Default value
        if (data && Array.isArray(data)) {
          if (isLengthCount) {
            count = data.length; // Use array length as count (for low stock)
          } else if (
            data.length > 0 &&
            data[0] &&
            typeof data[0].count !== "undefined"
          ) {
            count = data[0].count; // Get count from the first element
          } else if (data.length === 0) {
            count = 0; // If array is empty but query succeeded, count is 0
          }
        }
        // Only update if count is a valid number (>= 0)
        element.textContent =
          typeof count === "number" && count >= 0 ? count : "N/A";
      } else {
        console.warn(`KPI Element not found: ${elementId}`);
      }
    };

    updateKpi("kpi-new-orders", ordersCountRes);
    updateKpi("kpi-pending-po", poCountRes);
    updateKpi("kpi-pending-requests", returnsCountRes); // Updated ID
    updateKpi("kpi-low-stock", lowStockRes, true); // Use length of result array as count
  } catch (error) {
    console.error("Unexpected error fetching KPI data:", error);
    // Set all KPI fields to an error state
    [
      "kpi-new-orders",
      "kpi-pending-po",
      "kpi-pending-requests",
      "kpi-low-stock",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "Err";
    });
  }
}

async function fetchRecentOrders() {
  const tbody = document.getElementById("recent-orders-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="text-center p-5"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`; // Show loading state

  try {
    // Fetch recent orders using the centralized function
    const response = await getCountOrData(
      "orders o",
      [
        "o.timesort",
        "o.order_id",
        "o.buyer_name",
        "o.payments_date",
        "os.name as order_status",
        "w.name as website_name",
      ],
      "recent",
      5,
      null
    );

    if (response && Array.isArray(response)) {
      if (response.length > 0) {
        tbody.innerHTML = ""; // Clear loading message
        response.forEach((order) => {
          const {
            timesort,
            order_id,
            buyer_name,
            payments_date,
            order_status,
            website_name,
          } = order;
          const tr = document.createElement("tr");
          const statusLower = order_status?.toLowerCase() || "unknown";
          const badgeMap = {
            new: "primary",
            processing: "warning text-dark",
            shipped: "success",
            "partial shipped": "info",
            cancel: "danger",
            refund: "secondary",
            return: "secondary",
            // Add more status mappings as needed
          };
          const badgeClass = badgeMap[statusLower] || "light text-dark";
          const statusBadge = `<span class="badge bg-${badgeClass}">${
            order_status || "N/A"
          }</span>`;
          const orderDate = payments_date
            ? new Date(payments_date).toLocaleDateString()
            : "N/A";

          tr.innerHTML = `
                        <td><a href="../order_management/order_details.php?order_id=${order_id}">${
            timesort || order_id
          }</a></td>
                        <td>${buyer_name || "N/A"}</td>
                        <td>${website_name || "N/A"}</td>
                        <td class="text-center">${statusBadge}</td>
                        <td>${orderDate}</td>
                    `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-center p-5">No recent orders found.</td></tr>';
      }
    } else {
      // Handle null response (error occurred in getCountOrData)
      throw new Error("Failed to fetch recent orders (null response).");
    }
  } catch (error) {
    console.error("Error fetching/rendering recent orders:", error);
    displayError(
      "recent-orders-tbody",
      "Could not load recent orders.",
      "table"
    );
  }
}

async function fetchPendingPoDrafts() {
  const tbody = document.getElementById("pending-po-tbody");
  const section = document.getElementById("pending-po-section");
  if (!tbody || !section || section.style.display === "none") return false;

  tbody.innerHTML = `<tr><td colspan="3" class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`; // Loading state

  try {
    const response = await getCountOrData(
      "po_orders po",
      ["po.po_order_id", "f.name as factory_name"],
      "draft",
      10,
      null
    );

    if (Array.isArray(response)) {
      const drafts = response;
      if (drafts.length > 0) {
        tbody.innerHTML = "";
        drafts.forEach((po) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td>${po.po_order_id || "N/A"}</td>
                        <td>${po.factory_name || "N/A"}</td>
                        <td class="text-center"><a href="../po_management/po_order_details.php?po_order_id=${
                          po.po_order_id
                        }" class="btn btn-sm btn-warning">Manage</a></td>
                    `; // Link to po_order_details.php
          tbody.appendChild(tr);
        });
        return true; // Actions found
      } else {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center p-3">No pending PO drafts.</td></tr>';
        return false; // No actions found
      }
    } else {
      console.error(
        "Invalid response structure for pending POs:",
        response.data
      );
      throw new Error("Invalid response structure for pending POs.");
    }
  } catch (error) {
    console.error("Error fetching pending POs:", error);
    displayError("pending-po-tbody", "Could not load PO drafts.", "table");
    return false; // Error occurred
  }
}

async function fetchPendingReturns() {
  const tbody = document.getElementById("pending-requests-tbody"); // Updated ID
  const section = document.getElementById("pending-requests-section"); // Updated ID
  if (!tbody || !section || section.style.display === "none") return false;

  tbody.innerHTML = `<tr><td colspan="3" class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`; // Loading state

  try {
    const response = await getCountOrData(
      "requests r",
      ["r.id", "o.order_id"],
      "pending",
      10,
      null
    ); // Fetch pending requests
    // Check the structure returned by select.php (assuming { data: [...] } format)
    if (Array.isArray(response)) {
      const requests = response;
      if (requests.length > 0) {
        tbody.innerHTML = "";
        requests.forEach((req) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td>${req.id || "N/A"}</td>
                        <td><a href="../order_management/order_details.php?order_id=${
                          req.order_id
                        }">${req.order_id || "N/A"}</a></td>
                        <td class="text-center"><a href="../return_management/return.php?" class="btn btn-sm btn-danger">Process</a></td>
                    `; // Use request_id in link
          tbody.appendChild(tr);
        });
        return true; // Actions found
      } else {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center p-3">No pending requests.</td></tr>';
        return false; // No actions found
      }
    } else {
      console.error(
        "Invalid response structure for pending requests:",
        response.data
      );
      throw new Error("Invalid response structure for pending requests.");
    }
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    displayError(
      "pending-requests-tbody",
      "Could not load pending requests.",
      "table"
    );
    return false; // Error occurred
  }
}

async function fetchSyncStatus() {
  // ... (Existing fetchSyncStatus code - seems ok) ...
  const list = document.getElementById("sync-status-list");
  const timeEl = document.getElementById("last-sync-time");
  if (!list || !timeEl) return;

  list.innerHTML =
    '<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></li>';
  timeEl.textContent = "Checking status...";

  try {
    const response = await axios.get("../../backend/get/get_last_timesort.php"); // ** VERIFY Endpoint **

    if (
      response.data &&
      response.data.status &&
      Array.isArray(response.data.status)
    ) {
      if (response.data.status.length > 0) {
        list.innerHTML = ""; // Clear loading
        response.data.status.forEach((syncInfo) => {
          const li = document.createElement("li");
          li.className =
            "list-group-item d-flex justify-content-between align-items-center list-group-item-action py-2";
          const statusClass = syncInfo.success ? "text-success" : "text-danger";
          const statusIcon = syncInfo.success
            ? "fa-check-circle"
            : "fa-times-circle";
          const syncTime = syncInfo.last_sync_time
            ? new Date(syncInfo.last_sync_time).toLocaleString()
            : "Never";
          li.innerHTML = `
                        <span class="fw-medium">${
                          syncInfo.website_name || "Unknown Source"
                        }</span>
                        <span class="small ${statusClass}"><i class="fas ${statusIcon} me-1"></i> ${syncTime}</span>
                    `;
          list.appendChild(li);
        });
      } else {
        list.innerHTML =
          '<li class="list-group-item text-muted">No sync sources configured or found.</li>';
      }
      timeEl.textContent = `Status checked: ${new Date().toLocaleString()}`;
    } else {
      console.warn("Sync status API response invalid:", response.data);
      displayError(
        "sync-status-list",
        "Sync status unavailable or in wrong format.",
        "list"
      );
      timeEl.textContent = `Status check failed`;
    }
  } catch (error) {
    console.error("Error fetching sync status:", error);
    displayError("sync-status-list", "Could not load sync status.", "list");
    timeEl.textContent = `Status check failed`;
  }
}

// --- Chart Rendering Functions ---
// NOTE: Chart rendering functions are COMMENTED OUT in Initialization
//       as per the user's last provided dashboard.js code.
//       Uncomment and ensure they work with backend endpoints if needed.

async function renderOrderVolumeChart(theme = "light") {
  const container = document.getElementById("orderVolumeChartContainer");
  if (!container) return;

  container.innerHTML =
    '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading Chart...</span></div></div>';

  try {
    const chartData = await fetchChartCountBy();
    const year = new Date().getFullYear();
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const datasets = chartData.map((entry) => {
      const label = entry.details?.name || "Unknown";
      const siteData = entry.count_datas.find((c) => c.year === year);
      const monthTotals = Array(12).fill(0);

      if (siteData) {
        siteData.months.forEach((days, i) => {
          monthTotals[i] = days.reduce(
            (sum, val) => sum + (parseInt(val) || 0),
            0
          );
        });
      }

      return {
        label,
        data: monthTotals,
        borderColor: `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${
          Math.random() * 200
        }, 1)`,
        backgroundColor: `rgba(0,0,0,0.1)`,
        tension: 0.4,
      };
    });

    container.innerHTML = '<canvas id="orderVolumeChart"></canvas>';
    const ctx = document.getElementById("orderVolumeChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Order Volume - ${year}`,
          },
        },
      },
    });
  } catch (err) {
    console.error("Chart rendering failed:", err);
    container.innerHTML = `<div class="alert alert-danger">Chart Load Error</div>`;
  }
}

async function renderOrderSourceChart(theme = "light") {
  const container = document.getElementById("orderSourceChartContainer");
  container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading Chart...</span></div></div>`;

  try {
    const response = await getCountOrData(
      "orders o",
      ["w.name AS website_name", "COUNT(o.order_id) AS total_orders"],
      "new",
      null,
      null
    );

    if (response && Array.isArray(response) && response.length > 0) {
      const labels = response.map((row) => row.website_name);
      const data = response.map((row) => parseInt(row.total_orders));

      const backgroundColors = [
        "#0d6efd",
        "#dc3545",
        "#ffc107",
        "#20c997",
        "#6610f2",
        "#fd7e14",
        "#adb5bd",
        "#198754",
        "#6f42c1",
      ];

      container.innerHTML = `<canvas id="orderSourceChart"></canvas>`;
      const ctx = document.getElementById("orderSourceChart").getContext("2d");

      if (window.orderSourceChartInstance)
        window.orderSourceChartInstance.destroy();

      window.orderSourceChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              label: "Orders",
              data,
              backgroundColor: backgroundColors.slice(0, labels.length),
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Orders by Source (Last 7 Days)",
              font: { size: 16, weight: "bold" },
            },
            legend: {
              position: "bottom",
              labels: {
                padding: 15,
                font: { size: 12 },
                color: theme === "dark" ? "#e9ecef" : "#212529",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.label}: ${context.parsed} orders`,
              },
            },
          },
        },
      });
    } else {
      container.innerHTML = `<div class="alert alert-warning">No orders found for the past 7 days.</div>`;
    }
  } catch (error) {
    console.error("Error rendering order source chart:", error);
    container.innerHTML = `<div class="alert alert-danger">Failed to load data for source chart.</div>`;
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  applyPermissions(MOCK_USER_PERMISSIONS);
  showGlobalSpinner();

  try {
    const results = await Promise.allSettled([
      fetchKpiData(),
      fetchRecentOrders(),
      fetchPendingPoDrafts(),
      fetchPendingReturns(),
      fetchSyncStatus(),
      renderOrderVolumeChart(localStorage.getItem("theme") || "light"),
      renderOrderSourceChart(localStorage.getItem("theme") || "light"),
    ]);

    const poResult = results[2];
    const returnResult = results[3];
    const hasPendingPo =
      poResult.status === "fulfilled" && poResult.value === true;
    const hasPendingReturns =
      returnResult.status === "fulfilled" && returnResult.value === true;
    const poSectionVisible =
      document.getElementById("pending-po-section")?.style.display !== "none";
    const returnSectionVisible =
      document.getElementById("pending-requests-section")?.style.display !==
      "none";

    if (noPendingActionsDiv) {
      if (
        (poSectionVisible && hasPendingPo) ||
        (returnSectionVisible && hasPendingReturns)
      ) {
        noPendingActionsDiv.style.display = "none";
      } else if (poSectionVisible || returnSectionVisible) {
        noPendingActionsDiv.style.display = "block";
      } else {
        noPendingActionsDiv.style.display = "none";
      }
    }

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Initial load failed for task ${index}:`, result.reason);
      }
    });
  } catch (error) {
    console.error("Error during initial dashboard load sequence:", error);
    hideGlobalSpinner();
    if (Swal) {
      Swal.fire({
        icon: "error",
        title: "Dashboard Load Error",
        text: "Failed to initialize some dashboard components. Please try refreshing.",
        allowOutsideClick: false,
      });
    } else {
      alert(
        "Failed to initialize some dashboard components. Please try refreshing."
      );
    }
    return;
  }

  hideGlobalSpinner();
});
