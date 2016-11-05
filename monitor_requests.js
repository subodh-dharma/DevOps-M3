var redis = require('redis');
var ip = require('ip');
var sendmail = require('sendmail')();


var ipaddress = ip.address(); // REPLACE LATER on with the
var client = redis.createClient(6379, '54.146.135.5', {});

var args = process.argv.slice(2);
if (args.length == 0) {
    args = [ipaddress];
}
ipaddress = args[0];


setInterval(function() {
    client.get(ipaddress, function(error, reply) {

        if (parseInt(reply.toString()) > 4) { // threshold for requests per seconds
            // INSERT HERE logic for
            console.log("MNTR: " + reply.toString());
            console.log("OVERLOAD");
            sendmail({
                from: 'no-reply@DevOps.com',
                to: 'ssdharma@ncsu.edu, apatel10@ncsu.edu',
                subject: 'REQUEST OVERLOAD at ' + ipaddress,
                html: 'Server is overloading. Please check the server at ' + ipaddress
            }, function(err, reply) {

            });

        }
    });
}, 200);
