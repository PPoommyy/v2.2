const formatPhoneNumber = (phoneNumber) => {
    return phoneNumber.replace(/[^\d]/g, '');
}

const splitAddressData = (addressData) => {
    const regex1 = /\s*[\r\n]+\s*/;
    const regex2 = /\s*[·]+\s*/;
    
    const parts1 = addressData.split(regex1).map(part => part.trim());

    const result = parts1.map(part =>
        part.split(regex2)
            .map(innerPart => innerPart.trim())
            .filter(innerPart => innerPart !== '')
    ).filter(part => part.length > 0);

    return result;
}

const getValueByIndex = (array, length, isRequired) => {
    if (isRequired) {
        return array.length === length ? array[length-1] ? array[length-1] : null : array[0];
    } else {
        return array.length === length ? array[0] : null;
    }
}

const checkThaiProvince = (addressArray) => {
    const thaiProvinceArray = [
        ["กทม", "Bangkok"],
        ["กรุงเทพมหานคร", "Bangkok"],
        ["สมุทรปราการ", "Samut Prakan"],
        ["นนทบุรี", "Nonthaburi"],
        ["ปทุมธานี", "Pathum Thani"],
        ["พระนครศรีอยุธยา", "Ayutthaya"],
        ["อ่างทอง", "Ang Thong"],
        ["ลพบุรี", "Lopburi"],
        ["สิงห์บุรี", "Sing Buri"],
        ["ชัยนาท", "Chai Nat"],
        ["สระบุรี", "Saraburi"],
        ["ชลบุรี", "Chonburi"],
        ["ระยอง", "Rayong"],
        ["จันทบุรี", "Chanthaburi"],
        ["ตราด", "Trat"],
        ["ฉะเชิงเทรา", "Chachoengsao"],
        ["ปราจีนบุรี", "Prachin Buri"],
        ["นครนายก", "Nakhon Nayok"],
        ["สระแก้ว", "Sa Kaeo"],
        ["นครราชสีมา", "Nakhon Ratchasima"],
        ["บุรีรัมย์", "Buri Ram"],
        ["สุรินทร์", "Surin"],
        ["ศรีสะเกษ", "Sisaket"],
        ["อุบลราชธานี", "Ubon Ratchathani"],
        ["ยโสธร", "Yasothon"],
        ["ชัยภูมิ", "Chaiyaphum"],
        ["อำนาจเจริญ", "Amnat Charoen"],
        ["บึงกาฬ", "Bueng Kan"],
        ["หนองบัวลำภู", "Nong Bua Lam Phu"],
        ["ขอนแก่น", "Khon Kaen"],
        ["อุดรธานี", "Udon Thani"],
        ["เลย", "Loei"],
        ["หนองคาย", "Nong Khai"],
        ["มหาสารคาม", "Maha Sarakham"],
        ["ร้อยเอ็ด", "Roi Et"],
        ["กาฬสินธุ์", "Kalasin"],
        ["สกลนคร", "Sakon Nakhon"],
        ["นครพนม", "Nakhon Phanom"],
        ["มุกดาหาร", "Mukdahan"],
        ["เชียงใหม่", "Chiang Mai"],
        ["ลำพูน", "Lamphun"],
        ["ลำปาง", "Lampang"],
        ["อุตรดิตถ์", "Uttaradit"],
        ["แพร่", "Phrae"],
        ["น่าน", "Nan"],
        ["พะเยา", "Phayao"],
        ["เชียงราย", "Chiang Rai"],
        ["แม่ฮ่องสอน", "Mae Hong Son"],
        ["นครสวรรค์", "Nakhon Sawan"],
        ["อุทัยธานี", "Uthai Thani"],
        ["กำแพงเพชร", "Kamphaeng Phet"],
        ["ตาก", "Tak"],
        ["สุโขทัย", "Sukhothai"],
        ["พิษณุโลก", "Phitsanulok"],
        ["พิจิตร", "Phichit"],
        ["เพชรบูรณ์", "Phetchabun"],
        ["ราชบุรี", "Ratchaburi"],
        ["กาญจนบุรี", "Kanchanaburi"],
        ["สุพรรณบุรี", "Suphan Buri"],
        ["นครปฐม", "Nakhon Pathom"],
        ["สมุทรสาคร", "Samut Sakhon"],
        ["สมุทรสงคราม", "Samut Songkhram"],
        ["เพชรบุรี", "Phetchaburi"],
        ["ประจวบคีรีขันธ์", "Prachuap Khiri Khan"],
        ["นครศรีธรรมราช", "Nakhon Si Thammarat"],
        ["กระบี่", "Krabi"],
        ["พังงา", "Phang Nga"],
        ["ภูเก็ต", "Phuket"],
        ["สุราษฎร์ธานี", "Surat Thani"],
        ["ระนอง", "Ranong"],
        ["ชุมพร", "Chumphon"],
        ["สงขลา", "Songkhla"],
        ["สตูล", "Satun"],
        ["ตรัง", "Trang"],
        ["พัทลุง", "Phatthalung"],
        ["ปัตตานี", "Pattani"],
        ["ยะลา", "Yala"],
        ["นราธิวาส", "Narathiwat"]
    ];    

    const provinceNames = addressArray.filter(item => thaiProvinceArray.flat().includes(item));

    const isThaiProvince = provinceNames.length > 0;

    return isThaiProvince;
}

 const isValidEmail = (str) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
}

export const AddressController = {
    formatPhoneNumber,
    splitAddressData,
    getValueByIndex,
    checkThaiProvince,
    isValidEmail
}