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
