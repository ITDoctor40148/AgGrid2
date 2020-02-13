function onAnswer() {
    createTempTable("2020-10-20", "2020-12-21", 'M');
    let res = db.exec(createTempTable("2020-11-20", "2020-11-22", 'D') + "SELECT * FROM temp;");
    let columnDefsTemp = [];
    res[0].columns.map((col, id) => {
        if (col.split("-").length >= 3) {
            columnDefsTemp.push({
                headerName: col,
                field: col,
                enableRowGroup: true,
                enablePivot: true,
                hide: true,
                enableValue: true,
                aggFunc: id % 2 ? "sum" : "avg"
            })
        }
    });
    // gridOptions.columnDefs = columnDefs;
    // gridOptions.startDate = "2020-11-20";
    // gridOptions.endDate = "2020-11-21";
    // gridOptions.dateType = "D";
    gridOptions.api.setColumnDefs([...columnDefs, ...columnDefsTemp]);
}

function onPropertyChange(obj) {
    gridOptions.property = obj.value;
    gridOptions.api.onFilterChanged();
}

function createTempTable(startDate, endDate, type) {
    let sql = "DROP TABLE IF EXISTS temp; CREATE TABLE temp (attribute1 INTEGER,attribute2 INTEGER,attribute3 INTEGER,attribute4 INTEGER,attribute5 INTEGER,attribute6 INTEGER,attribute7 INTEGER,attribute8 INTEGER,attribute9 INTEGER,attribute10 INTEGER,channel1 INTEGER,channel2 INTEGER,channel3 INTEGER,property INTEGER, date_created text,";
    let additional_field_date_float = [];
    let additional_field = [];
    let selectSql = [];
    let start = "";
    let end = "";
    let s_date = "";
    let e_date = "";
    switch (type) {
        case 'D':
            start = strftime("%Y-%m-%d", asDate(startDate));
            end = strftime("%Y-%m-%d", asDate(endDate));
            e_date = s_date = start;
            for (let i = new Date(start), j = 0; i <= new Date(end); i.setDate(i.getDate() + 1), j++) {
                let tmp = "";
                if (j === 0) {
                    tmp = "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, date_created, value as '" + getISODate(i) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS keys" + j + " FROM tree WHERE value_date BETWEEN '" + s_date + "' AND '" + e_date + "')";
                } else {
                    tmp = " INNER JOIN (SELECT value as '" + getISODate(i) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS keys" + j + " FROM tree WHERE value_date BETWEEN '" + s_date + "' AND '" + e_date + "') ON keys0 = keys" + j;
                }

                selectSql.push(tmp);
                additional_field_date_float.push('"' + getISODate(i) + '"');
                additional_field.push("keys" + j);
            }
            break;
        case 'W':
            start = strftime("%Y-%w", asDate(startDate));
            end = strftime("%Y-%w", asDate(endDate));

            break;
        case 'M':
            start = strftime("%Y-%m", asDate(startDate));
            end = strftime("%Y-%m", asDate(endDate));
            s_date = calDateRange("M", start).start;
            e_date = calDateRange("M", end).end;

            for (let i = new Date(start); i <= new Date(end); i.setMonth(i.getMonth() + 1)) {
                console.log(strftime("%Y-%m", asDate(getISODate(i))));
            }

            break;
        case 'Q':
            break;
        case 'Y':
            break;
        default:
            break;
    }
    //  + additional_field.join(" text,") + " text);"
    sql += additional_field_date_float.join(" float,") + " float);" + " INSERT INTO temp SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, date_created, " + additional_field_date_float.join(",") + " FROM " + selectSql.join("") + ";";
    // console.log(sql);
    return sql;
}

function calDateRange(type, start) {
    let result = {};
    switch (type) {
        case 'D':
            result['start'] = start;
            result['end'] = start;
            break;
        case 'M':
            result['start'] = start + "-" + "01";
            result['end'] = start + "-" + "31";
            break;
        case 'Q':
            let year = start.slice(4);
            let quater = start.slice(-1) * 3;
            result['start'] = year + "-" + (quater - 2) + "-01";
            result['end'] = year + "-" + quater + "-31";
            break;
        case 'Y':
            result['start'] = start + "-01-01";
            result['end'] = start + "-12-31";
            break;
        default:
            break;
    }
    return result;
}

function modifyDataOfGrid(db, tableName, col = null, type = null, start = null, end = null) {
    let tableTree = [];
    let sqls = "SELECT * FROM " + tableName + ";";
    if (col != null) {
        sqls = "SELECT *, attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS keys FROM 'tree' ";
        let dateRange = calDateRange(type, start, end);
        let selectClause = "";
        // columnDefs = [];
        let columnDefsTemp = columnDefs.slice(0, columnDefs.length - 1);
        for (let i = new Date(dateRange.start), index = 0; i <= new Date(dateRange.end); i.setDate(i.getDate() + 1), index++) {
            let d = getISODate(i);

            let temp = "LEFT JOIN(SELECT value AS '" + d + "', attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE value_date = '" + d + "') ON (keys = joinkeys" + index + ")";
            sqls += temp;

            // columnDefsTemp.push({
            //     headerName: d,
            //     field: d
            // });
        }
        sqls += "WHERE user = 2 AND tag = 2 AND active = 0 AND change = 2  AND account = 0 AND model = 0 AND hierarchy = 1" + selectClause + " GROUP BY attribute1, attribute2, attribute3, attribute4,attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property;";
    }
    return sqls;
    // let tableTreeTemp = db.exec(sqls);
    // tableTreeTemp.map(item => {
    //     item.values.map(row => {
    //         var temp = {};
    //         item.columns.map((col, id) => {
    //             temp[col] = row[id];
    //         });
    //         tableTree.push(temp);
    //     });
    // })
    // return tableTree;
}

function asDate(dateAsString) {
    var splitFields = dateAsString.split("-");
    return new Date(splitFields[0], splitFields[1] - 1, splitFields[2]);
}

function getChannelString(channel_num, value_index) {

}

function getPropertyString(value_string) {

}

function getAttributeString(attribute_num, value_index) {

}

function decrypt() {

}

// get string value from int val and codetype
function getStringVal(codeType, intVal) {
    if ((codeType.slice(0, codeType.length - 1) == "attribute") || (codeType.slice(0, codeType.length - 1) == "channel")) {
        for (var i = 0; i < tableCode[0]["values"].length; i++) {
            var coderow = tableCode[0]["values"][i];
            if ((coderow[5] === codeType) && (coderow[7] === intVal)) {
                return coderow[6];
            }
        }
    } else {
        return false;
    }
}

// get int val from string val and codetype
function getIntVal(codeType, stringVal) {
    for (var i = 0; i < tableCode[0]["values"].length; i++) {
        var coderow = tableCode[0]["values"][i];
        if ((coderow[5] === codeType) && (coderow[6] === stringVal)) {
            return coderow[7];
        }
    }
    return -2;
}