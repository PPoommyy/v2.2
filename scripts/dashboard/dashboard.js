import { DataController } from "../../components/DataController.js";

const Swal = window.Swal;
const getCountOrData = async (
  table,
  columns = ["count(*) as count"],
  filterType = null,
  limit = null,
  page = null
) => {
  try {
    let where = [];
    let join = [];
    let orderBy = "id";
    let orderByType = "ASC";
    let groupBy = null;
    let having = null;

    const tableNameOnly = table.split(" ")[0];

    switch (tableNameOnly) {
      case "orders":
        orderBy = "o.timesort";
        join = [
          ["LEFT JOIN", "order_status os", "os.id", "o.order_status_id"],
          ["LEFT JOIN", "websites w", "w.id", "o.website_id"],
        ];
        if (filterType === "new") {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          where = [["o.date_created", ">=", date.toISOString().slice(0, 10)]];
          orderByType = "DESC";
        } else if (filterType === "recent") {
          orderByType = "DESC";
        } else if (filterType === "last7days") {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          where = [["o.date_created", ">=", date.toISOString().slice(0, 10)]];
          groupBy = "w.name";
          orderBy = "total_orders";
          orderByType = "DESC";
        } else if (filterType === "last90days") {
          const date = new Date();
          date.setDate(date.getDate() - 90);
          where = [["o.date_created", ">=", date.toISOString().slice(0, 10)]];
          groupBy = "w.name";
          orderBy = "total_orders";
          orderByType = "DESC";
        } else if (filterType === "last12months") {
          const now = new Date();
          const past = new Date();
          past.setMonth(now.getMonth() - 11);
          past.setDate(1);
          where = [["o.payments_date", ">=", past.toISOString().slice(0, 10)]];
          orderByType = "ASC";
        }
        break;

      case "po_orders":
        orderBy = "po.po_order_id";
        if (filterType === "draft") {
          join = [["LEFT JOIN", "factories f", "f.id", "po.factory_id"]];
          where = [["po.po_order_status_id", "=", 5]];
        }
        break;

      case "requests":
        orderBy = "r.request_date";
        orderByType = "ASC";
        if (filterType === "pending") {
          join = [["LEFT JOIN", "orders o", "o.timesort", "r.order_number"]];
          where = [["r.request_status_id", "=", 1]];
        }
        break;

      case "stock":
        orderBy = "s.id";
        if (filterType === "low") {
          join = [
            ["LEFT JOIN", "sku_settings ss", "s.sku_settings_id", "ss.id"],
          ];
          columns = ["s.sku_settings_id", "ss.order_product_sku"];
          having = [["SUM(s.remaining_quantity)", "<", 5]];
          orderBy = "s.sku_settings_id";
          groupBy = "s.sku_settings_id";
        }
        break;

      default:
        orderBy = "id";
        break;
    }

    const response = await DataController.select(
      table,
      columns,
      orderBy,
      limit,
      page,
      join,
      where,
      "AND",
      orderByType,
      groupBy
    );

    if (response && response.status) {
      return response.status;
    } else {
      console.error(`DataController.select failed for ${table}:`, response);
      return null;
    }
  } catch (error) {
    console.error(`Error in getCountOrData for ${table}:`, error);
    return null;
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

const MOCK_USER_PERMISSIONS = [
  "view_customer_orders",
  "view_po_management",
  "view_return_management",
  "view_stock_management",
  "view_order_reports",
  "view_system_settings",
];

const globalSpinner = document.getElementById("loading-spinner");
const themeToggle = document.getElementById("theme-toggle-button");
const noPendingActionsDiv = document.getElementById("no-pending-actions");

window.orderSourceChartInstance = null;

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
    element.innerHTML = `<div class="alert alert-danger m-2">${message}</div>`;
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
      el.style.display = "";
      if (
        el.id === "pending-po-section" ||
        el.id === "pending-requests-section"
      ) {
        hasVisiblePendingActions = true;
      }
    }
  });

  if (noPendingActionsDiv) {
    noPendingActionsDiv.style.display = hasVisiblePendingActions
      ? "none"
      : "block";
  }
}

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
  if (window.orderSourceChartInstance) renderOrderSourceChart(theme);
}

