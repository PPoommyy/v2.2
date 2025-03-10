async function insert (table, insertedData) {
    try {
        const response = await axios.post(
            `../../backend/insert/insert.php`,
            {
                table,
                insertedData
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function updateByKey(table, conKey, conValue, key, value) {
    try {
        const url = `../../backend/update/update_by_key.php?table=${table}&condition_key=${conKey}&condition_value=${conValue}`;
        const response = await axios.post(url, { key, value });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function update(table, key, value, toUpdate) {
    try {
        const url = `../../backend/update/update.php?table=${table}`;
        const response = await axios.post(url, { key, value, toUpdate });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function _delete (table, key, value) {
    try {
        const url = `../../backend/delete/delete.php?table=${table}`;
        const response = await axios.post(url, { key, value });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function upload (formData, uploadDir) {
    try {
        const url = `../../backend/file/upload.php${uploadDir?"?uploadDir="+uploadDir:""}`;
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function download(pathname) {
    try {
        const url = `../../backend/file/download.php${pathname ? "?pathname=" + encodeURIComponent(pathname) : ""}`;
        const response = await axios.get(url, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

const select = async(table, column, order_by, limit, page, join = [], where = [], logical_operator) => {
    try {
        const response = await axios.post(
            `../../backend/select/select.php?table=${table}&order_by=${order_by}&limit=${limit}&page=${page}`,
            {
                column,
                join,
                where,
                logical_operator
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

const selectByKey = async(table, key, value) => {
    try {
        const response = await axios.post(
            `../../backend/get/get_value_by_key.php?table=${table}`,
            {
                key,
                value
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const DataController = { 
    insert,
    update,
    select,
    selectByKey,
    _delete,
    updateByKey,
    upload,
    download
};