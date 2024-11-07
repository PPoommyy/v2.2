import { AddressController } from "../components/AddressController.js";
import { DataController } from "./DataController.js";

let proxy_server = "https://cors-anywhere.herokuapp.com";

const createToken = async (apiHost) => {
    try {
        var urlencoded = new URLSearchParams();
        /* urlencoded.append("username", "testuser1");
        urlencoded.append("password", "12345");
        urlencoded.append("grant_type", "password"); */
        urlencoded.append("username", "boxsense");
        urlencoded.append("password", "QUEBECpost");
        urlencoded.append("grant_type", "password");
        const response = await axios.post(
            `${proxy_server}/${apiHost}/api/token`,
            urlencoded,
            {
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

const generateBarcode = async (order, apiHost, accessToken) => {
    const itemsList = [];

    const contentPieces = [];

    const { details, all_total, sub_total, items, service_id } = order; 
    /* console.log("order");
    console.log(order);
    console.log("items");
    console.log(items); */

    const resultArray = AddressController.splitAddressData(details.raw_address).slice(1);

    const addressSplit = AddressController.splitAddressData(details.raw_address);
    const addressLineCount = addressSplit.length;
    const haveEmail = addressSplit[addressLineCount -1][0].indexOf('@') !== -1;

    let buyer_email, buyer_phone_number, ship_country, ship_city, ship_postal_code, ship_state;

    if (haveEmail) {
        buyer_phone_number = addressSplit[addressLineCount-2][0];
        ship_country = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
        ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, false);
        ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-4], 2, true);
        ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
    } else if (addressLineCount > 4) {
        buyer_phone_number = addressSplit[addressLineCount - 1][0];
        ship_country = AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, true);
        ship_city = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, false);
        ship_postal_code = AddressController.getValueByIndex(addressSplit[addressLineCount-3], 2, true);
        ship_state = AddressController.getValueByIndex(addressSplit[addressLineCount-2], 2, false);
    } else {
        buyer_phone_number = addressSplit[addressLineCount - 1][0];
        ship_city = null;
        ship_postal_code = null;
        ship_state = null;
    }

    const receiver_address = addressSplit[1]?addressSplit[1].length > 0 ? addressSplit[1].join(" ") : addressSplit[1]:"";

    items.forEach(item => {
        const newContentPieces = {
            "desc": item.order_product_sku,
            "amount": item.total,
            "currency": details.currency_code,
            "netWeight": 1,
            "unit": item.quantity_purchased,
            "originalLocation": "TH",
            "tariff": "95060110"
        }

        contentPieces.push(newContentPieces);
    });

    const newItem = {
        "itemId": details.timesort,
        "categoryItem": "merchandise",
        "weight": 1,
        "sender": {
            "name": "Boxsense",
            "tel": "0889564992",
            "email": "",
            "address": {
            "premises": "18/94 Soi Ramintra 65",
            "subDistrict": "Tharang",
            "district": "Bangkhen",
            "province": "Bangkok",
            "postalCode": "10230",
            "country": "Thailand",
            "countryCode": "TH"
            }
        },
        "receiver": {
            "name": details.buyer_name ? details.buyer_name.toUpperCase() : "",
            "tel": buyer_phone_number ? AddressController.formatPhoneNumber(buyer_phone_number) : "",
            "email": haveEmail ? addressSplit[addressLineCount-1][0] : "",
            "address": {
                "premises": addressSplit[1]?addressSplit[1].length > 0 ? addressSplit[1].join(" ") : addressSplit[1]:"",
                "city": ship_city ? ship_city : "",
                "state": ship_state ? ship_state : "",
                "postalCode": ship_postal_code ? ship_postal_code : "",
                "country": ship_country ? ship_country : "Thailand",
                "countryCode": details.ship_country ? details.ship_country === "UK" ? "GB" : details.ship_country : ""
            }
        },
        "contentPieces": [
            {
                "desc": "Boxing Equipment",
                "amount": sub_total,
                "currency": details.currency_code,
                "netWeight": 1,
                "unit": 1,
                "originalLocation": "TH",
                "tariff": "950691"
            }
        ]
    }

    /* console.log("contentPieces");
    console.log(contentPieces); */
    itemsList.push(newItem);
        
    /* console.log("itemsList");
    console.log(itemsList); */
    const payload = { 
        "service": /* 2 */service_id.service_id,
        items: itemsList
     };
    
    console.log("payload");
    console.log(payload);

    try {
        const response = await axios.post(
            `${proxy_server}/${apiHost}/api/item/outbound`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        throw error;
    }
}


async function uploadFile(fileUrl, orderId) {
    const response = await axios.get(`${proxy_server}/${fileUrl}`, { responseType: 'blob' });
    console.log("response");
    console.log(response);
    const formData = new FormData();
    const file = new File([response.data], `label-${orderId}.pdf`);
    console.log("file");
    console.log(file);
    formData.append('file', file, `label-${orderId}.pdf`);
    console.log("formData");
    console.log(formData);
    const uploadResponse = await DataController.upload(formData, "../files/");
    console.log("uploadResponse");
    console.log(uploadResponse);
    const to_insert_file = {
        order_id: orderId,
        file_name: uploadResponse.fileName,
        file_pathname: uploadResponse.filePath,
    };

    const updateOrderFile = await DataController.insert("order_files", to_insert_file);
    console.log("updateOrderFile");
    console.log(updateOrderFile);
    return updateOrderFile;
}

export const ThaiPostAPIController = { 
    createToken,
    uploadFile,
    generateBarcode
};