import { Alert } from "../components/Alert.js";
import { DataController } from "../components/DataController.js";


const get_factory_details = async (factoryId) => {
    try {
        const response = await DataController.selectByKey("factories", "id", parseInt(factoryId));
        return response;
    } catch (error) {
        throw error;
    }
};

const get_factory_sku_search = async(searchTerm, factory_id) => {
    try {
        const response = await axios.get(`../backend/get_factory_sku_search.php?factory_id=${factory_id}&searchTerm=${searchTerm}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_po_order_details = async(po_orders_id) => {
    try {
        const response = await axios.get(`../backend/get_po_order_details.php?po_orders_id=${po_orders_id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_sku_by_name = async (name) => {
    try {
        const response = await axios.get(`../backend/get_sku_by_name.php?name=${name}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const get_last_timesort = async(yearAndMonth) => {
    try {
        const response = await axios.get(`../backend/get_last_timesort.php?table=po_orders&year_and_month=${yearAndMonth}`);
        return response.data.last_timesort;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function toggleSpinner(loading) {
    const spinner = document.getElementById('loading-spinner');
    if (loading) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

const stock = await DataController.select("stock", ["*"], "received_date", 100, 1);
console.log(stock);