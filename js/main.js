import { CSVToArray } from "./csv-to-array.js";

const timeSeries = [];
const confirmedTimeSeriesData = {};
const recoveredTimeSeriesData = {};
const deathsTimeSeriesData = {};
let columns;

const getDataReady = async (
    confirmedDataPath,
    recoverdDataPath,
    deathsDataPath
) => {
    let response, data;

    response = await fetch(confirmedDataPath);
    data = await response.text();
    const confirmedCSVData = CSVToArray(data);

    response = await fetch(recoverdDataPath);
    data = await response.text();
    const recoveredCSVData = CSVToArray(data);

    response = await fetch(deathsDataPath);
    data = await response.text();
    const deathsCSVData = CSVToArray(data);

    columns =
        Math.min(
            confirmedCSVData[0].length,
            Math.min(recoveredCSVData[0].length, deathsCSVData[0].length)
        ) - 4;

    timeSeries.length = columns;
    confirmedTimeSeriesData.global = new Array(columns);
    recoveredTimeSeriesData.global = new Array(columns);
    deathsTimeSeriesData.global = new Array(columns);

    const dateSelect = document.getElementById("date-select");
    for (let i = 0; i < columns; i++) {
        timeSeries[i] = new Date(confirmedCSVData[0][i + 4]);
        confirmedTimeSeriesData.global[i] = 0;
        recoveredTimeSeriesData.global[i] = 0;
        deathsTimeSeriesData.global[i] = 0;
    }

    for (let i = columns - 1; i >= 0; i--) {
        const option = document.createElement("option");
        option.value = timeSeries[i];
        option.text = timeSeries[i];
        dateSelect.appendChild(option);
    }

    const fillTimeSeriesData = (timeSeriesData, CSVData) => {
        for (let i = 1; i < CSVData.length - 1; i++) {
            const country = CSVData[i][1];
            if (timeSeriesData[country]) {
                for (let j = 0; j < columns; j++) {
                    timeSeriesData.global[j] += Number(CSVData[i][j + 4]);
                    timeSeriesData[country][j] += Number(CSVData[i][j + 4]);
                }
            } else {
                timeSeriesData[country] = new Array(columns);
                for (let j = 0; j < columns; j++) {
                    timeSeriesData.global[j] += Number(CSVData[i][j + 4]);
                    timeSeriesData[country][j] = Number(CSVData[i][j + 4]);
                }
            }
        }
    };

    fillTimeSeriesData(confirmedTimeSeriesData, confirmedCSVData);
    fillTimeSeriesData(recoveredTimeSeriesData, recoveredCSVData);
    fillTimeSeriesData(deathsTimeSeriesData, deathsCSVData);

    const countries = Object.keys(confirmedTimeSeriesData);
    const countrySelect = document.getElementById("country-select");
    for (let i = 0; i < countries.length; i++) {
        if (countries[i] !== "global") {
            const option = document.createElement("option");
            option.value = countries[i];
            option.text = countries[i];
            countrySelect.appendChild(option);
        }
    }
};

google.charts.load("current", {
    packages: ["corechart", "line", "geochart"],
    mapsApiKey: "API_KEY",
});

function drawLineChart(ele, dataTable, series, xAxis, yAxis, title) {
    var data = new google.visualization.arrayToDataTable(dataTable);

    var options = {
        title: title,
        titleTextStyle: { color: "#ffffff" },
        hAxis: {
            title: xAxis,
            textStyle: { color: "#ffffff" },
            titleTextStyle: { color: "#ffffff" },
            gridlines: { color: "#333333" },
        },
        vAxis: {
            title: yAxis,
            textStyle: { color: "#ffffff" },
            titleTextStyle: { color: "#ffffff" },
            gridlines: { color: "#333333" },
        },
        series: series,
        legend: { textStyle: { color: "#ffffff" }, position: "bottom" },
        backgroundColor: { fill: "transparent" },
        focusTarget: "category",
    };

    var chart = new google.visualization.LineChart(
        document.getElementById(ele)
    );

    chart.draw(data, options);
}

