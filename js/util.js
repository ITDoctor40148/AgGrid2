function removeDuplicateElement(arr) {
    let unique = [...new Set(arr)];
    return unique;
}

function array2SQL(data) {
    return data.toString().split(";").join(";\n").split("\n,").join("\n");
}

function convertDate2ISOFormat(date) {
    let res = {};
    res["year"] = date.getFullYear();
    res["month"] = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1).toString() : "0" + (date.getMonth() + 1);
    res["day"] = date.getDate() > 9 ? date.getDate().toString() : "0" + date.getDate();
    return res;
}

function getTodayDate() {
    return getISODate(new Date());
}

function getISODate(date) {
    let today = convertDate2ISOFormat(date);
    return today.year + "-" + today.month + "-" + today.day;
}