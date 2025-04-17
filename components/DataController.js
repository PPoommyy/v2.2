const insert = async (table, insertedData) => {
  try {
    const response = await axios.post(
      `../../backend/insert/insert.php`,
      {
        table,
        insertedData,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateByKey = async (table, conKey, conValue, key, value) => {
  try {
    const url = `../../backend/update/update_by_key.php?table=${table}&condition_key=${conKey}&condition_value=${conValue}`;
    const response = await axios.post(url, { key, value });
    return response.data;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const update = async (table, key, value, toUpdate) => {
  try {
    const url = `../../backend/update/update.php?table=${table}`;
    const response = await axios.post(url, { key, value, toUpdate });
    return response.data;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const _delete = async (table, key, value) => {
  try {
    const url = `../../backend/delete/delete.php?table=${table}`;
    const response = await axios.post(url, { key: key, value: value });
    return response.data;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const upload = async (formData, uploadDir) => {
  try {
    const url = `../../backend/file/upload.php${
      uploadDir ? "?uploadDir=" + uploadDir : ""
    }`;
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    Alert.showErrorMessage();
  }
};

const download = async (pathname) => {
  try {
    const url = `../../backend/file/download.php${
      pathname ? "?pathname=" + encodeURIComponent(pathname) : ""
    }`;
    const response = await axios.get(url, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

const select = async (
  table,
  column,
  order_by,
  limit,
  page,
  join = [[]],
  where = [[]],
  logical_operator,
  order_by_type = "ASC",
  group_by
) => {
  try {
    const response = await axios.post(
      `../../backend/select/select.php?table=${table}&order_by=${order_by}${
        limit ? "&limit=" + limit : ""
      }${page ? "&page=" + page : ""}${
        order_by_type ? "&order_by_type=" + order_by_type : ""
      }${group_by ? "&group_by=" + group_by : ""}`,
      {
        column,
        join,
        where,
        logical_operator,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const selectNested = async (
  table1,
  column1,
  order_by1,
  order_by_type1,
  limit1,
  page1,
  join1 = [[]],
  where1 = [[]],
  logical_operator1,
  nestedKey,
  nestedTables // Array ของ nested table
) => {
  try {
    const response = await axios.post(
      `../../backend/select/select_nested.php?table1=${table1}&order_by1=${order_by1}${
        order_by_type1 ? "&order_by_type1=" + order_by_type1 : ""
      }${limit1 ? "&limit1=" + limit1 : ""}${page1 ? "&page1=" + page1 : ""}`,
      {
        column1,
        join1,
        where1,
        logical_operator1,
        nestedKey,
        nestedTables, // ส่ง array ของ nested tables
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const selectByKey = async (table, key, value) => {
  try {
    const response = await axios.post(
      `../../backend/get/get_value_by_key.php?table=${table}`,
      {
        key,
        value,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const _count = async (
  table,
  column,
  order_by,
  limit,
  page,
  join = [[]],
  where = [[]],
  logical_operator
) => {
  try {
    const response = await axios.post(
      `../../backend/select/select.php?table=${table}&order_by=${order_by}${
        limit ? "&limit" + limit : ""
      }${page ? "&page" + page : ""}`,
      {
        column,
        join,
        where,
        logical_operator,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const DataController = {
  insert,
  update,
  select,
  selectNested,
  selectByKey,
  _delete,
  updateByKey,
  upload,
  download,
  _count,
};
