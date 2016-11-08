var loadtest = require('loadtest');
var options = {
    url: 'http://localhost:3000/',
    maxRequests: 1000,
    maxSeconds: 2,
};
loadtest.loadTest(options, function(error, result)
{
    if (error)
    {
        return console.error('Got an error: %s', error);
    }
    console.log('Tests run successfully');
});
