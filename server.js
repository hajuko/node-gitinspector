var express = require('express');
var app = express();
var port = 1337;
var gitinspector = require('./gitinspector');


app.get('/', function (req, res) {
    var projectConfig = req.param('project');
    var parameters = require('./projects/' + projectConfig + '.json');
    gitinspector.run(parameters, res);
});

app.listen(port);
console.log('Api started at port: ' + port);

module.exports = app;
