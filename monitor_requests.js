var redis = require('redis');
var ip = require('ip');
var ipaddress = ip.address(); // REPLACE LATER on with the
var client = redis.createClient(6379, '54.146.135.5', {});

var args = process.argv.slice(2);
if (args.length == 0) {
    args = [ipaddress];
}
ipaddress = args[0];


setInterval(function() {
    client.get(ipaddress, function(error, reply) {
        console.log("MNTR: " + reply.toString());
        if (parseInt(reply.toString()) > 4) { // threshold for requests per seconds
            // INSERT HERE logic for
            console.log("OVERLOAD");
        }
    });
}, 200);
