var fs = require('fs');
var random = require('random-js')();

var urls = [];
var num_of_urls = 4;
var i = 0;
var test_url = '';

if (process.argv.slice(2)[0]) {
    test_url = process.argv.slice(2)[0];
} else {
    test_url = 'http://localhost:3000/';
}

while (i < num_of_urls) {
    var url = {};

    url["url"] = test_url;
    url["maxRequests"] = random.integer(1000, 10000); //random number between 1000 to 10000
    url["concurrency"] = random.integer(1, 10); //random number between 1 to 10
    url["requestsPerSecond"] = random.integer(100, 500); //randome number between 100 to 1000
    urls.push(url);
    i++;
}


fs.writeFile('generatedTests.json', JSON.stringify(urls), function() {
    console.log('Test URLs generated successfully');
});
