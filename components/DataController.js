async function insert (table, insertedData) {
    try {
        const response = await axios.post(
            `../datasets/insert.php`,
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
        const url = `../datasets/update_by_key.php?table=${table}&condition_key=${conKey}&condition_value=${conValue}`;
        const response = await axios.post(url, { key, value });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function update(table, key, value, toUpdate) {
    try {
        const url = `../datasets/update.php?table=${table}`;
        const response = await axios.post(url, { key, value, toUpdate });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function _delete (table, key, value) {
    try {
        const url = `../datasets/delete.php?table=${table}`;
        const response = await axios.post(url, { key, value });
        return response.data;
    } catch (error) {
        Alert.showErrorMessage();
    }
}

async function upload (formData, uploadDir) {
    try {
        const url = `../datasets/upload.php${uploadDir?"?uploadDir="+uploadDir:""}`;
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
        const url = `../datasets/download.php${pathname ? "?pathname=" + encodeURIComponent(pathname) : ""}`;
        const response = await axios.get(url, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

const select = async(table, column, orderBy, limit, page) => {
    try {
        const response = await axios.post(
            `../datasets/select.php`,
            {
                column
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                parameters: {
                    'table': table,
                    'limit': limit,
                    'page': page,
                    'order_by': orderBy
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
    _delete,
    updateByKey,
    upload,
    download
};