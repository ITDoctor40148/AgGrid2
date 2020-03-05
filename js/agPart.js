let visibleColsTemp = [];

var columnDefs = [{
        headerName: "attribute1",
        field: "attribute1",
        enableRowGroup: true,
        // rowGroup: true,
        enablePivot: true,
        hide: false
    },
    {
        headerName: "attribute2",
        field: "attribute2",
        enableRowGroup: true,
        hide: false
    },
    {
        headerName: "attribute3",
        field: "attribute3",
        hide: false
    },
    {
        headerName: "attribute4",
        field: "attribute4",
        hide: false
    },
    {
        headerName: "attribute5",
        field: "attribute5",
        hide: false
    },
    {
        headerName: "attribute6",
        field: "attribute6",
        hide: false
    },
    {
        headerName: "attribute7",
        field: "attribute7",
        hide: false
    },
    {
        headerName: "attribute8",
        field: "attribute8",
        hide: false
    },
    {
        headerName: "attribute9",
        field: "attribute9",
        hide: false
    },
    {
        headerName: "attribute10",
        field: "attribute10",
        hide: false
    },
    {
        headerName: "channel1",
        field: "channel1",
        enableRowGroup: true,
        // rowGroup: true,
        hide: false
    },
    {
        headerName: "channel2",
        field: "channel2",
        enableRowGroup: true,
        hide: false
    },
    {
        headerName: "channel3",
        field: "channel3",
        enableRowGroup: true,
        hide: false
    },
    {
        headerName: "date_created",
        field: "date_created"
    }
];

var gridOptions = {
    defaultColDef: {
        width: 120,
        allowedAggFuncs: ['SUM', 'MIN', 'MAX', 'AVG'],
        sortable: true,
        filter: true,
        resizable: true
    },
    suppressFieldDotNotation: true,
    autoGroupColumnDef: {
        width: 180,
        pinned: 'left'
    },
    rowBuffer: 0,
    columnDefs: columnDefs,
    rowModelType: 'serverSide',
    enableSeversideFilter: true,
    rowGroupPanelShow: 'always',
    animateRows: true,
    debug: false,
    suppressAggFuncInHeader: true,
    sideBar: {
        toolPanels: [{
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
            toolPanelParams: {
                suppressPivots: true,
                suppressPivotMode: true,
            }
        }],
        defaultToolPanel: 'columns'
    },
    maxConcurrentDatasourceRequests: 1,
    cacheBlockSize: 100,
    maxBlocksInCache: 2,
    purgeClosedRowNodes: true,
    property: "",
    datesS: "",
    datesE: "",
    dateType: "",
    expandedGroupIds: [],
    // rememberGroupStateWhenNewData: true,
    // onFirstDataRendered: function(params) {
    //     params.api.sizeColumnsToFit();
    // },
    getRowNodeId: function(node) {
        return node.id;
    },
    onRowGroupOpened: function(params) {
        var id = params.node.id;
        if (params.node.expanded) {
            if (gridOptions.expandedGroupIds.indexOf(id) < 0) {
                gridOptions.expandedGroupIds.push(id);
            }
        } else {
            gridOptions.expandedGroupIds = gridOptions.expandedGroupIds.filter(function(grpId) { return !grpId.startsWith(id); });
        }
    },
    onVirtualColumnsChanged: function() {
        let visibleCols = extractDateType(gridOptions.columnApi.getAllDisplayedVirtualColumns());
        if (visibleCols.length === 0) {
            gridOptions.datesS = gridOptions.datesE = (dateStart.value);
        } else if (JSON.stringify(visibleCols) !== JSON.stringify(visibleColsTemp)) {
            // visibleCols = visibleColsTemp;
            gridOptions.datesS = calDatesFromCol(visibleCols[0], gridOptions.dateType);
            gridOptions.datesE = calDatesFromCol(visibleCols[visibleCols.length - 1], gridOptions.dateType, false);
            setTimeout(() => {
                gridOptions.api.purgeServerSideCache([]);
            }, 0);
        } else {
            console.log(visibleCols);
            gridOptions.api.purgeServerSideCache([]);
        }
    }
};