if (preferredTheme) {
  setTheme(preferredTheme);
} else {
  setTheme("light");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-bs-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });
}

async function fetchKpiData() {
  try {
    const [ordersCountRes, poCountRes, returnsCountRes, lowStockRes] =
      await Promise.all([
        getCountOrData("orders o", ["count(*) as count"], "new"),
        getCountOrData("po_orders po", ["count(*) as count"], "draft"),
        getCountOrData("requests r", ["count(*) as count"], "pending"),
        getCountOrData("stock s", ["s.sku_settings_id"], "low"),
      ]);

    const updateKpi = (elementId, data, isLengthCount = false) => {
      const element = document.getElementById(elementId);
      if (element) {
        let count = "N/A";
        if (data && Array.isArray(data)) {
          if (isLengthCount) {
            count = data.length;
          } else if (data[0] && typeof data[0].count !== "undefined") {
            count = data[0].count;
          } else if (data.length === 0) {
            count = 0;
          }
        }
        element.textContent = count >= 0 ? count : "N/A";
      } else {
        console.warn(`KPI Element not found: ${elementId}`);
      }
    };

    updateKpi("kpi-new-orders", ordersCountRes);
    updateKpi("kpi-pending-po", poCountRes);
    updateKpi("kpi-pending-requests", returnsCountRes);
    updateKpi("kpi-low-stock", lowStockRes, true);
  } catch (error) {
    console.error("Unexpected error fetching KPI data:", error);
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
        tbody.innerHTML = "";
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
      ["po.po_order_id", "f.name as factory_name", "f.id as factory_id"],
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
                        <td class="text-center"><a href="../po_management/pre_po_details.php?factory_id=${
                          po.factory_id
                        }&po_order_id=${
            po.po_order_id
          }" class="btn btn-sm btn-warning">Manage</a></td>
                    `;
          tbody.appendChild(tr);
        });
        return true;
      } else {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center p-3">No pending PO drafts.</td></tr>';
        return false;
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
    return false;
  }
}

async function fetchPendingReturns() {
  const tbody = document.getElementById("pending-requests-tbody");
  const section = document.getElementById("pending-requests-section");
  if (!tbody || !section || section.style.display === "none") return false;

  tbody.innerHTML = `<tr><td colspan="3" class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`; // Loading state

  try {
    const response = await getCountOrData(
      "requests r",
      ["r.id", "o.order_id"],
      "pending",
      10,
      null
    );
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
                    `;
          tbody.appendChild(tr);
        });
        return true;
      } else {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center p-3">No pending requests.</td></tr>';
        return false;
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
    return false;
  }
}

