var db;
var fakeServer;
var dataSource;
var tableCode = [];

var dateStart = document.getElementById("daily_s");
var dateEnd = document.getElementById("daily_e");

dateStart.addEventListener("change", onStartDateChange);
dateEnd.addEventListener("change", onEndDateChange);

function onStartDateChange(e) {
    var filter = gridOptions.api.getFilterInstance('value_date');
    console.log(filter);
    filter.selectNothing();
    filter.selectValue('Ireland');
    filter.selectValue('Great Britain');
    filter.applyModel();
    gridOptions.api.onFilterChanged();
}

function onEndDateChange(e) {
    console.log(e.target.value);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("daily_s").value = getTodayDate();
    var gridDiv = document.querySelector('#aggrid');
    new agGrid.Grid(gridDiv, gridOptions);
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', './sample.db', true);
    httpRequest.responseType = 'arraybuffer';
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            var uInt8Array = new Uint8Array(this.response);
            db = new SQL.Database(uInt8Array);
            tableCode = db.exec("SELECT * FROM code;");
            onAnswer();
            fakeServer = new FakeServer(db);
            dataSource = new ServerSideDataSource(fakeServer, gridOptions);
            gridOptions.api.setServerSideDatasource(dataSource);
        }
    };
});