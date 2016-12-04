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
                // downscaling depends if any extra AWS is spawned.
                client.llen('aws_instanceid', function(err, cnt) {
                    aws_instance_cnt = cnt;

                    for (val in object) {
                        var numRequest = object[val];
                        if (aws_instance_cnt > 0) {
                            if (numRequest <= 100) {
                                downscaling = true;
                            } else {
                                downscaling = false;
                            }
                        }
                    }

                    if (downscaling) {
                        sleep = true;
                        console.log('Downscaling as request load is balanced!!');
                        var despawn = despawnAWS.terminateAWSInstance(redisip);

                        despawn.then(function() {
                            console.log('Existing server removed!');
                            sleep = false;
                            downscaling = false;
                        });
                    }
                });

                // upscaling depending on request load.
                for (val in object) {
                    var numRequest = object[val];
                    //console.log(numRequest);
                    //upscaling
                    if (numRequest >= 300) {
                        upscaling = true;
                        break;
                    }
                }

                if (upscaling) {
                    sleep = true;
                    console.log('Upscaling Because of Request load..');
                    var spawned = spawnAWS.createAWSInstance(cache.get('redis_ip'));
                    spawned.then(function() {
                        console.log('New Server Provisioned!');
                        sleep = false;
                        upscaling = false;
                    });
                }

            });

            client.hgetall('memory_load', function(err, object) {
                var aws_instance_cnt = 0;
                // downscaling depends if any extra AWS is spawned.
                client.llen('aws_instanceid', function(err, cnt) {
                    aws_instance_cnt = cnt;

                    for (val in object) {
                        var requestLoad = object[val];
                        if (aws_instance_cnt > 0) {
                            if (requestLoad <= 0.30) {
                                downscaling = true;
                            } else {
                                downscaling = false;
                            }
                        }
                    }

                    if (downscaling) {
                        sleep = true;
                        console.log('Downscaling because of optimum memory usage');
                        var despawn = despawnAWS.terminateAWSInstance(redisip);

                        despawn.then(function() {
                            console.log('Existing server removed!');
                            sleep = false;
                            downscaling = false;
                        });
                    }
                });

                // upscaling depending on request load.
                for (val in object) {
                    var requestLoad = object[val];
                    //console.log(numRequest);
                    //upscaling
                    if (requestLoad >= 0.90) {
                        upscaling = true;
                        break;
                    }
                }

                if (upscaling) {
                    sleep = true;
                    console.log('Upscaling because of high memory load');
                    var spawned = spawnAWS.createAWSInstance(cache.get('redis_ip'));
                    spawned.then(function() {
                        console.log('New Server Provisioned!');
                        sleep = false;
                        upscaling = false;
                    });
                }
            });
        } else {

            console.log('Rescaling initiated');
            if (upscaling) console.log('Provisioning Server!');
            if (downscaling) console.log('Deprovisioning Server!');

        }

    },
    1000
);
