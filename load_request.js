var loadtest = require('loadtest');
var options = require('./test_urls.json');



loadtest.loadTest(options[0], function(error, result)
{
    console.log('Load Test for root');
});
