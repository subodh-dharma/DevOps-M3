var chartData;

$(function(){
  $.ajax({

    url: 'http://localhost:3300/reqData',
    type: 'GET',
    success : function(data) {

      var chartProperties = {
        "caption": "Variation of Request Load",
        "xAxisName": "Time",
        "yAxisName": "Total number of request per second."
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
