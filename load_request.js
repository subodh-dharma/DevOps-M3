var loadtest = require('loadtest');
var options = require('./test_urls.json');
var sleep = require('sleep');
 
var i =0;

//document.write(getRandomIntWithLargestRange());

	for (i = 0; i < options.length; i++) 
	{ 
		//var getRandomNumber = Math.floor(Math.random() * 4);

		console.log(i);
		 
	    loadtest.loadTest(options[i], function(error, result)
		{
	    if(error){ console.log("/ "+ error);}
	    console.log('Load Test for a random number'+ JSON.stringify(options[i]));
		});

		sleep.sleep(30);
	}

	// callLoadTest(function (response) 
	// {
	// 	// body...
	// 	console.log("in call loadtest");
	// });



// loadtest.loadTest(options[getRandomNumber], function(error, result)
// {
//     if(error){ console.log("/ "+ error);}
//     console.log('Load Test for a random number'+ JSON.stringify(options[getRandomNumber]));
// });


// loadtest.loadTest(options[0], function(error, result)
// {
//     if(error){ console.log("/ "+ error);}
//     console.log('Load Test for /');
// });


// loadtest.loadTest(options[1], function(error, result)
// {
//     if(error){ console.log("/now "+ error);}
//     console.log('Load Test for /now');
// });


// loadtest.loadTest(options[2], function(error, result)
// {
//     if(error){ console.log("/now "+ error);}
//     console.log('Load Test for /now');
// });

// loadtest.loadTest(options[3], function(error, result)
// {
//     if(error){ console.log("/ with headers "+ error);}
//     console.log('Load Test for / with headers');
// });

