//ssdharma
var needle = require("needle");
var os   = require("os");
var keygen = require("ssh-keygen");
var sleep = require("sleep");
var config = {};
var machinestatus = "off";


config.token = process.env.DIGITAL_OCEAN_TOKEN;

var args = process.argv.slice(2);

if (args.length == 0) {
    args = ["digiocean"];
}
var machinename = args[0];



var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

// Documentation for needle:
// https://github.com/tomas/needle

var ipv4_addr = "";
var host_name = "root";



var client =
{


	getDropletDetails : function(dropletID, onResponse)
	{
		needle.get("https://api.digitalocean.com/v2/droplets/"+dropletID, {headers:headers}, onResponse)
	},

	createDroplet: function (ssh_id, onResponse)
	{
		var data =
		{
			"name": "DO-"+machinename,
			"region":"nyc1",
			"size":"512mb",
			"image":"16082940",
			// Id to ssh_key already associated with account.
			"ssh_keys": [ssh_id],
			//"ssh_keys":null,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

	console.log("Attempting to create: "+ JSON.stringify(data) );

	needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	},


	createKeyPair : function(onResponse)
	{
		console.log("Creating key pair..");
		
		keygen({
		location: process.env.HOME+"/.ssh/"+machinename+"_rsa.pem",
		comment: "",
		password: "",
		read: true
		},function (err, keypair){
			var fs = require('fs');
			var data =
			{
				name: "DO_"+machinename,
				public_key: keypair.pubKey
				
			};

		console.log("Posting Keys..");
		needle.post("https://api.digitalocean.com/v2/account/keys", data, {headers:headers,json:true}, onResponse);
	});	

	},

	checkStatus : function(dropletID,onResponse){
		needle.get("https://api.digitalocean.com/v2/droplets/"+dropletID+"/actions", {headers:headers}, onResponse);
		console.log("Checking...");
	}
}
 

client.createKeyPair(function(err, response){
        
	var data = response.body;
	var ssh_id = data.ssh_key.id;
	console.log("Received SSH ID..");        
	
	client.createDroplet(ssh_id,function(err, resp, body)
	{
	// StatusCode 202 - Means server accepted request.
	if(!err && resp.statusCode == 202)
	{

	sleep.sleep(30);
	client.getDropletDetails(body.droplet.id+"", function(error, response)
	{
		var data = response.body;
		if( data.droplet )
		console.log("IP Address "+data.droplet.networks.v4[0].ip_address);
		ipv4_addr = data.droplet.networks.v4[0].ip_address;
		writeInventoryFile();

	});
	
	
	}
    });


});




function writeKeyToFile(filePath, data) {

      var fs = require('fs');
      fs.writeFile(filePath, data, function(err) {
      if (err) {
           return console.log(err);
      }
      console.log("The RSA key file was saved!");
 });
}



function writeInventoryFile(){
        var home_path = process.env.HOME;
        var file_path = home_path + "/inventory.ini";
        var fs = require('fs');
        var writeString = machinename + " ansible_ssh_host=";
        writeString = writeString + ipv4_addr;
        writeString = writeString + " ansible_ssh_user=root";         //user-name for login
        writeString = writeString + " ansible_ssh_private_key_file=";
        writeString = writeString + process.env.HOME + "/.ssh/"+machinename+"_rsa.pem";
        writeString = writeString + "\n";


        var fs = require('fs');
        var fpath = process.env.HOME + "/inventory.ini";
        fs.appendFile(fpath,writeString,function(err){
                if(err){
                        console.log(err, err.stack);
                }

	});
}
