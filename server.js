var express = require('express');
var app = express();
var port = 1337;
var gitinspector = require('./gitinspector');

var parameters = require('./configs/test.json');

app.get('/', function (req, res) {
    gitinspector.run(parameters, res);
});

app.listen(port);
console.log('Api started at port: ' + port);





module.exports = app;
