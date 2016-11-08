var redis = require('redis');
var ip = require('ip');
var sendmail = require('sendmail')();


// var ipaddress = ip.address(); // REPLACE LATER on with the
var client = redis.createClient(6379, '52.90.252.26', {});

// var args = process.argv.slice(2);
// if (args.length == 0) {
    // args = [ipaddress];
// }
// ipaddress = args[0];


// setInterval(function() {
    // client.get(ipaddress, function(error, reply) {

        // if (parseInt(reply.toString()) > 4) { // threshold for requests per seconds
            // console.log("MNTR: " + reply.toString());
            // console.log("OVERLOAD");
            // client.lpop('active_servers', function(err, reply) {
                // if (err) console.log(err);
                // if (reply) {
                    // client.lpush('serving_servers', reply, function(error, response) {
                        // console.log('Provisioned new Server!');
                    // });
                // }


            // });
            // sendmail({
                // from: 'no-reply@DevOps.com',
                // to: 'ssdharma@ncsu.edu, apatel10@ncsu.edu',
                // subject: 'REQUEST OVERLOAD at ' + ipaddress,
                // html: 'Server is overloading. Please check the server at ' + ipaddress
            // }, function(err, reply) {

            // });

        // }
    // });
// }, 200);

exports.reqOverload = function(ip_addr) {
    console.log("in hereee");
    client.lpop('active_servers', function(err, reply) {
        if (err) console.log(err);
        if (reply) {
            client.lpush('serving_servers', reply, function(error, response) {
                console.log('Provisioned new Server!');
            });
            sendDetails('Server is overloading. Provisioning new server was successful.\nOverloaded Server:', ip_addr);
        }
        else {
            sendDetails('Server is overloading. No new servers available to provision. Urgent attention required.\nOverloaded Server:', ip_addr)
        }


    });
      console.log("HELLO");
};

function sendDetails(message, ip_addr){
    sendmail({
        from: 'no-reply@DevOps.com',
        to: 'ssdharma@ncsu.edu, apatel10@ncsu.edu',
        subject: 'REQUEST OVERLOAD at ' + ip_addr,
        html: message + ip_addr
    }, function(err, reply) {

    });
}
