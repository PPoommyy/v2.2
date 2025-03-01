import { DataController } from "./DataController.js";

const api_key = "asat_c559eeb1a43243319f731df19575d134";
let proxy_server = "https://cors-anywhere.herokuapp.com";

const createTracking = async (order, apiHost, tracking_number) => {
    const { details, all_total, sub_total, items, service_id } = order;
    const payload = {
        "slug": "thailand-post",
        "tracking_number": tracking_number,
        "title": `Order ${details.timesort}`,
        "emails": [
          "poorinat.p@gmail.com"
        ],
        "order_id": `ID ${details.order_id}`,
        "order_number": details.timesort,
        "order_id_path": `http://www.aftership.com/order_id=${details.order_id}`
    };
    try {
        const createTracking = await axios.post(
            `../../backend/api/aftership/aftership_create_tracking.php`,
            {
                payload
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        const to_insert = {
            order_id: details.order_id,
            tracking_id: createTracking.data.response.data.id,
            tracking_number: createTracking.data.response.data.tracking_number,
        };
        const updateTracking = await DataController.insert("tracking", to_insert);
        return createTracking.data;
    } catch (error) {
        throw error;
    }
}

export const AftershipAPIController = {
    createTracking
};