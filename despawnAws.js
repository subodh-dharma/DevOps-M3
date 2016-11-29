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

terminateInstance();

function terminateInstance() {
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

    client.lpop('aws_instanceid', function(err, reply) {
        var params = {
            DryRun: false,
            InstanceIds: [
                reply
            ]
        }
        ec2.describeInstances(params, function(err, data) {
            console.log('Removing excess server.');
            var pub_ip = data.Instances[0].PublicIpAddress;
            client.lrem('serving_servers', 0, pub_ip, function(err1, data1) {
                console.log(pub_ip + ' removed from serving list');
                console.log('Terminating aws instance!');

                var param = {
                    InstanceIds: [
                        reply
                    ],
                    DryRun: false
                };
                ec2.terminateInstances(param, function(error, datareply) {
                    if (error) console.log(error, err.stack); // an error occurred
                    else {
                        console.log("Intance Terminated Succesfully!!"); // successful response

                    }
                });
            });
        });
    })




}
