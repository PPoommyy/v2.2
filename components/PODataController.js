import { DataController } from "./DataController.js";

const get_factory_list = async () => {
  try {
    const response = await DataController.select("factories", ["*"], "id");
    console.log(response);
    return response.status;
  } catch (error) {
    throw error;
  }
};

const get_po_order_status = async () => {
  try {
    const response = await DataController.select(
      "po_orders_status",
      ["*"],
      "id"
    );
    console.log(response);
    return response.status;
  } catch (error) {
    throw error;
  }
};

const get_factory_details = async (factory_id) => {
  try {
    const where = [["id", "=", factory_id]];
    const response = await DataController.select(
      "factories",
      ["*"],
      "id",
      null,
      null,
      null,
      where
    );
    return response.status;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const get_factory_skus = async (factory_id) => {
  try {
    const column = [
      "ss.id AS sku_settings_id",
      "ss.order_product_sku",
      "ss.report_product_name",
      "fss.factory_id",
      "fss.factory_sku_settings_id AS factory_sku_settings_id",
      "fss.item_price",
      "fss.created_at",
      "fss.updated_at",
      `CASE 
            WHEN fss.factory_sku_settings_id IS NOT NULL THEN 1 
            ELSE 0 
        END AS exist`,
    ];
    const join = [
      [
        "LEFT JOIN",
        "factory_sku_settings fss",
        "ss.id",
        "fss.sku_settings_id AND fss.factory_id = " + factory_id,
      ],
    ];
    const response = await DataController.select(
      "sku_settings ss",
      column,
      "ss.order_product_sku ASC, ss.id",
      null,
      null,
      join
    );
    return response.status;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const get_pre_po_order = async (factory_id) => {
  try {
    const column1 = [
      "o.order_id",
      "o.timesort",
      "o.buyer_name",
      "w.name as website_name",
      "w.id as website_id",
      "c.name as currency_code",
      "c.id as currency_id",
    ];
    const join1 = [
      ["currencies c", "o.currency_id", "c.id"],
      ["websites w", "o.website_id", "w.id"],
    ];
    const nestedKey = "order_id";

    const nestedTables = [
      {
        table: "orders_skus os",
        columns: [
          "os.orders_skus_id",
          "os.unique_id",
          "os.order_item_id",
          "os.sku_settings_id",
          "os.item_price",
          "os.quantity_purchased",
          "os.shipping_price",
          "os.total",
          "ss.order_product_sku",
          "ss.report_product_name",
          "ps.id as product_status_id",
          "ps.name as product_status_name",
          "fss.factory_sku_settings_id",
        ],
        order_by: "os.orders_skus_id",
        joins: [
          ["sku_settings ss", "os.sku_settings_id", "ss.id"],
          [
            "factory_sku_settings fss",
            "os.sku_settings_id",
            "fss.sku_settings_id",
          ],
          ["product_status ps", "os.product_status_id", "ps.id"],
        ],
        where: [
          ["fss.factory_id", "=", factory_id],
          ["os.product_status_id", "=", 1],
        ],
        response_key: "items",
      },
    ];

    const response = await DataController.selectNested(
      "orders o",
      column1,
      "timesort",
      "DESC",
      100,
      0,
      join1,
      null,
      null,
      nestedKey,
      nestedTables
    );
    console.log(response);
    return response.status;
  } catch (error) {
    throw error;
  }
};

const get_po_list = async (filterValues, limit1, page1) => {
  try {
    const column1 = [
      "po.po_order_id",
      "po.timesort",
      "po.po_order_date",
      "po.factory_id",
      "po.po_order_status_id",
      "po.total_amount",
      "po.notes",
      "f.name AS factory_name",
      "pos.name AS order_status",
    ];

    const join1 = [
      ["factories f", "po.factory_id", "f.id"],
      ["po_orders_status pos", "po.po_order_status_id", "pos.id"],
    ];

    const nestedKey = "po_order_id";

    const nestedTables = [
      {
        table: "po_orders_items poi",
        columns: [
          "poi.po_order_item_id",
          "poi.po_order_id",
          "poi.orders_skus_id",
          "poi.sku_settings_id",
          "poi.quantity",
          "poi.item_price",
          "poi.total",
          "poi.po_order_item_status_id",
          "ss.order_product_sku",
          "ss.report_product_name",
        ],
        order_by: "poi.po_order_item_id",
        joins: [["sku_settings ss", "poi.sku_settings_id", "ss.id"]],
        response_key: "items",
      },
      {
        table: "po_orders_files pof",
        columns: [
          "pof.id",
          "pof.po_order_id",
          "pof.file_name",
          "pof.file_pathname",
        ],
        order_by: "pof.id",
        response_key: "files",
      },
    ];

    const response = await DataController.selectNested(
      "po_orders po",
      column1,
      "po.po_order_date",
      "DESC",
      limit1,
      0,
      join1,
      null,
      null,
      nestedKey,
      nestedTables
    );
    console.log(response);
    return response.status;
  } catch (error) {
    throw error;
  }
};

const get_po_details = async (po_order_id) => {
  try {
    const column1 = [
      "po.po_order_id",
      "po.timesort",
      "po.po_order_date",
      "po.factory_id",
      "po.po_order_status_id",
      "po.total_amount",
      "po.notes",
      "f.name AS factory_name",
      "f.contact_number",
      "f.email_address",
      "pos.name AS order_status",
    ];

    const join1 = [
      ["factories f", "po.factory_id", "f.id"],
      ["po_orders_status pos", "po.po_order_status_id", "pos.id"],
    ];

    const where1 = [["po.po_order_id", "=", po_order_id]];

    const nestedKey = "po_order_id";

    const nestedTables = [
      {
        table: "po_orders_items poi",
        columns: [
          "poi.po_order_item_id",
          "poi.po_order_id",
          "poi.orders_skus_id",
          "poi.sku_settings_id",
          "poi.quantity",
          "poi.item_price",
          "poi.total",
          "poi.po_order_item_status_id",
          "ss.order_product_sku",
          "ss.report_product_name",
        ],
        order_by: "poi.po_order_item_id",
        joins: [["sku_settings ss", "poi.sku_settings_id", "ss.id"]],
        response_key: "items",
      },
      {
        table: "po_orders_files pof",
        columns: [
          "pof.id",
          "pof.po_order_id",
          "pof.file_name",
          "pof.file_pathname",
        ],
        order_by: "pof.id",
        response_key: "files",
      },
    ];

    const response = await DataController.selectNested(
      "po_orders po",
      column1,
      "po.po_order_date",
      "DESC",
      null,
      null,
      join1,
      where1,
      null,
      nestedKey,
      nestedTables
    );
    return response.status;
  } catch (error) {
    throw error;
  }
};

const get_factory_draft = async (factory_id) => {
  try {
    const column1 = [
      "po.po_order_id",
      "po.timesort",
      "po.po_order_date",
      "po.factory_id",
      "po.po_order_status_id",
      "po.total_amount",
      "po.notes",
      "f.name AS factory_name",
      "f.contact_number",
      "f.email_address",
      "pos.name AS order_status",
    ];

    const join1 = [
      ["factories f", "po.factory_id", "f.id"],
      ["po_orders_status pos", "po.po_order_status_id", "pos.id"],
    ];

    const where1 = [
      ["po.factory_id", "=", factory_id],
      ["po.po_order_status_id", "=", 5],
    ];

    const nestedKey = "po_order_id";

    const nestedTables = [
      {
        table: "po_orders_items poi",
        columns: [
          "poi.po_order_item_id",
          "poi.po_order_id",
          "poi.orders_skus_id",
          "poi.sku_settings_id",
          "poi.quantity",
          "poi.item_price",
          "poi.total",
          "poi.po_order_item_status_id",
          "ss.order_product_sku",
          "ss.report_product_name",
        ],
        order_by: "poi.po_order_item_id",
        joins: [["sku_settings ss", "poi.sku_settings_id", "ss.id"]],
        response_key: "items",
      },
      {
        table: "po_orders_files pof",
        columns: [
          "pof.id",
          "pof.po_order_id",
          "pof.file_name",
          "pof.file_pathname",
        ],
        order_by: "pof.id",
        response_key: "files",
      },
    ];

    const response = await DataController.selectNested(
      "po_orders po",
      column1,
      "po.po_order_date",
      "DESC",
      null,
      null,
      join1,
      where1,
      null,
      nestedKey,
      nestedTables
    );
    return response.status;
  } catch (error) {
    throw error;
  }
};

export const PODataController = {
  get_factory_list,
  get_factory_details,
  get_factory_skus,
  get_factory_draft,
  get_pre_po_order,
  get_po_list,
  get_po_order_status,
  get_po_details,
};
