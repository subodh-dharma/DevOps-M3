var redis = require('redis')
var httpProxy = require('http-proxy')
var http = require('http')
var client = redis.createClient(6379, '54.146.135.5', {})


var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res){
  client.rpoplpush('serving_servers', 'serving_servers', function(err, reply){
    console.log('Request is being served by '+ reply);
    proxy.web(req, res, {target: reply});
  });
});
server.listen(3000);