class FakeServer {
    constructor(worker) {
        this.worker = worker;
    }
    getData(request, resultsCallback) {
        const SQL = this.buildSql(request);
        console.log(SQL);
        // const SQL = modifyDataOfGrid(this.db, "tree", "value_date", "D", "2020-11-20", "2020-11-21");
        this.worker.onmessage = (event) => {
            if (event.data.id === 22) {
                let tableTree = [];
                let results = event.data.results;
                // console.log(request);
                results.map(item => {
                    item.values.map(row => {
                        var temp = {};
                        item.columns.map((col, id) => {
                            var res = getStringVal(col, row[id]);
                            if (res) {
                                temp[col] = res;
                            } else {
                                temp[col] = row[id];
                            }
                        });
                        // var parentId = groupKeys.length > 0 ? groupKeys.join("") : "";
                        if (request.groupKeys.length !== 0) {
                            temp['id'] = request.groupKeys.length > 0 ? request.groupKeys.join("-") : temp[request.rowGroupCols[0].id];
                            if (request.groupKeys.length > 0) {
                                let tail = request.rowGroupCols[request.groupKeys.length] ? temp[request.rowGroupCols[request.groupKeys.length].id] : temp.keys;
                                temp.id += "-" + tail;
                            }
                            // console.log(temp);
                        } else {
                            temp['id'] = temp['attribute1'];
                        }
                        // request.groupKeys.map((item, id) => {
                        //     console.log(temp[request.rowGroupCols[id].id]);
                        //     temp['id'] += "-" + temp[request.rowGroupCols[id].id];
                        // });

                        tableTree.push(temp);
                    });
                });

                const rowCount = this.getRowCount(request, tableTree);
                const resultsForPage = this.cutResultsToPageSize(request, tableTree);
                // console.log(tableTree);
                resultsCallback(resultsForPage, rowCount);
            }
            if (event.data.id === 222) {
                this.worker.postMessage({ id: 22, action: 'exec', sql: SQL.SQL });
            }
        };
        this.worker.postMessage({ id: 22, action: 'exec', sql: SQL });
        // if (request.additional.isFirst) {
        //     let insertSQL = "DROP TABLE IF EXISTS temp; CREATE TABLE temp (";
        //     let colArr = [];
        //     request.additional.columns.map(item => {
        //         colArr.push(item.field);
        //     });
        //     insertSQL += colArr.join(",") + ");INSERT INTO temp SELECT * FROM " + SQL.temp;
        //     console.log(insertSQL);
        //     this.worker.postMessage({ id: 222, action: 'exec', sql: insertSQL });
        // } else {
        //     this.worker.postMessage({ id: 22, action: 'exec', sql: SQL.SQL });
        // }
    }

    buildSql(request) {
        const selectSql = this.createSelectSql(request);
        const fromSql = this.buildFromSql(request);

        // const leftJoinSql = this.createLeftJoinSql(request, isAdditional);

        const whereSql = this.createWhereSql(request);
        const limitSql = this.createLimitSql(request);

        const orderBySql = this.createOrderBySql(request);
        const groupBySql = this.createGroupBySql(request);

        const SQL = selectSql + fromSql + whereSql + groupBySql + orderBySql + limitSql;

        // console.log(SQL);
        return SQL;
        // return { SQL: SQL, temp: fromSql.temp };
    }

    buildFromSql(request) {
        let fromSql = "";
        let d = "";
        switch (request.additional.type) {
            case 'D':
                for (let i = new Date(request.additional.startD), index = 0; i <= new Date(request.additional.endD); i.setDate(i.getDate() + 1), index++) {
                    d = getISODate(i);
                    if (index === 0) {
                        fromSql += "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, date_created, SUM(value) AS '" + d + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  keys" + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d + "' GROUP BY keys)";
                        continue;
                    }

                    let temp = "INNER JOIN(SELECT SUM(value) AS '" + d + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d + "' GROUP BY joinkeys" + index + ") ON (keys = joinkeys" + index + ")";
                    fromSql += temp;
                }
                break;
            case 'W':
                for (let i = new Date(request.additional.startD), index = 0; i <= new Date(request.additional.endD); i.setDate(i.getDate() + 7), index++) {
                    d = getISODate(i);
                    if (index === 0) {
                        fromSql += "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, SUM(value) AS '" + d + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  keys" + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d + "' GROUP BY keys)";
                        continue;
                    }

                    let temp = "INNER JOIN(SELECT SUM(value) AS '" + d + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d + "' GROUP BY joinkeys" + index + ") ON (keys = joinkeys" + index + ")";
                    fromSql += temp;
                }
                break;
            case 'M':
                // console.log(request.additional.startD.slice(0, 7));
                for (let i = new Date(request.additional.startD), index = 0; i < new Date(request.additional.endD); i.setMonth(i.getMonth() + 1), index++) {
                    d = getISODate(i);
                    console.log(i);
                    if (index === 0) {
                        fromSql += "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, SUM(value) AS '" + d.slice(0, 5) + "" + d.slice(5, 7) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  keys" + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d.slice(0, 7) + "-31' GROUP BY keys)";
                        continue;
                    }

                    let temp = "INNER JOIN(SELECT SUM(value) AS '" + d.slice(0, 5) + "" + d.slice(5, 7) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE  value_date BETWEEN '" + d + "' AND '" + d.slice(0, 7) + "-31' GROUP BY joinkeys" + index + ") ON (keys = joinkeys" + index + ")";
                    fromSql += temp;
                }
                break;
            case 'Q':
                console.log("Start:%s,End:%s", request.additional.startD, request.additional.endD);
                for (let i = new Date(request.additional.startD), index = 0; i < new Date(request.additional.endD); i.setMonth(i.getMonth() + 3), index++) {
                    d = getISODate(i);
                    console.log(d);
                    if (index === 0) {
                        fromSql += "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, SUM(value) AS '" + d.slice(0, 5) + "0" + ((parseInt(strftime("%m", new Date(d))) + 2) / 3) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  keys" + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + getQuaterDateEnd(d) + "' GROUP BY keys)";
                        continue;
                    }

                    let temp = "INNER JOIN(SELECT SUM(value) AS '" + d.slice(0, 5) + "0" + ((parseInt(strftime("%m", new Date(d))) + 2) / 3) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE  value_date BETWEEN '" + d + "' AND '" + getQuaterDateEnd(d) + "' GROUP BY joinkeys" + index + ") ON (keys = joinkeys" + index + ")";
                    fromSql += temp;
                    console.log(fromSql);
                }
                break;
            case 'Y':
                for (let i = new Date(request.additional.startD.slice(0, 4) + "-01-01"), index = 0; i <= new Date(request.additional.endD.slice(0, 4) + "-12-31"); i.setFullYear(i.getFullYear() + 1), index++) {
                    d = getISODate(i);
                    console.log(d);
                    if (index === 0) {
                        fromSql += "(SELECT attribute1, attribute2, attribute3, attribute4, attribute5, attribute6, attribute7, attribute8, attribute9, attribute10, channel1, channel2, channel3, property, SUM(value) AS '" + d.slice(0, 4) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  keys" + " FROM tree WHERE value_date BETWEEN '" + d + "' AND '" + d.slice(0, 4) + "-12-31' GROUP BY keys)";
                        continue;
                    }

