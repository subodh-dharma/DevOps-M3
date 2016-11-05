var redis = require('redis')
var multer = require('multer')
var express = require('express')
var fs = require('fs')
var app = express()
var exec = require('child_process').exec;
var ip = require('ip');
var requestfreq = 0;
// REDIS - HOSTED-SHARED with JENKINS MACHINE
var client = redis.createClient(6379, '54.146.135.5', {})

///////////// WEB ROUTES
// Add hook to make it easier to get all visited URLS.
var history = [];
app.use(function(req, res, next) {
    console.log(req.method, req.url);

    //console.log("URL :" + req.url);
    //history.push(req.originalUrl);
    requestfreq++;
    client.set(ip.address(), requestfreq);
    client.lpush('queue', req.url);
    // ... INSERT HERE.
    app.get('/', function(req, res) {
        res.send('hello world')
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



    next(); // Passing the request to the next handler in the stack.
});

// HTTP SERVER
var args = process.argv.slice(2);

if (args.length == 0) {
    args = ["3000"];
}
var portNum = parseInt(args[0]);
var server = app.listen(portNum, ip.address(), function() {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)
})

//COUNTING per second requests
setInterval(function() {
    console.log("Request Frequency :" + requestfreq);
    requestfreq = 0;
    client.set(ip.address(), requestfreq);
}, 1000);

function teardown() {
    exec('forever stopall', function() {
        console.log("infrastructure shutdown");
        process.exit();
    });
}

process.on('exit', function() {
    teardown();
});
