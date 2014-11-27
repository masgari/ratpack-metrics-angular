'use strict';

angular.module('metrics')
  .controller('MainCtrl', function ($scope, $log, WebSocket) {
    WebSocket.onopen(function () {
      $log.debug('websocket - open');
    });

    WebSocket.onmessage(function (event) {
      var data = angular.fromJson(event.data);
      $scope.updateRequestCountChart(data);
      //$scope.updateTimerCharts(data);
      $scope.updateJvmCharts(data);
    });

    function findElement(arr, propName, propValue) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i][propName] === propValue) {
          return arr[i];
        }
      }
    }

    var timerChartsDataArray = [[],[],[]];

    function getTimerDiv(timerName) {
      var timerId = timerName.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '');

      if ($("#" + timerId).length === 0) {
        var newRow = '<h3>' + timerName + '</h3><div class="row" id="' + timerId + '"><div class="col-md-6" style="height: 300px;"></div><div class="col-md-6" style="height: 300px;"></div></div>';
        $('#timerCharts').prepend(newRow);
      }

      return $("#" + timerId);
    }

    function getTimerArrayPosition(timerName) {
      var timerArrayPosition = $.inArray(timerName, timerChartsDataArray[0]);

      if (timerArrayPosition < 0) {
        timerArrayPosition = timerChartsDataArray[0].length;
        timerChartsDataArray[0][timerArrayPosition] = timerName;

        var chartData1 = new google.visualization.DataTable();
        chartData1.addColumn('date', 'Time');
        chartData1.addColumn('number', 'Rate');
        timerChartsDataArray[1][timerArrayPosition] = chartData1;

        var chartData2 = new google.visualization.DataTable();
        chartData2.addColumn('date', 'Time');
        chartData2.addColumn('number', '95thPercentile');
        chartData2.addColumn({id:'50thPercentile', type:'number', role:'interval'});
        chartData2.addColumn({id:'75thPercentile', type:'number', role:'interval'});
        chartData2.addColumn({id:'99thPercentile', type:'number', role:'interval'});
        chartData2.addColumn({id:'999thPercentile', type:'number', role:'interval'});
        timerChartsDataArray[2][timerArrayPosition] = chartData2;
      }

      return timerArrayPosition
    }

    $scope.updateRequestCountChart = function (data) {
    };

    $scope.updateTimerCharts = function (data) {
      var snapshotTime = new Date(data.timestamp);

      angular.forEach(data.timers, function (value, index) {
        var timerDiv = getTimerDiv(value.name);
        var timerArrayPosition = getTimerArrayPosition(value.name);

        // Request per min chart
        var chartData1 = timerChartsDataArray[1][timerArrayPosition];
        chartData1.addRow([snapshotTime, value.oneMinuteRate]);
        if (chartData1.getNumberOfRows() > 30) {
          chartData1.removeRow(0);
        }

        var options = {
          title: 'Requests per Minute',
          legend: {position: 'none'},
          hAxis: {slantedText: true, textPosition: 'none'},
          vAxis: {viewWindow: {min: 0}},
          chartArea: {left: 50, width: '100%'}
        };
        $log.debug('timerDiv.children().eq(0).get(0)', timerDiv.children().eq(0).get(0));
        var chart1 = new google.visualization.LineChart(timerDiv.children().eq(0).get(0));
        chart1.draw(chartData1, options);


        // Response time chart
        var chartData2 = timerChartsDataArray[2][timerArrayPosition];
        chartData2.addRow([snapshotTime, value['95thPercentile'], value['50thPercentile'], value['75thPercentile'], value['99thPercentile'], value['999thPercentile']]);
        if (chartData2.getNumberOfRows() > 15) {
          chartData2.removeRow(0);
        }

        var options = {
          title: 'Response Time Percentiles (ms)',
          legend: {position: 'none'},
          curveType: 'function',
          series: [{'color': '#F1CA3A'}],
          intervals: {'style': 'area'},
          hAxis: {slantedText: true, textPosition: 'none'},
          vAxis: {viewWindow: {min: 0}},
          chartArea: {left: 50, width: '100%'}
        };

        var chart2 = new google.visualization.LineChart(timerDiv.children().eq(1).get(0));
        chart2.draw(chartData2, options);
      });
    };

    $scope.updateJvmCharts = function (data) {
      var maxHeap = findElement(data.gauges, 'name', 'heap.max').value;
      var usedHeap = findElement(data.gauges, 'name', 'heap.used').value;

      var heapData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Heap', Math.round(parseInt(usedHeap) / parseInt(maxHeap) * 100)]
      ]);

      var heapChartOptions = {
        width: 400, height: 280,
        redFrom: 90, redTo: 100,
        yellowFrom: 70, yellowTo: 90,
        minorTicks: 5,
        max: 100
      };

      var heapChart = new google.visualization.Gauge(document.getElementById('heapChart'));
      heapChart.draw(heapData, heapChartOptions);


      var threadData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Threads', findElement(data.gauges, 'name', 'count').value]
      ]);

      var threadChartOptions = {
        width: 400, height: 280,
        redFrom: 90, redTo: 100,
        yellowFrom: 75, yellowTo: 90,
        minorTicks: 5
      };

      var threadChart = new google.visualization.Gauge(document.getElementById('threadsChart'));
      threadChart.draw(threadData, threadChartOptions);
    };
  });