function drawPieChart(ele, dataTable, slices, title) {
    var data = new google.visualization.arrayToDataTable(dataTable);

    var options = {
        title: title,
        titleTextStyle: { color: "#ffffff" },
        slices: slices,
        pieSliceBorderColor: "#202020",
        pieSliceTextStyle: { color: "#000" },
        sliceVisibilityThreshold: 0,
        legend: {
            textStyle: { color: "#ffffff" },
            position: "labeled",
            labeledValueText: "both",
        },
        backgroundColor: { fill: "transparent" },
    };

    var chart = new google.visualization.PieChart(document.getElementById(ele));

    chart.draw(data, options);
}

const displayCountryData = (country) => {
    let pieData = [
        ["Case type", "Count"],
        [
            "Active",
            confirmedTimeSeriesData[country][columns - 1] -
                recoveredTimeSeriesData[country][columns - 1] -
                deathsTimeSeriesData[country][columns - 1],
        ],
        ["Recovered", recoveredTimeSeriesData[country][columns - 1]],
        ["Deaths", deathsTimeSeriesData[country][columns - 1]],
    ];

    const slices = {
        0: { color: "#00b7ff" },
        1: { color: "#22cc22" },
        2: { color: "red" },
    };

    drawPieChart("country-pie-chart", pieData, slices, "Cases overview");

    document.getElementById("c-confirmed-counter").innerHTML =
        confirmedTimeSeriesData[country][columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    document.getElementById("c-recovered-counter").innerHTML =
        recoveredTimeSeriesData[country][columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    document.getElementById("c-deaths-counter").innerHTML =
        deathsTimeSeriesData[country][columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const countryConfirmed = [["Date", "Confirmed cases"]],
        countryRecovered = [["Date", "Recovered cases"]],
        countryDeaths = [["Date", "Death cases"]],
        dailyCases = [["Date", "New cases", "Recovered cases", "Death cases"]],
        activeCases = [["Date", "Active cases"]];

    for (let i = 0; i < columns; i++) {
        countryConfirmed.push([
            timeSeries[i],
            confirmedTimeSeriesData[country][i],
        ]);
        countryRecovered.push([
            timeSeries[i],
            recoveredTimeSeriesData[country][i],
        ]);
        countryDeaths.push([timeSeries[i], deathsTimeSeriesData[country][i]]);
        dailyCases.push([
            timeSeries[i],
            confirmedTimeSeriesData[country][i],
            recoveredTimeSeriesData[country][i],
            deathsTimeSeriesData[country][i],
        ]);
        activeCases.push([
            timeSeries[i],
            confirmedTimeSeriesData[country][i] -
                (recoveredTimeSeriesData[country][i] +
                    deathsTimeSeriesData[country][i]),
        ]);
    }

    for (let i = columns; i >= 2; i--) {
        dailyCases[i][1] = dailyCases[i][1] - dailyCases[i - 1][1];
        dailyCases[i][2] = dailyCases[i][2] - dailyCases[i - 1][2];
        dailyCases[i][3] = dailyCases[i][3] - dailyCases[i - 1][3];
    }

    drawLineChart(
        "country-confirmed-data-chart",
        countryConfirmed,
        { 0: { color: "skyblue" } },
        "Dates",
        "Confirmed",
        "Confirmed cases"
    );
    drawLineChart(
        "country-recovered-data-chart",
        countryRecovered,
        { 0: { color: "yellowgreen" } },
        "Dates",
        "Recovered",
        "Recovered cases"
    );
    drawLineChart(
        "country-deaths-data-chart",
        countryDeaths,
        { 0: { color: "red" } },
        "Dates",
        "Deaths",
        "Death cases"
    );
    drawLineChart(
        "daily-cases-chart",
        dailyCases,
        {
            0: { color: "#00b7ff" },
            1: { color: "yellowgreen" },
            2: { color: "red" },
        },
        "Dates",
        "Daily cases",
        "Daily cases"
    );
    drawLineChart(
        "active-cases-chart",
        activeCases,
        { 0: { color: "yellow" } },
        "Dates",
        "Active cases",
        "Active cases"
    );
};

const displayCasesBarAndGeoChart = (date) => {
    let d;
    for (d = 0; d < columns; d++) if (date === String(timeSeries[d])) break;

    const barDataTable = [["Country", "Confirmed cases", { role: "style" }]];
    const geoDataTable = [["Country", "Active cases"]];
    const countries = Object.keys(confirmedTimeSeriesData);
    for (let i = 0; i < countries.length; i++) {
        if (countries[i] !== "global" && countries[i] !== "US") {
            barDataTable.push([
                countries[i],
                confirmedTimeSeriesData[countries[i]][d],
                "opacity: 0.5",
            ]);
            geoDataTable.push([
                countries[i],
                confirmedTimeSeriesData[countries[i]][d] -
                    (recoveredTimeSeriesData[countries[i]][d] +
                        deathsTimeSeriesData[countries[i]][d]),
            ]);
        }
    }

    var barData = new google.visualization.arrayToDataTable(barDataTable);
    var geoData = new google.visualization.arrayToDataTable(geoDataTable);

    var options1 = {
        title: `Confirmed cases in different countries on ${date} (in logarithmic scale)`,
        titleTextStyle: { color: "#ffffff" },
        hAxis: {
            title: "Countries",
            textStyle: { color: "#ffffff" },
            titleTextStyle: { color: "#ffffff" },
            gridlines: { color: "transparent" },
        },
        vAxis: {
            title: "Confirmed cases",
            textStyle: { color: "#ffffff" },
            titleTextStyle: { color: "#ffffff" },
            gridlines: { color: "transparent" },
            logScale: true,
        },
        colors: ["#ff2d7e"],
        legend: {
            textStyle: { color: "#ffffff" },
        },
        backgroundColor: { fill: "transparent" },
        focusTarget: "category",
    };

    var options2 = {
        backgroundColor: { fill: "#202020" },
        datalessRegionColor: "#333333",
        colorAxis: { minValue: 0, colors: ["#444444", "#00b7ff"] },
        legend: "none",
    };

    var barChart = new google.visualization.ColumnChart(
        document.getElementById("cases-bar-chart")
    );

    document.getElementById(
        "cases-geo-chart-title"
    ).innerText = `Active cases in different countries on ${date}`;
    var geoChart = new google.visualization.GeoChart(
        document.getElementById("cases-geo-chart")
    );

    barChart.draw(barData, options1);
    geoChart.draw(geoData, options2);
};

const onCountryChange = () => {
    const country = document.getElementById("country-select").value;
    displayCountryData(country);
};

const onDateChange = () => {
    const date = document.getElementById("date-select").value;
    displayCasesBarAndGeoChart(date);
};

const display = async () => {
    await getDataReady(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv",
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
    );

    document.getElementById("g-confirmed-counter").innerHTML =
        confirmedTimeSeriesData.global[columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    document.getElementById("g-recovered-counter").innerHTML =
        recoveredTimeSeriesData.global[columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    document.getElementById("g-deaths-counter").innerHTML =
        deathsTimeSeriesData.global[columns - 1]
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const globalConfirmed = [["Date", "Confirmed cases"]],
        globalRecovered = [["Date", "Recovered cases"]],
        globalDeaths = [["Date", "Death cases"]];

    for (let i = 0; i < columns; i++) {
        globalConfirmed.push([
            timeSeries[i],
            confirmedTimeSeriesData.global[i],
        ]);
        globalRecovered.push([
            timeSeries[i],
            recoveredTimeSeriesData.global[i],
        ]);
        globalDeaths.push([timeSeries[i], deathsTimeSeriesData.global[i]]);
    }

    drawLineChart(
        "global-confirmed-data-chart",
        globalConfirmed,
        { 0: { color: "skyblue" } },
        "Dates",
        "Confirmed",
        "Confirmed cases"
    );
    drawLineChart(
        "global-recovered-data-chart",
        globalRecovered,
        { 0: { color: "yellowgreen" } },
        "Dates",
        "Recovered",
        "Recovered cases"
    );
    drawLineChart(
        "global-deaths-data-chart",
        globalDeaths,
        { 0: { color: "red" } },
        "Dates",
        "Deaths",
        "Death cases"
    );

    onCountryChange();
    onDateChange();
};

google.charts.setOnLoadCallback(display);