                    let temp = "INNER JOIN(SELECT SUM(value) AS '" + d.slice(0, 4) + "', property||attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE  value_date BETWEEN '" + d + "' AND '" + d.slice(0, 4) + "-12-31' GROUP BY joinkeys" + index + ") ON (keys = joinkeys" + index + ")";
                    fromSql += temp;
                }
                break;
            default:
                // return fromSql + "tree ";
                break;
        }
        // console.log(fromSql);
        return " FROM " + fromSql;
        // return { fromSql: " FROM temp ", temp: fromSql };
    }

    createSelectSql(request) {
        const rowGroupCols = request.rowGroupCols;
        const valueCols = request.valueCols;
        const groupKeys = request.groupKeys;

        if (this.isDoingGrouping(rowGroupCols, groupKeys)) {
            const colsToSelect = [];

            const rowGroupCol = rowGroupCols[groupKeys.length];
            colsToSelect.push(rowGroupCol.field);

            valueCols.forEach(function(valueCol) {
                colsToSelect.push("ROUND(" + valueCol.aggFunc + '("' + valueCol.field + '"), 2) as "' + valueCol.field + '"');
            });
            let result = ' SELECT ' + colsToSelect.join(', ');

            return result;
        }

        return ' SELECT *';
    }

    createFilterSql(key, item) {
        switch (item.filterType) {
            case 'text':
                return this.createTextFilterSql(key, item);
            case 'number':
                return this.createNumberFilterSql(key, item);
            default:
                console.log('unkonwn filter type: ' + item.filterType);
        }
    }

    createNumberFilterSql(key, item) {
        switch (item.type) {
            case 'equals':
                return key + ' = ' + item.filter;
            case 'notEqual':
                return key + ' != ' + item.filter;
            case 'greaterThan':
                return key + ' > ' + item.filter;
            case 'greaterThanOrEqual':
                return key + ' >= ' + item.filter;
            case 'lessThan':
                return key + ' < ' + item.filter;
            case 'lessThanOrEqual':
                return key + ' <= ' + item.filter;
            case 'inRange':
                return '(' + key + ' >= ' + item.filter + ' and ' + key + ' <= ' + item.filterTo + ')';
            default:
                console.log('unknown number filter type: ' + item.type);
                return 'true';
        }
    }

    createTextFilterSql(key, item) {
        switch (item.type) {
            case 'equals':
                return key + ' = "' + item.filter + '"';
            case 'notEqual':
                return key + ' != "' + item.filter + '"';
            case 'contains':
                return key + ' LIKE "%' + item.filter + '%"';
            case 'notContains':
                return key + ' NOT LIKE "%' + item.filter + '%"';
            case 'startsWith':
                return key + ' LIKE "' + item.filter + '%"';
            case 'endsWith':
                return key + ' LIKE "%' + item.filter + '"';
            default:
                console.log('unknown text filter type: ' + item.type);
                return 'true';
        }
    }

    createWhereSql(request) {
        const rowGroupCols = request.rowGroupCols;
        const groupKeys = request.groupKeys;
        const filterModel = request.filterModel;

        const that = this;
        const whereParts = [];

        // whereParts.push("user = 2");
        // whereParts.push("tag = 2");
        // whereParts.push("active = 0");
        // whereParts.push("change = 2");
        // whereParts.push("account = 0");
        // whereParts.push("model = 0");
        // whereParts.push("hierarchy = 1");
        // whereParts.push("property = " + request.additional.property);

        if (request.additional.property.length !== 0) {
            whereParts.push("property = " + request.additional.property);
        }

        if (groupKeys.length > 0) {
            groupKeys.forEach(function(key, index) {
                const colName = rowGroupCols[index].field;
                whereParts.push(colName + ' = "' + getIntVal(colName, key) + '"')
            });
        }

        if (whereParts.length > 0) {
            let result = ' WHERE ' + whereParts.join(' AND ');
            return result;
        } else {
            return '';
        }
    }

    createGroupBySql(request) {
        const rowGroupCols = request.rowGroupCols;
        const groupKeys = request.groupKeys;

        if (this.isDoingGrouping(rowGroupCols, groupKeys)) {
            const colsToGroupBy = [];

            const rowGroupCol = rowGroupCols[groupKeys.length];
            colsToGroupBy.push(rowGroupCol.field);

            return ' GROUP BY ' + colsToGroupBy.join(', ');
        } else {
            // select all columns
            return '';
        }
    }

    createOrderBySql(request) {
        const rowGroupCols = request.rowGroupCols;
        const groupKeys = request.groupKeys;
        const sortModel = request.sortModel;

        const grouping = this.isDoingGrouping(rowGroupCols, groupKeys);

        const sortParts = [];
        if (sortModel) {

            const groupColIds =
                rowGroupCols.map(groupCol => groupCol.id)
                .slice(0, groupKeys.length + 1);

            sortModel.forEach(function(item) {
                if (grouping && groupColIds.indexOf(item.colId) < 0) {
                    // ignore
                } else {
                    sortParts.push(item.colId + ' ' + item.sort);
                }
            });
        }

        if (sortParts.length > 0) {
            return ' ORDER BY ' + sortParts.join(', ');
        } else {
            return '';
        }
    }

    isDoingGrouping(rowGroupCols, groupKeys) {
        // we are not doing grouping if at the lowest level. we are at the lowest level
        // if we are grouping by more columns than we have keys for (that means the user
        // has not expanded a lowest level group, OR we are not grouping at all).
        return rowGroupCols.length > groupKeys.length;
    }

    createLimitSql(request) {
        const startRow = request.startRow;
        const endRow = request.endRow;
        const pageSize = endRow - startRow;
        return ' LIMIT ' + (pageSize + 1) + ' OFFSET ' + startRow;
        // return "";
    }

    getRowCount(request, results) {
        if (results === null || results === undefined || results.length === 0) {
            return null;
        }
        const currentLastRow = request.startRow + results.length;
        return currentLastRow <= request.endRow ? currentLastRow : -1;
    }

    cutResultsToPageSize(request, results) {
        const pageSize = request.endRow - request.startRow;
        if (results && results.length > pageSize) {
            return results.slice(0, pageSize);
        } else {
            return results;
        }
    }
}

