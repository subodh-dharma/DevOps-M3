var loadtest = require('loadtest');
var options = require('./test_urls.json');



loadtest.loadTest(options[0], function(error, result)
{
    console.log('Load Test for /');
});

/*
loadtest.loadTest(options[1], function(error, result)
{
    console.log('Load Test for /now');
});


loadtest.loadTest(options[2], function(error, result)
{
    console.log('Load Test for /noexist');
});
*/
