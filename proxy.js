var redis = require('redis')
var httpProxy = require('http-proxy')
var http = require('http')
var client = redis.createClient(6379, '52.90.252.26', {})


var proxy = httpProxy.createProxyServer({});

var counter = 0;
var server = http.createServer(function(req, res){
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