async function fetchSyncStatus() {
  const list = document.getElementById("sync-status-list");
  const timeEl = document.getElementById("last-sync-time");
  if (!list || !timeEl) return;

  list.innerHTML =
    '<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></li>';
  timeEl.textContent = "Checking status...";

  try {
    const response = await axios.get("../../backend/get/get_last_timesort.php");

    if (
      response.data &&
      response.data.status &&
      Array.isArray(response.data.status)
    ) {
      if (response.data.status.length > 0) {
        list.innerHTML = "";
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

let chartInstance = null;

async function renderOrderVolumeChart(theme = "light") {
  const container = document.getElementById("orderVolumeChartContainer");
  const websiteControls = document.getElementById("website-controls");
  const canvas = document.getElementById("orderVolumeChart");

  if (!container || !canvas || !websiteControls) return;

  container.classList.add("position-relative");
  container.insertAdjacentHTML(
    "beforeend",
    `
    <div id="chart-loading" class="position-absolute top-50 start-50 translate-middle text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading Chart...</span>
      </div>
    </div>
  `
  );

  try {
    const chartData = await fetchChartCountBy();

    // === สร้าง 12 เดือนล่าสุด ===
    const end = new Date();
    const labels = [];
    const labelKeys = []; // สำหรับ lookup

    for (let i = 11; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      const label = `${d.toLocaleString("default", {
        month: "short",
      })} ${d.getFullYear()}`;
      labels.push(label);
      labelKeys.push({ year: d.getFullYear(), month: d.getMonth() }); // month: 0-based
    }

    const datasets = chartData.map((entry) => {
      const label = entry.details?.name || "Unknown";

      const dataByYM = {};
      entry.count_datas.forEach((c) => {
        const y = c.year;
        c.months.forEach((days, mIndex) => {
          const key = `${y}-${mIndex}`;
          dataByYM[key] = days.reduce(
            (sum, val) => sum + (parseInt(val) || 0),
            0
          );
        });
      });

      const monthTotals = labelKeys.map(({ year, month }) => {
        const key = `${year}-${month}`;
        return dataByYM[key] || 0;
      });

      return {
        label,
        data: monthTotals,
        borderColor: `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(
          Math.random() * 180
        )}, ${Math.floor(Math.random() * 180)}, 1)`,
        backgroundColor: `rgba(0,0,0,0.1)`,
        tension: 0.4,
      };
    });

    if (chartInstance) chartInstance.destroy();
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas context not available");
      return;
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Order Volume - Last 12 Months`,
          },
          legend: {
            display: false,
          },
        },
      },
    });

    let controlsHTML = "";
    datasets.forEach((dataset, i) => {
      controlsHTML += `
        <div class="d-flex align-items-center mb-2">
          <input type="checkbox" class="form-check-input me-2 website-checkbox" data-index="${i}" id="toggle-${i}" checked>
          <span class="rounded-circle d-inline-block me-2" style="width:12px;height:12px;background:${dataset.borderColor}"></span>
          <label for="toggle-${i}" class="form-check-label small text-muted text-truncate" style="max-width: 180px;">${dataset.label}</label>
        </div>
      `;
    });
    websiteControls.innerHTML = controlsHTML;

    document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const idx = parseInt(this.dataset.index);
        chartInstance.data.datasets[idx].hidden = !this.checked;
        chartInstance.update();
      });
    });
  } catch (err) {
    console.error("Chart rendering failed:", err);
    container.innerHTML = `<div class="alert alert-danger">Chart Load Error</div>`;
  } finally {
    const loading = document.getElementById("chart-loading");
    if (loading) loading.remove();
  }
}

async function renderOrderSourceChart(
  theme = "light",
  chartID,
  containerID,
  type
) {
  const container = document.getElementById(containerID);
  container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading Chart...</span></div></div>`;

  try {
    const response = await getCountOrData(
      "orders o",
      ["w.name AS website_name", "COUNT(o.order_id) AS total_orders"],
      type
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

      container.innerHTML = `<canvas id="${chartID}"></canvas>`;
      const ctx = document.getElementById(chartID).getContext("2d");

      // ใช้ chartID เป็น key เพื่อป้องกันกราฟซ้อนทับ
      if (window[chartID] && typeof window[chartID].destroy === "function") {
        window[chartID].destroy();
      }

      window[chartID] = new Chart(ctx, {
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
              text: `Orders by Source (${
                type === "last90days" ? "Last 90 Days" : "Last 7 Days"
              })`,
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
      container.innerHTML = `<div class="alert alert-warning">No orders found for the selected range.</div>`;
    }
  } catch (error) {
    console.error(`Error rendering chart ${chartID}:`, error);
    container.innerHTML = `<div class="alert alert-danger">Failed to load chart data.</div>`;
  }
}

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
      renderOrderSourceChart(
        localStorage.getItem("theme") || "light",
        "orderSourceChart",
        "orderSourceChartContainer",
        "last7days"
      ),
      renderOrderSourceChart(
        localStorage.getItem("theme") || "light",
        "orderSourceChart2",
        "orderSourceChartContainer2",
        "last90days"
      ),
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
