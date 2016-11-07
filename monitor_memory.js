var monitor = require("os-monitor");
var sendmail = require('sendmail')();
var shell = require('child_process').exec;
monitor.start({
    delay: 3000 // interval in ms between monitor cycles
        ,
    freemem: 155180400 // freemem under which event 'freemem' is triggered
}).pipe(process.stdout);



// define handler for a too low free memory
monitor.on('freemem', function(event) {
    console.log(event.type);
    console.log("************************");
    console.log('Free memory is very low!');
    sendmail({
        from: 'no-reply@DevOps.com',
        to: 'ssdharma@ncsu.edu, apatel10@ncsu.edu',
        subject: 'MEMORY USAGE ALERT!',
        html: 'HIGH MEMORY USAGE.\n Attempting to clean cache and free memory'
    }, function(err, reply) {});

    shell('./freemem.sh', function(error, stdout, stderr) {
        console.log(error);
    });

});

// change config while monitor is running
monitor.config({
    freemem: 0.8 // alarm when 80% or less free memory available
});

// check whether monitor is running or not
monitor.isRunning(); // -> true / false
