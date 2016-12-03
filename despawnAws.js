var AWS = require('aws-sdk');
var redis = require('redis');
AWS.config.loadFromPath('/home/ubuntu/aws_credentials.json');
var ec2 = new AWS.EC2();
process.env.ANSIBLE_HOST_KEY_CHECKING = false;
var instance_ID = "";
var pub_ip = "";
var instance_status = 0;
var workspace = '/var/lib/jenkins/workspace/AppServers/';
var fs = require('fs');


// deletes AWS instance and updates redis-store
exports.terminateAWSInstance = function(redisipaddr) {

    return new Promise(function(resolve, reject) {

        var client = {};
        var redisip = redisipaddr;
        console.log(redisip);
        client = redis.createClient(6379, redisip, {});

        client.lpop('aws_instanceid', function(err, reply) {
            var params = {
                DryRun: false,
                InstanceIds: [
                    reply
                ]
            }
            ec2.describeInstances(params, function(err, data) {
                console.log('Removing excess server.');
                var pub_ip = data.Reservations[0].Instances[0].PublicIpAddress;
                client.lrem('serving_servers', 0, "http://" + pub_ip, function(err1, data1) {
                    console.log(pub_ip + ' removed from serving list');
                    console.log('Terminating aws instance!');

                    client.hset("memory_load", 'http://' + pub_ip, 0);
                    client.hset("request_load", 'http://' + pub_ip, 0);

                    var param = {
                        InstanceIds: [
                            reply
                        ],
                        DryRun: false
                    };
                    ec2.terminateInstances(param, function(error, datareply) {
                        if (error) console.log(error); // an error occurred
                        else {

                            console.log("Instance Terminated Succesfully!!"); // successful response
                            resolve('Instance Deleted!');
                        }
                    });
                });
            });
        })
    });

}
