var main_func = require('./analysis.js');

main_func.main().then(function(builders) {
    console.log(builders);
    console.log('Completed!! and Resolved!');
});;
