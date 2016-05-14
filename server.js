var express = require('express');
var app = express();
var port = 1337;
var gitinspector = require('./gitinspector');


app.get('/single', function (req, res) {
    var projectConfig = req.param('project');
    var parameters = require('./projects/' + projectConfig + '.json');
    var fileTypes = req.param('fileTypes');
    parameters.since = req.param('since');
    parameters.until = req.param('until');

    if (fileTypes) {
        parameters.fileTypes = fileTypes;
    }

    console.log(parameters);

    gitinspector.run(parameters, res);
});

app.get('/web/js/main.js', function(req, res) {
    res.sendfile('web/js/main.js');
});

app.get('/web/css/main.css', function(req, res) {
    res.sendfile('web/css/main.css');
});

app.get('/', function(req, res) {
    res.sendfile('web/index.html');
});

app.listen(port);
console.log('Api started at port: ' + port);

module.exports = app;
