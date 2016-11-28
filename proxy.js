var redis = require('redis')
var httpProxy = require('http-proxy')
var http = require('http')
var client = {};
if(process.argv.slice(2)[0]){
	var redisip = process.argv.slice(2)[0];
	console.log(redisip);
	client = redis.createClient(6379, redisip, {});
	
}else
{
	throw Error("REDIS ip required as parameter");
}




var proxy = httpProxy.createProxyServer({});


var counter = 0;
var server = http.createServer(function(req, res){
    
    proxy.on('proxyError', function(err, req, res){
    	res.end();
    });

    proxy.on('error', function(err, req, res){
    	console.log("ERR: \n"+err);
	res.end();
    });
    
    counter++;
    if(counter < 4)
    {
        client.rpoplpush('serving_servers', 'serving_servers', function(err, reply){
            console.log('Request is being served by '+ reply);
            proxy.web(req, res, {target: reply});
        });
    }
    else{
        client.rpoplpush('canary_servers', 'canary_servers', function(err, reply){
            if(err) throw err;
            if(reply)
            {
                console.log('Request is being served by '+ reply);
                proxy.web(req, res, {target: reply});
            }
            else{
                client.rpoplpush('serving_servers', 'serving_servers', function(err, reply){
                    console.log('Request is being served by '+ reply);
                    proxy.web(req, res, {target: reply});
                });
            }
        })
        counter = 0;
    }
});
server.listen(3000);
