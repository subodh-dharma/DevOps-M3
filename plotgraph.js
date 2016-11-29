var redis = require('redis')
var multer = require('multer')
var express = require('express')
var app = express()
var client = {}; //default initialization
var HashMap = require('hashmap');
var dateFormat = require('dateformat');

// REDIS SEPARATE SERVER
//var client = redis.createClient(6379, '52.90.252.26', {});
if (process.argv.slice(2)[0]) {
    var redisip = process.argv.slice(2)[0];
    console.log(redisip);
    client = redis.createClient(6379, redisip, {});
} else {
    //throw Error('REDIS IP required');
    console.warn('REDIS IP required!!', 'Connecting to REDIS on localhost if present!');
    client = redis.createClient(6379, '127.0.0.1', {});
}

var server_list = new HashMap();

var express = require("express");

var server_list = {}
var time_list = []
var req_time_list = []
var req_server_list = {}

function getData(responseObj){
    var dataset = [];
    Object.keys(server_list).forEach(function(key){

        dataset.push({"seriesname" : key, "data": server_list[key]})
    })

    var response = {
      "dataset" : dataset,
      "categories" : time_list
    };
    console.log(response);
    responseObj.json(response);

}

function getReqData(responseObj){
    var dataset = [];
    Object.keys(req_server_list).forEach(function(key){

        dataset.push({"seriesname" : key, "data": req_server_list[key]})
    })

    var response = {
      "dataset" : dataset,
      "categories" : req_time_list
    };
    console.log(response);
    responseObj.json(response);

}

setInterval(function(){
    var now = new Date();
    var time = dateFormat(now);
    req_time_list.push({"value": time});
    client.hgetall("request_load", function(err,obj){
        Object.keys(req_server_list).forEach(function(key){
            if(!obj[key]){
                req_server_list[key].push({"value": 0});
            }
        });
        Object.keys(obj).forEach(function(key){
            if(!req_server_list[key]){
                req_server_list[key] = new Array(time_list.length-1).fill({"value": 0});
                req_server_list[key].push({"value": obj[key]});
            }
            else {
                req_server_list[key].push({"value": obj[key]});
            }
        })    
    });
}, 20000);

setInterval(function(){
    var now = new Date();
    var time = dateFormat(now);
    console.log(time);
    time_list.push({"value": time});
    client.hgetall("memory_load", function(err,obj){
        console.log(obj);
        // var time = Date
        Object.keys(server_list).forEach(function(key){
            if(!obj[key]){
                server_list[key].push({"value": 0});
            }
        });
        Object.keys(obj).forEach(function(key){
            if(!server_list[key]){
                server_list[key] = new Array(time_list.length-1).fill({"value": 0});
                server_list[key].push({"value": obj[key]});
            }
            else {
                server_list[key].push({"value": obj[key]});
            }
        })
    });    
},20000);

//create express app
var app = express();

//NPM Module to integrate Handlerbars UI template engine with Express
var exphbs  = require('express-handlebars');

//Declaring Express to use Handlerbars template engine with main.handlebars as
//the default layout

app.set('view engine', 'handlebars');

//Defining middleware to serve static files
app.use('/public', express.static('public'));
app.get("/fuelPrices", function(req, res){
  getData(res);
});

app.get("/reqData", function(req, res){
  getReqData(res);
});

app.get("/request_chart", function(req, res){
    app.engine('handlebars', exphbs({defaultLayout: 'req'}));
    res.render("chart");
})
  
app.get("/memory_chart", function(req, res){
  app.engine('handlebars', exphbs({defaultLayout: 'main'}));
  res.render("chart");
});

app.listen("3300", function(){
  console.log('Server up: http://localhost:3300');
});