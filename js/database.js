var tableCode = [];
let properties;

var dateStart = document.getElementById("daily_s");
var dateEnd = document.getElementById("daily_e");
var property = document.getElementById("property");
var typeDate = document.getElementById("typeDate");
var propSelect = document.getElementById("property");

dateStart.addEventListener("change", onStartDateChange);
dateEnd.addEventListener("change", onEndDateChange);
typeDate.addEventListener("change", onTypeChange);
propSelect.addEventListener("change", onPropertyChange);

function onPropertyChange(obj) {
    gridOptions.property = obj.target.value;
    gridOptions.isFirst = false;
    gridOptions.columnDefs.map((item, id) => {
        if (id > 13) {
            gridOptions.columnApi.setColumnAggFunc(gridOptions.columnApi.getColumn(item.headerName), properties[0].values[obj.value - 1][2]);
        }
    });
    // gridOptions.api.purgeServerSideCache(gridOptions.expandedGroupIds);
    // calNewCols();
    gridOptions.api.onFilterChanged();
}

function onStartDateChange(e) {
    console.log(e.target.value);
    gridOptions.datesS = calDatesFromCol(dateStart.value, gridOptions.dateType);
    gridOptions.datesE = calDatesFromCol(dateEnd.value, gridOptions.dateType, false);
    calNewCols();
}

function onTypeChange(obj) {
    gridOptions.dateType = obj.target.value;
    gridOptions.datesS = calDatesFromCol(dateStart.value, gridOptions.dateType);
    gridOptions.datesE = calDatesFromCol(dateEnd.value, gridOptions.dateType, false);
    console.log("Start:%s,End:%s", gridOptions.datesS, gridOptions.datesE);
    calNewCols();
}

function onEndDateChange(e) {
    gridOptions.datesS = calDatesFromCol(dateStart.value, gridOptions.dateType);
    gridOptions.datesE = calDatesFromCol(dateEnd.value, gridOptions.dateType, false);
    console.log("Start:%s,End:%s", gridOptions.datesS, gridOptions.datesE);
    calNewCols();
}

document.addEventListener('DOMContentLoaded', function() {

    document.getElementById("daily_s").value = getTodayDate();
    document.getElementById("daily_e").value = '2020-02-29';

    var gridDiv = document.querySelector('#aggrid');
    new agGrid.Grid(gridDiv, gridOptions);

    let worker = new Worker('./js/sqljs/worker.sql-wasm.js');

    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', './sample.db', true);
    httpRequest.responseType = 'arraybuffer';
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            var uInt8Array = new Uint8Array(this.response);
            worker.onmessage = function(e) {
                if (e.data.id === 20) {
                    worker.postMessage({ id: 21, action: 'exec', sql: "SELECT * FROM code;" });
                }
                if (event.data.id === 21) {
                    tableCode = event.data.results;
                    worker.postMessage({ id: 22, action: 'exec', sql: "SELECT * FROM property;" });
                }
                if (event.data.id === 22) {
                    properties = event.data.results;
                    properties[0].values.map(item => {
                        let option = document.createElement('option');
                        option.value = getIntVal('property1', item[0]);
                        option.text = item[0];
                        property.appendChild(option);
                    });
                    let fakeServer = new FakeServer(worker);
                    gridOptions.property = document.getElementById("property").value;
                    gridOptions.dateType = document.getElementById("typeDate").value;
                    gridOptions.datesS = document.getElementById("daily_s").value;
                    gridOptions.datesE = document.getElementById("daily_e").value;
                    calNewCols();
                    let dataSource = new ServerSideDataSource(fakeServer, gridOptions);
                    gridOptions.api.setServerSideDatasource(dataSource);
                }
            };
            try {
                worker.postMessage({ id: 20, action: 'open', buffer: uInt8Array }, [uInt8Array]);
            } catch (exception) {
                worker.postMessage({ id: 20, action: 'open', buffer: uInt8Array });
            }

        }
    };
});