var chartData;

$(function(){
  $.ajax({

    url: 'http://107.23.244.214:3300/getData',
    type: 'GET',
    success : function(data) {

      var chartProperties = {
        "caption": "Variation of Memory Load",
        "xAxisName": "Time",
        "yAxisName": "Memory Usage Ratio Percentage (Used memory/Total memory)"
      };

      var categoriesArray = [{
          "category" : data["categories"]
      }];

      var lineChart = new FusionCharts({
        type: 'msline',
        renderAt: 'chart-location',
        width: '1000',
        height: '600',
        dataFormat: 'json',
        dataSource: {
          chart: chartProperties,
          categories : categoriesArray,
          dataset : data["dataset"]
        }
      });
      lineChart.render();
    }
  });
});
