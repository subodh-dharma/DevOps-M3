var loadtest = require('loadtest');
var options = require('./test_urls.json');
var sleep = require('sleep');
var async = require('async');
var sync = require('sync'); 
var i =0;
var flag=1;

//document.write(getRandomIntWithLargestRange());

	//  while(i<4)
	//  {
	// 	while(flag==1)
	// 	{
	// 	//var getRandomNumber = Math.floor(Math.random() * 4);

	// 		console.log(i);

	// 		if(flag==1)
	// 		{
			 
	// 		 	flag=0;
	// 		 	console.log("set flag to 0");
	// 		    loadtest.loadTest(options[i], function(error, result)
	// 			{
					
	// 			    if(error){ console.log("/ "+ error);}
	// 			    console.log('Load Test for a number'+ JSON.stringify(options[i]));
	// 			    flag=1;
	// 			    i=i+1;
	// 			    console.log("set flag to 1");
	// 			});

				
	// 			//sleep.sleep(30);
	// 		}
	// 	}
	// }
	


	// callLoadTest(function (response) 
	// {
	// 	// body...
	// 	console.log("in call loadtest");
	// });

	// Pretend this is some complicated async factory



var async = require('async');

// var square = function (num, doneCallback) 
// {
//   console.log(num * num);
//   sleep.sleep(5);
//   // Nothing went wrong, so callback with a null error.
//   return doneCallback(null);
// };

var load = function (num, doneCallback)
{

	loadtest.loadTest(options[num], function(error, result)
	{
	    if(error){ console.log("/ "+ error);}
	    console.log('Load Test for /'+JSON.stringify(options[num]));
	    return doneCallback(null);
	});
};


// Square each number in the array [1, 2, 3, 4]
async.each([0, 1, 2, 3], load, function (err) 
{
  // Square has been called on each of the numbers
  // so we're now done!
  console.log("Finished!");
});


// var createUser = function(id, callback) {
//     callback(null, {
//         id: 'user' + id
//     });
//     console.log("hello"+id);
//     sleep.sleep(30);
//     loadtest.loadTest(options[id], function(error, result)
// 	{
// 	    if(error){ console.log(""+ error);}
// 	    console.log('Load Test for '+JSON.stringify(options[id]));
// 	});
// };

// // generate 5 users
// async.eachSeries(4, function(n, next) {
//     createUser(n, function(err, user) {
//         next(err, user);
//     });
// }, function(err, users) {
//     // we should now have 5 users
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
