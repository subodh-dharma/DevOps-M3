var redis = require('redis');
var spawnAWS = require('./spawnAws.js');
var despawnAWS = require('./despawnAws.js');
var cache = require('memory-cache');

var client = {};
var redisip = '';
var upscaling = false;
var downscaling = false;
var sleep = false;

if (process.argv.slice(2)[0]) {
    redisip = process.argv.slice(2)[0];
    console.log(redisip);
    cache.put('redis_ip', redisip);
    client = redis.createClient(6379, redisip, {});
} else {
    //throw Error('REDIS IP required');
    console.warn('REDIS IP required!!', 'Connecting to REDIS on localhost if present!');
    client = redis.createClient(6379, '127.0.0.1', {});
}

// autoscaler monitoring;
setInterval(
    function(redisip) {
        if (!sleep) {
            client.hgetall('request_load', function(err, object) {
                //console.log(object);
                var aws_instance_cnt = 0;

                client.llen('aws_instanceid', function(err, cnt) {
                    aws_instance_cnt = cnt;
                });

                for (val in object) {
                    var numRequest = object[val];
                    console.log(numRequest);
                    //upscaling
                    if (numRequest >= 300) {
                        upscaling = true;
                        break;
                    }

                    // if (aws_instance_cnt > 0) {
                    //     if (numRequest <= 300) {
                    //         downscaling = true;
                    //     } else {
                    //         downscaling = false;
                    //     }
                    // }
                }

                if (upscaling) {
                    sleep = true;
                    spawnAWS.createAWSInstance(cache.get('redis_ip'), function() {
                        console.log('New Server Provisioned!');
                        sleep = false;
                        upscaling = false;
                    });
                }

                // if (downscaling) {
                //     sleep = true;
                //     despawnAWS.terminateAWSInstance(redisip, function() {
                //         console.log('Existing server removed!');
                //         sleep = false;
                //         downscaling = false;
                //     });
                // }


                //downscaling
            });

            // client.hgetall('memory_load', function(err, object) {
            //     //console.log(object);
            //     var aws_instance_cnt = 0;

            //     client.llen('aws_instanceid', function(err, cnt) {
            //         aws_instance_cnt = cnt;
            //     });

            //     for (val in object) {
            //         console.log(object[val]);
            //         //upscaling
            //         if (object[val] >= 0.80) {
            //             upscaling = true;
            //             break;
            //         }

            //         if (aws_instance_cnt > 0) {
            //             if (object[val] <= 0.30) {
            //                 downscaling = true;
            //             } else {
            //                 downscaling = false;
            //             }
            //         }
            //     }

            //     if (upscaling) {
            //         sleep = true;
            //         spawnAWS.createAWSInstance(redisip, function() {
            //             console.log('New Server Provisioned!');
            //             sleep = false;
            //             upscaling = false;
            //         });
            //     }

            //     if (downscaling) {
            //         sleep = true;
            //         despawnAWS.terminateAWSInstance(redisip, function() {
            //             console.log('Existing server removed!');
            //             sleep = false;
            //             downscaling = false;
            //         });
            //     }
            // });
        } else {

            console.log('Rescaling initiated');
            if (upscaling) console.log('Provisioning Server!');
            if (downscaling) console.log('Deprovisioning Server!');

        }

    },
    1000
);
