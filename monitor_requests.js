var redis = require('redis');
var ip = require('ip');
var sendmail = require('sendmail')();


// var ipaddress = ip.address(); // REPLACE LATER on with the
var client = {};
if (process.argv.slice(2)[0]) {
    var redisip = process.argv.slice(2)[0];
    console.log(redisip);
    client = redis.createClient(6379, redisip, {});
} else {
    //throw Error('REDIS IP required');
    console.warn('REDIS IP required!!', 'Connecting to REDIS on localhost if present!');
    client = redis.createClient(6379, '127.0.0.1', {});
}

exports.reqOverload = function(ip_addr) {

    client.lpop('active_servers', function(err, reply) {
        if (err) console.log(err);
        if (reply) {
            client.lpush('serving_servers', reply, function(error, response) {
                console.log('Provisioned new Server!');
            });
            sendDetails('Server is overloading. Provisioning new server was successful.\nOverloaded Server:', ip_addr);
        } else {
            sendDetails('Server is overloading. No new servers available to provision. Urgent attention required.\nOverloaded Server:', ip_addr)
        }


    });
    console.log("HELLO");
};

function sendDetails(message, ip_addr) {
    sendmail({
        from: 'no-reply@DevOps.com',
        to: 'ssdharma@ncsu.edu, apatel10@ncsu.edu',
        subject: 'REQUEST OVERLOAD at ' + ip_addr,
        html: message + ip_addr
    }, function(err, reply) {

    });
}
