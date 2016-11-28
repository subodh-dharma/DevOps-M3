var AWS = require('aws-sdk');
var exec = require('child_process').exec();
var ansible = require('node-ansible');
AWS.config.loadFromPath('/home/ubuntu/aws_credentials.json');
var ec2 = new AWS.EC2();
process.env.ANSIBLE_HOST_KEY_CHECKING = false;
var instance_ID = "";
var instance_status = 0;
var workspace = '/var/lib/jenkins/workspace/AppServers/';
var fs = require('fs');

createInstance();

//exports.createAWSInstance = function() {
function createInstance() {
    //var keyName = createKeyPair();
    var keyName = "SPAWNED_" + Math.ceil(Math.random() * (1000 - 1) + 1000);
    var pubkeyContent = fs.readFileSync('/var/lib/jenkins/.ssh/devops.pub');
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

                var pub_ip;
                ec2.waitFor('instanceRunning', params, function(err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                        //get public-dns name;
                        console.log('New Machine Spawned, Waiting for access!');
                        var pub_dns = data.Reservations[0].Instances[0].PublicDnsName;
                        pub_ip = data.Reservations[0].Instances[0].PublicIp;
                        params = {
                            Resources: [instanceId],
                            Tags: [{
                                Key: 'Name',
                                Value: 'SpawnedServer'
                            }]
                        };
                        writeInventoryFile(pub_dns);
                        ec2.createTags(params, function(err) {
                            console.log("Tagging instance", err ? "failure" : "success");
                        });
                    }
                });

                ec2.waitFor('instanceStatusOk', params, function(err, data) {
                    console.log('Server OK..Deploying Server');
                    var playbook_cmd = new ansible.Playbook().playbook('setup.yml');
                    playbook_cmd.inventory('inventory.ini');
                    playbook_cmd.exec();
                    // exec('ansible-playbook -i ./inventory.ini setup.yml', function(err, stdout, stderr) {
                    //     console.log("ERR :" + err);
                    //     console.log("OUT :" + stdout);
                    //     console.log("CMDERR :" + stderr);
                    //     fs.unlinkSync('./inventory.ini');
                    //     console.log('inventory deleted.');
                    // });
                });



            });


        }
    });

}


function writeInventoryFile(ssh_host) {
    var home_path = '/var/lib/jenkins/.ssh/';
    var file_path = "./inventory.ini";
    var fs = require('fs');
    var writeString = "prod ansible_ssh_host=";
    writeString = writeString + ssh_host;
    writeString = writeString + " ansible_ssh_user=ubuntu"; //user-name for login
    writeString = writeString + " ansible_ssh_private_key_file=";
    writeString = writeString + home_path + "devops.pem";
    writeString = writeString + "\n";

    fs.appendFile(file_path, writeString, function(err) {
        if (err) {
            console.log(err, err.stack);
        }

    })
}