class ServerSideDataSource {
    constructor(server, option) {
        this.fakeServer = server;
        this.option = option;
    }
    getRows(params) {
        // console.log('ServerSideDatasource.getRows: params = ', this.option);
        let optionClone = this.option;
        params.request["additional"] = {};
        params.request.additional["property"] = this.option.property;

        // if (this.option.isFirst) {
        params.request.additional["startD"] = this.option.datesS;
        params.request.additional["endD"] = this.option.datesE;
        // }

        params.request.additional["type"] = this.option.dateType;
        // params.request.additional["isFirst"] = this.option.isFirst;
        // params.request.additional["columns"] = this.option.columnDefs;
        // this.option.columnApi.setColumnPinned("ag-Grid-AutoColumn", 'left');
        this.fakeServer.getData(params.request,
            function successCallback(resultForGrid, lastRow, secondaryColDefs) {
                params.successCallback(resultForGrid, lastRow);
                resultForGrid.forEach(function(row) {
                    if (optionClone.expandedGroupIds.indexOf(row.id) > -1) {
                        console.log(row.id);
                        console.log(optionClone.api.getRowNode(row.id));
                        let rowNode = optionClone.api.getRowNode(row.id);
                        if (rowNode) {
                            rowNode.setExpanded(true);
                        }
                    }
                });
                console.log(gridOptions.expandedGroupIds);
                // optionClone.api.purgeServerSideCache([]);
            }
        );
    };
}