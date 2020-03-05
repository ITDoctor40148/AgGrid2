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

function getQuaterDate(date, isStart = true) {
    let res = "";
    let dateT = new Date(date);
    res = strftime("%Y", dateT);
    let month = isStart ? parseInt((parseInt(strftime("%m", dateT)) + 2) / 3) * 3 - 2 : parseInt((parseInt(strftime("%m", dateT)) + 2) / 3) * 3;
    month = month > 9 ? month : "0" + month;
    console.log(res + "-" + month);
    return res + "-" + month;
}

function getQuaterDateEnd(date) {
    let tmp = date.split("-");
    let month = parseInt(tmp[1]);
    month = month + 2;
    let monthString = month > 9 ? month.toString() : "0" + month;
    return tmp[0] + "-" + monthString + "-31";
}