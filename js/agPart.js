var columnDefs = [{
        headerName: "attribute1",
        field: "attribute1",
        enableRowGroup: true,
        rowGroup: true,
        enablePivot: true,
        hide: true
    },
    {
        headerName: "attribute2",
        field: "attribute2",
        enableRowGroup: true,
        hide: true
    },
    {
        headerName: "attribute3",
        field: "attribute3",
        hide: true
    },
    {
        headerName: "attribute4",
        field: "attribute4",
        hide: true
    },
    {
        headerName: "attribute5",
        field: "attribute5",
        hide: true
    },
    {
        headerName: "attribute6",
        field: "attribute6",
        hide: true
    },
    {
        headerName: "attribute7",
        field: "attribute7",
        hide: true
    },
    {
        headerName: "attribute8",
        field: "attribute8",
        hide: true
    },
    {
        headerName: "attribute9",
        field: "attribute9",
        hide: true
    },
    {
        headerName: "attribute10",
        field: "attribute10",
        hide: true
    },
    {
        headerName: "channel1",
        field: "channel1",
        enableRowGroup: true,
        hide: true
    },
    {
        headerName: "channel2",
        field: "channel2",
        enableRowGroup: true,
        hide: true
    },
    {
        headerName: "channel3",
        field: "channel3",
        enableRowGroup: true,
        hide: true
    },
    {
        headerName: "date_created",
        field: "date_created"
    }
];

var gridOptions = {
    defaultColDef: {
        width: 100,
        // restrict what aggregation functions the columns can have,
        // include a custom function 'random' that just returns a
        // random number
        allowedAggFuncs: ['sum', 'min', 'max', 'random'],
        filter: true,
        sortable: true,
        resizable: true
    },
    autoGroupColumnDef: {
        width: 180
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
    // restrict to 2 server side calls concurrently
    maxConcurrentDatasourceRequests: 2,
    cacheBlockSize: 100,
    maxBlocksInCache: 2,
    purgeClosedRowNodes: true,
    property: "",
    paginationPageSize: 10,
    onFirstDataRendered: function(params) {
        params.api.sizeColumnsToFit();
    }
};

class FakeServer {
    constructor(db) {
        this.db = db;
    }
    getData(request, resultsCallback) {

        const SQL = this.buildSql(request);
        console.log(SQL);
        // const SQL = modifyDataOfGrid(this.db, "tree", "value_date", "D", "2020-11-20", "2020-11-21");
        let tableTree = [];
        let results = db.exec(SQL);
        // results.map(item => {
        console.log(results);
        results[0].values.map(row => {
            var temp = {};
            results[0].columns.map((col, id) => {
                var res = getStringVal(col, row[id]);
                if (res) {
                    temp[col] = res;
                } else {
                    temp[col] = row[id];
                }
            });
            tableTree.push(temp);
        });
        // })
        const rowCount = this.getRowCount(request, tableTree);
        console.log(rowCount);
        const resultsForPage = this.cutResultsToPageSize(request, tableTree);

        resultsCallback(resultsForPage, rowCount);
    }

    buildSql(request) {
        const isAdditional = Object.values(request.additional).join("").length !== 0;

        const selectSql = this.createSelectSql(request);
        const fromSql = ' FROM temp ';

        // const leftJoinSql = this.createLeftJoinSql(request, isAdditional);

        const whereSql = this.createWhereSql(request);
        const limitSql = this.createLimitSql(request);

        const orderBySql = this.createOrderBySql(request);
        const groupBySql = this.createGroupBySql(request);

        const SQL = selectSql + fromSql + whereSql + groupBySql + orderBySql + limitSql;

        // console.log(SQL);

        return SQL;
    }

    createLeftJoinSql(request, isAdditional) {
        let result = "";
        if (isAdditional) {
            let dateRange = calDateRange(request.additional.dateType, request.additional.startDate, request.additional.endDate);

            for (let i = new Date(dateRange.start), index = 0; i <= new Date(dateRange.end); i.setDate(i.getDate() + 1), index++) {
                let d = getISODate(i);

                let temp = "LEFT JOIN (SELECT value AS '" + d + "', attribute1||attribute2||attribute3||attribute4||attribute5||attribute6||attribute7||attribute8||attribute9||attribute10||channel1||channel2||channel3 AS  joinkeys" + index + " FROM tree WHERE value_date = '" + d + "') ON (keys = joinkeys" + index + ")";
                result += temp;
            }
        }
        return result;
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
                colsToSelect.push(valueCol.aggFunc + '("' + valueCol.field + '") as "' + valueCol.field + '"');
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

        if (request.additional.property.length !== 0) {
            whereParts.push("property = " + request.additional.property);
        }

        if (groupKeys.length > 0) {
            groupKeys.forEach(function(key, index) {
                const colName = rowGroupCols[index].field;
                console.log(key);
                whereParts.push(colName + ' = "' + getIntVal(colName, key) + '"')
            });
        }

        if (filterModel) {
            const keySet = Object.keys(filterModel);
            keySet.forEach(function(key) {
                const item = filterModel[key];
                whereParts.push(that.createFilterSql(key, item));
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
            return ' order by ' + sortParts.join(', ');
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
        return ' LIMIT ' + (pageSize + 1) + ' offset ' + startRow;
        // return "";
    }

    getRowCount(request, results) {
        if (results === null || results === undefined || results.length === 0) {
            return null;
        }
        const currentLastRow = request.startRow + results.length;
        // return results.length <= request.endRow ? results.length : -1;
        return currentLastRow <= request.endRow ? currentLastRow : -1;
    }

    cutResultsToPageSize(request, results) {
        const pageSize = request.endRow - request.startRow;
        if (results && results.length > pageSize) {
            // results.splice(0, pageSize);
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
        console.log('ServerSideDatasource.getRows: params = ', params);
        // let rowGroupCols = params.request.rowGroupCols;
        // rowGroupCols.push({ id: "value_date", aggFunc: undefined, displayName: "value_date", field: "value_date" });
        params.request["additional"] = {};
        params.request.additional["property"] = this.option.property;
        this.fakeServer.getData(params.request,
            function successCallback(resultForGrid, lastRow, secondaryColDefs) {
                params.successCallback(resultForGrid, lastRow);
                //that.setSecondaryColsIntoGrid(secondaryColDefs);
            });
    };

    // we only set the secondary cols if they have changed since the last time. otherwise
    // the cols would reset every time data comes back from the server (which means col
    // width, positioning etc would be lost every time we eg expand a group, or load another
    // block by scrolling down).
    setSecondaryColsIntoGrid(secondaryColDefs) {
        var colDefHash = this.createColsHash(secondaryColDefs);
        if (this.colDefHash !== colDefHash) {
            this.gridOptions.columnApi.setSecondaryColumns(secondaryColDefs);
            this.colDefHash = colDefHash;
        }
    };

    createColsHash(colDefs) {
        if (!colDefs) { return null; }
        var parts = [];
        var that = this;
        colDefs.forEach(function(colDef) {
            if (colDef.children) {
                parts.push(colDef.groupId);
                parts.push('[' + that.createColsHash(colDef.children) + ']');
            } else {
                parts.push(colDef.colId);
                // headerName can change if the aggFunc was changed in a value col. if we didn't
                // do this, then the grid would not pick up on new header names as we move from
                // eg min to max.
                if (colDef.headerName) {
                    parts.push(colDef.headerName);
                }
            }
        });
        return parts.join(',');
    };
}