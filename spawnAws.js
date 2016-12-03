var AWS = require('aws-sdk');
var exec = require('child_process').exec();
var ansible = require('node-ansible');
var redis = require('redis');
AWS.config.loadFromPath('/home/ubuntu/aws_credentials.json');
var ec2 = new AWS.EC2();
process.env.ANSIBLE_HOST_KEY_CHECKING = false;
var instance_ID = "";
var pub_ip = "";
var instance_status = 0;
var fs = require('fs');

// function to create an AWS instance and update redis-store
exports.createAWSInstance = function(redisipaddr) {

    return new Promise(function(resolve, reject) {


        var redisip = redisipaddr;
        var client = {};

        console.log(redisip);
        client = redis.createClient(6379, redisipaddr, {});

        //var keyName = createKeyPair();
        var keyName = "SPAWNED_" + Math.ceil(Math.random() * (1000 - 1) + 1000);
        var pubkeyContent = fs.readFileSync('/var/lib/aws/devops.pub');
        var params = {
            //KeyName: 'AWS_' + Math.ceil(Math.random() * 1000).toString(),
            KeyName: keyName,
            /* required */
            PublicKeyMaterial: pubkeyContent,
            DryRun: false
        };
        ec2.importKeyPair(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {

                //	create aws instance.
                console.log("Booting up the Server");
                var params = {
                    ImageId: 'ami-40d28157', // Ubuntu 14.04 amd64
                    InstanceType: 't2.micro',
                    MinCount: 1,
                    MaxCount: 1,
                    KeyName: keyName
                };

                // Create the instance
                ec2.runInstances(params, function(err, data) {
                    if (err) {
                        console.log("Could not create instance", err);
                        return;
                    }

                    var instanceId = data.Instances[0].InstanceId;
                    instance_ID = data.Instances[0].InstanceId;
                    //console.log("Created instance", instanceId);
                    var params = {
                        DryRun: false,
                        InstanceIds: [
                            instance_ID
                            /* more items */
                        ]
                    };



                    ec2.waitFor('instanceRunning', params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else {
                            //get public-dns name;
                            console.log('New Machine Spawned, Waiting for access!');
                            var pub_dns = data.Reservations[0].Instances[0].PublicDnsName;
                            pub_ip = data.Reservations[0].Instances[0].PublicIpAddress;
                            params = {
                                Resources: [instanceId],
                                Tags: [{
                                    Key: 'Name',
                                    Value: 'SpawnedServer'
                                }]
                            };

                            writeInventoryFile(pub_ip);
                            ec2.createTags(params, function(err) {
                                console.log("Tagging instance", err ? "failure" : "success");
                            });
                        }
                    });

                    ec2.waitFor('instanceStatusOk', params, function(err, data) {
                        console.log('Server OK..Deploying Server');

                        // making entry in redis-store to load-balance

                        var playbook_cmd = new ansible.Playbook().playbook('setup');
                        playbook_cmd.inventory('inventory.ini');
                        playbook_cmd.on('stdout', function(data) {
                            console.log(data.toString());
                        });
                        playbook_cmd.on('stderr', function(data) {
                            console.log(data.toString());
                        });
                        playbook_cmd.exec();

                        client.lpush(['aws_instanceid', instance_ID], function(err, reply) {
                            console.log('Adding to instance id list');
                            resolve('Instance Created');
                        });

                    });



                });


            }
        });

    });

}


function writeInventoryFile(ssh_host) {
    var home_path = '/var/lib/aws/';
    var file_path = "./inventory.ini";
    var fs = require('fs');
    var writeString = "[prod]\n"
    writeString = writeString + "prod ansible_ssh_host=";
    writeString = writeString + ssh_host;
    writeString = writeString + " ansible_ssh_user=ubuntu"; //user-name for login
    writeString = writeString + " ansible_ssh_private_key_file=";
    writeString = writeString + home_path + "devops.pem";
    writeString = writeString + "\n";

    //redis entry
    writeString = writeString + "[redis]\n"
    writeString = writeString + "redis ansible_host=";
    writeString = writeString + process.argv.slice(2)[0];

    fs.appendFile(file_path, writeString, function(err) {
        if (err) {
            console.log(err, err.stack);
        }

    })
}
