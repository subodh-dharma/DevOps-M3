var redis = require('redis')
var multer = require('multer')
var express = require('express')
var fs = require('fs')
var app = express()
var exec = require('child_process').exec;
var ip = require('ip');
var cache = require('memory-cache');
const os = require('os');

var monitor = require('./monitor_requests.js');
var client = {}; //default initialization
var requestfreq = 0;

var server;

var totalReq = 0;
var averageReq = 0;
var numReqSeconds = 0;


// REDIS SEPARATE SERVER
//var client = redis.createClient(6379, '52.90.252.26', {});
if (process.argv.slice(2)[0]) {
    var redisip = process.argv.slice(2)[0];
    console.log(redisip);
    client = redis.createClient(6379, redisip, {});
} else {
    //throw Error('REDIS IP required');
    console.warn('REDIS IP required!!', 'Connecting to REDIS on localhost if present!');
    client = redis.createClient(6379, '127.0.0.1', {});
}

var extIP = require('external-ip');


if (process.argv.slice(2)[1] == 'clearRedis') {
    var getIP = extIP({
        replace: true,
        services: ['http://ifconfig.co/x-real-ip', 'http://ifconfig.io/ip'],
        timeout: 600,
        getIP: 'parallel'
    });

    getIP(function(err, ip) {
        if (err) {
            throw err;
        }
        client.lrem('active_servers', 0, 'http://' + ip, function(err, reply) {
            if (err) throw err;
        });
        client.lrem('serving_servers', 0, 'http://' + ip, function(err, reply) {
            if (err) throw err;
        });
        client.lrem('canary_servers', 0, 'http://' + ip, function(err, reply) {
            if (err) throw err;
        });
        process.exit();
    })
} else if (process.argv.slice(2)[1] == 'canaryRelease') {
    var getIP = extIP({
        replace: true,
        services: ['http://ifconfig.co/x-real-ip', 'http://ifconfig.io/ip'],
        timeout: 600,
        getIP: 'parallel'
    });

    getIP(function(err, ip) {
        if (err) {
            throw err;
        }
        cache.put('public_ip', ip);
        setInterval(function() {
            client.hset("request_load", 'http://' + cache.get('public_ip'), requestfreq);
            requestfreq = 0;
        }, 20000);

        setInterval(function() {
            var freemem = os.freemem();
            var totalmem = os.totalmem();
            if ( totalmem && freemem && totalmem != 0)
            {
                client.hset("memory_load", 'http://' + cache.get('public_ip'), 1-(freemem/totalmem));
            }
        }, 20000);

        client.lpush(['canary_servers', 'http://' + ip], function(err, reply) {
            console.log('A Canary Server added to list');
        });

    });
} else {
    var getIP = extIP({
        replace: true,
        services: ['http://ifconfig.co/x-real-ip', 'http://ifconfig.io/ip'],
        timeout: 600,
        getIP: 'parallel'
    });

    getIP(function(err, ip) {
        if (err) {
            throw err;
        }
        cache.put('public_ip', ip);

        setInterval(function() {
            console.log("Number of requests per second: " + requestfreq);
            client.hset("request_load", 'http://' + cache.get('public_ip'), requestfreq);
            requestfreq = 0;
        }, 1000);

        setInterval(function() {
            var freemem = os.freemem();
            var totalmem = os.totalmem();
            if ( totalmem && freemem && totalmem != 0)
            {
                client.hset("memory_load", 'http://' + cache.get('public_ip'), 1-(freemem/totalmem));
            }
        }, 1000);

        client.llen('serving_servers', function(err, serv_count) {
            client.lpush(['serving_servers', 'http://' + ip], function(err, reply) {
                console.log('Server adding to serving list');
            });
        });

    });
}


///////////// WEB ROUTES
// Add hook to make it easier to get all visited URLS.
args = ["3000"];
var portNum = parseInt(args[0]);
server = app.listen(portNum, 'localhost', function() {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
})


var history = [];
app.use(function(req, res, next) {
    // console.log(req.method, req.url);

    //console.log("URL :" + req.url);
    //history.push(req.originalUrl);
    requestfreq++;
    client.set(cache.get('public_ip'), requestfreq);
    client.lpush('queue', req.url);
    // ... INSERT HERE.
    app.get('/', function(req, res) {
        res.send('hello world!!!!')
    })

    app.get('/get', function(req, res) {

        client.get("key", function(err, reply) {
            res.send(reply.toString());
        });

    })

    app.get('/set', function(req, res) {

        client.set("key", "this message will self-destruct in 10 seconds");
        client.expire("key", 10);
        res.send("Key set");

    })


    app.get('/recent', function(req, res) {

        client.lrange('queue', 0, 4, function(err, resp) {

            var head = "<html><body><ol>";
            var tail = "</ol><body></html>";
            console.log("Recent:");
            for (r in resp) {
                console.log(resp[r]);
                head = head + "<li>" + resp[r].toString() + "</li>";
            }

            head = head + tail;
            res.send(head);
        });
    })

    app.get('/featureflag', function(req, res) {
        client.get("featureflag", function(err, reply) {
            if (!reply || reply.toString() != 'true') {
                res.send("Feature not ready yet!");
            } else {
                console.log("fflag");
                if (reply.toString() == 'true') {
                    res.send("Feature deployed successfully");
                }
            }
        });

    })

    app.get('/now', function(req, res) {
        res.send('The time is NOW!!');

    })

    app.get('/time', function(req, res) {
        var date = new Date();
        res.send(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
    })

    app.get('/disable/canary', function(req, res) {
        client.del('canary_servers', function(err, reply) {
            if (err) throw err;
            if (reply) {
                res.send("Canary feature is disabled");
            } else {
                res.send("No canary feature found to disable");
            }
        })
    })



    next(); // Passing the request to the next handler in the stack.
});


function teardown() {
    exec('forever stopall', function() {
        console.log("infrastructure shutdown");
        process.exit();
    });
    client.lrem('active_servers', 1, cache.get('public_ip'), function(err, reply) {
        if (err) throw err;
        process.exit();
    });
}

process.on('exit', function() {
    teardown();
});

process.on('SIGINT', function() {
    teardown();
});

module.exports = server;
